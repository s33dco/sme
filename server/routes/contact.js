const express = require("express")
const router = express.Router()
const bodyParser = require("body-parser")
const moment = require("moment")
const { validationResult } = require("express-validator/check")
const validate = require("../middleware/validators")
const nodemailer = require("nodemailer")
const sendgridTransport = require("nodemailer-sendgrid-transport")
const ejs = require("ejs")
const logger = require("../startup/logger")
const config = require("config")

router.get("/", (req, res) => {
	res.render("contact", {
		data: {},
		errors: {},
		csrfToken: req.csrfToken(), // generate a csrf token
		pageTitle: "Get in touch.",
		pageDescription: "We'd love to hear from you."
	})
})

router.post("/", validate.email, (req, res) => {
	const errors = validationResult(req)
	if (!errors.isEmpty()) {
		return res.render("contact", {
			data: req.body,
			errors: errors.mapped(),
			csrfToken: req.csrfToken(), // generate new csrf token
			pageTitle: "Get in touch.",
			pageDescription: "Give it another shot."
		})
	}

	// send the email.....

	const transporter = nodemailer.createTransport(
		sendgridTransport({
			auth: {
				api_key: config.get("SENDGRID_API_PASSWORD")
			}
		})
	)

	ejs.renderFile(
		"./views/contactEmail.ejs",
		{ from: req.body.email, message: req.body.message, name: req.body.name },
		function(error, data) {
			if (error) {
				logger.error(`file error: ${error.message} - ${error.stack}`)
			} else {
				const options = {
					from: req.body.email,
					to: config.get("SME_EMAIL"),
					replyTo: req.body.email,
					subject: `${req.body.name} has sent you an email.`,
					html: data
				}

				transporter.sendMail(options, (error, info) => {
					if (error) {
						logger.error(`send email error: ${error.message} - ${error.stack}`)
						req.flash("alert", `Your message could not be sent.`)
						res.redirect("/")
					} else {
						logger.info(`Contact email from ${req.body.name} sent to ${config.get("SME_EMAIL")}`)
						req.flash("success", `Thanks for the message ${req.body.name}! I‘ll be in touch :)`)
						res.redirect("/")
					}
				})
			}
		}
	)
})

module.exports = router
