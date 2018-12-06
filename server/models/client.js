const mongoose  = require('mongoose');

let ClientSchema = new mongoose.Schema({
  clientName: {
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

ClientSchema.methods.toJSON             = function () {
  let client = this;
  let clientObject = client.toObject();

  return clientObject;
};


let Client = mongoose.model('Client', ClientSchema);

module.exports = {Client};
