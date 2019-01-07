const {check}  = require('express-validator/check');
const {Client} = require("./models/client");

module.exports = {

  invoice: [
    check('clientId')
      .isMongoId()
      .withMessage('Select Client')
      .custom(id => {
        return Client.findById(id).then(client => {
          if (!client) {
            return Promise.reject('Client not in DB');
          } else {
            return true
          }
        })
      }),

    check('invDate')
      .isISO8601()
      .withMessage('date is wrong YYYY-MM-DD')
      .isBefore(new Date().toISOString())
      .withMessage('must be today or earlier'),

    check('invNo')
      .isInt().withMessage('check invoice number'),

    check('message')
      .isLength({ min: 1 }).withMessage('include a message'),

    check('items')
      .isLength({ min: 1 })
      .withMessage("Need at least one item"),

    check('items.*.date')
      .isISO8601()
      .withMessage('date is wrong YYYY-MM-DD')
      .isBefore(new Date().toISOString())
      .withMessage('must be today or earlier YYYY-MM-DD'),

    check('items.*.desc')
      .isLength({ min: 1 })
      .withMessage('Include details for the item'),

    check('items.*.fee')
      .isNumeric().withMessage('fee must be a number')
    ],

  email: [
    check('message')
      .isLength({ min: 1 })
      .withMessage('Message is required')
      .trim(),
    check('email')
      .isEmail()
      .withMessage('That email doesn‘t look right')
      .trim()
      .normalizeEmail()
  ],

  login: [
    check('email')
      .isEmail()
      .withMessage('That email doesn‘t look right')
      .trim()
      .normalizeEmail(),
    check('password')
      .isLength({ min: 7 })
      .withMessage("password too short!")
      .trim()
  ],

  client: [
    check('name')
      .isLength({ min: 1 })
      .withMessage("Client name too short!")
      .trim(),
    check('email')
      .isEmail()
      .withMessage('That email doesn‘t look right')
      .trim()
      .normalizeEmail()
  ],

  user: [
    check('firstName')
      .isLength({ min: 1 })
      .withMessage("first name too short!")
      .isAlpha()
      .withMessage("only letters")
      .trim(),
    check('lastName')
      .isLength({ min: 1 })
      .withMessage("last name too short!")
      .isAlpha()
      .withMessage("only letters")
      .trim(),
    check('email')
      .isEmail()
      .withMessage('That email doesn‘t look right')
      .trim()
      .normalizeEmail(),
    check('password')
      .isLength({ min: 7 })
      .withMessage("password too short!")
      .trim(),
    check('passwordConfirmation')
      .custom((value, { req }) => {
        if (value !== req.body.password) {
              return false;
            } else {
              return value;
            }
      }).withMessage("Passwords don't match")
      ]
}
