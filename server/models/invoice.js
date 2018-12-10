const mongoose = require('mongoose');
const {ObjectID}    = require('mongodb');

let InvoiceSchema = new mongoose.Schema({
  invNo:    {
    type: Number,
    required: true
  },
  invDate:  {
    type: Date,
    default: Date.now,
    required: true
  },
  message: {
    type: String
  },
  billTo:   {           //embedded document
              clientId   : {
                  type: ObjectID,
                  required: true
                          },
              clientName  : {
                  type: String,
                  required: true
                          },
              clientEmail : {
                  type: String,
                  required: true
                  }
            },
  standardInfo: {
    utr: {type: String},
    email: {type:String},
    phone: {type:String}
  },
  items: [
    {
      date: {type: Date},
      desc: {type: String},
      fee: {type: Number}
    }
  ],
  paid: {
    type: Boolean
  },
  datePaid: {
    type: Date
  }
});



let Invoice = mongoose.model('Invoice', InvoiceSchema);


module.exports = {Invoice};
