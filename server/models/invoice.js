const mongoose = require('mongoose');

let InvoiceSchema = new mongoose.Schema({
  invNo       : { type: Number},
  invDate     : { type: Date, default: Date.now},
  client      : {
    _id     : { type: mongoose.Schema.Types.ObjectId},
    name   : { type: String},
    email  : { type: String}
  },
  message     : { type: String},
  details : {
    utr         : { type: String},
    email       : { type: String},
    phone       : { type: String},
    bank        : { type: String},
    sortcode    : { type: String},
    accountNo   : { type: String},
    terms       : { type: String}
  },
  paid        : { type: Boolean },
  datePaid    : { type: Date },
  items       : [{  date: {type: Date},
                    desc: {type: String},
                    fee : {type: String} }]
});

let Invoice = mongoose.model('Invoice', InvoiceSchema);

module.exports = {Invoice};
