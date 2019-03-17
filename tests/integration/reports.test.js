const {makePaidInvoice,
makeUnpaidInvoice}    = require('../seed/invoice');
const {makeUserToken,
makeAdminToken}       = require('../seed/user');
const {makeClient}    = require('../seed/client');
const {makeExpense}   = require('../seed/expense');
const {Client}        = require('../../server/models/client');
const {Invoice}       = require('../../server/models/invoice');
const {User}          = require('../../server/models/user');
const {Expense}       = require('../../server/models/expense');
const request         = require('supertest');
const moment          = require('moment');
const app             = require('../../app');

let token, client1, client2, client3, clientIds, properties, start, end, startString, endString;

// create 6 invoices, each 100.00, 3 paid, 3 unpaid, al within the last 14 days
// create 3 expenses, each 200.00, all from today.

  beforeEach( async() => {
    end   = moment().toISOString();
    start = moment().subtract(13, 'days').toISOString();
    endString = moment(end).format("Do MMMM YYYY");
    startString = moment(start).format("Do MMMM YYYY")
    token   = await makeAdminToken();
    client1 = await makeClient();
    client2 = await makeClient();
    client3 = await makeClient();
    clientIds = [client1._id, client2._id, client3._id];
    clientIds.forEach( async (id)=> {
      await makePaidInvoice(id);
      await makeUnpaidInvoice(id);
      await makeExpense();
    })
  });

  afterEach( async()=> {
    await Client.deleteMany();
    await User.deleteMany();
    await Invoice.deleteMany();
    await Expense.deleteMany();
  });

describe('/reports', () => {

  describe('GET /', ()=> {

    const getForm = async () => {
      return await request(app).get('/reports').set('Cookie', `token=${token}`);
    };

    it('should display the reports form', async () => {
        const res = await getForm();
        expect(res.status).toBe(200);
        expect(res.text).toContain('Reports');
    });

    it('should return 401 if no token', async () => {
        token = '';
        const res = await getForm();
        expect(res.status).toBe(401);
    });
  });

  describe('GET /viewer', ()=> {
    const sendForm = async () => {
      return await request(app).get(`/reports/viewer?start=${start}&end=${end}`)
              .set('Cookie', `token=${token}`)
    };

    it('should display the reports viewer', async () => {
      const res = await sendForm();
      expect(res.status).toBe(200);
      expect(res.text).toContain(startString);
      expect(res.text).toContain(endString);
    });

    it('should display the invoice statistics', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Invoices');
      expect(res.text).toContain('6 created (3 paid)');
      expect(res.text).toContain('18 items invoiced (9 paid)');
    });

    it('should display average weekly income for period', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Average Weekly Income');
      expect(res.text).toContain('Invoiced : £150.00');
      expect(res.text).toContain('HMRC declared : £-150.00');
    });

    it('should display sum of paid invoices for period', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Money Received £300.00');
    });

    it('should break down paid totals for invoice categories', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Labour (£60.00)');
      expect(res.text).toContain('Materials (£120.00)');
      expect(res.text).toContain('Expenses (£120.00)');
    });

    it('should display export link', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Export received 4th March 2019 - 17th March 2019 to a .csv file');
    });

    it('should display sum of deductions for period', async () => {
      const res = await sendForm();
      expect(res.text).toContain('HMRC Deductions £600');
    });

    it('should break down deductions into categories', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Office, property and equipment (£600)');
    });

    it('should display export link', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Export HMRC deductions 4th March 2019 - 17th March 2019 to a .csv file');
    });

    it('should display sum of unpaid invoices', async () => {
      const res = await sendForm();
      expect(res.text).toContain('Unpaid Invoices £300.00');
    });

    it('should return 401 if no token', async () => {
      token = '';
      const res = await sendForm();
      expect(res.status).toBe(401);
    });

  });


  describe('GET /download', async ()=> {

  });

});
