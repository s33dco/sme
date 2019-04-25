const { makeDetails } = require("../seed/detail")
const { makeAdminToken, makeUserToken } = require("../seed/user")
const { User } = require("../../server/models/user")
const { Detail } = require("../../server/models/detail")
const request = require("supertest")
const app = require("../../app")
const mongoose = require("mongoose")
const cheerio = require("cheerio")

let token,
	details,
	farewell,
	contact,
	email,
	phone,
	utr,
	bank,
	sortcode,
	accountNo,
	terms,
	csrfToken,
	cookies,
	properties

beforeEach(async () => {
	token = await makeAdminToken()
	userToken = await makeUserToken()
	details = await makeDetails()
	farewell = details.farewell
	contact = details.contact
	email = details.email
	phone = details.phone
	utr = details.utr
	bank = details.bank
	sortcode = details.sortcode
	accountNo = details.accountNo
	terms = details.terms
	business = details.business
	address1 = details.address1
	address2 = details.address2
	postcode = details.postcode
})

afterEach(async () => {
	await User.deleteMany()
	await Detail.deleteMany()
})

describe("GET /", () => {
	const getDetails = async () => {
		return await request(app)
			.get("/details")
			.set("Cookie", `token=${token}`)
	}

	it("retrieves the details", async () => {
		const res = await getDetails()
		expect(res.status).toBe(200)
		expect(res.text).toContain(business)
		expect(res.text).toContain(farewell)
		expect(res.text).toContain(contact)
		expect(res.text).toContain(email)
		expect(res.text).toContain(phone)
		expect(res.text).toContain(utr)
		expect(res.text).toContain(bank)
		expect(res.text).toContain(sortcode)
		expect(res.text).toContain(accountNo)
		expect(res.text).toContain(terms)
		expect(res.text).toContain(address1)
		expect(res.text).toContain(address2)
		expect(res.text).toContain(postcode)
	})

	it("returns 401 if no token", async () => {
		token = ""
		const res = await getDetails()
		expect(res.status).toBe(401)
	})

	it("returns 403 if user token", async () => {
		token = await makeUserToken()
		const res = await getDetails()
		expect(res.status).toBe(403)
	})

	it("redirects to edit if no details are found", async () => {
		await Detail.deleteMany()
		const res = await getDetails()
		expect(res.status).toBe(302)
		expect(res.text).toMatch(/Redirecting/)
	})
})

describe("GET /edit", () => {
	const getEdit = async () => {
		return await request(app)
			.get("/details/edit")
			.set("Cookie", `token=${token}`)
	}

	it("retrieves the edit details form", async () => {
		const res = await getEdit()
		expect(res.status).toBe(200)
		expect(res.text).toMatch(/Editing/)
	})

	it("returns 401 if no token", async () => {
		token = ""
		const res = await getEdit()
		expect(res.status).toBe(401)
	})

	it("returns 403 if user token", async () => {
		token = await makeUserToken()
		const res = await getEdit()
		expect(res.status).toBe(403)
	})
})

describe("POST /", () => {
	const getForm = async () => {
		const res = await request(app)
			.get("/details/edit")
			.set("Cookie", `token=${token}`)
		let $ = cheerio.load(res.text)
		csrfToken = $("[name=_csrf]").val()
		cookies = res.headers["set-cookie"]
		cookies.push(`token=${token}`)
		return res
	}

	const postForm = async () => {
		const res = await request(app)
			.post("/details/")
			.type("form")
			.set("Cookie", cookies)
			.send(properties)
		return res
	}

	it("updates the record with a valid request", async () => {
		await getForm()
		properties = {
			_csrf: csrfToken,
			farewell: "see you later",
			contact,
			email,
			phone,
			utr,
			bank,
			sortcode: "23-23-23",
			accountNo,
			terms,
			business,
			address1,
			address2,
			postcode
		}
		const res = await postForm()
		expect(res.status).toBe(302)
		let { farewell } = await Detail.findOne()
		expect(farewell).toMatch(/see you later/)
	})

	it("redisplays form for when invalid properties are sent", async () => {
		await getForm()
		properties = {
			_csrf: csrfToken,
			farewell: "see you later",
			contact,
			email,
			phone,
			utr,
			bank,
			sortcode: "232323",
			accountNo,
			terms
		}
		const res = await postForm()
		expect(res.status).toBe(200)
		expect(res.text).toMatch(/Have another go/)
	})

	it("returns a 403 with invalid csrf token", async () => {
		await getForm()
		properties = {
			_csrf: "",
			farewell: "see you later",
			contact,
			email,
			phone,
			utr,
			bank,
			sortcode: "23-23-23",
			accountNo,
			terms
		}
		const res = await postForm()
		expect(res.status).toBe(403)
	})

	it("returns a 401 with no auth token", async () => {
		await getForm()
		cookies[2] = `token=`
		properties = {
			_csrf: csrfToken,
			farewell: "see you later",
			contact,
			email,
			phone,
			utr,
			bank,
			sortcode: "23-23-23",
			accountNo,
			terms
		}
		const res = await postForm()
		expect(res.status).toBe(401)
	})

	it("returns a 403 with a user token", async () => {
		await getForm()
		cookies[2] = `token=${userToken}`
		properties = {
			_csrf: csrfToken,
			farewell: "see you later",
			contact,
			email,
			phone,
			utr,
			bank,
			sortcode: "23-23-23",
			accountNo,
			terms
		}
		const res = await postForm()
		expect(res.status).toBe(403)
	})
})
