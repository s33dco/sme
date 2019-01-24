const express           = require('express');
const router            = express.Router();
const bodyParser        = require('body-parser');
const moment            = require('moment');
const {validationResult}= require('express-validator/check');
const validate          = require('../validators')
const {mongoose}        = require('../db/mongoose');
const {ObjectID}        = require('mongodb');
const {Invoice}         = require("../models/invoice");
const {User}            = require("../models/user");
const {Client}          = require("../models/client");
const {Detail}          = require("../models/detail");
const {authenticate}    = require('../middleware/authenticate');



module.exports = router
