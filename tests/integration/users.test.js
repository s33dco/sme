const { makeUser, makeAdmin } = require("../seed/user")
const { User } = require("../../server/models/user")
const request = require("supertest")
const app = require("../../app")
const mongoose = require("mongoose")
const cheerio = require("cheerio")

let token,
	adminUser,
	otherAdminUser,
	user,
	userId,
	adminId,
	userToken,
	csrfToken,
	cookies,
	properties

beforeEach(async () => {
	adminUser = await makeAdmin()
	otherAdminUser = await makeAdmin()
	token = await adminUser.generateAuthToken()
	user = await makeUser()
	adminId = adminUser._id
	userId = user._id
	userToken = user.generateAuthToken()
})

afterEach(async () => {
	await User.deleteMany()
})

describe("/users", () => {
	describe("GET /", () => {
		const exec = async () => {
			return await request(app)
				.get("/users")
				.set("Cookie", `token=${token}`)
		}

		it("should display the users page for admin user", async () => {
			const res = await exec()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Users/)
		})

		it("should return 403 if not an admin user", async () => {
			token = userToken
			const res = await exec()
			expect(res.status).toBe(403)
		})

		it("should return 401 if not logged in", async () => {
			token = ""
			const res = await exec()
			expect(res.status).toBe(401)
		})
	})

	describe("GET / :id", () => {
		const getUser = async () => {
			return await request(app)
				.get(`/users/${userId}`)
				.set("Cookie", `token=${token}`)
		}

		const getAdmin = async () => {
			return await request(app)
				.get(`/users/${adminUser._id}`)
				.set("Cookie", `token=${token}`)
		}

		it("should return 404 for valid id with no record", async () => {
			userId = mongoose.Types.ObjectId()
			const res = await getUser()
			expect(res.status).toBe(404)
		})

		it("should return 404 for an invalid id", async () => {
			userId = "rubbish_id"
			const res = await getUser()
			expect(res.status).toBe(404)
		})

		it("should display the user page", async () => {
			const res = await getUser()
			expect(res.status).toBe(200)
		})

		it("should display admin, edit and delete button for non admin user", async () => {
			const res = await getAdmin()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Edit/)
			expect(res.text).toMatch(/No Admin/)
			expect(res.text).toMatch(/Delete/)
		})

		it("should display no admin, edit and delete button for admin user", async () => {
			const res = await getUser()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Edit/)
			expect(res.text).toMatch(/Make Admin/)
			expect(res.text).toMatch(/Delete/)
		})
	})

	describe("DELETE / ", () => {
		const getUser = async () => {
			const res = await request(app)
				.get(`/users/${userId}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".delete")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
		}

		it("should delete the record with valid credentials", async () => {
			await getUser()
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(302)
			let count = await User.find().countDocuments()
			expect(count).toEqual(2)
		})

		it("cannot delete your own id", async () => {
			userId = adminUser._id
			await getUser()
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(400)
			let count = await User.find().countDocuments()
			expect(count).toEqual(3)
		})

		it("cannot delete last user in db", async () => {
			await User.deleteOne({ _id: user._id })
			userId = adminUser._id
			await getUser()
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(400)
			let count = await User.find().countDocuments()
			expect(count).toEqual(2)
		})

		it("should return 403 with invalid csrf token", async () => {
			await getUser()
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: "hreuhgiahrgiuhaergiheariugh" })
			expect(res.status).toBe(403)
			let count = await User.find().countDocuments()
			expect(count).toEqual(3)
		})

		it("should return 403 if no admin token", async () => {
			token = userToken
			await getUser()
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
			let count = await User.find().countDocuments()
			expect(count).toEqual(3)
		})
		//
		it("should return 403 if no token", async () => {
			await getUser()
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: "" })
			expect(res.status).toBe(403)
			let count = await User.find().countDocuments()
			expect(count).toEqual(3)
		})

		it("should return 404 with valid id in request not in db", async () => {
			await getUser()
			let rogueId = new mongoose.Types.ObjectId()
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: rogueId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(404)
			let count = await User.find().countDocuments()
			expect(count).toEqual(3)
		})

		it("should return 400 with invalid id in request", async () => {
			await getUser()
			let rogueId = "rubbish_id"
			const res = await request(app)
				.delete("/users")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: rogueId, _csrf: csrfToken })
			expect(res.status).toBe(400)
			let count = await User.find().countDocuments()
			expect(count).toEqual(3)
		})
	})

	describe("POST / upgrade", () => {
		const getUser = async () => {
			const res = await request(app)
				.get(`/users/${userId}`)
				.set("Cookie", `token=${token}`)

			let $ = cheerio.load(res.text)
			csrfToken = $(".upgrade")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
		}

		it("should update isAdmin as true for a user when logged in as an admin", async () => {
			await getUser()
			const res = await request(app)
				.post("/users/upgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(302)
			expect(res.text).toMatch(/dashboard/)
			let checkAdmin = await User.findOne({ _id: userId })
			let status = checkAdmin.isAdmin
			expect(status).toBe(true)
		})

		it("should return 404 for valid user Id not found", async () => {
			await getUser()
			userId = new mongoose.Types.ObjectId()
			const res = await request(app)
				.post("/users/upgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(404)
		})

		it("should return 400 for valid user Id not found", async () => {
			await getUser()
			userId = new mongoose.Types.ObjectId()
			const res = await request(app)
				.post("/users/upgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: "rubbush_Id_string", _csrf: csrfToken })
			expect(res.status).toBe(400)
		})

		it("should return 403 if user token", async () => {
			await getUser()
			cookies[2] = `token=${userToken}`
			const res = await request(app)
				.post("/users/upgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
		})

		it("should return 401 if no token", async () => {
			await getUser()
			cookies[2] = `token=`
			const res = await request(app)
				.post("/users/upgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: userId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(401)
		})
	})

	describe("POST / downgrade", () => {
		const getAdmin = async () => {
			const res = await request(app)
				.get(`/users/${adminId}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".downgrade")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
		}

		it("should update isAdmin as false when logged in as an admin", async () => {
			await getAdmin()
			const res = await request(app)
				.post("/users/downgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: adminId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(302)
			expect(res.text).toMatch(/dashboard/)
			let checkIfAdmin = await User.findOne({ _id: userId })
			let status = checkIfAdmin.isAdmin
			expect(status).toBe(false)
		})

		it("should return 404 for valid user Id not found", async () => {
			await getAdmin()
			adminId = new mongoose.Types.ObjectId()
			const res = await request(app)
				.post("/users/downgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: adminId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(404)
		})

		it("should return 400 for valid user Id not found", async () => {
			await getAdmin()
			const res = await request(app)
				.post("/users/downgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: "rubbush_id_String", _csrf: csrfToken })
			expect(res.status).toBe(400)
		})

		it("should return 403 if user token", async () => {
			await getAdmin()
			cookies[2] = `token=${userToken}`
			const res = await request(app)
				.post("/users/downgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: adminId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(403)
		})

		it("should return 401 if no token", async () => {
			await getAdmin()
			cookies[2] = `token=`
			const res = await request(app)
				.post("/users/downgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: adminId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(401)
		})

		it("should not be able to turn last admin into a user 400", async () => {
			await User.deleteOne({ _id: otherAdminUser._id })
			await getAdmin()
			const res = await request(app)
				.post("/users/downgrade")
				.set("Cookie", cookies)
				.type("form")
				.send({ id: adminId.toHexString(), _csrf: csrfToken })
			expect(res.status).toBe(400)
		})
	})

	describe("GET / new", () => {
		const getNew = async () => {
			return await request(app)
				.get("/users/new")
				.set("Cookie", `token=${token}`)
		}

		it("should return the form with admin token", async () => {
			const res = await getNew()
			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Create a new user/)
		})

		it("should return 403 with user token", async () => {
			token = userToken
			const res = await getNew()
			expect(res.status).toBe(403)
		})

		it("should return 403 with no token", async () => {
			token = userToken
			const res = await getNew()
			expect(res.status).toBe(403)
		})
	})

	describe("POST /", () => {
		const getNewUserForm = async () => {
			const res = await request(app)
				.get("/users/new")
				.set("Cookie", `token=${token}`)

			let $ = cheerio.load(res.text)
			csrfToken = $(".userFields")
				.find("[name=_csrf]")
				.val()
			cookies = res.headers["set-cookie"]
			cookies.push(`token=${token}`)
			return res
		}

		it("should create a new user with a valid request", async () => {
			await getNewUserForm()
			properties = {
				_csrf: csrfToken,
				firstName: "Derek",
				lastName: "Smalls",
				email: "derek@tap.com",
				password: "password",
				passwordConfirmation: "password"
			}

			const res = await request(app)
				.post("/users")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(302)
			let count = await User.find().countDocuments()
			expect(count).toBe(4)
		})

		it("should return 403 if no admin token", async () => {
			await getNewUserForm()
			cookies[2] = `token=${userToken}`
			properties = {
				_csrf: csrfToken,
				firstName: "Derek",
				lastName: "Smalls",
				email: "derek@tap.com",
				password: "password",
				passwordConfirmation: "password"
			}

			const res = await request(app)
				.post("/users")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(403)
			let count = await User.find().countDocuments()
			expect(count).toBe(3)
		})

		it("should return 401 if no token", async () => {
			await getNewUserForm()
			cookies[2] = `token=`
			properties = {
				_csrf: csrfToken,
				firstName: "Derek",
				lastName: "Smalls",
				email: "derek@tap.com",
				password: "password",
				passwordConfirmation: "password"
			}

			const res = await request(app)
				.post("/users")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(401)
			let count = await User.find().countDocuments()
			expect(count).toBe(3)
		})

		it("should redisplay form if input invalid", async () => {
			await getNewUserForm()
			properties = {
				_csrf: csrfToken,
				firstName: "",
				lastName: "",
				email: "derek@tap.com",
				password: "password",
				passwordConfirmation: "password"
			}

			const res = await request(app)
				.post("/users")
				.set("Cookie", cookies)
				.type("form")
				.send(properties)

			expect(res.status).toBe(200)
			expect(res.text).toMatch(/Have another go/)
			let count = await User.find().countDocuments()
			expect(count).toBe(3)
		})
	})

	describe("GET / edit / :id", () => {
		const getEdit = async () => {
			return await request(app)
				.get(`/users/edit/${userId}`)
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

		it("should return 404 if valid user id not in db sent in request", async () => {
			userId = mongoose.Types.ObjectId()
			await getEdit()
			const res = await getEdit()
			expect(res.status).toBe(404)
		})

		it("should return 400 if invalid id sent in request", async () => {
			userId = "fake_id"
			await getEdit()
			const res = await getEdit()
			expect(res.status).toBe(404)
		})
	})

	describe("PUT / :id", () => {
		const getEdit = async () => {
			const res = await request(app)
				.get(`/users/edit/${userId}`)
				.set("Cookie", `token=${token}`)
			let $ = cheerio.load(res.text)
			csrfToken = $(".userFields")
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
				firstName: "Tarquin",
				lastName: "Farquis",
				email: "email@example.com"
			}
			const res = await request(app)
				.put(`/users/${userId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(302)
			const { firstName } = await User.findOne({ _id: userId })
			expect(firstName).toMatch(/tarquin/)
		})

		it("redisplays form with invalid form data", async () => {
			await getEdit()
			properties = { _csrf: csrfToken, firstName: "", lastName: "Farquis", email: "e@co" }
			const res = await request(app)
				.put(`/users/${userId}`)
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
				firstName: "Tarquin",
				lastName: "Farquis",
				email: "email@example.com"
			}
			const res = await request(app)
				.put(`/users/${userId}`)
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
				firstName: "Tarquin",
				lastName: "Farquis",
				email: "email@example.com"
			}
			const res = await request(app)
				.put(`/users/${userId}`)
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
				firstName: "Tarquin",
				lastName: "Farquis",
				email: "email@example.com"
			}
			const res = await request(app)
				.put(`/users/${userId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(403)
		})

		it("returns 404 with invalid id in request", async () => {
			await getEdit()
			properties = {
				_csrf: csrfToken,
				firstName: "Tarquin",
				lastName: "Farquis",
				email: "email@example.com"
			}
			userId = "fake_id"
			const res = await request(app)
				.put(`/users/${userId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(404)
		})

		it("returns 404 with valid id in request not in db", async () => {
			await getEdit()
			properties = {
				_csrf: csrfToken,
				firstName: "Tarquin",
				lastName: "Farquis",
				email: "email@example.com"
			}
			userId = mongoose.Types.ObjectId()
			const res = await request(app)
				.put(`/users/${userId}`)
				.type("form")
				.set("Cookie", cookies)
				.send(properties)
			expect(res.status).toBe(404)
		})
	})
})
