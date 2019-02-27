const {check}     = require('express-validator/check');
const {Client}    = require("../models/client");

module.exports = {
  invoice: [
    check('clientId')
      .isMongoId()
      .withMessage('Select a Client')
      .custom(id => {
        return Client.findById(id).then(client => {
          if (!client) {
            return Promise.reject('Client not found');
          } else {
            return true
          }
        })
      }),

    check('invDate')
      .isISO8601()
      .withMessage('date is wrong')
      .isBefore(new Date().toISOString())
      .withMessage('dates must be today or earlier'),

    check('invNo')
      .isInt().withMessage('check invoice number'),

    check('message')
      .isLength({ min: 1 }).withMessage('include a message'),

    check('items')
      .isLength({ min: 1 })
      .withMessage("Need at least one item"),

    check('items.*.date')
      .isISO8601()
      .withMessage('date is wrong')
      .isBefore(new Date().toISOString())
      .withMessage('dates must be today or earlier'),

    check('items.*.desc')
      .isLength({ min: 1 })
      .withMessage('Include details for the item'),

    check('items.*.fee')
      // .isInt()
      .isDecimal({ decimal_digits: '2,', force_decimal: true })
      .withMessage('check fee xx.xx')
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
      .normalizeEmail(),
    check('phone')
      .matches(/^\d+$/)
      .withMessage("phone digits only")
      .isLength({ min: 11 })
      .withMessage("too short!")
      .isLength({ max: 16 })
      .withMessage("too long!")
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
      })
      .withMessage("Passwords don't match")
    ],

  detail: [
    check('farewell')
      .matches(/(\w(\s)?)+/)
      .withMessage('just words'),
    check('contact')
      .matches(/(\w(\s)?)+/)
      .withMessage('just words'),
    check('email')
      .isEmail().withMessage('email address looks wrong'),
    check('phone')
      .matches(/^\d+$/)
      .withMessage("phone digits only")
      .isLength({ min: 11 })
      .withMessage("too short!")
      .isLength({ max: 16 })
      .withMessage("too long!"),
    check('utr')
      .matches(/[0-9]{10}/)
      .withMessage('tax reference 10 digits only'),
    check('bank')
      .matches(/(\w(\s)?)+/)
      .withMessage('bank name just words'),
    check('sortcode')
      .matches(/^(\d){2}-(\d){2}-(\d){2}$/)
      .withMessage("sort code format XX-XX-XX only"),
    check('accountNo')
      .trim()
      .matches(/^(\d){8}$/)
      .withMessage('account number 8 digits only'),
    check('terms')
      .matches(/(\w(\s)?)+/)
      .withMessage('just words')
    ],

  useredit: [
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
        .optional({checkFalsy:true}).isLength({ min: 7 })
        .withMessage("password too short!")
        .trim(),
      check('passwordConfirmation')
        .optional({checkFalsy:true})
        .custom((value, { req }) => {
          if (value !== req.body.password) {
                return false;
              } else {
                return value;
              }
        })
        .withMessage("Passwords don't match")
      ]
}
