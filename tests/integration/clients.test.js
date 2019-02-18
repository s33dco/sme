const request   = require('supertest');
const {makeUserToken, makeAdminToken}    = require('../seed/user');
const {User}  = require('../../server/models/user');
const {Client}  = require('../../server/models/client');
const {Invoice} = require('../../server/models/invoice');
const app       = require('../../app');
const mongoose  = require('mongoose');
const cheerio   = require('cheerio');

let user, clients, token, id, name, cookies, csrfToken, properties;

beforeEach( async () => {
  clients = [
              {  name: "Client One",
                email: "client1@example.com",
                phone: "01234567890"},
              { name: "Client Two",
                email: "client2@example.com",
                phone: "02234567890"}
  ];
  clients = await Client.insertMany(clients);
  id = clients[0]._id;
  token = await makeAdminToken();
});

afterEach( async () => {
  await Client.deleteMany();
  await Invoice.deleteMany();
  await User.deleteMany();
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

    properties = {  name: "New Client",
                    email: "newclient@example.com",
                    phone: "01234567890",
                    _csrf : csrfToken};

    const getForm = async () => {
      const res = await request(app).get('/clients/new')
                    .set('Cookie', `token=${token}`);
      let $ = cheerio.load(res.text);
      csrfToken = $('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      return res;
    };

    const postForm = async () => {
      const res = await request(app).post('/clients/')
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
      properties = {  name: "New Client",
                      email: "newclient@example.com",
                      phone: "01234567890",
                      _csrf : csrfToken};
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
      properties = {  name: "New Client",
                      email: "newclient@example.com",
                      phone: "01234567890",
                      _csrf : csrfToken};
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
      properties = {  name: "",
                      email: "newclient",
                      phone: "phone",
                      _csrf : csrfToken};
      const res = await postForm();
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/please correct/);
      const number = await countClients();
      expect(number).toEqual(2);
    });

    it('should not create a new client and redirect if not admin', async () => {
      await getForm();
      token = await makeUserToken();
      cookies.push(`token=${token}`);
      properties = {  name: "New Client",
                      email: "newclient@example.com",
                      phone: "01234567890",
                      _csrf : csrfToken};
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
      properties = {  name: "New Client",
                      email: "newclient@example.com",
                      phone: "01234567890",
                      _csrf : '5667t8gfkhgjtdk6fuyfkuy'};
      const res = await postForm();
      expect(res.status).toBe(403);
      expect(res.text).toMatch(/invalid csrf token/);
      const number = await countClients();
      expect(number).toEqual(2);
    });
  });

  describe('DELETE /', () => {

    const exec = async () => {
      const res = await request(app).get('/clients').set('Cookie', `token=${token}`);
      cookies = res.headers['set-cookie'];
      cookies.push(`token=${token}`);
    };

    const getId = async () => {
      const res = await request(app).get(`/clients/${id}`)
                          .set('Cookie', cookies);
      let $ = cheerio.load(res.text);
      csrfToken = $('.delete').find('[name=_csrf]').val();
    };

    it('it should delete a record with a valid request', async () => {
      await exec();
      await getId();
      const res = await request(app).delete('/')
          .set('Cookie', cookies)
          .send({_id : id,
                  name: clients[0].name,
                  billed: 0,
                  _csrf: csrfToken});
      expect(res.status).toBe(302);
      number = countClients();
      expect(number).toEqual(1);
    });
  });

  // describe.skip('POST / edit', () => {});
  //
  // describe.skip('PATCH / :id ', () => {});
  //


});
