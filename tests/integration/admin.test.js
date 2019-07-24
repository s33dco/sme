const request = require('supertest');
const app = require('../../app');
const { User } = require('../../server/models/user');
const { makeUser, makeAdmin } = require('../seed/user');

let user, token;

// need to solve csrf token issue first....

describe('admin middleware', () => {
	afterEach(async () => {
		await User.deleteMany();
	});

	it('200 response if isAdmin=true ', async () => {
		user = await makeAdmin();
		token = await user.generateAuthToken();
		const res = await request(app)
			.get('/users')
			.set('Cookie', `token=${token}`);
		expect(res.status).toBe(200);
	});

	it('403 response if isAdmin=false ', async () => {
		user = await makeUser();
		token = await user.generateAuthToken();
		const res = await request(app)
			.get('/users')
			.set('Cookie', `token=${token}`);
		expect(res.status).toBe(403);
	});
});
