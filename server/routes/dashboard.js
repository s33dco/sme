const express     = require('express');
const router      = express.Router();
const moment      = require('moment');
const {Invoice}   = require("../models/invoice");
const {Expense}   = require("../models/expense");
const {Detail}    = require("../models/detail");
const auth        = require("../middleware/auth")
const logger      = require('../startup/logger');

router.get('/', auth, async (req, res) => {

    const promise = Promise.all([ Invoice.countUniqueClients(),
                                  Invoice.firstItemDate(),
                                  Invoice.listUnpaidInvoices(),
                                  Invoice.sumOfOwedInvoices(),
                                  Invoice.sumOfPaidInvoices(),
                                  Invoice.countItems(),
                                  Invoice.numberOfInvoices(),
                                  Expense.sumOfExpenses(),
                                  Detail.getBusinessName()
                                ]);

    promise.then( async ([uniqueClients, firstItem, unpaidInvoices, sumOfOwed,
                          sumOfPaid, noItems, noInvoices, outgoings, businessName]) => {

      const title               = businessName
      const numberOfClients     = uniqueClients;
      const firstDate           = firstItem;
      const unpaidInvoiceList   = unpaidInvoices;
      const moneyDue            = sumOfOwed;
      const moneyIn             = sumOfPaid;
      const tradingDays         = moment(Date.now()).diff(moment(firstDate), 'days');
      const items               = noItems;
      const invoices            = noInvoices;
      const sumOfOutgoings      = outgoings
      const avWeekEarningsGross = await Invoice.averageWeeklyGrossEarnings(tradingDays);
      const averageHMRCPerWeek  = () => {
          return (Math.round((((parseFloat(moneyIn) * 100) - (parseFloat(sumOfOutgoings) * 100)) / tradingDays) * 7) / 100).toFixed(2);
        }
      const totalHMRCToDate     = () => {
          return (Math.round((((parseFloat(moneyIn) * 100) - (parseFloat(sumOfOutgoings)) * 100))/ 100)).toFixed(2);
        }

      res.render('dashboard', {
        pageTitle: "Dashboard",
        pageDescription: "Let's get paid!.",
        admin : req.user.isAdmin,
        csrfToken: req.csrfToken(),
        numberOfClients,
        moneyDue,
        moneyIn,
        avWeekEarningsGross,
        unpaidInvoiceList,
        items,
        invoices,
        sumOfOutgoings,
        averageNettPerWeek: averageHMRCPerWeek(),
        totalHMRC : totalHMRCToDate(),
        title
      });
    })
    .catch((e) => {
      req.flash('alert', `No data available`);
      res.redirect("/invoices");
    });
});

module.exports = router
