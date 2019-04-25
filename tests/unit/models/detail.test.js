const { Detail } = require("../../../server/models/detail")
const { makeDetails } = require("../../seed/detail")
const mongoose = require("mongoose")
const app = require("../../../app")

let detail

describe("Detail", () => {
	describe("saving an detail", () => {
		beforeEach(async () => {
			detail = await makeDetails()
		})

		afterEach(async () => {
			await Detail.deleteMany()
		})

		it("should save record with valid data", () => {
			expect(detail).toHaveProperty("business", "my business name")
			expect(detail).toHaveProperty("utr", "1234567898")
			expect(detail).toHaveProperty("email", "email@example.com")
			expect(detail).toHaveProperty("phone", "07956245637")
			expect(detail).toHaveProperty("bank", "the bank complany")
			expect(detail).toHaveProperty("sortcode", "203445")
			expect(detail).toHaveProperty("accountNo", "23456789")
			expect(detail).toHaveProperty("terms", "pay now")
			expect(detail).toHaveProperty("farewell", "yours")
			expect(detail).toHaveProperty("contact", "it is me")
			expect(detail).toHaveProperty("address1", "7 street road")
			expect(detail).toHaveProperty("address2", "townsville")
			expect(detail).toHaveProperty("postcode", "AB1 1BA")
		})
	})
})
