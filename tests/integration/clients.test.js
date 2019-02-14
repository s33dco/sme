const request   = require('supertest');
const {User}    = require('../../server/models/user');
const {Client}  = require('../../server/models/client');
const {Invoice} = require('../../server/models/invoice');
const app       = require('../../app');
const mongoose  = require('mongoose');
const {disconnectDb, connectDb} = require('../utils/db');

const cheerio   = require('cheerio');

let user, clients, token, id, name;

beforeEach( async () => {
  await connectDb();
  clients = [
              {  name: "Client One",
                email: "client1@example.com",
                phone: "01234567890"},
              { name: "Client Two",
                email: "client2@example.com",
                phone: "02234567890"}
  ]
  clients = await Client.insertMany(clients);
  user = await new User({
    firstName: "Testy",
    lastName: "Tester",
    email: "email@example.com",
    password: "password",
    isAdmin : true
  }).save();
  token = user.generateAuthToken();
  id = clients[0]._id
});

afterEach( async () => {
  await Client.deleteMany();
  await Invoice.deleteMany();
  await User.deleteMany();
  await disconnectDb();
});

describe('/clients', () => {

  describe('GET /', () => {

    const exec = async () => {
      return await request(app).get('/clients').set('Cookie', `token=${token}`);
    };

    it('should return all the clients when logged in', async () => {
      const res = await exec();
      expect(res.text).toMatch(/Client One/);
      expect(res.text).toMatch(/Client Two/);
    });

    it('should return 401 when not logged in', async () => {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });

  });

  describe('GET / :id', () => {

    const exec = async () => {
      return await request(app).get(`/clients/${id}`).set('Cookie', `token=${token}`);
    };

    it('should return the id record when logged in', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Client One/);
      expect(res.text).toMatch(/client1@example.com/);
      expect(res.text).toMatch(/01234567890/);
    });

    it('should return no 404 for invalid id', async () => {
      id = 'notanid';
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 404 for not found id', async () => {
      id = mongoose.Types.ObjectId;
      const res = await exec();
      expect(res.status).toBe(404);
    });

    it('should return 401 when not logged in', async () => {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it('should display the previous items billed to client id', async () => {
      invoice = new Invoice({
                invNo      : 1,
                invDate    : Date.now(),
                message    : "thanks",
                client     : {
                    _id         : id,
                    name        : clients[0].name,
                    email       : clients[0].email,
                    phone       : clients[0].phone
                },
                items      : [{date: Date.now(), desc:'working very hard', fee:20},
                              {date: Date.now(), desc:'working very hard', fee:20}],
                details    : {
                    utr         : "1234567891",
                    email       : "myemail@email.com",
                    phone       : "07865356742",
                    bank        : "the bank",
                    sortcode    : "00-00-00",
                    accountNo   : "12345678",
                    terms       : "cash is king",
                    contact     : "myemail@example.com"
                },
                paid        : false
              });
      await invoice.save();
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

  describe.skip('GET / new', () => {});

  describe.skip('POST /', () => {});

  describe.skip('POST / edit', () => {});

  describe.skip('PATCH / :id ', () => {});

  describe.skip('DELETE /', () => {});

});
