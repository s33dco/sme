const mongoose = require('mongoose');


let InvoiceSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true,
    unique: true,
    validate: {
      validator : validator.isEmail,
      message: '{VALUE} is not a valid email'
      }
  },
  password: {
    type: String,
    require: true,
    minlength: 6
  }
});



let Invoice = mongoose.model('Invoice', InvoiceSchema);


module.exports = {User};
