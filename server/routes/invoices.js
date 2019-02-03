const express             = require('express');
const router              = express.Router();
const moment              = require('moment');
const {validationResult}  = require('express-validator/check');
const validate            = require('../validators')
const {mongoose}          = require('../db/mongoose');
const {ObjectID}          = require('mongodb');
const {Invoice}           = require("../models/invoice");
const {Client}            = require("../models/client");
const {Detail}            = require("../models/detail");
const {authenticate}      = require('../middleware/authenticate');

router.get('/',  (req, res) => {
  Invoice.listInvoices().then((invoices)=> {
      res.render('invoices/invoices', {
      pageTitle: "Invoices",
      pageDescription: "Invoice Admin.",
      invoices
    })
  }).catch((e) => {
    console.log(e.message);
    res.sendStatus(400);
  })
});

router.get('/new', (req, res) => {

  const promise = Promise.all([
    Invoice.newestInvoiceNumber(),
    Client.find({}, {name:1}).sort({name: 1})
  ]);

  promise.then(([lastInvoiceNo, clients]) => {

    console.log(lastInvoiceNo);

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

router.post('/',  validate.invoice, (req, res) => {
    const errors = validationResult(req)

    if (!errors.isEmpty()) {

      Client.find({}, {name:1}).sort({name: 1}).then((clients) => {
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
          console.log(e.message);
          res.status(400);
      });
    };
  });

router.get('/:id',  (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  Invoice.findOne({
    _id: id,
  }).then((invoice) => {
    if (!invoice) {
      req.flash('alert', "Can't find that invoice, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client"
      });
    }

    let total = invoice.totalInvoiceValue();

    res.render('invoices/invoice', {
        pageTitle       : "Invoice",
        pageDescription : "invoice.",
        total,
        invoice,
        csrfToken       : req.csrfToken()
    });
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

router.post('/email', (req, res) => {

  let id = req.body.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible to email this invoice.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }
  Invoice.findOne({  _id: id }).then((invoice) => {

    if (!invoice) {
      req.flash('alert', "Can't find that invoice, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client"
      });
    }

    // send the email....

    req.flash('success', `Invoice ${invoice.invNo} sent to ${invoice.client.email}`)
    res.redirect('/dashboard')
  })
  .catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource"
    })
  })
});

router.patch('/paid', (req, res) => {
  let id = req.body.id
  if (!ObjectID.isValid(id)) {
    console.log('invalid id');
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  Invoice.findOneAndUpdate(
   { _id : id },
   {$set: {paid:true},$currentDate: { datePaid: true}},
   {new : true })
  .then((invoice) => {
     req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} paid!`);
     res.redirect('/dashboard');
   })
  .catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
      pageTitle       : "404",
      pageDescription : "Invalid resource",
    });
  });
});

router.patch('/unpaid', (req, res) => {
  let id = req.body.id;

  if (!ObjectID.isValid(id)) {
    console.log('invalid id', id);
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  };

  Invoice.findOneAndUpdate(
     { _id : id },
     {$set: {paid:false}, $unset: {datePaid:1}},
     {new : true })
  .then((invoice) => {
     req.flash('success', `Invoice ${invoice.invNo} for ${invoice.client.name} now unpaid!`);
     res.redirect("/dashboard");
   }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
      pageTitle       : "404",
      pageDescription : "Invalid resource",
    });
  });
});

router.post('/edit', (req, res) => {
  let id = req.body.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const promise = Promise.all([
    Invoice.findOne({  _id: id }),
    Client.find({}, {name:1}).sort({name: 1})
  ]);

  promise.then(([invoice, clients]) => {

    if (!invoice ) {
      req.flash('alert', "Can't find that invoice...");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client"
      });
    }

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

router.patch('/:id',  validate.invoice,(req, res) => {

  const errors = validationResult(req)

  if (!errors.isEmpty()) {

    Client.find({}, {name:1}).sort({name: 1}).then((clients) => {
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

router.delete('/', (req, res) => {
  console.log(req.body)
  const { id, number, name, paid } = req.body;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }
  if (paid === 'true')  {
    req.flash('alert', "Can't delete a paid invoice.");
    return res.redirect("/dashboard");
  }

  Invoice.deleteOne({ _id : id })
  .then((invoice) => {
     req.flash('alert', `Invoice ${number} for ${name} deleted!`);
     return res.redirect("/invoices");
   }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

module.exports = router
