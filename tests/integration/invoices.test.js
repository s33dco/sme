const { makeUserToken, makeAdminToken } = require("../seed/user")
const { makeUnpaidInvoice, makePaidInvoice } = require("../seed/invoice")
const { makeClient } = require("../seed/client")
const { makeDetails } = require("../seed/detail")
const { Detail } = require("../../server/models/detail")
const { Client } = require("../../server/models/client")
const { Invoice } = require("../../server/models/invoice")
const { User } = require("../../server/models/user")
const request = require("supertest")
const app = require("../../app")
const mongoose = require("mongoose")
const cheerio = require("cheerio")
const moment = require("moment")

let token,
	csrfToken,
	cookies,
	client,
	paidInvoice,
	unpaidInvoice,
	invoice,
	userToken,
	invoiceId,
	clientId,
	properties

beforeEach(async () => {
	token = await makeAdminToken()
	userToken = await makeUserToken()
	client = await makeClient()
	await makeDetails()
	paid = await makePaidInvoice(client._id)
	unpaid = await makeUnpaidInvoice(client._id)
	invoiceId = unpaid._id
	clientId = client._id
})

afterEach(async () => {
	await Client.deleteMany()
	await Invoice.deleteMany()
	await Detail.deleteMany()
	await User.deleteMany()
})

describe("/invoices", () => {
	describe("GET /", () => {
		const exec = async () => {
			return await request(app)
				.get("/invoices")
				.set("Cookie", `token=${token}`)
		}

		it("should display the invoice page for admin user", async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Previous Invoices/)
			expect(res.text).toMatch(/new invoice/)
		})

		it("should display the invoice page for without new invoice link for a user", async () => {
			token = await makeUserToken()
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Previous Invoices/)
			expect(res.text).not.toMatch(/new invoice/)
		})

		it("should return 401 if not logged in", async () => {
			token = ""
			const res = await exec()
			expect(res.status).toBe(401)
		})
	})

	describe("GET / :id", () => {
		const getInvoice = async () => {
			return await request(app)
				.get(`/invoices/${invoiceId}`)
				.set("Cookie", `token=${token}`)
		}

		it("should return 404 for valid id with no record", async () => {
			invoiceId = mongoose.Types.ObjectId()
			const res = await getInvoice()
			expect(res.status).toBe(404)
		})

		it("should return 404 for an invalid id", async () => {
			invoiceId = "rubbish_id"
			const res = await getInvoice()
			expect(res.status).toBe(404)
		})

		it("should display the invoice page", async () => {
			invoiceId = unpaid._id
			const res = await getInvoice()
			expect(res.status).toBe(200)
		})

		it("should display correct buttons for unpaid invoice if admin", async () => {
			invoiceId = unpaid._id
			const res = await getInvoice()
			expect(res.text).toMatch(/Email Invoice/)
			expect(res.text).toMatch(/Edit Invoice/)
			expect(res.text).toMatch(/Mark as Paid/)
			expect(res.text).toMatch(/Delete/)
		})

		it("should display correct buttons for unpaid invoice if a user", async () => {
			invoiceId = unpaid._id
			token = await makeUserToken()
			const res = await getInvoice()
			expect(res.text).toMatch(/Email Invoice/)
		})

		it("should display correct buttons for paid invoice if admin", async () => {
			invoiceId = paid._id
			const res = await getInvoice()
			expect(res.text).toMatch(/Email Invoice/)
			expect(res.text).toMatch(/Edit Invoice/)
			expect(res.text).toMatch(/Mark as Unpaid/)
			expect(res.text).toMatch(/Delete/)
		})

		it("should display correct buttons for paid invoice if a user", async () => {
			invoiceId = paid._id
			token = await makeUserToken()
			const res = await getInvoice()
			expect(res.text).toMatch(/Email Invoice/)
		})

		it("should not print recieved with thanks if invoice unpaid", async () => {
			invoiceId = unpaid._id
			const res = await getInvoice()
			expect(res.text).not.toMatch(/Received with thanks/)
		})

		it("should print recieved with thanks if invoice paid", async () => {
			invoiceId = paid._id
			const res = await getInvoice()
			expect(res.text).toMatch(/Received with thanks/)
		})

		it("should return 401 if not logged in", async () => {
			invoiceId = unpaid._id
			token = ""
			const res = await getInvoice()
			expect(res.status).toBe(401)
		})
	})

	describe("GET / new", () => {
		const exec = async () => {
			return await request(app)
				.get("/invoices/new")
				.set("Cookie", `token=${token}`)
		}

		it("should return 200", async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Create/)
		})

		it("should return 401 if no auth token", async () => {
			token = ""
			const res = await exec()
			expect(res.status).toBe(401)
		})

		it("should return 403 if not an admin", async () => {
			token = await makeUserToken()
			const res = await exec()
			expect(res.status).toBe(403)
		})

		it("should redirect to details edit info no invoice info found", async () => {
			await Detail.deleteMany()
			const res = await exec()
			expect(res.status).toBe(302)
			expect(res.text).toBe("Found. Redirecting to /details/edit")
		})
		// expect invoice number field to be populated with 2
	})

	describe("POST / paid", () => {
		const getUnpaidInvoice = async () => {
			const res = await request(app)
				.get(`/invoices/${invoiceId}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".paid")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
		}

		it("updates the paid field to true", async () => {
			invoiceId = unpaid._id
			await getUnpaidInvoice()
			const res = await request(app)
				.post("/invoices/paid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId.toHexString(), _csrf: csrfToken })
			invoice = await Invoice.findOne({ _id: invoiceId })
			expect(invoice).toHaveProperty("paid", true)
			expect(invoice).toHaveProperty("datePaid", expect.any(Date))
			expect(res.status).toBe(302)
			expect(res.text).toMatch(/dashboard/)
		})

		it("responds with a 403 if not admin", async () => {
			invoiceId = unpaid._id
			token = makeUserToken()
			await getUnpaidInvoice()
			const res = await request(app)
				.post("/invoices/paid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: unpaid._id.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
		})

		it("responds with a 403 if not logged in", async () => {
			invoiceId = unpaid._id
			token = ""
			await getUnpaidInvoice()
			const res = await request(app)
				.post("/invoices/paid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: unpaid._id.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
		})

		it("responds with 404 for an invalid id", async () => {
			invoiceId = "rubbish_id"
			await getUnpaidInvoice()
			const res = await request(app)
				.post("/invoices/paid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId, _csrf: csrfToken })
			// expect(res.status).toBe(404);
			// TODO: why does the csrf error supercede the 404 error
			expect(res.status).toBe(403)
		})

		it("responds with 404 for a valid id not found in db", async () => {
			invoiceId = mongoose.Types.ObjectId()
			await getUnpaidInvoice()
			const res = await request(app)
				.post("/invoices/paid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId, _csrf: csrfToken })
			expect(res.status).toBe(403)
		})
	})

	describe("POST / unpaid", () => {
		const getPaidInvoice = async () => {
			const res = await request(app)
				.get(`/invoices/${invoiceId}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".unpaid")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
		}

		it("updates the paid field to false", async () => {
			invoiceId = paid._id
			await getPaidInvoice()

			const res = await request(app)
				.post("/invoices/unpaid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: paid._id.toHexString(), _csrf: csrfToken })
			invoice = await Invoice.findOne({ _id: paid._id })
			expect(invoice).toHaveProperty("paid", false)
			expect(res.status).toBe(302)
			expect(res.text).toMatch(/dashboard/)
		})

		it("responds with a 403 if not admin", async () => {
			invoiceId = paid._id
			token = makeUserToken()
			await getPaidInvoice()
			const res = await request(app)
				.post("/invoices/unpaid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: unpaid._id.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
		})

		it("responds with a 403 if not logged in", async () => {
			invoiceId = paid._id
			token = ""
			await getPaidInvoice()
			const res = await request(app)
				.post("/invoices/unpaid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: unpaid._id.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
		})

		it("responds with 403 for an invalid id", async () => {
			invoiceId = "rubbish_id"
			await getPaidInvoice()
			const res = await request(app)
				.post("/invoices/unpaid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId, _csrf: csrfToken })
			// expect(res.status).toBe(404);
			// TODO: why does the csrf error supercede the 404 error
			expect(res.status).toBe(403)
		})

		it("responds with 404 for a valid id not found in db", async () => {
			invoiceId = mongoose.Types.ObjectId()
			await getPaidInvoice()
			const res = await request(app)
				.post("/invoices/unpaid")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId, _csrf: csrfToken })
			expect(res.status).toBe(403)
		})
	})

	describe("DELETE / ", () => {
		const getInvoice = async () => {
			const res = await request(app)
				.get(`/invoices/${invoiceId}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".delete")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
		}

		it("should delete the record with valid credentials", async () => {
			invoiceId = unpaid._id
			await getInvoice()
			const res = await request(app)
				.delete("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(302)
			let count = await Invoice.find().countDocuments()
			expect(count).toEqual(1)
		})

		it("should return 403 with invalid csrf token", async () => {
			invoiceId = paid._id
			await getInvoice()
			csrfToken = "nogood"
			const res = await request(app)
				.delete("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
			let count = await Invoice.find().countDocuments()
			expect(count).toEqual(2)
		})

		it("should return 403 if no admin token", async () => {
			invoiceId = paid._id
			token = makeUserToken()
			await getInvoice()
			const res = await request(app)
				.delete("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
			let count = await Invoice.find().countDocuments()
			expect(count).toEqual(2)
		})

		it("should return 403 if no token", async () => {
			invoiceId = paid._id
			token = ""
			await getInvoice()
			const res = await request(app)
				.delete("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId.toHexString(), _csrf: csrfToken })
			// does return 401 first for not logged in but superceded by csrf error
			expect(res.status).toBe(403)
			let count = await Invoice.find().countDocuments()
			expect(count).toEqual(2)
		})

		it("should return 404 with valid id in request not in db", async () => {
			invoiceId = paid._id
			token = ""
			await getInvoice()
			const res = await request(app)
				.delete("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: mongoose.Types.ObjectId().toHexString(), _csrf: csrfToken })
			// does return 401 first for not logged in but superceded by csrf error
			expect(res.status).toBe(403)
			let count = await Invoice.find().countDocuments()
			expect(count).toEqual(2)
		})

		it("should return 404 with invalid id in request", async () => {
			invoiceId = paid._id
			token = ""
			await getInvoice()
			const res = await request(app)
				.delete("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: "crazynonid", _csrf: csrfToken })
			// does return 401 first for not logged in but superceded by csrf error
			expect(res.status).toBe(403)
			let count = await Invoice.find().countDocuments()
			expect(count).toEqual(2)
		})

		it("should return 400 if invoice.paid is true", async () => {
			invoiceId = paid._id
			await getInvoice()
			const res = await request(app)
				.delete("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: invoiceId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(400)
			let count = await Invoice.find().countDocuments()
			expect(count).toEqual(2)
		})
	})

	describe("POST /", () => {
		const getNewInvoiceForm = async () => {
			const res = await request(app)
				.get("/invoices/new")
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".details")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
			return res
		}

		it("creates a new invoice with a valid request", async () => {
			clientId = client._id
			await getNewInvoiceForm()
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				emailGreeting: "Dearest Customer",
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Materials",
						desc: "jump a stile",
						fee: "25.00"
					}
				]
			}

			const res = await request(app)
				.post("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)
			expect(res.status).toBe(302)
			number = await Invoice.find().countDocuments()
			expect(number).toEqual(3)
		})

		it("returns 403 if no admin token", async () => {
			token = await makeUserToken()
			clientId = client._id
			await getNewInvoiceForm()
			properties = {
				_csrf: csrfToken,
				clientId: client._id.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						desc: "jump a stile",
						fee: "25.00"
					}
				]
			}

			const res = await request(app)
				.post("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(403)
			number = await Invoice.find().countDocuments()
			expect(number).toEqual(2)
		})

		it("returns 403 if no login token", async () => {
			token = ""
			clientId = client._id
			await getNewInvoiceForm()
			properties = {
				_csrf: csrfToken,
				clientId: client._id.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						desc: "jump a stile",
						fee: "25.00"
					}
				]
			}

			const res = await request(app)
				.post("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(403)
			number = await Invoice.find().countDocuments()
			expect(number).toEqual(2)
		})

		it("returns 403 if invalid csrf token", async () => {
			clientId = client._id
			await getNewInvoiceForm()
			properties = {
				_csrf: "rubbish",
				clientId: client._id.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "25.00"
					}
				]
			}

			const res = await request(app)
				.post("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(403)
			number = await Invoice.find().countDocuments()
			expect(number).toEqual(2)
		})

		it("redisplay form when invalid data submitted and display message", async () => {
			await getNewInvoiceForm()
			properties = {
				_csrf: csrfToken,
				clientId: clientId,
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "25.00"
					}
				]
			}

			const res = await request(app)
				.post("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(200)
			number = await Invoice.find().countDocuments()
			expect(number).toEqual(2)
			expect(res.text).toMatch(/Have another/)
		})

		it("returns 200 and error message for an invalid client id", async () => {
			await getNewInvoiceForm()
			properties = {
				_csrf: csrfToken,
				clientId: "fake_id",
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "25.00"
					}
				]
			}

			const res = await request(app)
				.post("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Select a Client/)
			number = await Invoice.find().countDocuments()
			expect(number).toEqual(2)
			expect(res.text).toMatch(/Have another go/)
		})

		it("returns 200 and error for a valid client id not in db", async () => {
			// need custom validator for express validator existing clientid

			clientId = new mongoose.Types.ObjectId()
			await getNewInvoiceForm()
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						desc: "jump a stile",
						fee: "25.00"
					}
				]
			}

			const res = await request(app)
				.post("/invoices")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(200)
			number = await Invoice.find().countDocuments()
			expect(number).toEqual(2)
			expect(res.text).toMatch(/Client not found/)
		})
	})

	describe("POST / email", () => {
		it.skip("emails a pdf of the invoice", async () => {})
	})

	describe("GET / edit / :id", () => {
		const getEdit = async () => {
			return await request(app)
				.get(`/invoices/edit/${invoiceId}`)
				.set("Cookie", `token=${token}`)
		}

		it("should display the edit form", async () => {
			const res = await getEdit()
			expect(res.status).toBe(200)
		})

		it("returns 403 if no admin token", async () => {
			token = userToken
			const res = await getEdit()
			expect(res.status).toBe(403)
		})

		it("returns 401 if no token", async () => {
			token = ""
			const res = await getEdit()
			expect(res.status).toBe(401)
		})

		it("should return 404 if valid user id not found", async () => {
			invoiceId = mongoose.Types.ObjectId()
			await getEdit()
			const res = await getEdit()
			expect(res.status).toBe(404)
		})

		it("should return 400 if invalid id sent in request", async () => {
			invoiceId = "fake_id"
			await getEdit()
			const res = await getEdit()
			expect(res.status).toBe(404)
		})
	})

	describe("PUT / :id", () => {
		const getEdit = async () => {
			const res = await request(app)
				.get(`/invoices/edit/${invoiceId}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".details")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
			return res
		}

		it("updates the record with a valid request", async () => {
			await getEdit()
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				emailGreeting: "Hello Cocker",
				message: "new message",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "50.00"
					}
				]
			}

			const res = await request(app)
				.put(`/invoices/${invoiceId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(302)
			const { message } = await Invoice.findOne({ _id: invoiceId })
			expect(message).toMatch(/new message/)
		})

		it("redisplays form with invalid form data", async () => {
			await getEdit()
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "50.00"
					}
				]
			}
			const res = await request(app)
				.put(`/invoices/${invoiceId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Have another go/)
		})

		it("returns 403 with invalid _csrf token", async () => {
			await getEdit()
			properties = {
				_csrf: "",
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "50.00"
					}
				]
			}
			const res = await request(app)
				.put(`/invoices/${invoiceId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(403)
		})

		it("returns 401 if no auth token", async () => {
			await getEdit()
			cookies[2] = `token=`
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "50.00"
					}
				]
			}
			const res = await request(app)
				.put(`/invoices/${invoiceId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(401)
		})

		it("returns 403 if user auth token", async () => {
			await getEdit()
			cookies[2] = `token=${userToken}`
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "50.00"
					}
				]
			}
			const res = await request(app)
				.put(`/invoices/${invoiceId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(403)
		})

		it("returns 404 with invalid id in request", async () => {
			await getEdit()
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				emailGreeting: "Alright",
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "50.00"
					}
				]
			}
			invoiceId = "fake_id"
			const res = await request(app)
				.put(`/invoice/${invoiceId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(404)
		})

		it("returns 404 with valid id in request not in db", async () => {
			await getEdit()
			properties = {
				_csrf: csrfToken,
				clientId: clientId.toHexString(),
				invDate: moment().format("YYYY-MM-DD"),
				invNo: 12,
				emailGreeting: "Howdy",
				message: "efwefwef itiortjrotg ortihjriotj roorir roririoroi.",
				items: [
					{
						date: moment()
							.subtract(1, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "run a mile",
						fee: "50.00"
					},
					{
						date: moment()
							.subtract(2, "days")
							.format("YYYY-MM-DD"),
						type: "Labour",
						desc: "jump a stile",
						fee: "50.00"
					}
				]
			}
			invoiceId = mongoose.Types.ObjectId()
			const res = await request(app)
				.put(`/invoices/${invoiceId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(404)
		})
	})
})
