const express = require("express")
const router = express.Router()
const logger = require("../startup/logger")
const details = (req, res) => {
	req.flash("alert", "We can't find that for you.")
	res.status(404)
	throw {
		tag: "It's just not possible.",
		message:
			"The resource you are looking for cannot be found, maybe it's been deleted, maybe it was never here.",
		statusCode: 404
	}
}

router.get("/", (req, res) => {
	details(req, res)
})

router.post("/", (req, res) => {
	details(req, res)
})

router.patch("/", (req, res) => {
	details(req, res)
})

router.put("/", (req, res) => {
	details(req, res)
})

router.delete("/", (req, res) => {
	details(req, res)
})

module.exports = router
