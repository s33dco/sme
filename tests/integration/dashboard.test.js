const {makePaidInvoice,
makeUnpaidInvoice}    = require('../seed/invoice');
const {makeUserToken,
makeAdminToken}       = require('../seed/user');
const {makeClient}    = require('../seed/client');
const {makeExpense}   = require('../seed/expense');
const {makeDetails}   = require('../seed/detail');
const {Client}        = require('../../server/models/client');
const {Invoice}       = require('../../server/models/invoice');
const {User}          = require('../../server/models/user');
const {Expense}       = require('../../server/models/expense');
const request         = require('supertest');
const moment          = require('moment');
const app             = require('../../app');

let token, client1, client2, client3, clientIds, detail, businessName;

// create 6 invoices, each 100.00, 3 paid, 3 unpaid, al within the last 14 days
// create 3 expenses, each 200.00, all from today.

  beforeEach( async() => {
    detail  = await makeDetails();
    token   = await makeUserToken();
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

describe('/dashboard', () => {

  describe('GET /', ()=> {

    const getDashboard = async () => {
      return await request(app).get('/dashboard').set('Cookie', `token=${token}`);
    };

    it('should return 401 if no token', async () => {
        token = '';
        const res = await getDashboard();
        expect(res.status).toBe(401);
    });

    it('should display the dashboard page', async () => {
        const res = await getDashboard();
        expect(res.status).toBe(200);
        expect(res.text).toContain('my business name');
    });

    it('should total up paid invoices', async () => {
        const res = await getDashboard();
        expect(res.text).toContain('Invoiced : £300');
    });

    it('should total up unpaid invoices', async () => {
        const res = await getDashboard();
        expect(res.text).toContain('Unpaid Invoices £300');
    });

    it('should report invoice stats', async () => {
        const res = await getDashboard();
        expect(res.text).toContain('6 created');
        expect(res.text).toContain('18 items invoiced');
        expect(res.text).toContain('3 clients');
    });

    it('should report totals', async () => {
        const res = await getDashboard();
        expect(res.text).toContain('Totals to Date');
        expect(res.text).toContain('Invoiced : £300');
        expect(res.text).toContain('HMRC declared : £-300');
    });

    it('should report average weekly', async () => {
        const res = await getDashboard();
        expect(res.text).toContain('Average Weekly Income');
        expect(res.text).toContain('Invoiced: £150');
        expect(res.text).toContain('HMRC declared: £-150');
    });

  });

});
