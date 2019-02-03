const express             = require('express');
const router              = express.Router();
const {validationResult}  = require('express-validator/check');
const validate            = require('../validators')
const {mongoose}          = require('../db/mongoose');
const {ObjectID}          = require('mongodb');
const {User}              = require("../models/user");
const {authenticate}      = require('../middleware/authenticate');

router.get('/',(req, res) => {
  let users = User.find({},{firstName:1, lastName:1}).sort({firstName: 1}).then((users) => {
    res.render('users/users', {
        pageTitle       : "Users",
        pageDescription : "People with access.",
        users
    });
  }).catch((e) => {
    res.send(400);
  });
});

router.get('/new', (req, res) => {
  res.render('users/newuser', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a user",
    pageDescription : "Create a new user with admin access."
  });
});

router.post('/',  validate.user , (req, res) => {
  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.render('users/newuser', {
      data            : req.body,
      errors          : errors.mapped(),
      csrfToken       : req.csrfToken(),  // generate new csrf token
      pageTitle       : "Add a user",
      pageDescription : "Give it another shot."
    });
  };

  const { firstName, lastName, email, password } = req.body;
  let user = new User({ firstName, lastName, email, password });

    // TODO: why auth token this should be on login only
  user.save().then(() => {
    return user.generateAuthToken();
  }).then((token) => {
    req.flash('success', `${user.firstName} ${user.lastName} created !`)
    res.header('x-auth', token).redirect('/dashboard') // create custom header 'x-auth' with value of token
  }).catch((e) => {
    res.status(400).send(e);
  });
});

router.get('/:id',(req, res) => {
  let id = req.params.id;
  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }
  User.findOne({
    _id: id,
  }).then((user) => {
    if (!user) {
      req.flash('alert', "Can't find that client, maybe try later.");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that client",
      });
    }
    res.render('users/user', {
        pageTitle       : "Users",
        pageDescription : "People with access.",
        csrfToken: req.csrfToken(),
        user
    });
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

router.post('/edit', validate.useredit, (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  User.findOne({_id: req.body.id})
  .then((user) => {
    if (!user ) {
      req.flash('alert', "Can't find that user...");
      return res.render('404', {
          pageTitle       : "404",
          pageDescription : "Can't find that user"
      });
    }

    let { _id, firstName, lastName, email} = user;

    res.render('users/edituser', {
      data: { _id, firstName, lastName, email },
      errors: {},
      csrfToken: req.csrfToken(),
      pageTitle       : "Edit user",
      pageDescription : "edit user."
    })
  }).catch((e) => {
    req.flash('alert', `${e.message}`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

router.patch('/:id', validate.useredit ,(req, res) => {

  if (!ObjectID.isValid(req.params.id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.render('users/edituser', {
        data            : req.body,
        errors          : errors.mapped(),
        csrfToken       : req.csrfToken(),
        pageTitle       : "Edit User",
        pageDescription : "Give it another shot.",
    });
  } else {
    User.findOne({_id : req.params.id})
    .then((user) => {
        user.firstName = req.body.firstName;
        user.lastName  = req.body.lastName;
        user.email     = req.body.email;
        user.password  = req.body.password;
        user.save();



      // return user.updateOne({
      //   $set:
      //    {
      //       firstName : req.body.firstName,
      //       lastName  : req.body.lastName,
      //       email     : req.body.email,
      //       password  : req.body.password
      //     }
      //   })
    })
    .then((user) => {
      req.flash('success', `${req.body.firstName} ${req.body.lastName} updated!`);
      res.redirect(`/users`);
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

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    res.redirect("/dashboard");
  }

  const promise = Promise.all([
    User.findOne({ _id : id }),
    User.count()
  ]);

  promise.then(([user, count]) => {
    if (count === 1) {
      return Promise.reject(new Error('Must be atleast one user'));
    } else {
      user.remove()
    }
  })
  .then(() => {
       req.flash('alert', `${req.body.firstName} ${req.body.lastName} deleted!`);
       res.redirect("/users");
  })
  .catch((e) => {
      req.flash('alert', `${e.message}`);
      res.redirect("/users");
  });
});

module.exports = router
