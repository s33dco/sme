const express           = require('express');
const router            = express.Router();
const {validationResult}= require('express-validator/check');
const validate          = require('../validators')
const {mongoose}        = require('../db/mongoose');
const {ObjectID}        = require('mongodb');
const {Client}          = require("../models/client");
const {authenticate}    = require('../middleware/authenticate');

router.get('/', (req, res) => {
  let clients = Client.find({}, {name:1}).sort({name: 1}).then((clients) => {
    res.render('clients/clients', {
        pageTitle       : "Client List",
        pageDescription : "Clients.",
        clients
    });
  }).catch((e) => {
    res.send(400);
  })
});

router.get('/new', (req, res) => {
  res.render('clients/newclient', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a client",
    pageDescription : "Create a new client."
  });
});

router.post('/', validate.client, (req, res) => {

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

  client.save().then(() => {
    req.flash('success', `${client.name} created !`)
    res.redirect('/clients')
  }).catch((e) => {
    res.status(400).send(e);
  });
});

router.get('/:id', (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const promise = Promise.all([
    Client.findOne({_id: id}),
    Invoice.listItemsByClient(id)
    ]);

  promise.then(([client, itemsList]) => {

    if (!client) {
      req.flash('alert', "Can't find that client, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client",
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
        total
    });
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

router.post('/edit', (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  console.log('id ok')

  Client.findOne({_id: req.body.id})
  .then((client) => {
    console.log(client)
    if (!client ) {
      req.flash('alert', "Can't find that client...");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client"
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
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

router.patch('/:id', validate.client,(req, res) => {

  if (!ObjectID.isValid(req.params.id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

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
    Client.findOne({_id : req.params.id})
    .then((client) => {
      return client.updateOne({
        $set:
         {
            name    : req.body.name,
            phone  : req.body.phone,
            email  : req.body.email,
          }
        })
      })
      .then((client) => {
        req.flash('success', `Invoice ${req.body.name} updated!`);
        res.redirect(`/clients`);
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
  const { id, name, billed } = req.body;

  console.log(billed)

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  if (billed > 0) {
    req.flash('alert', "Can't delete a billed client.");
    return res.redirect(`/clients`);
  }

  Client.deleteOne({ _id : id })
  .then((client) => {
     req.flash('alert', `${req.body.name} deleted!`);
     res.redirect("/dashboard");
   }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

module.exports = router
