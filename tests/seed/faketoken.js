const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const config = require("config")
const mongoose = require("mongoose")

const fakeToken = async () => {
	const payload = {
		_id: new mongoose.Types.ObjectId(),
		isAdmin: true,
		name: "Faker Fake Name"
	}
	const token = jwt.sign({ payload }, config.get("JWT_SECRET"), { expiresIn: "1h" })
	return token
}

module.exports = { fakeToken }
