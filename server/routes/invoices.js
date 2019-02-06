const express             = require('express');
const router              = express.Router();
const moment              = require('moment');
const {validationResult}  = require('express-validator/check');
const validate            = require('../middleware/validators')
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

router.get('/new', [auth, admin], (req, res) => {

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

      return res.render('invoices/newinvoice', {
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
        Detail.findOne(),
        Client.findOne({_id: req.body.clientId})
      ]);

      promise.then(([detail, client]) => {
        return new Invoice({
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
        }).save();
      }).then((invoice) => {
          req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} created !`)
          res.redirect(`invoices/${invoice._id}`);
      }).catch((e) => {
          logger.error(e.message);
          res.status(500);
      });
    };
  });

router.get('/:id',  auth, async (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {throw Error("No find")}

  const invoice = await Invoice.findOne({ _id: id});

  if (!invoice) {throw Error("No find")}

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
  let id = req.body.id
  if (!ObjectID.isValid(id)) {throw Error("No find")}

  const invoice = await Invoice.findOneAndUpdate(
     { _id : id },
     {$set: {paid:true},$currentDate: { datePaid: true}},
     {new : true });

  req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} paid!`);
  res.redirect('/dashboard');
});

router.patch('/unpaid', [auth, admin], async (req, res) => {
  let id = req.body.id;

  if (!ObjectID.isValid(id)) {throw Error("No find")}

  const invoice = await Invoice.findOneAndUpdate(
     { _id : id },
     {$set: {paid:false}, $unset: {datePaid:1}},
     {new : true });

  req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} now unpaid!`);
  res.redirect("/dashboard");
});

router.post('/edit', [auth, admin], (req, res) => {
  let id = req.body.id;

  if (!ObjectID.isValid(id)) {throw Error("No find")}

  const promise = Promise.all([
    Invoice.findOne({  _id: id }),
    Client.find({}, {name:1}).sort({name: 1})
  ]);

  promise.then(([invoice, clients]) => {

    if (!invoice ) {throw Error("No find")}

    if (invoice.paid ) {
      req.flash('alert', "can't edit a paid invoice!");
      res.redirect(`/dashboard`);
    }

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
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
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

  if (!ObjectID.isValid(id)) {throw Error("No find")}
  if (paid === 'true')  {
    req.flash('alert', "Can't delete a paid invoice.");
    return res.redirect("/dashboard");
  }

  const invoice = await Invoice.deleteOne({ _id : id });

  req.flash('alert', `Invoice ${number} for ${name} deleted!`);
  return res.redirect("/invoices");
});

module.exports = router
