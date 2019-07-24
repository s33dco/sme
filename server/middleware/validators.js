const { check } = require('express-validator/check');
const { Client } = require('../models/client');
const { Invoice } = require('../models/invoice');
const { itemType } = require('../models/invoice');
const { categories } = require('../models/expense');

module.exports = {
	invoice: [
		check('clientId')
			.isMongoId()
			.withMessage('Select a Client')
			.custom(id => {
				return Client.findById(id).then(client => {
					if (!client) {
						return Promise.reject('Client not found');
					} else {
						return true;
					}
				});
			}),

		check('invDate')
			.isISO8601()
			.withMessage('date is wrong')
			.isBefore(new Date().toISOString())
			.withMessage('dates must be today or earlier'),

		check('invNo')
			.isInt()
			.withMessage('check invoice number'),

		// .custom(number => {
		//   return Invoice.listInvoiceNumbers().then(array => {
		//     if (array.includes(number)) {
		//       return Promise.reject('duplicate invoice number');
		//     } else {
		//       return true
		//     }
		//   })
		// }),
		check('emailGreeting')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),

		check('message')
			.isLength({ min: 1 })
			.withMessage('include a message'),

		check('items')
			.isLength({ min: 1 })
			.withMessage('Need at least one item'),

		check('items.*.date')
			.isISO8601()
			.withMessage('date is wrong')
			.isBefore(new Date().toISOString())
			.withMessage('items dates must be today or earlier'),

		check('items.*.type')
			.isIn(itemType)
			.withMessage('items type should be Labour, Materials or Expense'),

		check('items.*.desc')
			.isLength({ min: 1 })
			.withMessage('Include details for the items'),

		check('items.*.fee')
			// .isInt()
			.isDecimal({ decimal_digits: '2,', force_decimal: true })
			.withMessage('check items fee, format xx.xx')
	],

	email: [
		check('message')
			.isLength({ min: 1 })
			.withMessage('Message is required')
			.trim(),
		check('email')
			.isEmail()
			.withMessage('That email doesn‘t look right')
			.trim()
			.normalizeEmail(),
		check('name')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words in the name.')
			.trim()
	],

	login: [
		check('email')
			.isEmail()
			.withMessage('That email doesn‘t look right')
			.trim()
			.normalizeEmail(),
		check('password')
			.isLength({ min: 7 })
			.withMessage('password too short!')
			.trim()
	],

	client: [
		check('name')
			.isLength({ min: 1 })
			.withMessage('Client name too short!')
			.trim(),
		check('email')
			.isEmail()
			.withMessage('That email doesn‘t look right')
			.trim()
			.normalizeEmail(),
		check('phone')
			.matches(/^\d+$/)
			.withMessage('numbers only for phone')
			.isLength({ min: 11 })
			.withMessage('too short!')
			.isLength({ max: 16 })
			.withMessage('too long!'),
		check('address1')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words and numbers for first line of address'),
		check('address2')
			.optional({ checkFalsy: true })
			.isLength({ min: 1 })
			.matches(/(\w(\s)?)+/)
			.withMessage('just words in address field'),
		check('address3')
			.optional({ checkFalsy: true })
			.isLength({ min: 1 })
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),
		check('postcode')
			.matches(/^([a-z0-9]\s*){5,7}$/i)
			.withMessage('postcode looks wrong.')
	],

	user: [
		check('firstName')
			.isLength({ min: 1 })
			.withMessage('first name too short!')
			.isAlpha()
			.withMessage('only letters')
			.trim(),
		check('lastName')
			.isLength({ min: 1 })
			.withMessage('last name too short!')
			.isAlpha()
			.withMessage('only letters')
			.trim(),
		check('email')
			.isEmail()
			.withMessage('That email doesn‘t look right')
			.trim()
			.normalizeEmail(),
		check('password')
			.isLength({ min: 7 })
			.withMessage('password too short!')
			.trim(),
		check('passwordConfirmation')
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					return false;
				} else {
					return value;
				}
			})
			.withMessage("Passwords don't match")
	],

	detail: [
		check('business')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),
		check('farewell')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),
		check('contact')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),
		check('email')
			.isEmail()
			.withMessage('email address looks wrong'),
		check('phone')
			.matches(/^\d+$/)
			.withMessage('phone digits only')
			.isLength({ min: 11 })
			.withMessage('too short!')
			.isLength({ max: 16 })
			.withMessage('too long!'),
		check('utr')
			.matches(/[0-9]{10}/)
			.withMessage('tax reference 10 digits only'),
		check('bank')
			.matches(/(\w(\s)?)+/)
			.withMessage('bank name just words'),
		check('sortcode')
			.matches(/^(\d){2}-(\d){2}-(\d){2}$/)
			.withMessage('sort code format XX-XX-XX only'),
		check('accountNo')
			.trim()
			.matches(/^(\d){8}$/)
			.withMessage('account number 8 digits only'),
		check('terms')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),
		check('address1')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words and numbers'),
		check('address2')
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),
		check('address3')
			.optional({ checkFalsy: true })
			.isLength({ min: 1 })
			.matches(/(\w(\s)?)+/)
			.withMessage('just words'),
		check('postcode')
			.matches(/^([a-z0-9]\s*){5,7}$/i)
			.withMessage('postcode looks wrong.')
	],

	useredit: [
		check('firstName')
			.isLength({ min: 1 })
			.withMessage('first name too short!')
			.isAlpha()
			.withMessage('only letters')
			.trim(),
		check('lastName')
			.isLength({ min: 1 })
			.withMessage('last name too short!')
			.isAlpha()
			.withMessage('only letters')
			.trim(),
		check('email')
			.isEmail()
			.withMessage('That email doesn‘t look right')
			.trim()
			.normalizeEmail(),
		check('password')
			.optional({ checkFalsy: true })
			.isLength({ min: 7 })
			.withMessage('password too short!')
			.trim(),
		check('passwordConfirmation')
			.optional({ checkFalsy: true })
			.custom((value, { req }) => {
				if (value !== req.body.password) {
					return false;
				} else {
					return value;
				}
			})
			.withMessage("Passwords don't match")
	],

	reports: [
		check('start')
			.isISO8601()
			.withMessage('select a date')
			.isBefore(new Date().toISOString())
			.withMessage('date must be today or earlier'),
		check('end')
			.isISO8601()
			.withMessage('select a date')
			.custom((value, { req }) => {
				if (value < req.query.start) {
					return false;
				} else {
					return value;
				}
			})
			.withMessage("can't be before start date.")
	],

	download: [
		check('start')
			.isISO8601()
			.withMessage('select a date')
			.isBefore(new Date().toISOString())
			.withMessage('dates must be today or earlier'),
		check('end')
			.isISO8601()
			.withMessage('date is wrong')
			.custom((value, { req }) => {
				if (value < req.query.start) {
					return false;
				} else {
					return value;
				}
			})
			.withMessage("can't be before start date."),
		check('type')
			.isIn(['deductions', 'incoming'])
			.withMessage('only deductions or incoming available')
	],

	expense: [
		check('date')
			.isISO8601()
			.withMessage('date is wrong.')
			.isBefore(new Date().toISOString())
			.withMessage('dates must be today or earlier.'),
		check('category')
			.isIn(categories)
			.withMessage('select a category.'),
		check('desc')
			.matches(/(\w(\s)?)+/)
			.withMessage('description - just words and numbers.'),
		check('amount')
			.isDecimal({ decimal_digits: '2,', force_decimal: true })
			.withMessage('check amount, format xx.xx')
	]
};
