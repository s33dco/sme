const { makeUserToken, makeAdminToken } = require('../seed/user');
const { makeUnpaidInvoice } = require('../seed/invoice');
const { makeDave, makeFrank } = require('../seed/client');
const request = require('supertest');
const { User } = require('../../server/models/user');
const { Client } = require('../../server/models/client');
const { Invoice } = require('../../server/models/invoice');
const app = require('../../app');
const mongoose = require('mongoose');
const cheerio = require('cheerio');

let user,
	clients,
	token,
	id,
	name,
	idWithNoInvoice,
	cookies,
	newcookies,
	csrfToken,
	clientId,
	properties,
	newClient,
	invoice,
	newCsrfToken;

beforeEach(async () => {
	let first = await makeDave();
	let second = await makeFrank();
	token = await makeAdminToken();
	userToken = await makeUserToken();
	id = first._id;
	invoice = await makeUnpaidInvoice(id);
	idWithNoInvoice = second._id;
});

afterEach(async () => {
	await Client.deleteMany();
	await Invoice.deleteMany();
	await User.deleteMany();
});

describe('/clients', () => {
	describe('GET /', () => {
		const exec = async () => {
			return await request(app)
				.get('/clients')
				.set('Cookie', `token=${token}`);
		};

		it('should return all the clients when logged in', async () => {
			const res = await exec();
			expect(res.text).toMatch(/dave/);
			expect(res.text).toMatch(/frank/);
		});

		it('should return 401 when not logged in', async () => {
			token = '';
			const res = await exec();
			expect(res.status).toBe(401);
		});
	});

	describe('GET / :id', () => {
		const exec = async () => {
			return await request(app)
				.get(`/clients/${id}`)
				.set('Cookie', `token=${token}`);
		};

		it('should return the id record when logged in', async () => {
			const res = await exec();
			expect(res.status).toBe(200);
			expect(res.text).toMatch(/dave/);
			expect(res.text).toMatch(/dave@dave.com/);
			expect(res.text).toMatch(/07724367851/);
		});

		it('should return no 404 for invalid id', async () => {
			id = 'notanid';
			const res = await exec();
			expect(res.status).toBe(404);
		});

		it('should return 404 for not found id', async () => {
			id = mongoose.Types.ObjectId();
			const res = await exec();
			expect(res.status).toBe(404);
		});

		it('should return 401 when not logged in', async () => {
			token = '';
			const res = await exec();
			expect(res.status).toBe(401);
		});

		it('should display the previous items billed to client id', async () => {
			const res = await exec();
			expect(res.status).toBe(200);
			expect(res.text).toMatch(/Invoice 1/);
		});

		it('should display when nothing previously billed for client iwth no invoices', async () => {
			const res = await exec();
			expect(res.status).toBe(200);
			expect(res.text).toMatch(/0 previously billed/);
		});
	});

	describe('GET / new', () => {
		const exec = async () => {
			return await request(app)
				.get('/clients/new')
				.set('Cookie', `token=${token}`);
		};

		it('should return 200', async () => {
			const res = await exec();
			expect(res.status).toBe(200);
			expect(res.text).toMatch(/Create/);
		});

		it('should return 401 if no auth token', async () => {
			token = '';
			const res = await exec();
			expect(res.status).toBe(401);
		});

		it('should return 403 if not an admin', async () => {
			token = await makeUserToken();
			const res = await exec();
			expect(res.status).toBe(403);
		});
	});

	describe('POST /', () => {
		properties = {
			name: 'New Client',
			email: 'newclient@example.com',
			phone: '01234567890',
			address1: '23 acacia avenue',
			postcode: 'yb1 1by',
			_csrf: csrfToken
		};

		const getForm = async () => {
			const res = await request(app)
				.get('/clients/new')
				.set('Cookie', `token=${token}`);
			let $ = cheerio.load(res.text);
			csrfToken = $('[name=_csrf]').val();
			cookies = res.headers['set-cookie'];
			return res;
		};

		const postForm = async () => {
			const res = await request(app)
				.post('/clients/')
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			return res;
		};

		const countClients = async () => {
			return await Client.find().countDocuments();
		};

		it('should create a new client with valid properties', async () => {
			await getForm();
			await cookies.push(`token=${token}`);
			properties = {
				name: 'New Client',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			const res = await postForm();
			expect(res.status).toBe(302);
			expect(res.text).toMatch(/clients/);
			const number = await countClients();
			expect(number).toEqual(3);
		});

		it('should not create a new client and redirect if not admin', async () => {
			await getForm();
			token = await makeUserToken();
			cookies.push(`token=${token}`);
			properties = {
				name: 'New Client',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			const res = await postForm();
			expect(res.status).toBe(403);
			expect(res.text).toMatch(/can only view/);
			const number = await countClients();
			expect(number).toEqual(2);
		});

		it('should not create a new client if form data invalid', async () => {
			await getForm();
			token = await makeAdminToken();
			cookies.push(`token=${token}`);
			properties = {
				name: '',
				email: 'newclient',
				phone: 'phone',
				address1: '',
				postcode: '',
				_csrf: csrfToken
			};
			const res = await postForm();
			expect(res.status).toBe(200);
			expect(res.text).toMatch(/Have another go/);
			const number = await countClients();
			expect(number).toEqual(2);
		});

		it('should not create a new client and redirect if not admin', async () => {
			await getForm();
			token = await makeUserToken();
			cookies.push(`token=${token}`);
			properties = {
				name: 'New Client',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			const res = await postForm();
			expect(res.status).toBe(403);
			expect(res.text).toMatch(/can only view/);
			const number = await countClients();
			expect(number).toEqual(2);
		});

		it('should not create if csrf do not check out', async () => {
			await getForm();
			token = await makeAdminToken();
			cookies.push(`token=${token}`);
			properties = {
				name: 'New Client',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: 'jdhfkhkfhiuwehFIwheifuh'
			};
			const res = await postForm();
			expect(res.status).toBe(403);
			expect(res.text).toMatch(/invalid csrf token/);
			const number = await countClients();
			expect(number).toEqual(2);
		});
	});

	describe('DELETE /', () => {
		beforeEach(async () => {
			const res = await request(app)
				.get(`/clients/${id}`)
				.set('Cookie', `token=${token}`);
			let $ = cheerio.load(res.text);
			csrfToken = $('.delete')
				.find('[name=_csrf]')
				.val();
			cookies = res.headers['set-cookie'];
			properties = {};
		});

		const deleteID = async () => {
			return await request(app)
				.delete('/clients')
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
		};

		const countClients = async () => {
			return await Client.find().countDocuments();
		};

		it('it should delete a record with a valid request and redirect to dashboard', async () => {
			cookies.push(`token=${token}`);
			properties = {
				id: idWithNoInvoice.toHexString(),
				_csrf: csrfToken,
				billed: 0
			};
			const res = await deleteID();
			let number = await countClients();
			expect(number).toEqual(1);
			expect(res.text).toMatch(/dashboard/);
			expect(res.status).toBe(302);
		});

		it('have to have an admin token to delete (user token)', async () => {
			token = await makeUserToken();
			cookies.push(`token=${token}`);
			properties = { id: id.toHexString(), _csrf: csrfToken, billed: 0 };
			const res = await deleteID();
			let number = await countClients();
			expect(number).toEqual(2);
			expect(res.status).toBe(403);
		});

		it('have to have an admin token to delete (no token)', async () => {
			token = '';
			cookies.push(`token=${token}`);
			properties = { id: id.toHexString(), _csrf: csrfToken, billed: 0 };
			const res = await deleteID();
			let number = await countClients();
			expect(number).toEqual(2);
			expect(res.status).toBe(401);
		});

		it('it should not delete a client with invoices attached.', async () => {
			cookies.push(`token=${token}`);
			await makeUnpaidInvoice(id);
			properties = { id: id.toHexString(), _csrf: csrfToken, billed: 10 };
			const res = await deleteID();
			let number = await countClients();
			expect(number).toEqual(2);
			expect(res.status).toBe(400);
		});

		it('it should not delete a client with a invalid id, throw 400.', async () => {
			cookies.push(`token=${token}`);
			properties = { id: 'invalididstring1234', _csrf: csrfToken, billed: 0 };
			const res = await deleteID();
			number = await countClients();
			expect(number).toEqual(2);
			expect(res.status).toBe(400);
		});

		it('it should not delete a client with a valid id not in db, throw 404.', async () => {
			cookies.push(`token=${token}`);
			properties = {
				id: new mongoose.Types.ObjectId().toHexString(),
				_csrf: csrfToken,
				billed: 0
			};
			const res = await deleteID();
			let number = await countClients();
			expect(number).toEqual(2);
			expect(res.status).toBe(404);
		});
	});

	describe('GET / edit / :id', () => {
		const getEdit = async () => {
			return await request(app)
				.get(`/clients/edit/${id}`)
				.set('Cookie', `token=${token}`);
		};

		it('should display the edit form', async () => {
			const res = await getEdit();
			expect(res.status).toBe(200);
		});

		it('returns 403 if no admin token', async () => {
			token = userToken;
			const res = await getEdit();
			expect(res.status).toBe(403);
		});

		it('returns 401 if no token', async () => {
			token = '';
			const res = await getEdit();
			expect(res.status).toBe(401);
		});

		it('should return 404 if valid user id not found', async () => {
			id = mongoose.Types.ObjectId();
			await getEdit();
			const res = await getEdit();
			expect(res.status).toBe(404);
		});

		it('should return 400 if invalid id sent in request', async () => {
			id = 'fake_id';
			await getEdit();
			const res = await getEdit();
			expect(res.status).toBe(404);
		});
	});

	describe('PUT / :id', () => {
		const getEdit = async () => {
			const res = await request(app)
				.get(`/clients/edit/${id}`)
				.set('Cookie', `token=${token}`);
			let $ = cheerio.load(res.text);
			csrfToken = $('.clientFields')
				.find('[name=_csrf]')
				.val();
			cookies = res.headers['set-cookie'];
			cookies.push(`token=${token}`);
			return res;
		};

		it('updates the record with a valid request', async () => {
			await getEdit();
			properties = {
				name: 'Tarquin',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			const res = await request(app)
				.put(`/clients/${id}`)
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			expect(res.status).toBe(302);
			const { name } = await Client.findOne({ _id: id });
			expect(name).toMatch(/tarquin/);
		});

		it('redisplays form with invalid form data', async () => {
			await getEdit();
			properties = {
				_csrf: csrfToken,
				name: '',
				phone: '07456734517',
				email: 'e@',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by'
			};
			const res = await request(app)
				.put(`/clients/${id}`)
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			expect(res.status).toBe(200);
			expect(res.text).toMatch(/Have another go/);
		});

		it('returns 403 with invalid _csrf token', async () => {
			await getEdit();
			properties = {
				name: 'Tarquin',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: 'nogoood'
			};
			const res = await request(app)
				.put(`/clients/${id}`)
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			expect(res.status).toBe(403);
		});

		it('returns 401 if no auth token', async () => {
			await getEdit();
			cookies[2] = `token=`;
			properties = {
				name: 'Tarquin',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			const res = await request(app)
				.put(`/clients/${id}`)
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			expect(res.status).toBe(401);
		});

		it('returns 403 if user auth token', async () => {
			await getEdit();
			cookies[2] = `token=${userToken}`;
			properties = {
				name: 'Tarquin',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			const res = await request(app)
				.put(`/clients/${id}`)
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			expect(res.status).toBe(403);
		});

		it('returns 404 with invalid id in request', async () => {
			await getEdit();
			properties = {
				name: 'Tarquin',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			id = 'fake_id';
			const res = await request(app)
				.put(`/clients/${id}`)
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			expect(res.status).toBe(404);
		});

		it('returns 404 with valid id in request not in db', async () => {
			await getEdit();
			properties = {
				name: 'Tarquin',
				email: 'newclient@example.com',
				phone: '01234567890',
				address1: '23 acacia avenue',
				postcode: 'yb1 1by',
				_csrf: csrfToken
			};
			id = mongoose.Types.ObjectId();
			const res = await request(app)
				.put(`/clients/${id}`)
				.type('form')
				.set('Cookie', cookies)
				.send(properties);
			expect(res.status).toBe(404);
		});
	});
});
