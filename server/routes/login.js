const bcrypt = require('bcryptjs');
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const moment = require('moment');
const { validationResult } = require('express-validator/check');
const validate = require('../middleware/validators');
const { User } = require('../models/user');
const logger = require('../startup/logger');

router.get('/', (req, res) => {
	res.render('login', {
		data: {},
		errors: {},
		csrfToken: req.csrfToken(), // generate a csrf token
		pageTitle: 'Sign In.',
		pageDescription: 'Come on in.'
	});
});

router.post('/', validate.login, async (req, res) => {
	const errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.render('login', {
			data: req.body,
			errors: errors.mapped(),
			csrfToken: req.csrfToken(), // generate new csrf token
			pageTitle: 'Sign In.',
			pageDescription: 'Give it another shot.'
		});
	}

	let { email, password } = req.body;

	const user = await User.findByEmail(req.body.email);

	if (!user) {
		throw {
			tag: 'Access Denied !',
			message:
				"The email address and password you've given do not match up, you can give it another go or if you're sure you're using the correct credentials get in touch with the administrator.",
			statusCode: 401
		};
	}

	const validPassword = await bcrypt.compare(req.body.password, user.password);

	if (!validPassword) {
		throw {
			tag: 'Access Denied !',
			message:
				"The email address and password you've given do not match up, you can give it another go or if you're sure you're using the correct credentials get in touch with the administrator.",
			statusCode: 401
		};
	}

	const token = user.generateAuthToken();

	req.flash('success', `Welcome back ${user.firstName}`);
	res.cookie('token', token);
	res.redirect('/dashboard');
});

module.exports = router;
