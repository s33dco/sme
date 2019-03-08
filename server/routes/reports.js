const fs                = require('fs');
const Json2csvParser    = require('json2csv').Parser;
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
    pageTitle       : "Run a report",
    pageDescription : "Run an invoice report.",
  });
});

router.get('/viewer', [auth, validate.reports], async (req, res) => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('reports/form', {
      data            : req.query,
      errors          : errors.mapped(),
      pageTitle       : "Run a report",
      pageDescription : "Run an invoice report.",
    });
  };

  const start             = moment(req.query.start).startOf('day').toISOString();
  const end               = moment(req.query.end).endOf('day').toISOString();
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

router.get('/download', [auth, validate.download], async (req, res) => {
  let errors = validationResult(req);
  let data, fields, filepath;

  if (!errors.isEmpty()) {
    logger.error(`csv failed `, errors)
    req.flash('alert', 'export failed !')
    return res.redirect('/reports')
  }

  const {type, start, end} = req.query;

  if (type === 'incoming'){

    data  = await Invoice.listPaidItemsBetween(start, end);

    if (data.length === 0 ) {
      req.flash('alert', 'no data to export!')
      return res.redirect('/reports')
    }

    fields = [
                      { label : 'Invoice',
                        value : 'invNo'},
                      { label : 'Invoice Date',
                        value : (field) => moment(field).format('DD/MM/YY'),
                        stringify: true},
                      { label : 'Client Name',
                        value : 'client.name'},
                      { label : 'Item Date',
                        value : (field) => moment(field).format('DD/MM/YY'),
                        stringify: true},
                      { label : 'Description',
                        value : 'items.desc'},
                      { label : 'Amount',
                        value : 'items.fee'},
                      // { label : 'Amount',
                      //   value : (field) => stringMoney(field),
                      //   stringify: true},


                      { label : 'Date Paid',
                        value : (field) => moment(field).format('DD/MM/YY'),
                        stringify: true}
                    ];
    filepath =`./public/Incomings-${moment(start).format("Do-MMMM-YYYY")}-to-${moment(end).format("Do-MMMM-YYYY")}.csv`;

  } else {
    data = await Invoice.listOutgoingsBetween(start, end);

    if (data.length === 0 ) {
      req.flash('alert', 'no data to export!')
      return res.redirect('/reports')
    }

    fields = [
                      { label : 'Invoice',
                        value : 'invNo'},
                      { label : 'Item Date',
                        value : (field) => moment(field).format('DD/MM/YY'),
                        stringify: true},
                      { label : 'Description',
                        value : 'items.desc'},
                      { label : 'Amount',
                        value : 'items.fee'}
                    ];
    filepath =`./public/Outgoings-${moment(start).format("Do-MMMM-YYYY")}-to-${moment(end).format("Do-MMMM-YYYY")}.csv`;

  }

  data.forEach((item) => {
    item.items.fee = parseFloat(item.items.fee).toFixed(2);
  })
  
  const json2csvParser = new Json2csvParser({ fields });
  const csv = json2csvParser.parse(data);

  fs.writeFile(filepath, csv, function(err,data) {
     if (err) {throw err;}
     else{
       res.download(filepath);
     }
  });


});


module.exports = router;
