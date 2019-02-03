const express           = require('express');
const router            = express.Router();
const {validationResult}= require('express-validator/check');
const validate          = require('../validators')
const {mongoose}        = require('../db/mongoose');
const {ObjectID}        = require('mongodb');
const {Detail}          = require("../models/detail");
const {authenticate}    = require('../middleware/authenticate');

router.get('/', (req, res) => {
  Detail.findOne()
  .then((detail) => {
    console.log(detail);
    res.render('details/details', {
        pageTitle       : "Invoice Details",
        pageDescription : "Basic Invoice Details",
        csrfToken       : req.csrfToken(),
        detail
    })
  })
  .catch((e) => {
    req.flash('alert', `details not available`);
    res.redirect("/dashboard");
  })
});

router.get('/edit',validate.detail , (req, res) => {
  Detail.findOne()
  .then((detail) => {
    let {utr, email, phone, bank, sortcode,
      accountNo, terms, contact, farewell} = detail;

    res.render('details/editdetails', {
      data            : {utr, email, phone, bank, sortcode,
                          accountNo, terms, contact, farewell},
      errors          : {},
      csrfToken       : req.csrfToken(),
      pageTitle       : "Edit Inv Info",
      pageDescription : "edit Inv Info."
    })
  }).catch((e) => {
    req.flash('alert', `Can't Connect`);
    res.render('404', {
        pageTitle       : "404",
        pageDescription : "Invalid resource",
    });
  });
});

router.patch('/', validate.detail , (req, res) => {

  const errors = validationResult(req)

  if (!errors.isEmpty()) {
    return res.render('details/editdetails', {
        data            : req.body,
        errors          : errors.mapped(),
        csrfToken       : req.csrfToken(),
        pageTitle       : "Edit Inv Info",
        pageDescription : "Give it another shot.",
    });
  } else {
    Detail.findOne()
    .then((detail) => {
      return detail.updateOne({
        $set:
         {
            utr      : req.body.utr,
            email    : req.body.email,
            phone    : req.body.phone,
            bank     : req.body.bank,
            sortcode : req.body.sortcode,
            accountNo: req.body.accountNo,
            terms    : req.body.terms,
            contact  : req.body.contact,
            farewell : req.body.farewell
          }
        })
      })
      .then((detail) => {
        req.flash('success', `Invoice Information updated!`);
        res.redirect(`/invoices`);
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

module.exports = router
