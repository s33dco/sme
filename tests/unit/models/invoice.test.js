const {Invoice} = require('../../../server/models/invoice');
const {makeInvoice, makePaidInvoice} = require('../../seed/invoice');
const mongoose = require('mongoose');
const app       = require('../../../app');

let invoice;
let clientIds = [];

describe('Invoice', () => {

  describe('invoice.methods', () => {

    beforeEach( async () => {
      invoice =  await makeInvoice(new mongoose.Types.ObjectId);
    })

    afterEach( async () => {
      await Invoice.deleteMany();
      clientIds = [];
    });

    describe('saving an invoice', () => {
      it('should save an invoice with valid details', () => {
        expect(invoice).toHaveProperty('message', 'thanks');
        expect(invoice.items.length).toBe(3);
        expect(invoice.client.name).toEqual('client name');
        expect(invoice.details.phone).toEqual('07865356742');
      });
    });

    describe('add up the total of the billed items on invoice', () => {
      it('should add up the value of the invoice items', async () => {
        const sum = await invoice.totalInvoiceValue();
        expect(sum).toBe(100);
      });
    });
  });

  describe('Invoice.statics', () => {

    beforeEach(async () => {
      // make 10 invoices, 2 per client, 30 billed items, 5 paid, 5 unpaid, each total 100.
      for(i=0; i<5; i++) {
        let clientId = new mongoose.Types.ObjectId;
        clientIds.push(clientId);
        await makeInvoice(clientId);
        await makePaidInvoice(clientId);
      }
    })

    afterEach( async () => {
      await Invoice.deleteMany();
      clientIds = [];
    });

    it('should count number of unique clients', async () => {
      const res = await Invoice.countUniqueClients();
      expect(res[0].count).toEqual(5);
    });

    it('should list unpaid invoices', async () => {
      const res = await Invoice.listUnpaidInvoices();
      let ids = res.map( inv => inv._id.clientLink);
      expect(ids.length).toBe(5);
      ids.forEach((id) => {
        expect(clientIds).toContainEqual(id);
      });
    });

    it('should list all invoices', async () => {
      const res = await Invoice.listInvoices();
      expect(res.length).toBe(10);
    });

    it('should sum paid invoices', async () => {
      const res = await Invoice.sumOfPaidInvoices();
      expect(res[0].total).toEqual(500);
    });

    it('should sum unpaid invoices', async () => {
      const res = await Invoice.sumOfOwedInvoices();
      expect(res[0].total).toEqual(500);
    });

    it('should list invoiced items by client', async () => {
      let clientId = clientIds.pop();
      const res = await Invoice.listItemsByClient(clientId);
      expect(res.length).toBe(6);
      res.forEach((r) => {
        expect(r).toHaveProperty('_id');
        expect(r).toHaveProperty('invNo');
        expect(r).toHaveProperty('items.date');
        expect(r).toHaveProperty('items.desc');
        expect(r).toHaveProperty('items.fee');
      });
    });

    it('should count invoices with clientId (find 2)', async () => {
      let clientId = clientIds.pop();
      const res = await Invoice.withClientId(clientId);
      expect(res.length).toBe(2);
    });

    it('should count invoices with clientId (find 0)', async () => {
      let clientId = new mongoose.Types.ObjectId;;
      const res = await Invoice.withClientId(clientId);
      expect(res.length).toBe(0);
    });

    // InvoiceSchema.statics.newestInvoiceNumber
  });

});
