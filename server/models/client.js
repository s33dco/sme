const mongoose  = require('mongoose');


let clientSchema = new mongoose.Schema({
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
    minlength: 7,
    trim: true
  }
});

clientSchema.statics.isValid = function (id) {
  return this.findById(id)
    .then(result => {
      if (!result) {return false} else {return id}})
}

clientSchema.statics.withId = function (id) {
  return this.findOne({_id: id});
}



let Client = mongoose.model('Client', clientSchema);

module.exports = {Client};
