const fs = require('fs');
const Json2csvParser = require('json2csv').Parser;
const express = require('express');
const router = express.Router();
const moment = require('moment');
const { Invoice } = require('../models/invoice');
const { Expense } = require('../models/expense');
const { validationResult } = require('express-validator/check');
const validate = require('../middleware/validators');
const auth = require('../middleware/auth');
const logger = require('../startup/logger');

router.get('/', auth, (req, res) => {
	res.render('reports/form', {
		data: {},
		errors: {},
		pageTitle: 'Run a report',
		pageDescription: 'Run an invoice report.'
	});
});

router.get('/viewer', [auth, validate.reports], async (req, res) => {
	let errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.render('reports/form', {
			data: req.query,
			errors: errors.mapped(),
			pageTitle: 'Run a report',
			pageDescription: 'Run an invoice report.'
		});
	}

	const start = moment(req.query.start)
		.startOf('day')
		.toISOString();
	const end = moment(req.query.end)
		.endOf('day')
		.toISOString();
	const tradingDays = moment(end).diff(moment(start), 'days') + 1;

	const incomings = await Invoice.sumOfPaidInvoicesBetween(start, end);
	const invoicesProduced = await Invoice.numberOfInvoicesProducedBetween(
		start,
		end
	);
	const invoicesPaid = await Invoice.numberOfInvoicesPaidBetween(start, end);
	const itemsInvoiced = await Invoice.countItemsInvoicedBetween(start, end);
	const itemsPaid = await Invoice.countItemsPaidBetween(start, end);
	const owed = await Invoice.sumOfOwedInvoicesBetween(start, end);
	const labour = await Invoice.sumOfLabourPaidBetween(start, end);
	const labourList = await Invoice.listLabourPaidBetween(start, end);
	const expenses = await Invoice.sumOfExpensesPaidBetween(start, end);
	const expensesList = await Invoice.listExpensesPaidBetween(start, end);
	const materials = await Invoice.sumOfMaterialsPaidBetween(start, end);
	const materialsList = await Invoice.listMaterialsPaidBetween(start, end);
	const deductions = await Expense.sumOfDeductionsBetween(start, end);
	const officeList = await Expense.listOfficeExpensesBetween(start, end);
	const officeSum = await Expense.sumOfficeExpensesBetween(start, end);
	const carList = await Expense.listCarExpensesBetween(start, end);
	const carSum = await Expense.sumCarExpensesBetween(start, end);
	const resellingList = await Expense.listResellingExpensesBetween(start, end);
	const resellingSum = await Expense.sumResellingExpensesBetween(start, end);
	const staffList = await Expense.listStaffExpensesBetween(start, end);
	const staffSum = await Expense.sumStaffExpensesBetween(start, end);
	const legalList = await Expense.listLegalExpensesBetween(start, end);
	const legalSum = await Expense.sumLegalExpensesBetween(start, end);
	const mktgList = await Expense.listMktgExpensesBetween(start, end);
	const mktgSum = await Expense.sumMktgExpensesBetween(start, end);
	const clothingList = await Expense.listClothingExpensesBetween(start, end);
	const clothingSum = await Expense.sumClothingExpensesBetween(start, end);
	const owedList = await Invoice.listOfMadeUnpaidInvoicesBetween(start, end);

	const averageWeeklyIncome = () => {
		if (!incomings) {
			return 0;
		}
		return (
			Math.round(((parseFloat(incomings) * 100) / tradingDays) * 7) / 100
		).toFixed(2);
	};
	const averageWeeklyHMRCIncome = () => {
		if (!incomings && !deductions) {
			return 0;
		}
		return (
			Math.round(
				((parseFloat(incomings) * 100 - parseFloat(deductions) * 100) /
					tradingDays) *
					7
			) / 100
		).toFixed(2);
	};
	const daysWorked = !labourList ? 0 : labourList.length;
	const daysPerWeek = !daysWorked
		? 0
		: (daysWorked / (tradingDays / 7)).toFixed(2);
	const weeklyIncome = averageWeeklyIncome();
	const hmrcWeekly = averageWeeklyHMRCIncome();
	const earnings = parseFloat(hmrcWeekly);
	const basicPercent = !earnings ? 0 : ((earnings / 323) * 100).toFixed(2);
	const truePercent = !earnings ? 0 : ((earnings / 440) * 100).toFixed(2);

	res.render('reports/viewer', {
		pageTitle: 'Report Results',
		pageDescription: `Report Results`,
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
		deductions,
		officeList,
		officeSum,
		carList,
		carSum,
		resellingList,
		resellingSum,
		clothingList,
		clothingSum,
		staffList,
		staffSum,
		legalList,
		legalSum,
		mktgList,
		mktgSum,
		owedList,
		daysPerWeek,
		basicPercent,
		truePercent,
		weeklyIncome,
		hmrcWeekly
	});
});

router.get('/download', [auth, validate.download], async (req, res) => {
	let errors = validationResult(req);
	let data, fields, filepath;

	if (!errors.isEmpty()) {
		logger.error(`csv failed `, errors);
		req.flash('alert', 'export failed !');
		return res.redirect('/reports');
	}

	const { start, end, type } = req.query;

	if (type === 'incoming') {
		data = await Invoice.listPaidItemsBetween(start, end);

		if (data.length === 0) {
			req.flash('alert', 'no data to export!');
			return res.redirect('/reports');
		}

		fields = [
			{ label: 'Invoice', value: 'invNo' },
			{ label: 'Invoice Date', value: 'invDate', stringify: true },
			{ label: 'Type', value: 'items.type' },
			{ label: 'Client Name', value: 'client.name' },
			{ label: 'Item Date', value: 'items.date', stringify: true },
			{ label: 'Description', value: 'items.desc' },
			{ label: 'Amount', value: 'items.fee' },
			{ label: 'Date Paid', value: 'datePaid', stringify: true }
		];
		filepath = `./public/Earnings-${moment(start).format(
			'Do-MMMM-YYYY'
		)}-to-${moment(end).format('Do-MMMM-YYYY')}.csv`;

		data.forEach(item => {
			item.items.fee = parseFloat(item.items.fee).toFixed(2);
			item.datePaid = moment(item.datePaid).format('DD/MM/YY');
			item.invDate = moment(item.invDate).format('DD/MM/YY');
			item.items.date = moment(item.items.date).format('DD/MM/YY');
		});
	} else {
		data = await Expense.listOfExpensesBetween(start, end);

		if (data.length === 0) {
			req.flash('alert', 'no data to export!');
			return res.redirect('/reports');
		}

		fields = [
			{ label: 'Expense Date', value: 'date' },
			{ label: 'Category', value: 'category' },
			{ label: 'Description', value: 'desc' },
			{ label: 'Amount', value: 'amount' }
		];

		filepath = `./public/Deductions-${moment(start).format(
			'Do-MMMM-YYYY'
		)}-to-${moment(end).format('Do-MMMM-YYYY')}.csv`;

		data.forEach(item => {
			item.amount = parseFloat(item.amount).toFixed(2);
			item.date = moment(item.date).format('DD/MM/YY');
		});
	}

	const json2csvParser = new Json2csvParser({ fields });
	const csv = json2csvParser.parse(data);

	fs.writeFile(filepath, csv, function(err, data) {
		if (err) {
			throw err;
		} else {
			res.download(filepath, function(err) {
				if (err) {
					logger.error(`could not download pdf ${err}`);
				} else {
					logger.info(`${filepath} downloaded`);
					fs.unlink(filepath, function(err) {
						if (err) {
							logger.error(err.toString());
						} else {
							logger.info(filepath + ' deleted');
						}
					});
				}
			});
		}
	});
});

module.exports = router;
