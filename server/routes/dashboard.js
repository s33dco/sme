const express     = require('express');
const router      = express.Router();
const moment      = require('moment');
const {Invoice}   = require("../models/invoice");
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
                                  Invoice.sumOutgoings()
                                ]);

    promise.then( async ([uniqueClients, firstItem, unpaidInvoices, sumOfOwed,
                          sumOfPaid, noItems, noInvoices, outgoings]) => {

      const numberOfClients     = uniqueClients;
      const firstDate           = firstItem;
      const unpaidInvoiceList   = unpaidInvoices;
      const moneyDue            = sumOfOwed;
      const moneyIn             = sumOfPaid;
      const tradingDays         = moment(Date.now()).diff(moment(firstDate), 'days');
      const items               = noItems;
      const invoices            = noInvoices;
      const moneyOut            = outgoings;
      const avWeekEarningsGross = await Invoice.averageWeeklyGrossEarnings(tradingDays);
      const averageNettPerWeek  = () => {
        return (Math.round((((parseFloat(moneyIn) * 100) - (parseFloat(moneyOut) * 100)) / tradingDays) * 7) / 100).toFixed(2);
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
        moneyOut,
        avWeekEarningsNett : averageNettPerWeek()
      });
    })
    .catch((e) => {
      req.flash('alert', `No data available`);
      res.redirect("/invoices");
    });
});

module.exports = router
