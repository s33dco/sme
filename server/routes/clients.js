const express = require('express');
const router = express.Router();
const { validationResult } = require('express-validator/check');
const validate = require('../middleware/validators');
const validateId = require('../middleware/validateId');
const { ObjectID } = require('mongodb');
const { Client } = require('../models/client');
const { Invoice } = require('../models/invoice');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const logger = require('../startup/logger');
const mongoose = require('mongoose');

router.get('/', auth, async (req, res) => {
	const clients = await Client.orderedByName();

	res.render('clients/clients', {
		pageTitle: 'Client List',
		pageDescription: 'Clients.',
		clients,
		admin: req.user.isAdmin
	});
});

router.get('/new', [auth, admin], (req, res) => {
	res.render('clients/newclient', {
		data: {},
		errors: {},
		csrfToken: req.csrfToken(), // generate a csrf token
		pageTitle: 'Add a client',
		pageDescription: 'Create a new client.'
	});
});

router.get('/:id', [auth, validateId], async (req, res) => {
	const id = req.params.id;

	const client = await Client.withId(id);

	if (!client) {
		throw {
			tag: 'No longer available.',
			message:
				"The client you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
			statusCode: 404
		};
	}

	const itemsList = await Invoice.listItemsByClient(id);

	if (itemsList.length > 0) {
		total = await Invoice.totalBilledtoClient(client._id);
	} else {
		total = '0';
	}
	res.render('clients/client', {
		pageTitle: 'Client',
		pageDescription: 'Client.',
		csrfToken: req.csrfToken(),
		client,
		itemsList,
		total,
		admin: req.user.isAdmin
	});
});

router.post('/', [auth, admin, validate.client], async (req, res) => {
	let errors = validationResult(req);

	if (!errors.isEmpty()) {
		return res.render('clients/newclient', {
			data: req.body,
			errors: errors.mapped(),
			csrfToken: req.csrfToken(), // generate new csrf token
			pageTitle: 'Add a client',
			pageDescription: 'Give it another shot.'
		});
	}

	const {
		name,
		email,
		phone,
		address1,
		address2,
		address3,
		postcode
	} = req.body;

	let client = new Client({
		name,
		email,
		phone,
		address1,
		address2,
		address3,
		postcode
	});
	await client.save();
	req.flash('success', `${client.name} created !`);
	res.redirect('/clients');
});

router.get('/edit/:id', [auth, admin, validateId], async (req, res) => {
	const client = await Client.findOne({ _id: req.params.id });

	if (!client) {
		throw {
			tag: "Client can't be found",
			message: "The client can't be found maybe you should try again.",
			statusCode: 404
		};
	}

	let {
		_id,
		name,
		email,
		phone,
		address1,
		address2,
		address3,
		postcode
	} = client;

	res.render('clients/editclient', {
		data: { _id, name, email, phone, address1, address2, address3, postcode },
		errors: {},
		csrfToken: req.csrfToken(), // generate a csrf token
		pageTitle: 'Edit Client',
		pageDescription: 'edit client.'
	});
});

router.put(
	'/:id',
	[auth, admin, validateId, validate.client],
	async (req, res) => {
		const errors = validationResult(req);

		if (!errors.isEmpty()) {
			return res.render('clients/editclient', {
				data: req.body,
				errors: errors.mapped(),
				csrfToken: req.csrfToken(),
				pageTitle: 'Edit Client',
				pageDescription: 'Give it another shot.'
			});
		} else {
			const client = await Client.findOneAndUpdate(
				{ _id: req.params.id },
				{
					name: req.body.name,
					phone: req.body.phone,
					email: req.body.email,
					address1: req.body.address1,
					address2: req.body.address2,
					address3: req.body.address3,
					postcode: req.body.postcode
				},
				{ new: true }
			);

			if (!client) {
				throw {
					tag: "Client can't be found",
					message:
						"The client can't be found to update maybe you should try again.",
					statusCode: 404
				};
			}

			req.flash('success', `${client.name} updated!`);
			res.redirect(`/clients`);
		}
	}
);

router.delete('/', [auth, admin], async (req, res) => {
	if (!ObjectID.isValid(req.body.id)) {
		throw {
			tag: "Client can't be deleted",
			message: "The client can't be found maybe you should try again.",
			statusCode: 400
		};
	}

	const client = await Client.findOne({ _id: req.body.id });

	if (!client) {
		throw {
			tag: "Client can't be found",
			message: "The client can't be found maybe you should try again.",
			statusCode: 404
		};
	}

	const attachedInvoices = await Invoice.withClientId(req.body.id);

	if (attachedInvoices.length) {
		req.flash('alert', `${client.name} cannot be deleted!`);
		throw {
			tag: "Client can't be deleted",
			message: `The client is attached to invoice(s) and cannot be deleted.`,
			statusCode: 400
		};
	}

	await client.remove();

	req.flash('alert', `${client.name} deleted!`);
	res.redirect('/dashboard');
});

module.exports = router;
