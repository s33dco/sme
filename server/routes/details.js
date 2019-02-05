const express           = require('express');
const router            = express.Router();
const {validationResult}= require('express-validator/check');
const validate          = require('../validators')
const {mongoose}        = require('../db/mongoose');
const {ObjectID}        = require('mongodb');
const {Detail}          = require("../models/detail");
const auth              = require("../middleware/auth");
const admin              = require("../middleware/admin");
const asyncMiddleware = require('../middleware/async');


router.get('/', [auth, admin], asyncMiddleware(async (req, res) => {
  const detail = await Detail.findOne();
  res.render('details/details', {
      pageTitle       : "Invoice Details",
      pageDescription : "Basic Invoice Details",
      csrfToken       : req.csrfToken(),
      detail
  })
}));

router.get('/edit', [auth, admin, validate.detail] , asyncMiddleware(async (req, res) => {
  let detail = await Detail.findOne();

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

}));

router.patch('/', [auth, admin, validate.detail] , asyncMiddleware(async (req, res) => {

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
    let detail = await Detail.findOne();
    await detail.updateOne({
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

    req.flash('success', `Invoice Information updated!`);
    res.redirect(`/invoices`);
  }
}));

module.exports = router
