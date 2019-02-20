const express           = require('express');
const router            = express.Router();
const {validationResult}= require('express-validator/check');
const validate          = require('../middleware/validators')
const validateId        = require('../middleware/validateId')
const {ObjectID}        = require('mongodb');
const {Client}          = require("../models/client");
const {Invoice}         = require("../models/invoice");
const auth              = require("../middleware/auth");
const admin             = require("../middleware/admin");
const logger            = require('../startup/logger');
const mongoose          = require('mongoose');

router.get('/', auth, async (req, res) => {
  const clients = await Client.find({}, {name:1}).sort({name: 1});
  res.render('clients/clients', {
      pageTitle       : "Client List",
      pageDescription : "Clients.",
      clients,
      admin : req.user.isAdmin
  });
});

router.get('/new', [auth, admin], (req, res) => {
  res.render('clients/newclient', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a client",
    pageDescription : "Create a new client."
  });
});

router.get('/:id', [auth, validateId ], (req, res) => {
  const id = req.params.id;

  const promise = Promise.all([
    Client.withId(id),
    Invoice.listItemsByClient(id)
    ]);

  promise.then(([client, itemsList]) => {

    if (!client) {
      throw ({
        tag : 'No longer available.',
        message : "The resource you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
        statusCode : 404
      });
    }

    if (itemsList.length > 0){
      total = itemsList.map(item => item.items.fee).reduce((total, fee) => total + fee)
    } else {
      total = '0'
    }
    res.render('clients/client', {
        pageTitle       : "Client",
        pageDescription : "Client.",
        csrfToken       : req.csrfToken(),
        client,
        itemsList,
        total,
        admin : req.user.isAdmin
    });
  })
  .catch((e) => {
    logger.error(`${e.statusCode} - ${e.tag} - ${e.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    req.flash('alert', "We can't find that for you.");
    res.render('error', {
      errorCode: e.statusCode,
      errorTag: e.tag,
      errorMessage : e.message,
      pageTitle: e.statusCode,
      pageDescription: `${e.tag}`
    });
  })
});

router.post('/', [auth, admin, validate.client], async (req, res) => {

  let errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.render('clients/newclient', {
      data            : req.body,
      errors          : errors.mapped(),
      csrfToken       : req.csrfToken(),  // generate new csrf token
      pageTitle       : "Add a client",
      pageDescription : "Give it another shot."
    });
  };

  const { name, email, phone} = req.body;

  let client = new Client({name, email, phone});
  await client.save();
  req.flash('success', `${client.name} created !`)
  res.redirect('/clients')
});

router.post('/edit', [auth, admin], async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "Client can't be edited",
      message : "The client can't be found maybe you should try again.",
      statusCode : 400
    });
  }

  const client =  await Client.findOne({_id: req.body.id});

  if (!client ){
    throw ({
      tag : "Client can't be found",
      message : "The client can't be found maybe you should try again.",
      statusCode : 404
    });
  }

  let { _id, name, email, phone} = client;

  res.render('clients/editclient', {
    data: { _id, name, email, phone},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle       : "Edit Client",
    pageDescription : "edit client."
  })
});

router.patch('/:id', [auth, admin, validate.client, validateId], async (req, res) => {

  if (!ObjectID.isValid(req.params.id)) {throw Error("No find")}

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.render('clients/editclient', {
        data            : req.body,
        errors          : errors.mapped(),
        csrfToken       : req.csrfToken(),
        pageTitle       : "Edit Client",
        pageDescription : "Give it another shot.",
    });
  } else {
    const client = await Client.findOneAndUpdate({_id: req.params.id},
      {name: req.body.name, phone: req.body.phone, email: req.body.email},
      {new: true});

    req.flash('success', `${client.name} updated!`);
    res.redirect(`/clients`);
  }
});

router.delete('/', [auth, admin], async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "Client can't be deleted",
      message : "The client can't be found maybe you should try again.",
      statusCode : 400
    });
  }

  const client =  await Client.findOne({_id: req.body.id});

  if (!client ){
    throw ({
      tag : "Client can't be found",
      message : "The client can't be found maybe you should try again.",
      statusCode : 404
    });
  }


// TODO: improve this so found from db rather than sent from form...
// use InvoicewithClientId(client._id)

  if (req.body.billed != 0) {
    req.flash('alert', `${client.name} cannot be deleted!`);
    throw ({
      tag : "Client can't be deleted",
      message : `The client is attached to invoice(s) and cannot be deleted.`,
      statusCode : 400
    });
  }

  await client.remove();

  req.flash('alert', `${client.name} deleted!`);
  res.redirect("/dashboard");
});

module.exports = router
