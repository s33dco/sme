const express             = require('express');
const router              = express.Router();
const moment              = require('moment');
const {validationResult}  = require('express-validator/check');
const validate            = require('../middleware/validators');
const validateId          = require('../middleware/validateId')
const {ObjectID}          = require('mongodb');
const {Invoice}           = require("../models/invoice");
const {Client}            = require("../models/client");
const {Detail}            = require("../models/detail");
const logger              = require('../startup/logger');
const auth                = require("../middleware/auth");
const admin               = require("../middleware/admin");

router.get('/',  auth, async (req, res) => {
  const invoices = await Invoice.listInvoices();

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
          invDate    : req.body.invDate,
          message    : req.body.message,
          client     : {
              _id         : client._id,
              name        : client.name,
              email       : client.email,
              phone       : client.phone
          },
          items      : req.body.items,
          details    : {
              utr         : detail.utr,
              email       : detail.email,
              phone       : detail.phone,
              bank        : detail.bank,
              sortcode    : detail.sortcode,
              accountNo   : detail.accountNo,
              terms       : detail.terms,
              contact     : detail.contact
          },
          paid        : false
        }).save()
    req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} created !`)
    res.redirect(`invoices/${invoice._id}`);
  });

router.get('/:id',  [auth, validateId ], async (req, res) => {
  let id = req.params.id;

  const invoice = await Invoice.findOne({ _id: id});

  if (!invoice) {
    throw ({
      tag : 'No longer available.',
      message : "The client you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
      statusCode : 404
    });
  }

  let total = invoice.totalInvoiceValue();

  res.render('invoices/invoice', {
      pageTitle       : "Invoice",
      pageDescription : "invoice.",
      total,
      invoice,
      csrfToken       : req.csrfToken(),
      admin : req.user.isAdmin
  });
});

router.post('/email', auth, async (req, res) => {

  let id = req.body.id;

  if (!ObjectID.isValid(id)) {throw Error("No find")}

  const invoice = await Invoice.findOne({  _id: id });

  if (!invoice) {throw Error("No find")}

    // send the email....

  req.flash('success', `Invoice ${invoice.invNo} sent to ${invoice.client.email}`)
  res.redirect('/dashboard')
});

router.patch('/paid', [auth, admin], async (req, res) => {

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

  await invoice.update({paid: true, $currentDate: { datePaid: true}});

  req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} paid!`);
  res.redirect('/dashboard');
});

router.patch('/unpaid', [auth, admin], async (req, res) => {

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

router.post('/edit', [auth, admin], async (req, res) => {
  let id = req.body.id;

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "Invoice can't be edited",
      message : "The invoice can't be found or amended.",
      statusCode : 400
    });
  }

  invoice = await Invoice.findOne({  _id: id });

  if (!invoice ){
    throw ({
      tag : "Invoice can't be edited",
      message : "The invoice can't be found or edited, maybe you should try again.",
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

  const clients = await Client.find({}, {name:1}).sort({name: 1})

  let { client, _id, invNo, invDate, message, items, paid} = invoice;
  let clientId = client._id;
  let selected = client

  res.render('invoices/editinvoice', {
    clients,
    selected,
    data: { _id, invNo, invDate, message, items, paid, clientId},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle       : "Edit Invoice",
    pageDescription : "edit invoice."
  })
});

router.patch('/:id',  [auth, admin, validate.invoice], async (req, res) => {

  const errors = validationResult(req)

  if (!errors.isEmpty()) {

    const clients = await Client.find({}, {name:1}).sort({name: 1});
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

    return res.render('invoices/editinvoice', {
        data            : req.body,
        errors          : errors.mapped(),
        csrfToken       : req.csrfToken(),
        pageTitle       : "Invoice",
        pageDescription : "Give it another shot.",
        clients,
        selected
    });

  } else {
    const promise = Promise.all([
      Invoice.findOne({_id : req.params.id}),
      Client.findOne({_id: req.body.clientId})
    ]);

    promise.then(([invoice, client]) => {
      return invoice.updateOne({
        $set:
        {
            invNo    : req.body.invNo,
            invDate  : req.body.invDate,
            message  : req.body.message,
            items    : req.body.items,
            client: {
              _id         : client._id,
              name        : client.name,
              email       : client.email,
              phone       : client.phone
            }
        }
      })
    })
    .then((client) => {
       req.flash('success', `Invoice ${req.body.invNo} updated!`);
       res.redirect(`/dashboard`);
     })
     .catch((e) => {
      req.flash('alert', `${e.message}`);
      res.render('404', {
          pageTitle       : "404",
          pageDescription : "Invalid resource",
      });
    });
  }
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
