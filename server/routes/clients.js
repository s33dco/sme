const express           = require('express');
const router            = express.Router();
const {validationResult}= require('express-validator/check');
const validate          = require('../validators')
const {mongoose}        = require('../db/mongoose');
const {ObjectID}        = require('mongodb');
const {Client}          = require("../models/client");
const {Invoice}         = require("../models/invoice");
const auth              = require("../middleware/auth");
const admin             = require("../middleware/admin");

router.get('/', auth , async (req, res) => {
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

router.post('/', [auth, admin, validate.client], async (req, res) => {

  const errors = validationResult(req)

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

router.get('/:id', auth, (req, res) => {
  const id = req.params.id;

  if (!ObjectID.isValid(id)){throw Error("No find")}

  const promise = Promise.all([
    Client.findOne({_id: id}),
    Invoice.listItemsByClient(id)
    ]);

  promise.then(([client, itemsList]) => {

    if (!client) { throw Error("We can't find that.")}

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
    req.flash('alert', "We can't get that for you.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  })
});

router.post('/edit', [auth, admin], async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {throw Error("No find")}

  const client =  await Client.findOne({_id: req.body.id});

  if (!client ){throw Error("No find")}

  let { _id, name, email, phone} = client;

  res.render('clients/editclient', {
    data: { _id, name, email, phone},
    errors: {},
    csrfToken: req.csrfToken(),  // generate a csrf token
    pageTitle       : "Edit Client",
    pageDescription : "edit client."
  })
});

router.patch('/:id', [auth, admin, validate.client], async (req, res) => {

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
      {name: req.body.name, phone: req.body.phone, email: req.body.email});

    req.flash('success', `Invoice ${req.body.name} updated!`);
    res.redirect(`/clients`);
  }
});

router.delete('/', [auth, admin], async (req, res) => {
  const { id, name, billed } = req.body;

  if (!ObjectID.isValid(id)) {throw Error("No find")}

  if (billed > 0) {
    req.flash('alert', "Can't delete a billed client.");
    return res.redirect(`/clients`);
  }

  const client = await Client.findByIdAndRemove(id);

  req.flash('alert', `${req.body.name} deleted!`);
  res.redirect("/dashboard");
});

module.exports = router
