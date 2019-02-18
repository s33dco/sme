const request = require('supertest');
const app     = require('../../app');
const {User}  =  require('../../server/models/user');
const {makeUser, makeAdmin} = require('../seed/user');
const {fakeToken} = require('../seed/faketoken');

let user, token;

// need to solve csrf token issue first....

describe('auth middleware', () => {
  beforeEach( async () => {
    user = await makeUser();
    token = await user.generateAuthToken();
  });

  afterEach( async () => {
    await User.deleteMany();
  });

  it('throw error and 401 if no auth token in request', async () => {
    token = ''
    const res = await request(app).get('/invoices')
                      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(401);
  });

  it('200 with valid auth token in request', async () => {
    const res = await request(app).get('/invoices')
                      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(200);
  });

  it('throw error and 401 if no user found from db', async () => {
    token = await fakeToken();
    const res = await request(app).get('/invoices')
                      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(401);
  });

  it('throw error and 401 if token garbage', async () => {
    token = 'uhihvihrkvherih98er798eurvhqoerbhvqherlbhqo';
    const res = await request(app).get('/invoices')
                      .set('Cookie', `token=${token}`);
    expect(res.status).toBe(401);
  });

});
