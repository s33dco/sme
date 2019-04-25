const mongoose = require("mongoose")

module.exports = (req, res, next) => {
	if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
		res.status(404)
		req.flash("alert", "Cannot be found.")
		throw {
			tag: "Invalid Request.",
			message: "The page you are looking for cannot be found.",
			statusCode: 404
		}
		logger.error(
			`${e.statusCode} - ${e.tag} - ${e.message} - ${req.originalUrl} - ${req.method} - ${
				req.ip
			} - ${ip}`
		)
		next(Error)
	}
	next()
}
