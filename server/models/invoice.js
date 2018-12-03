const mongoose = require('mongoose');


let InvoiceSchema = new mongoose.Schema({
  emailTo: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  }

  // billingDate
  // paid (bolean)
  // datepaid
  //
  // charges [ date, description, amount, tax]
  //

});



let Invoice = mongoose.model('Invoice', InvoiceSchema);


module.exports = {Invoice};
