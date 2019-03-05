const express           = require('express');
const router            = express.Router();
const moment            = require('moment');
const {Invoice}         = require("../models/invoice");
const {validationResult}= require('express-validator/check');
const validate          = require('../middleware/validators');
const auth              = require("../middleware/auth");
const logger            = require('../startup/logger');


router.get('/', auth, (req, res) => {
  res.render('reports/form', {
    data            : {},
    errors          : {},
    csrfToken       : req.csrfToken(),
    pageTitle       : "Run a report",
    pageDescription : "Run an invoice report.",
  });
});

router.post('/', [auth, validate.reports], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('reports/form', {
      data            : req.body,
      errors          : errors.mapped(),
      csrfToken       : req.csrfToken(),
      pageTitle       : "Run a report",
      pageDescription : "Run an invoice report.",
    });
  };

  const start             = moment(req.body.startDate).startOf('day');
  const end               = moment(req.body.endDate).endOf('day');
  const invoicesProduced  = await Invoice.numberOfInvoicesProducedBetween(start,end);
  const invoicesPaid      = await Invoice.numberOfInvoicesPaidBetween(start,end);
  const itemsInvoiced     = await Invoice.countItemsInvoicedBetween(start,end);
  const itemsPaid         = await Invoice.countItemsPaidBetween(start,end);
  const listPaidItems     = await Invoice.listPaidItemsBetween(start, end);
  const listUnpaidItems   = await Invoice.listUnpaidItemsBetween(start, end);
  const incomings         = await Invoice.sumOfPaidInvoicesBetween(start,end);
  const outgoings         = await Invoice.sumOfOutgoingsBetween(start,end);
  const owed              = await Invoice.sumOfOwedInvoicesBetween(start,end);
  const costs             = await Invoice.sumOfCostsBetween(start,end);
  const costsList         = await Invoice.listCostsBetween(start,end);
  const expenses          = await Invoice.sumOfExpensesBetween(start,end);
  const expensesList      = await Invoice.listExpensesBetween(start,end);


  req.flash('success', `Report created !`)
  
  res.render('reports/viewer', {
    pageTitle       : "Report Results",
    pageDescription : `Report Results`,
    start,
    end,
    invoicesProduced,
    invoicesPaid,
    itemsInvoiced,
    itemsPaid,
    listPaidItems,
    listUnpaidItems,
    incomings,
    outgoings,
    owed,
    costs,
    costsList,
    expenses,
    expensesList
  });

});




module.exports = router;
