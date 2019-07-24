const { Client } = require('../../../server/models/client');
const { makeFrank } = require('../../seed/client');
const mongoose = require('mongoose');
const app = require('../../../app');

let client;

describe('Client', () => {
	describe('saving a client', () => {
		beforeEach(async () => {
			client = await makeFrank();
		});

		afterEach(async () => {
			await Client.deleteMany();
		});

		it('should save record with valid data', () => {
			expect(client).toHaveProperty('name', 'frank');
			expect(client).toHaveProperty('email', 'frank@frank.com');
			expect(client).toHaveProperty('phone', '07724367851');
			expect(client).toHaveProperty('address1', 'frank street');
			expect(client).toHaveProperty('address2', 'franksville');
			expect(client).toHaveProperty('postcode', 'AB1 1BA');
		});
	});
});
