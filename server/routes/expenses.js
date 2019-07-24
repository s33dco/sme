const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator/check');
const validate = require('../middleware/validators');
const validateId = require('../middleware/validateId');
const { ObjectID } = require('mongodb');
const { Expense, categories } = require('../models/expense');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../startup/logger');
const mongoose = require('mongoose');
const moment = require('moment');

router.get('/', [auth, admin], async (req, res) => {
	const expenses = await Expense.listExpenses();
	const totalExpenses = await Expense.sumOfExpenses();

	res.render('expenses/expenses', {
		pageTitle: 'Expenses',
		pageDescription: 'Expenses.',
		expenses,
		totalExpenses,
		admin: req.user.isAdmin
	});
});

router.get('/new', [auth, admin], async (req, res) => {
	res.render('expenses/newexpense', {
		data: {},
		errors: {},
		csrfToken: req.csrfToken(),
		pageTitle: 'Add an Expense',
		pageDescription: 'Create a new expenses.',
		categories
	});
});

router.post('/', [auth, admin, validate.expense], async (req, res) => {
	let errors = validationResult(req);

	if (!errors.isEmpty()) {
		let selected;
		let nonSelected;

		if (req.body.category) {
			selected = categories.find(c => c == req.body.category);
			if (!selected) {
				categories;
			} else {
				nonSelected = categories.filter(c => c != selected);
			}
		} else {
			categories;
		}

		return res.render('expenses/newexpense', {
			data: req.body,
			errors: errors.mapped(),
			csrfToken: req.csrfToken(),
			pageTitle: 'Add an Expense',
			pageDescription: 'Give it another shot.',
			selected,
			nonSelected,
			categories
		});
	}

	const expense = await new Expense({
		date: moment(req.body.date),
		category: req.body.category,
		desc: req.body.desc,
		amount: req.body.amount
	}).save();

	req.flash('success', `Expense created !`);
	res.redirect(`/expenses`);
});

router.get('/:id', [auth, admin, validateId], async (req, res) => {
	let id = req.params.id;

	expense = await Expense.withId(id);

	if (!expense) {
		throw {
			tag: "Expense can't be edited",
			message:
				"The expense can't be found or edited, maybe you should try again.",
			statusCode: 404
		};
	}

	res.render('expenses/expense', {
		pageTitle: 'Edit Expense',
		pageDescription: 'Edit Expense.',
		expense,
		csrfToken: req.csrfToken()
	});
});

router.get('/edit/:id', [auth, admin, validateId], async (req, res) => {
	let id = req.params.id;

	expense = await Expense.withId(id);

	if (!expense) {
		throw {
			tag: "Expense can't be edited",
			message:
				"The expense can't be found or edited, maybe you should try again.",
			statusCode: 404
		};
	}

	const { date, category, desc, amount, _id } = expense;

	let selected;
	let nonSelected;

	if (category) {
		selected = categories.find(c => c == category);
		if (!selected) {
			categories;
		} else {
			nonSelected = categories.filter(c => c != selected);
		}
	} else {
		categories;
	}

	res.render('expenses/editexpense', {
		pageTitle: 'Edit Expense',
		pageDescription: 'Edit Expense.',
		data: { date, category, desc, amount, _id },
		errors: {},
		csrfToken: req.csrfToken(),
		categories,
		nonSelected,
		selected
	});
});

router.put(
	'/:id',
	[auth, admin, validateId, validate.expense],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			let selected;
			let nonSelected;

			if (req.body.category) {
				selected = categories.find(c => c == req.body.category);
				if (!selected) {
					categories;
				} else {
					nonSelected = categories.filter(c => c != selected);
				}
			} else {
				categories;
			}

			return res.render('expenses/editexpense', {
				data: req.body,
				errors: errors.mapped(),
				csrfToken: req.csrfToken(),
				pageTitle: 'Edit Expense',
				pageDescription: 'Give it another shot.',
				categories,
				nonSelected,
				selected
			});
		} else {
			const expense = await Expense.findOneAndUpdate(
				{ _id: req.params.id },
				{
					date: moment(req.body.date).startOf('day'),
					category: req.body.category,
					desc: req.body.desc,
					amount: req.body.amount
				},
				{ new: true }
			);

			if (!expense) {
				throw {
					tag: "Client can't be found",
					message:
						"The client can't be found to update maybe you should try again.",
					statusCode: 404
				};
			}

			req.flash('success', `Expense updated!`);
			res.redirect(`/expenses`);
		}
	}
);

router.delete('/', [auth, admin], async (req, res) => {
	if (!ObjectID.isValid(req.body.id)) {
		throw {
			tag: "Expense can't be deleted",
			message: "The expense can't be found maybe you should try again.",
			statusCode: 400
		};
	}

	const expense = await Expense.withId(req.body.id);

	if (!expense) {
		throw {
			tag: "User can't be found",
			message: "The expense can't be found maybe you should try again.",
			statusCode: 404
		};
	}

	await Expense.deleteOne({ _id: expense._id });

	req.flash('alert', `Expense deleted!`);
	res.redirect('/expenses');
});

module.exports = router;
