const express     = require('express');
const router      = express.Router();
const moment      = require('moment');
const {Invoice}   = require("../models/invoice");
const auth        = require("../middleware/auth")
const logger      = require('../startup/logger');

router.get('/', auth, (req, res) => {
  const promise = Promise.all([
    Invoice.countUniqueClients(),
    Invoice.listInvoices(),
    Invoice.sumOfPaidInvoices(),
    Invoice.sumOfOwedInvoices(),
    Invoice.listUnpaidInvoices()
  ]);

  promise.then(([billedClients, allInvoices, totalPaid, totalOwed, unpaidInvoiceList]) => {

    let uniqueClients = billedClients[0].count;
    let noInvoicesProduced  = allInvoices.length;
    let noUnpaidInvoices    = unpaidInvoiceList.length
    let firstInvoice = allInvoices.pop();
    let firstDate = firstInvoice._id.date;
    let owed = totalOwed.length == 0 ? 0 : totalOwed[0].total;
    let paid = totalPaid.length == 0 ? 0 : totalPaid[0].total;
    let tradingDays = moment(Date.now()).diff(moment(firstDate), 'days');
    let avWeekEarnings = (paid / tradingDays) * 7;

    res.render('dashboard', {
      pageTitle: "Dashboard",
      pageDescription: "Let's get paid!.",
      unpaidInvoiceList,
      noUnpaidInvoices,
      noInvoicesProduced,
      uniqueClients,
      owed,
      paid,
      csrfToken: req.csrfToken(),
      tradingDays,
      avWeekEarnings,
      admin : req.user.isAdmin
    })
  }).catch((e) => {
    req.flash('alert', `No data available`);
    res.redirect("/invoices");
  });
});

module.exports = router
