const mongoose  = require('mongoose');


let ClientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  },
  email: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  }
});

let Client = mongoose.model('Client', ClientSchema);

module.exports = {Client};
