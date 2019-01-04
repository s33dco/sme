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
  },
  phone: {
    type: String,
    required: true,
    minlength: 1,
    trim: true
  }
});

ClientSchema.statics.listClients = function () {
  return this.find({},{name:0, email:0,phone:0}).map(client => client._id);
}

let Client = mongoose.model('Client', ClientSchema);

module.exports = {Client};
