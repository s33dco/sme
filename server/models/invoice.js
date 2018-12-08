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
  billedItem: [
    {
      billedDate: {type: Date},
      billedDesc: {type: String},
      billedAmount: {type: Number}
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
