const express               = require('express');
const router                = express.Router();
const {validationResult}    = require('express-validator/check');
const validate              = require('../middleware/validators')
const validateId            = require('../middleware/validateId')
const {ObjectID}            = require('mongodb');
const {Expense, categories} = require("../models/expense");
const auth                  = require("../middleware/auth");
const admin                 = require("../middleware/admin");
const logger                = require('../startup/logger');
const mongoose              = require('mongoose');

router.get('/', [auth, admin], async (req, res) => {
  const expenses = await Expense.listExpensesByDate();

  res.render('expenses/expenses', {
    pageTitle: "Expenses",
    pageDescription: "Expenses.",
    expenses,
    admin : req.user.isAdmin
  })

});

router.get('/new', [auth, admin], async (req, res) => {
  res.render('expenses/newexpense', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),
    pageTitle       : "Add an Expense",
    pageDescription : "Create a new expenses.",
    categories
  });
});

router.post('/',  [auth, admin, validate.expense], async (req, res) => {

  let errors = validationResult(req);

  if (!errors.isEmpty()) {

    let selected;
    let nonSelected;

    if (req.body.category) {
      selected = categories.find(c => c == req.body.category);
      if (!selected){
        categories
      } else {
        nonSelected = categories.filter((c) => c != selected);
      }
    } else {
      categories
    }




    return res.render('expenses/newexpense', {
        data            : req.body,
        errors          : errors.mapped(),
        csrfToken       : req.csrfToken(),
        pageTitle       : "Add an Expense",
        pageDescription : "Give it another shot.",
        selected,
        nonSelected,
        categories
    });
  };


  const expense = await new Expense({
                  date      : req.body.date,
                  category  : req.body.category,
                  desc      : req.body.desc,
                  amount    : req.body.amount}).save();


  req.flash('success', `Expense created !`)
  res.redirect(`/expenses`);
});


module.exports = router
