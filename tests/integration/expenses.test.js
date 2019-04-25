const { makeExpense } = require("../seed/expense")
const { makeAdminToken, makeUserToken } = require("../seed/user")
const request = require("supertest")
const { Expense } = require("../../server/models/expense")
const { User } = require("../../server/models/user")
const app = require("../../app")
const mongoose = require("mongoose")
const moment = require("moment")
const cheerio = require("cheerio")

let expense, admintoken, userToken, csrfToken, token, id

beforeEach(async () => {
	expense = await makeExpense()
	token = await makeAdminToken()
	userToken = await makeUserToken()
	id = expense._id
})

afterEach(async () => {
	await Expense.deleteMany()
	await User.deleteMany()
})

describe("/expenses", () => {
	describe("GET /", () => {
		const exec = async () => {
			return await request(app)
				.get("/expenses")
				.set("Cookie", `token=${token}`)
		}

		it("should return all the clients when logged in", async () => {
			const res = await exec()
			expect(res.text).toMatch(/lots of equipment/)
			expect(res.text).toMatch(/Office, property and equipment/)
		})

		it("should return 401 when not logged in", async () => {
			token = ""
			const res = await exec()
			expect(res.status).toBe(401)
		})
	})

	describe("GET / :id", () => {
		const exec = async () => {
			return await request(app)
				.get(`/expenses/${id}`)
				.set("Cookie", `token=${token}`)
		}

		it("should return the id record when logged in", async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/lots of equipment/)
			expect(res.text).toMatch(/Office, property and equipment/)
		})

		it("should return no 404 for invalid id", async () => {
			id = "notanid"
			const res = await exec()
			expect(res.status).toBe(404)
		})

		it("should return 404 for not found id", async () => {
			id = mongoose.Types.ObjectId()
			const res = await exec()
			expect(res.status).toBe(404)
		})

		it("should return 401 when not logged in", async () => {
			token = ""
			const res = await exec()
			expect(res.status).toBe(401)
		})

		it("should display the previous items billed to client id", async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/lots of equipment/)
		})
	})

	describe("GET / new", () => {
		const exec = async () => {
			return await request(app)
				.get("/expenses/new")
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
			token = userToken
			const res = await exec()
			expect(res.status).toBe(403)
		})
	})

	describe("POST /", () => {
		properties = {
			date: moment().format("YYYY-MM-DD"),
			category: "Office, property and equipment",
			desc: "lots of equipment",
			amount: 200.0,
			_csrf: csrfToken
		}

		const getForm = async () => {
			const res = await request(app)
				.get("/expenses/new")
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $("[name=_csrf]").val()
			cookies = res.headers["set-cookie"]
			return res
		}

		const postForm = async () => {
			const res = await request(app)
				.post("/expenses/")
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			return res
		}

		const countExpenses = async () => {
			return await Expense.find().countDocuments()
		}

		it("should create a new expense with valid properties", async () => {
			await getForm()
			await cookies.push(`token=${token}`)
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Office, property and equipment",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			const res = await postForm()
			expect(res.status).toBe(302)
			expect(res.text).toMatch(/expenses/)
			const number = await countExpenses()
			expect(number).toEqual(2)
		})

		it("should not create a new expense and redirect if not admin", async () => {
			await getForm()
			token = userToken
			cookies.push(`token=${token}`)
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Office, property and equipment",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			const res = await postForm()
			expect(res.status).toBe(403)
			expect(res.text).toMatch(/can only view/)
			const number = await countExpenses()
			expect(number).toEqual(1)
		})

		it("should not create a new expense if form data invalid", async () => {
			await getForm()
			token = await makeAdminToken()
			cookies.push(`token=${token}`)
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			const res = await postForm()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Have another go/)
			const number = await countExpenses()
			expect(number).toEqual(1)
		})

		it("should not create a new expense and redirect if not admin", async () => {
			await getForm()
			token = userToken
			cookies.push(`token=${token}`)
			properties = {
				name: "New Client",
				email: "newclient@example.com",
				phone: "01234567890",
				address1: "23 acacia avenue",
				postcode: "yb1 1by",
				_csrf: csrfToken
			}
			const res = await postForm()
			expect(res.status).toBe(403)
			expect(res.text).toMatch(/can only view/)
			const number = await countExpenses()
			expect(number).toEqual(1)
		})

		it("should not create if csrf do not check out", async () => {
			await getForm()
			cookies.push(`token=${token}`)
			properties = {
				name: "New Client",
				email: "newclient@example.com",
				phone: "01234567890",
				address1: "23 acacia avenue",
				postcode: "yb1 1by",
				_csrf: "jdhfkhkfhiuwehFIwheifuh"
			}
			const res = await postForm()
			expect(res.status).toBe(403)
			expect(res.text).toMatch(/invalid csrf token/)
			const number = await countExpenses()
			expect(number).toEqual(1)
		})
	})

	describe("DELETE /", () => {
		beforeEach(async () => {
			const res = await request(app)
				.get(`/expenses/${id}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".delete")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			properties = {}
		})

		const deleteID = async () => {
			return await request(app)
				.delete("/expenses")
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
		}

		const countExpenses = async () => {
			return await Expense.find().countDocuments()
		}

		it("it should delete a record with a valid request and redirect to dashboard", async () => {
			cookies.push(`token=${token}`)
			properties = { id: id.toHexString(), _csrf: csrfToken }
			const res = await deleteID()
			let number = await countExpenses()
			expect(number).toEqual(0)
			expect(res.text).toMatch(/expenses/)
			expect(res.status).toBe(302)
		})

		it("have to have an admin token to delete (user token)", async () => {
			token = userToken
			cookies.push(`token=${token}`)
			properties = { id: id.toHexString(), _csrf: csrfToken }
			const res = await deleteID()
			let number = await countExpenses()
			expect(number).toEqual(1)
			expect(res.status).toBe(403)
		})

		it("have to have an admin token to delete (no token)", async () => {
			token = ""
			cookies.push(`token=${token}`)
			properties = { id: id.toHexString(), _csrf: csrfToken }
			const res = await deleteID()
			let number = await countExpenses()
			expect(number).toEqual(1)
			expect(res.status).toBe(401)
		})

		it("it should not delete a client with a invalid id, throw 400.", async () => {
			cookies.push(`token=${token}`)
			properties = { id: "invalididstring1234", _csrf: csrfToken }
			const res = await deleteID()
			number = await countExpenses()
			expect(number).toEqual(1)
			expect(res.status).toBe(400)
		})

		it("it should not delete a client with a valid id not in db, throw 404.", async () => {
			cookies.push(`token=${token}`)
			properties = { id: new mongoose.Types.ObjectId().toHexString(), _csrf: csrfToken }
			const res = await deleteID()
			let number = await countExpenses()
			expect(number).toEqual(1)
			expect(res.status).toBe(404)
		})
	})

	describe("GET / edit / :id", () => {
		const getEdit = async () => {
			return await request(app)
				.get(`/expenses/edit/${id}`)
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
			id = mongoose.Types.ObjectId()
			await getEdit()
			const res = await getEdit()
			expect(res.status).toBe(404)
		})

		it("should return 400 if invalid id sent in request", async () => {
			id = "fake_id"
			await getEdit()
			const res = await getEdit()
			expect(res.status).toBe(404)
		})
	})

	describe("PUT / :id", () => {
		const getEdit = async () => {
			const res = await request(app)
				.get(`/expenses/edit/${id}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".expenseFields")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
			return res
		}

		it("updates the record with a valid request", async () => {
			await getEdit()
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Clothing expenses",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			const res = await request(app)
				.put(`/expenses/${id}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(302)
			const { category } = await Expense.findOne({ _id: id })
			expect(category).toMatch(/Clothing expenses/)
		})

		it("redisplays form with invalid form data", async () => {
			await getEdit()
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Clothing expenses",
				desc: "lots of equipment",
				amount: "",
				_csrf: csrfToken
			}
			const res = await request(app)
				.put(`/expenses/${id}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Have another/)
		})

		it("returns 403 with invalid _csrf token", async () => {
			await getEdit()
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Clothing expenses",
				desc: "lots of equipment",
				amount: "",
				_csrf: "okedjfjowjfowf"
			}
			const res = await request(app)
				.put(`/expenses/${id}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(403)
		})

		it("returns 401 if no auth token", async () => {
			await getEdit()
			cookies[2] = `token=`
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Clothing expenses",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			const res = await request(app)
				.put(`/expenses/${id}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(401)
		})

		it("returns 403 if user auth token", async () => {
			await getEdit()
			cookies[2] = `token=${userToken}`
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Clothing expenses",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			const res = await request(app)
				.put(`/expenses/${id}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(403)
		})

		it("returns 404 with invalid id in request", async () => {
			await getEdit()
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Clothing expenses",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			id = "fake_id"
			const res = await request(app)
				.put(`/expenses/${id}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(404)
		})

		it("returns 404 with valid id in request not in db", async () => {
			await getEdit()
			properties = {
				date: moment().format("YYYY-MM-DD"),
				category: "Clothing expenses",
				desc: "lots of equipment",
				amount: "200.00",
				_csrf: csrfToken
			}
			id = mongoose.Types.ObjectId()
			const res = await request(app)
				.put(`/expenses/${id}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(404)
		})
	})
})
