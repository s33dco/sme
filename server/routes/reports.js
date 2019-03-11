const fs                = require('fs');
const Json2csvParser    = require('json2csv').Parser;
const express           = require('express');
const router            = express.Router();
const moment            = require('moment');
const {Invoice}         = require("../models/invoice");
const {Expense}         = require("../models/expense");
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
  const incomings         = await Invoice.sumOfPaidInvoicesBetween(start,end);
  const invoicesProduced  = await Invoice.numberOfInvoicesProducedBetween(start,end);
  const invoicesPaid      = await Invoice.numberOfInvoicesPaidBetween(start,end);
  const itemsInvoiced     = await Invoice.countItemsInvoicedBetween(start,end);
  const itemsPaid         = await Invoice.countItemsPaidBetween(start,end);
  const owed              = await Invoice.sumOfOwedInvoicesBetween(start,end);
  const labour            = await Invoice.sumOfLabourBetween(start,end);
  const labourList        = await Invoice.listLabourBetween(start,end);
  const expenses          = await Invoice.sumOfExpensesBetween(start,end);
  const expensesList      = await Invoice.listExpensesBetween(start,end);
  const materials         = await Invoice.sumOfMaterialsBetween(start,end);
  const materialsList     = await Invoice.listMaterialsBetween(start,end);
  const deductions        = await Expense.sumOfExpensesBetween(start,end);

  res.render('reports/viewer', {
    pageTitle       : "Report Results",
    pageDescription : `Report Results`,
    start,
    end,
    invoicesProduced,
    invoicesPaid,
    itemsInvoiced,
    itemsPaid,
    incomings,
    owed,
    labour,
    labourList,
    expenses,
    expensesList,
    materials,
    materialsList,
    deductions
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

  const {start, end, type} = req.query;

  if (type ==='incoming'){

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
                { label : 'Type',
                  value : 'items.type'},
                { label : 'Client Name',
                  value : 'client.name'},
                { label : 'Item Date',
                  value : (field) => moment(field).format('DD/MM/YY'),
                  stringify: true},
                { label : 'Description',
                  value : 'items.desc'},
                { label : 'Amount',
                  value : 'items.fee'},
                { label : 'Date Paid',
                  value : (field) => moment(field).format('DD/MM/YY'),
                  stringify: true}
              ];
    filepath =`./public/Earnings-${moment(start).format("Do-MMMM-YYYY")}-to-${moment(end).format("Do-MMMM-YYYY")}.csv`;

    data.forEach((item) => {
      item.items.fee = parseFloat(item.items.fee).toFixed(2);
    })

    console.log(data)

  } else {

    data  = await Expense.listOfExpensesBetween(start, end);

    if (data.length === 0 ) {
      req.flash('alert', 'no data to export!')
      return res.redirect('/reports')
    }

    fields = [
                { label : 'Expense Date',
                  value : 'date'},
                { label : 'Category',
                  value : 'category'},
                { label : 'Description',
                  value : 'desc'},
                { label : 'Amount',
                  value : 'amount'},
              ];

    filepath =`./public/Deductions-${moment(start).format("Do-MMMM-YYYY")}-to-${moment(end).format("Do-MMMM-YYYY")}.csv`;

    data.forEach((item) => {
      item.amount = parseFloat(item.amount).toFixed(2);
      item.date = moment(item.date).format('DD/MM/YY');
    })
    console.log(data)
  }



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
