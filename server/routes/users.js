const express             = require('express');
const router              = express.Router();
const {validationResult}  = require('express-validator/check');
const validate            = require('../middleware/validators');
const validateId          = require('../middleware/validateId');
const {ObjectID}          = require('mongodb');
const {User}              = require("../models/user");
const auth                = require("../middleware/auth");
const admin               = require("../middleware/admin");
const logger              = require('../startup/logger');

router.get('/', [auth, admin], async (req, res) => {
  const users = await User.find({},{firstName:1, lastName:1}).sort({firstName: 1});
  res.render('users/users', {
      pageTitle       : "Users",
      pageDescription : "People with access.",
      users,
      admin : req.user.isAdmin
  });
});

router.get('/new', [auth, admin], (req, res) => {
  res.render('users/newuser', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),  // generate a csrf token
    pageTitle       : "Add a user",
    pageDescription : "Create a new user with admin access."
  });
});

router.get('/:id', [auth, admin, validateId], async (req, res) => {
  let id = req.params.id;

  const viewUser = await User.findOne({_id: id});

  if (!viewUser) {
    throw ({
      tag : 'No longer available.',
      message : "The user you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
      statusCode : 404
    });
  }

  res.render('users/user', {
      pageTitle       : "Users",
      pageDescription : "People with access.",
      csrfToken: req.csrfToken(),
      user : viewUser
  });
});

router.delete('/', [auth, admin], async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "User can't be deleted",
      message : "The user can't be found maybe you should try again.",
      statusCode : 400
    });
  }

  if ( req.user._id === req.body.id) {
    throw ({
      tag : "You can't delete yourself!",
      message : "If you want to delete yourself get another admin user to do it for you.",
      statusCode : 400
    });
  }

  const user = await User.findOne({_id: req.body.id})

  if (!user ){
    throw ({
      tag : "User can't be found",
      message : "The user can't be found maybe you should try again.",
      statusCode : 404
    });
  }

  const count = await User.find().countDocuments();

  if (count === 1) {
    throw ({
      tag : "Cann't delete last user.",
      message : "If there is only one user they cannot be deletes.",
      statusCode : 400
    });
  }

  await User.deleteOne({ _id : user._id });

  req.flash('alert', `${user.firstName} ${user.lastName} deleted!`);
  res.redirect("/users");
});

router.post('/upgrade', [auth, admin], async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "User can't be upgraded",
      message : "The user can't be to make an admin, should try again.",
      statusCode : 400
    });
  }

  let user = await User.findOne({_id: req.body.id})

  if (!user ){
    throw ({
      tag : "User can't be found",
      message : "The user can't be found maybe you should try again.",
      statusCode : 404
    });
  }

  await User.findOneAndUpdate(
     { _id : req.body.id },
     {$set: {isAdmin : true}},
     {new : true });

  req.flash('success', `${user.firstName} can now change data`);
  res.redirect('/dashboard');
});

router.post('/downgrade', [auth, admin], async (req, res) => {

  if (!ObjectID.isValid(req.body.id)) {
    throw ({
      tag : "User can't be updated",
      message : "The user can't be found, should try again.",
      statusCode : 400
    });
  }

  const user = await User.findOne({_id: req.body.id})

  if (!user ){
    throw ({
      tag : "User can't be found",
      message : "The user can't be found maybe you should try again.",
      statusCode : 404
    });
  }

  let adminCount = await User.countAdmins();

  if (adminCount.length === 1){
    throw ({
      tag : "Cannot change status",
      message : "There must be atleast one user with admin rights",
      statusCode : 400
    });
  }

  await User.findOneAndUpdate(
    { _id : req.body.id },
    {$set: {isAdmin : false}},
    {new : true });

  req.flash('success', `${user.firstName} can now change data`);
  res.redirect('/dashboard');
});

router.post('/', [auth, admin,validate.user], async (req, res) => {
  let errors = validationResult(req)

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
});

router.get('/edit/:id', [auth, admin, validateId, validate.useredit], async (req, res) => {

  const user = await User.findOne({_id: req.params.id})

  if (!user ){
    throw ({
      tag : "User can't be edited",
      message : "The user can't be found or edited, maybe you should try again.",
      statusCode : 404
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
});

router.put('/:id', [auth, admin, validateId, validate.useredit], async (req, res) => {

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

    if (!updateUser) {
      throw ({
        tag : "User can't be found",
        message : "The user can't be found to update maybe you should try again.",
        statusCode : 404
      });
    }

    updateUser.firstName = req.body.firstName;
    updateUser.lastName  = req.body.lastName;
    updateUser.email     = req.body.email;
    // TODO: leave password empty and not fail validation.....
    // if (password){user.password  = req.body.password};

    await updateUser.save();

    req.flash('success', `${updateUser.firstName} ${updateUser.lastName} updated!`);
    res.redirect(`/users`);
  }
});

module.exports = router
