const mongoose = require('mongoose');


let InvoiceSchema = new mongoose.Schema({
  emailTo: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
            }
  // invoice number
  // billingDate
  // paid (bolean)
  // datepaid
  //
  // charges [ dateWorked, description, amount, tax]
  //
  // billedTo
});



let Invoice = mongoose.model('Invoice', InvoiceSchema);


module.exports = {Invoice};
