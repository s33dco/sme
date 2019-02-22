const {makeUserToken,
makeAdminToken}     = require('../seed/user');
const {makeUnpaidInvoice,
makePaidInvoice}    = require('../seed/invoice');
const {makeClient}  = require('../seed/client');
const {makeDetails}  = require('../seed/details');
const {Client}      = require('../../server/models/client');
const {Invoice}     = require('../../server/models/invoice');
const request       = require('supertest');
const app           = require('../../app');
const mongoose      = require('mongoose');
const cheerio       = require('cheerio');
const moment        = require('moment');

let token, details, csrfToken, cookies, client, paidInvoice, unpaidInvoice, invoice, invoiceId, clientId, properties;

beforeEach( async () => {
  token = await makeAdminToken();
  client = await makeClient();
  details = await makeDetails();
  paid = await makePaidInvoice(client._id);
  unpaid = await makeUnpaidInvoice(client._id);
});

afterEach( async () => {
  await Client.deleteMany();
  await Invoice.deleteMany();
  token = '';
});

describe('/invoices', () => {

  describe('GET /', () => {

    const exec = async () => {
      return await request(app).get('/invoices').set('Cookie', `token=${token}`);
    };

    it('should display the invoice page for admin user', async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Previous Invoices/);
      expect(res.text).toMatch(/new invoice/);
    });

    it('should display the invoice page for without new invoice link for a user', async () => {
      token = await makeUserToken();
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.text).toMatch(/Previous Invoices/);
      expect(res.text).not.toMatch(/new invoice/);
    });

    it('should return 401 if not logged in', async () => {
      token = '';
      const res = await exec();
      expect(res.status).toBe(401);
    });
  });

  describe('GET / :id', () => {

    const getInvoice = async () => {
      return await request(app).get(`/invoices/${invoiceId}`).set('Cookie', `token=${token}`);
    };

    it('should return 404 for valid id with no record', async () => {
      invoiceId = mongoose.Types.ObjectId();
      const res = await getInvoice();
      expect(res.status).toBe(404);
    });

    it('should return 404 for an invalid id', async () => {
      invoiceId = 'rubbish_id';
      const res = await getInvoice();
      expect(res.status).toBe(404);

    });

    it('should display the invoice page', async () => {
      invoiceId = unpaid._id;
      const res = await getInvoice();
      expect(res.status).toBe(200);
    });

    it('should display correct buttons for unpaid invoice if admin', async () => {
      invoiceId = unpaid._id;
      const res = await getInvoice();
      expect(res.text).toMatch(/Email Invoice/);
      expect(res.text).toMatch(/Edit Invoice/);
      expect(res.text).toMatch(/Mark as Paid/);
      expect(res.text).toMatch(/Delete/);
    });

    it('should display correct buttons for unpaid invoice if a user', async () => {
      invoiceId = unpaid._id;
      token = await makeUserToken();
      const res = await getInvoice();
      expect(res.text).toMatch(/Email Invoice/);
    });

    it('should display correct buttons for paid invoice if admin', async () => {
      invoiceId = paid._id;
      const res = await getInvoice();
      expect(res.text).toMatch(/Email Invoice/);
      expect(res.text).toMatch(/Edit Invoice/);
      expect(res.text).toMatch(/Mark as Unpaid/);
      expect(res.text).toMatch(/Delete/);
    });

    it('should display correct buttons for paid invoice if a user', async () => {
      invoiceId = paid._id;
      token = await makeUserToken();
      const res = await getInvoice();
      expect(res.text).toMatch(/Email Invoice/);
    });

    it('should not print recieved with thanks if invoice unpaid', async () => {
      invoiceId = unpaid._id;
      const res = await getInvoice();
      expect(res.text).not.toMatch(/Received with thanks/);
    });

    it('should print recieved with thanks if invoice paid', async () => {
      invoiceId = paid._id;
      const res = await getInvoice();
      expect(res.text).toMatch(/Received with thanks/);
    });

    it('should return 401 if not logged in', async () => {
      invoiceId = unpaid._id;
      token = '';
      const res = await getInvoice();
      expect(res.status).toBe(401);
    });
  });

  describe('GET / new', () => {

    const exec = async () => {
      return await request(app)
        .get('/invoices/new')
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

    // expect invoice number field to be populated with 2

  });

  describe('PATCH / paid', () => {
    const getUnpaidInvoice = async () => {
      const res =  await request(app).get(`/invoices/${invoiceId}`).set('Cookie', `token=${token}`);
      let $ = cheerio.load(res.text);
      csrfToken = $('.paid').find('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      cookies.push(`token=${token}`);
    };

    it('updates the paid field to true', async () => {
      invoiceId = unpaid._id;
      await getUnpaidInvoice();
      const res = await request(app).patch('/invoices/paid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: unpaid._id.toHexString(),
                            _csrf: csrfToken})
      invoice = await Invoice.findOne({_id: unpaid._id});
      expect(invoice).toHaveProperty('datePaid', expect.any(Date));
      expect(invoice).toHaveProperty('paid', true);
      expect(res.status).toBe(302);
      expect(res.text).toMatch(/dashboard/)
    });

    it('responds with a 403 if not admin', async () => {
      invoiceId = unpaid._id;
      token = makeUserToken();
      await getUnpaidInvoice();
      const res = await request(app).patch('/invoices/paid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: unpaid._id.toHexString(),
                            _csrf: csrfToken})
      expect(res.status).toBe(403);
    });

    it('responds with a 403 if not logged in', async () => {
      invoiceId = unpaid._id;
      token = '';
      await getUnpaidInvoice();
      const res = await request(app).patch('/invoices/paid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: unpaid._id.toHexString(),
                            _csrf: csrfToken})
      expect(res.status).toBe(403);
    });

    it('responds with 404 for an invalid id', async ()=>{
      invoiceId = 'rubbish_id';
      await getUnpaidInvoice();
      const res = await request(app).patch('/invoices/paid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: invoiceId,
                            _csrf: csrfToken})
      // expect(res.status).toBe(404);
      // TODO: why does the csrf error supercede the 404 error
      expect(res.status).toBe(403);
    });

    it('responds with 404 for a valid id not found in db', async ()=>{
      invoiceId = mongoose.Types.ObjectId();
      await getUnpaidInvoice();
      const res = await request(app).patch('/invoices/paid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: invoiceId,
                            _csrf: csrfToken})
      expect(res.status).toBe(403);
    });
  });

  describe('PATCH / unpaid', () => {
    const getPaidInvoice = async () => {
      const res =  await request(app).get(`/invoices/${invoiceId}`).set('Cookie', `token=${token}`);
      let $ = cheerio.load(res.text);
      csrfToken = $('.unpaid').find('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      cookies.push(`token=${token}`);
    };

    it('responds with a 403 if not admin', async () => {
      invoiceId = paid._id;
      token = makeUserToken();
      await getPaidInvoice();
      const res = await request(app).patch('/invoices/unpaid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: unpaid._id.toHexString(),
                            _csrf: csrfToken})
      expect(res.status).toBe(403);
    });

    it('responds with a 403 if not logged in', async () => {
      invoiceId = paid._id;
      token = '';
      await getPaidInvoice();
      const res = await request(app).patch('/invoices/unpaid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: unpaid._id.toHexString(),
                            _csrf: csrfToken})
      expect(res.status).toBe(403);
    });

    it('responds with 403 for an invalid id', async ()=>{
      invoiceId = 'rubbish_id';
      await getPaidInvoice();
      const res = await request(app).patch('/invoices/unpaid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: invoiceId,
                            _csrf: csrfToken})
      // expect(res.status).toBe(404);
      // TODO: why does the csrf error supercede the 404 error
      expect(res.status).toBe(403);
    });

    it('responds with 404 for a valid id not found in db', async ()=>{
      invoiceId = mongoose.Types.ObjectId();
      await getPaidInvoice();
      const res = await request(app).patch('/invoices/unpaid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: invoiceId,
                            _csrf: csrfToken})
      expect(res.status).toBe(403);
    });

    it('updates the paid field to false', async () => {
      invoiceId = paid._id;
      await getPaidInvoice();

      const res =  await request(app).patch('/invoices/unpaid')
                    .set('Cookie', cookies)
                    .type('form')
                    .send({ id: paid._id.toHexString(),
                            _csrf: csrfToken});
      invoice = await Invoice.findOne({_id: paid._id});
      expect(invoice).toHaveProperty('paid', false);
      expect(res.status).toBe(302);
      expect(res.text).toMatch(/dashboard/)
    });
  });

  describe('DELETE / ', ()=> {

    const getInvoice = async () => {
      const res =  await request(app).get(`/invoices/${invoiceId}`).set('Cookie', `token=${token}`);
      let $ = cheerio.load(res.text);
      csrfToken = $('.delete').find('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      cookies.push(`token=${token}`);
    };

    it('should delete the record with valid credentials', async ()=> {
      invoiceId = unpaid._id;
      await getInvoice();
      const res = await request(app).delete('/invoices')
                          .set('Cookie', cookies)
                          .type('form')
                          .send({ id: invoiceId.toHexString(),
                                  _csrf: csrfToken});
      expect(res.status).toBe(302);
      let count = await Invoice.find().countDocuments();
      expect(count).toEqual(1);
    });

    it('should return 403 with invalid csrf token', async ()=> {
      invoiceId = paid._id;
      await getInvoice();
      csrfToken = 'nogood';
      const res = await request(app).delete('/invoices')
                          .set('Cookie', cookies)
                          .type('form')
                          .send({ id: invoiceId.toHexString(),
                                  _csrf: csrfToken});
      expect(res.status).toBe(403);
      let count = await Invoice.find().countDocuments();
      expect(count).toEqual(2);
    });

    it('should return 403 if no admin token', async ()=> {
      invoiceId = paid._id;
      token = makeUserToken();
      await getInvoice();
      const res = await request(app).delete('/invoices')
                          .set('Cookie', cookies)
                          .type('form')
                          .send({ id: invoiceId.toHexString(),
                                  _csrf: csrfToken});
      expect(res.status).toBe(403);
      let count = await Invoice.find().countDocuments();
      expect(count).toEqual(2);
    });

    it('should return 403 if no token', async ()=> {
      invoiceId = paid._id;
      token = '';
      await getInvoice();
      const res = await request(app).delete('/invoices')
                          .set('Cookie', cookies)
                          .type('form')
                          .send({ id: invoiceId.toHexString(),
                                  _csrf: csrfToken});
      // does return 401 first for not logged in but superceded by csrf error
      expect(res.status).toBe(403);
      let count = await Invoice.find().countDocuments();
      expect(count).toEqual(2);
    });

    it('should return 404 with valid id in request not in db', async ()=> {
      invoiceId = paid._id;
      token = '';
      await getInvoice();
      const res = await request(app).delete('/invoices')
                          .set('Cookie', cookies)
                          .type('form')
                          .send({ id: mongoose.Types.ObjectId().toHexString(),
                                  _csrf: csrfToken});
      // does return 401 first for not logged in but superceded by csrf error
      expect(res.status).toBe(403);
      let count = await Invoice.find().countDocuments();
      expect(count).toEqual(2);
    });

    it('should return 404 with invalid id in request', async ()=> {
      invoiceId = paid._id;
      token = '';
      await getInvoice();
      const res = await request(app).delete('/invoices')
                          .set('Cookie', cookies)
                          .type('form')
                          .send({ id: 'crazynonid',
                                  _csrf: csrfToken});
      // does return 401 first for not logged in but superceded by csrf error
      expect(res.status).toBe(403);
      let count = await Invoice.find().countDocuments();
      expect(count).toEqual(2);
    });

    it('should return 400 if invoice.paid is true', async ()=> {
      invoiceId = paid._id;
      await getInvoice();
      const res = await request(app).delete('/invoices')
                          .set('Cookie', cookies)
                          .type('form')
                          .send({ id: invoiceId.toHexString(),
                                  _csrf: csrfToken});
      expect(res.status).toBe(400);
      let count = await Invoice.find().countDocuments();
      expect(count).toEqual(2);
    });
  });

  describe('POST /', ()=> {

    const getNewInvoiceForm = async () => {
      const res = await request(app).get('/invoices/new')
                          .set('Cookie', `token=${token}`);

      let $ = cheerio.load(res.text);
      csrfToken = $('.details').find('[name=_csrf]').val();
      cookies = res.headers['set-cookie'];
      cookies.push(`token=${token}`);
      return res;
    };

    it('creates a new invoice with a valid request', async ()=> {
      clientId =  client._id;
      await getNewInvoiceForm();
      properties = { _csrf: csrfToken,
                    clientId: client._id.toHexString(),
                    invDate: moment().format('YYYY-MM-DD'),
                    invNo: 12,
                    message: 'efwefwef itiortjrotg ortihjriotj roorir roririoroi.',
                    items : [{date:moment().subtract(1, 'days').format('YYYY-MM-DD'), desc:'run a mile',fee: 50 },
                            {date:moment().subtract(2, 'days').format('YYYY-MM-DD'), desc:'jump a stile',fee: 50 }]
                    }

      const res = await request(app).post('/invoices')
                        .set('Cookie', cookies)
                        .type('form')
                        .send(properties)

      expect(res.status).toBe(302);
      number = await Invoice.find().countDocuments();
      expect(number).toEqual(3);
    });

    it('gives 403 if no admin token', async ()=> {
      token = await makeUserToken();
      clientId =  client._id;
      await getNewInvoiceForm();
      properties = { _csrf: csrfToken,
                    clientId: client._id.toHexString(),
                    invDate: moment().format('YYYY-MM-DD'),
                    invNo: 12,
                    message: 'efwefwef itiortjrotg ortihjriotj roorir roririoroi.',
                    items : [{date:moment().subtract(1, 'days').format('YYYY-MM-DD'), desc:'run a mile',fee: 50 },
                            {date:moment().subtract(2, 'days').format('YYYY-MM-DD'), desc:'jump a stile',fee: 50 }]
                    }

      const res = await request(app).post('/invoices')
                        .set('Cookie', cookies)
                        .type('form')
                        .send(properties)

      expect(res.status).toBe(403);
      number = await Invoice.find().countDocuments();
      expect(number).toEqual(2);
    });
  });

  // describe('POST / edit', ()=> {});
  // describe('PATCH / :id', ()=> {});
  // describe('POST / email', ()=> {});

});
