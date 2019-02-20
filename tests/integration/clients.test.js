const {makeUserToken,
makeAdminToken}     = require('../seed/user');
const {makeInvoice} = require('../seed/invoice');
const request       = require('supertest');
const {User}        = require('../../server/models/user');
const {Client}      = require('../../server/models/client');
const {Invoice}     = require('../../server/models/invoice');
const app           = require('../../app');
const mongoose      = require('mongoose');
const cheerio       = require('cheerio');

let user, clients, token, id, name, cookies, newcookies, csrfToken, properties, newClient, invoice, newCsrfToken;

beforeEach( async () => {
  clients = [
              { name: "Client One",
                email: "client1@example.com",
                phone: "01234567890"},
              { name: "Client Two",
                email: "client2@example.com",
                phone: "02234567890"}
  ];
  clients = await Client.insertMany(clients);
  id = clients[0]._id;
  token = await makeAdminToken();
  invoice = await makeInvoice(id);
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

    beforeEach( async () => {
      const res = await request(app).get(`/clients/${id}`).set('Cookie', `token=${token}`);
      let $ = cheerio.load(res.text);
      csrfToken = $('.delete').find('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      properties = {};
    });

    const deleteID = async () => {
      return await request(app).delete('/clients')
          .type('form')
          .set('Cookie', cookies)
          .send(properties);
    };

    const countClients = async () => {
      return await Client.find().countDocuments();
    };

    it('it should delete a record with a valid request and redirect to dashboard', async () => {
      cookies.push(`token=${token}`);
      properties = { id : id.toHexString(), _csrf: csrfToken, billed: 0};
      const res = await deleteID();
      let number = await countClients();
      expect(number).toEqual(1);
      expect(res.text).toMatch(/dashboard/);
      expect(res.status).toBe(302);
    });

    it('have to have an admin token to delete (user token)', async () => {
      token = await makeUserToken();
      cookies.push(`token=${token}`);
      properties = { id : id.toHexString(), _csrf: csrfToken, billed: 0};
      const res = await deleteID();
      let number = await countClients();
      expect(number).toEqual(2);
      expect(res.status).toBe(403);
    });

    it('have to have an admin token to delete (no token)', async () => {
      token = '';
      cookies.push(`token=${token}`);
      properties = { id : id.toHexString(), _csrf: csrfToken, billed: 0};
      const res = await deleteID();
      let number = await countClients();
      expect(number).toEqual(2);
      expect(res.status).toBe(401);
    });

    it('it should not delete a client with invoices attached.', async () => {
      cookies.push(`token=${token}`);
      properties = { id : id.toHexString(), _csrf: csrfToken, billed: 10};
      const res = await deleteID();
      let number = await countClients();
      expect(number).toEqual(2);
      expect(res.status).toBe(400);
    });

    it('it should not delete a client with a invalid id, throw 400.', async () => {
      cookies.push(`token=${token}`);
      properties = { id : 'invalididstring1234', _csrf: csrfToken, billed: 0}
      const res = await deleteID();
      number = await countClients();
      expect(number).toEqual(2);
      expect(res.status).toBe(400);
    });

    it('it should not delete a client with a valid id not in db, throw 404.', async () => {
      cookies.push(`token=${token}`);
      properties = { id : new mongoose.Types.ObjectId().toHexString(), _csrf: csrfToken, billed: 0}
      const res = await deleteID();
      let number = await countClients();
      expect(number).toEqual(2);
      expect(res.status).toBe(404);
    });
  });

  describe.skip('PATCH / :id ', () => {

    const getEditButton = async () => {
      const res = await request(app).get(`/clients/${id}`).set('Cookie', `token=${token}`);
      let $ = cheerio.load(res.text);
      csrfToken = $('.edit').find('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      cookies.push(`token=${token}`);
      console.log(`headers from getEditButton - ${cookies}`)
      return res;
    }

    const getUpdateForm = async () => {
      const res = await request(app).post('/clients/edit')
          .type('form')
          .set('Cookie', cookies)
          .send({id : id.toHexString(), _csrf: csrfToken});
      let $ = cheerio.load(res.text);
      newCsrfToken = $('[name=_csrf]').val();
      console.log(`headers from getUpdateForm - ${cookies}`)
      return res;
    };

    const sendUpdate = async () => {
      return await request(app).patch(`/clients/${id}`)
          .type('form')
          .set('Cookie', cookies)
          .send(properties);
    };

    it('updates the client record with valid input', async () => {
      properties = {id : id.toHexString(),
                    _csrf: newCsrfToken,
                    name: 'New Name for Client',
                    email: 'newmemail@example.com',
                    phone: '07777777777'};
      let get = await getEditButton();
      let form = await getUpdateForm();
      const res = await sendUpdate();
      console.log(`headers from send update - ${cookies}`)
      expect(res.status).toBe(302);
    });

  });

  describe('POST / edit', () => {
    beforeEach( async () => {
      const res = await request(app).get(`/clients/${id}`).set('Cookie', `token=${token}`);
      let $ = cheerio.load(res.text);
      csrfToken = $('.edit').find('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      properties = {};
    });

    afterEach ( async () => {
      cookies = [];
      properties = {};
      token = '';
    });


    const editID = async () => {
      return await request(app).post('/clients/edit')
          .type('form')
          .set('Cookie', cookies)
          .send({id : id.toHexString(), _csrf: csrfToken});
    };

    it('should display the edit form with admin token', async () => {
      cookies.push(`token=${token}`);
      const res = await editID();
      expect(res.status).toBe(200);
    });

    it('will not display the edit form with user token', async () => {
      token = await makeUserToken();
      cookies.push(`token=${token}`);
      const res = await editID();
      expect(res.status).toBe(403);
    });

    it('will not display the edit form with no token', async () => {
      token = "";
      cookies.push(`token=${token}`);
      const res = await editID();
      expect(res.status).toBe(401);
    });

  });
});
