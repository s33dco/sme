const express             = require('express');
const router              = express.Router();
const {validationResult}  = require('express-validator/check');
const validate            = require('../validators')
const {mongoose}          = require('../db/mongoose');
const {ObjectID}          = require('mongodb');
const {User}              = require("../models/user");
const auth                = require("../middleware/auth");
const admin               = require("../middleware/admin");
const asyncMiddleware = require('../middleware/async');


router.get('/', [auth, admin], asyncMiddleware(async (req, res) => {
  const users = await User.find({},{firstName:1, lastName:1}).sort({firstName: 1});
  res.render('users/users', {
      pageTitle       : "Users",
      pageDescription : "People with access.",
      users,
      admin : req.user.isAdmin
  });
}));

router.get('/new', [auth, admin], (req, res) => {
  res.render('users/newuser', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a user",
    pageDescription : "Create a new user with admin access."
  });
});

router.post('/', [auth, admin,validate.user] , asyncMiddleware(async (req, res) => {
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
  let newUser = new User({ firstName, lastName, email, password });

  await newUser.save() // uses .pre('save') to encrypt password
  req.flash('success', `${newUser.firstName} ${newUser.lastName} created !`)
  res.redirect('/dashboard')
}));

router.get('/:id', [auth, admin], asyncMiddleware(async (req, res) => {
  let id = req.params.id;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const viewUser = await User.findOne({_id: id});

  if (!viewUser) {
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
      user : viewUser
  });
}));

router.post('/edit', [auth, admin, validate.useredit], asyncMiddleware(async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const editUser = await User.findOne({_id: req.body.id});

  if (!editUser ) {
    req.flash('alert', "Can't find that user...");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Can't find that user"
    });
  }

  let { _id, firstName, lastName, email} = editUser;

  res.render('users/edituser', {
    data: { _id, firstName, lastName, email },
    errors: {},
    csrfToken: req.csrfToken(),
    pageTitle       : "Edit user",
    pageDescription : "edit user."
  })
}));

router.post('/upgrade', [auth, admin], asyncMiddleware(async (req, res) => {

  console.log(req.body.id)

  if (!ObjectID.isValid(req.body.id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  const user = await User.findOneAndUpdate(
     { _id : req.body.id },
     {$set: {isAdmin : true}},
     {new : true });

  req.flash('success', `${user.firstName} can now change data`);
  res.redirect('/dashboard');
}));

router.post('/downgrade', [auth, admin], asyncMiddleware(async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    return res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  }

  if ( req.user._id === req.body.id) {
    req.flash('alert', `You can't give up admin rights!`);
    return res.redirect('/dashboard');
  }

  const user = await User.findOneAndUpdate(
     { _id : req.body.id },
     {$set: {isAdmin : false}},
     {new : true });

  req.flash('success', `${user.firstName} can only view data`);
  res.redirect('/dashboard');
}));

router.patch('/:id', [auth, admin, validate.useredit], asyncMiddleware(async (req, res) => {

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

// this is about the pre.save

    let updateUser = await User.findOne({_id : req.params.id});
    updateUser.firstName = req.body.firstName;
    updateUser.lastName  = req.body.lastName;
    updateUser.email     = req.body.email;
    // TODO: leave password empty and not fail validation.....
    // if (password){user.password  = req.body.password};

    await updateUser.save();

    req.flash('success', `${req.body.firstName} ${req.body.lastName} updated!`);
    res.redirect(`/users`);

  }
}));

router.delete('/', [auth, admin], (req, res) => {
  const { id, name, billed } = req.body;

  if (!ObjectID.isValid(id)) {
    req.flash('alert', "Not possible invalid ID, this may update.");
    res.redirect("/dashboard");
  }

  if ( req.user._id === req.body.id) {
    req.flash('alert', `You can't delete yourself!`);
    return res.redirect('/dashboard');
  }

  const promise = Promise.all([
    User.findOne({ _id : id }),
    User.count()
  ]);

  promise.then(([xUser, count]) => {
    if (count === 1) {
      return Promise.reject(new Error('Must be atleast one user'));
    } else {
      xUser.remove();
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
