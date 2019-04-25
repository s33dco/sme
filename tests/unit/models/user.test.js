const { User } = require("../../../server/models/user")
const { makeUser, makeAdmin } = require("../../seed/user")
const app = require("../../../app")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const config = require("config")

describe("User", () => {
	afterEach(async () => {
		await User.deleteMany()
	})

	describe("user.generateAuthToken", () => {
		it("should return a valid JWT", async () => {
			const user = await makeUser()
			const payload = {
				_id: user._id,
				isAdmin: user.isAdmin,
				name: user.firstName
			}
			const token = user.generateAuthToken()
			const decoded = jwt.verify(token, config.get("JWT_SECRET"))
			expect(decoded).toHaveProperty("_id", user._id.toHexString())
			expect(decoded).toHaveProperty("name", user.firstName)
			expect(decoded).toHaveProperty("isAdmin", false)
		})

		it("should show if user is an admin", async () => {
			const user = await makeAdmin()
			const payload = {
				_id: user._id,
				isAdmin: user.isAdmin,
				name: user.firstName
			}
			const token = user.generateAuthToken()
			const decoded = jwt.verify(token, config.get("JWT_SECRET"))
			expect(decoded).toHaveProperty("_id", user._id.toHexString())
			expect(decoded).toHaveProperty("name", user.firstName)
			expect(decoded).toHaveProperty("isAdmin", true)
		})
	})

	describe("User.findByEmail", () => {
		it("should return the correct user object", async () => {
			const user = await makeUser()
			email = user.email
			const found = await User.findByEmail(email)
			expect(found._id).toEqual(user._id)
		})
	})

	describe("password hashing", () => {
		it("should hash password on saving", async () => {
			user = await makeUser()
			expect(user.password).not.toEqual("password")
		})

		it("should return true on comparing", async () => {
			user = await makeUser()
			const validPassword = await bcrypt.compare("password", user.password)
			expect(validPassword).toBe(true)
		})
	})
})
