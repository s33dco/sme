const nodemailer         = require('nodemailer');
const sendgridTransport  = require('nodemailer-sendgrid-transport');
const ejs                = require('ejs');
const config             = require('config');
const express            = require('express');
const router             = express.Router();
const moment             = require('moment');
const {validationResult} = require('express-validator/check');
const validate           = require('../middleware/validators');
const validateId         = require('../middleware/validateId')
const {ObjectID}         = require('mongodb');
const {Invoice, itemType}= require("../models/invoice");
const {Client}           = require("../models/client");
const {Detail}           = require("../models/detail");
const logger             = require('../startup/logger');
const auth               = require("../middleware/auth");
const admin              = require("../middleware/admin");

router.get('/',  auth, async (req, res) => {
  const invoices = await Invoice.listInvoices();
  // const numbers = await Invoice.listInvoiceNumbers();
  // console.log(numbers);

  res.render('invoices/invoices', {
    pageTitle: "Invoices",
    pageDescription: "Invoice Admin.",
    invoices,
    admin : req.user.isAdmin
  })
});

router.get('/new', [auth, admin], async (req, res) => {

  const detail = await Detail.findOne();

  if (!detail){
    req.flash('alert', `You must enter the standard invoice details first!`);
    res.redirect(`/details/edit`);
  };


  const promise = Promise.all([
    Invoice.newestInvoiceNumber(),
    Client.find({}, {name:1}).sort({name: 1})
  ]);

  promise.then(([lastInvoiceNo, clients]) => {


    if (clients.length < 1){
      req.flash('alert', `You must create a client first!`);
      res.redirect(`/clients/new`);
    };

    let checkInvoice = ((invArray) => {
      if(invArray.length < 1) {
        return 1;
      } else {
        return lastInvoiceNo[0].invNo + 1;
      }
    });

    let now = moment().toISOString();
    let items = [];

    res.render('invoices/newinvoice', {
      data            : { invDate : now, invNo : checkInvoice(lastInvoiceNo), items},
      errors          : {},
      csrfToken       : req.csrfToken(),
      pageTitle       : "Add an Invoice",
      pageDescription : "Create a new Invoice.",
      clients
    });
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.redirect("/invoices");
  })
});

router.post('/',  [auth, admin, validate.invoice], async (req, res) => {

    let errors = validationResult(req);

    if (!errors.isEmpty()) {

      let clients = await Client.find({}, {name:1}).sort({name: 1});
      let selected;

      if (req.body.clientId) {
        selected = clients.find(c => c._id == req.body.clientId);
        if (!selected){
          clients
        } else {
          clients = clients.filter((c) => c._id !== selected._id);
        }
      } else {
        clients
      }

      return res.render('invoices/newinvoice', {
          data            : req.body,
          errors          : errors.mapped(),
          csrfToken       : req.csrfToken(),
          pageTitle       : "Invoice",
          pageDescription : "Give it another shot.",
          clients,
          selected
      });

    }

    if (!ObjectID.isValid(req.body.clientId)) {
      throw ({
        tag : "Client can't be found",
        message : "The client can't be found maybe you should try again.",
        statusCode : 400
      });
    }

    const client = await Client.findOne({_id: req.body.clientId});

    if (!client) {
          throw ({
            tag : 'No longer available.',
            message : "The client you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
            statusCode : 404
          });
    }

    const detail = await Detail.findOne();

    if (!detail) {
      throw ({
        tag : 'You need to add your details...',
        message : "No information for your invoice can be found, head over to details and add your bank details etc....",
        statusCode : 400
      });
    }

    const invoice = await new Invoice({
          invNo      : req.body.invNo,
          invDate    : moment(req.body.invDate).endOf('day'),
          message    : req.body.message,
          client     : {
              _id         : client._id,
              name        : client.name,
              email       : client.email,
              phone       : client.phone,
              address1    : client.address1,
              address2    : client.address2,
              address3    : client.address3,
              postcode    : client.postcode
          },
          items      : req.body.items,
          details    : {
              business    : detail.business,
              utr         : detail.utr,
              email       : detail.email,
              phone       : detail.phone,
              bank        : detail.bank,
              sortcode    : detail.sortcode,
              accountNo   : detail.accountNo,
              terms       : detail.terms,
              contact     : detail.contact,
              farewell    : detail.farewell,
              address1    : detail.address1,
              address2    : detail.address2,
              address3    : detail.address3,
              postcode    : detail.postcode
          },
          paid        : false
        }).save()

    req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} created !`)
    res.redirect(`invoices/${invoice._id}`);
  });

router.get('/:id',  [auth, validateId ], async (req, res) => {
  let id = req.params.id;

  const invoice = await Invoice.withId(id);

  if (!invoice) {
    throw ({
      tag : 'No longer available.',
      message : "The invoice you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
      statusCode : 404
    });
  }

  const total = await Invoice.sumOfInvoice(id);
  const itemsByDateAndType = await Invoice.itemsByDateAndType(id);


  res.render('invoices/invoice', {
      pageTitle       : "Invoice",
      pageDescription : "invoice.",
      total,
      invoice,
      itemsByDateAndType,
      csrfToken       : req.csrfToken(),
      admin : req.user.isAdmin
  });
});

router.post('/email', auth, async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "Invoice can't be emailed",
      message : "The Invoice can't be found to email maybe you should try again.",
      statusCode : 404
    });
  }

  const id = req.body.id;

  const invoice = await Invoice.withId(id);

  if (!invoice) {
    throw ({
      tag : 'No longer available.',
      message : "The invoice you want to email cannot be found, maybe it was deleted, maybe it was never here.",
      statusCode : 404
    });
  }

  const total = await Invoice.sumOfInvoice(id);
  const itemsByDateAndType = await Invoice.itemsByDateAndType(id);

  // Configure Nodemailer SendGrid Transporter
  const transporter = nodemailer.createTransport(
    sendgridTransport({
      auth: {
        api_key: config.get('SENDGRID_API_PASSWORD')
      },
    })
  );

  ejs.renderFile( "./views/invoiceEmail.ejs", { total, invoice, itemsByDateAndType, moment: moment }, function (error, data) {
    if (error) {
      logger.error(`file error: ${error.message} - ${error.stack}`);
    } else {
      const options = {
        from: 'noreply@jillpendleton.herokuapp.com',
        to: invoice.client.email,
        replyTo: invoice.details.email,
        subject: `Invoice ${invoice.invNo} - ${moment(invoice.invDate).format("Do MMMM YYYY")}`,
        html: data };

      transporter.sendMail(options, (error, info) => {
          if (error) {
            logger.error(`send email error: ${error.message} - ${error.stack}`);
            req.flash('alert', `Invoice has not been emailed.`)
            res.redirect('/dashboard')
          } else {
            logger.info(`Invoice ${invoice.invNo} mailed to ${invoice.client.email}`);
            req.flash('success', `Invoice ${invoice.invNo} mailed to ${invoice.client.email}.`)
            res.redirect('/dashboard')
          }
      });
    };
  });
});

router.post('/paid', [auth, admin], async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "Invoice can't be updated",
      message : "The Invoice can't be found maybe you should try again.",
      statusCode : 404
    });
  }

  const invoice = await Invoice.findOne({_id: req.body.id});

  if (!invoice) {
    throw ({
      tag : 'No longer available.',
      message : "The invoice you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
      statusCode : 404
    });
  }

  await Invoice.findOneAndUpdate({_id: req.body.id},{paid: true, $currentDate: { datePaid: true}});

  req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} paid!`);
  res.redirect('/dashboard');
});

router.post('/unpaid', [auth, admin], async (req, res) => {

  let id = req.body.id

  if (!ObjectID.isValid(id)) {
    throw ({
      tag : "Invoice can't be updated",
      message : "The Invoice can't be found maybe you should try again.",
      statusCode : 404
    });
  }

  let invoice = await Invoice.withId(id);

  if (!invoice) {
    throw ({
      tag : 'No longer available.',
      message : "The invoice you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
      statusCode : 404
    });
  }

  await invoice.update({paid: false, datePaid: undefined});

  // invoice = await Invoice.findOneAndUpdate({ _id : id },
  //                         { $set: {paid:false},
  //                           $unset: {datePaid:1}},
  //                         {new : true });

  req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} now unpaid!`);
  res.redirect("/dashboard");
});

router.get('/edit/:id', [auth, admin, validateId], async (req, res) => {
  let id = req.params.id;

  invoice = await Invoice.findOne({  _id: id });

  if (!invoice ){
    throw ({
      tag : "Invoice can't be edited",
      message : "The invoice can't be found or edited, maybe you should try again.",
      statusCode : 404
    });
  }

  if (invoice.paid)  {
    req.flash('alert', "Can't edit a paid invoice.");
    throw ({
      tag : "Invoice can't be edited",
      message : "The invoice can't be edited once it has been paid, if you need to edit you'll need mark the invoice as unpaid first.",
      statusCode : 400
    });
  }

  const clients = await Client.find({}, {name:1}).sort({name: 1})

  let { client, _id, invNo, invDate, message, items} = invoice;
  let clientId = client._id;
  let selected = client

  res.render('invoices/editinvoice', {
    clients,
    selected,
    data: { _id, invNo, invDate, message, items, clientId},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle       : "Edit Invoice",
    pageDescription : "edit invoice."
  })
});

router.put('/:id',  [auth, admin, validateId, validate.invoice], async (req, res) => {
  let errors = validationResult(req)

  if (!errors.isEmpty()) {

    let clients = await Client.find({}, {name:1}).sort({name: 1});
    let selected;
    if (req.body.clientId) {
      selected = clients.find(c => c._id == req.body.clientId);
      if (!selected){
        clients
      } else {
        clients = clients.filter((c) => c._id != selected._id);
      }
    } else {
      clients
    }

    return res.render('invoices/newinvoice', {
        data            : req.body,
        errors          : errors.mapped(),
        csrfToken       : req.csrfToken(),
        pageTitle       : "Invoice",
        pageDescription : "Give it another shot.",
        clients,
        selected
    });
  }

  const detail = await Detail.findOne({});

  if (!detail){
      req.flash('alert', `You must enter the standard invoice details first!`);
      res.redirect(`/details/edit`);
    };

  const invoice = await Invoice.findOne({_id : req.params.id});

  if (!invoice) {
      throw ({
        tag : 'No longer available.',
        message : "The invoice you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
        statusCode : 404
      });
    }

  const client = await Client.findOne({_id: req.body.clientId});

  if (!client) {
      throw ({
        tag : 'No longer available.',
        message : "The client you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
        statusCode : 404
      });
    }

  await Invoice.updateOne({_id : req.params.id} ,
    {$set:  { invNo     :  req.body.invNo,
              invDate   : moment(req.body.invDate).endOf('day'),
              message   : req.body.message,
              items     : req.body.items,
              client    : { _id  : client._id,
                          name   : client.name,
                          email  : client.email,
                          phone  : client.phone,
                          address1 : client.address1,
                          address2 : client.address2,
                          address3 : client.address3,
                          postcode : client.postcode,
                        },
              details   : {
                  business    : detail.business,
                  utr         : detail.utr,
                  email       : detail.email,
                  phone       : detail.phone,
                  bank        : detail.bank,
                  sortcode    : detail.sortcode,
                  accountNo   : detail.accountNo,
                  terms       : detail.terms,
                  contact     : detail.contact,
                  farewell    : detail.farewell,
                  address1    : detail.address1,
                  address2    : detail.address2,
                  address3    : detail.address3,
                  postcode    : detail.postcode
              },
            }
      });
   req.flash('success', `Invoice ${req.body.invNo} updated!`);
   res.redirect(`/dashboard`);

});

router.delete('/', [auth, admin], async (req, res) => {

  const { id, number, name, paid } = req.body;

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "Invoice can't be deleted",
      message : "The invoice can't be found maybe you should try again.",
      statusCode : 400
    });
  }

  const invoice =  await Invoice.findOne({_id: req.body.id});

  if (!invoice ){
    throw ({
      tag : "Invoice can't be found",
      message : "The client can't be found maybe you should try again.",
      statusCode : 404
    });
  }

  if (invoice.paid)  {
    req.flash('alert', "Can't delete a paid invoice.");
    throw ({
      tag : "Invoice can't be deleted",
      message : "The invoice can't be deleted if it has been paid, if you need to delete you'll need mark the invoice as unpaid first.",
      statusCode : 400
    });
  }

  await Invoice.deleteOne({ _id : invoice._id });

  req.flash('alert', `Invoice ${invoice.invNo} deleted!`);
  return res.redirect("/invoices");

});

module.exports = router
