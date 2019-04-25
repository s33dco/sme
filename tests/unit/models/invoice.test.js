const { Invoice } = require("../../../server/models/invoice")
const { makeUnpaidInvoice, makePaidInvoice } = require("../../seed/invoice")
const mongoose = require("mongoose")
const app = require("../../../app")

let invoice
let clientIds = []

describe("Invoice", () => {
	describe("invoice.methods", () => {
		beforeEach(async () => {
			invoice = await makeUnpaidInvoice(new mongoose.Types.ObjectId())
		})

		afterEach(async () => {
			await Invoice.deleteMany()
			clientIds = []
		})

		describe("saving an invoice", () => {
			it("should save an invoice with valid details", () => {
				expect(invoice).toHaveProperty("message", "thanks")
				expect(invoice.items.length).toBe(3)
				expect(invoice.client.name).toEqual("client name")
				expect(invoice.details.phone).toEqual("07865356742")
			})
		})
	})

	describe("Invoice.statics", () => {
		beforeEach(async () => {
			// make 10 invoices, 2 per client, 30 billed items, 5 paid, 5 unpaid, each total 100.
			for (i = 0; i < 5; i++) {
				let clientId = new mongoose.Types.ObjectId()
				clientIds.push(clientId)
				await makeUnpaidInvoice(clientId)
				await makePaidInvoice(clientId)
			}
		})

		afterEach(async () => {
			await Invoice.deleteMany()
			clientIds = []
		})

		it("countUniqueClients() should count number of unique clients", async () => {
			const res = await Invoice.countUniqueClients()
			expect(res).toEqual(5)
		})

		it("listUnpaidInvoices() should list unpaid invoices", async () => {
			const res = await Invoice.listUnpaidInvoices()
			let ids = res.map(inv => inv._id.clientLink)
			expect(ids.length).toBe(5)
			ids.forEach(id => {
				expect(clientIds).toContainEqual(id)
			})
		})

		it("listInvoices() should list all invoices", async () => {
			const res = await Invoice.listInvoices()
			expect(res.length).toBe(10)
		})

		it("listItemsByClient(clientId) should list invoiced items by client", async () => {
			let clientId = clientIds.pop()
			const res = await Invoice.listItemsByClient(clientId)
			expect(res.length).toBe(6)
			res.forEach(r => {
				expect(r).toHaveProperty("_id")
				expect(r).toHaveProperty("invNo")
				expect(r).toHaveProperty("items.date")
				expect(r).toHaveProperty("items.desc")
				expect(r).toHaveProperty("items.fee")
				expect(r).toHaveProperty("paid")
			})
		})

		it("withClientId(clientId) should count invoices with clientId (find 2)", async () => {
			let clientId = clientIds.pop()
			const res = await Invoice.withClientId(clientId)
			expect(res.length).toBe(2)
		})

		it(".withClientId(clientId) should count invoices with clientId (find 0)", async () => {
			let clientId = new mongoose.Types.ObjectId()
			const res = await Invoice.withClientId(clientId)
			expect(res.length).toBe(0)
		})

		it("sumOfInvoice() should add up the items on an invoice", async () => {
			const invoice = await Invoice.findOne({})
			const res = await Invoice.sumOfInvoice(invoice._id)
			expect(res.toJSON()).toMatchObject({ $numberDecimal: "100.00" })
		})

		it("sumOfPaidInvoices() should sum paid invoices", async () => {
			const res = await Invoice.sumOfPaidInvoices()
			expect(res.toJSON()).toMatchObject({ $numberDecimal: "500.00" })
		})

		it("sumOfOwedInvoices() should sum unpaid invoices", async () => {
			const res = await Invoice.sumOfOwedInvoices()
			expect(res.toJSON()).toMatchObject({ $numberDecimal: "500.00" })
		})

		it("totalBilledtoClient() should return the sum of all invoice items for clientId", async () => {
			let clientId = clientIds.pop()
			const res = await Invoice.totalBilledtoClient(clientId)
			expect(res.toJSON()).toMatchObject({ $numberDecimal: "200.00" })
		})

		it("should work out the average daily earnings", async () => {
			const res = await Invoice.averageWeeklyGrossEarnings(7)
			expect(res.toJSON()).toMatchObject({ $numberDecimal: "500" })
		})

		// InvoiceSchema.statics.newestInvoiceNumber
	})
})
