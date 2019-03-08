const mongoose  = require('mongoose');

let clientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minlength: 1,
    lowercase: true,
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
  },
  address1: {
    type: String,
    required: true,
    minlength: 1,
    lowercase: true,
    trim: true
  },
  address2: {
    type: String,
    lowercase: true,
    trim: true
  },
  address3: {
    type: String,
    lowercase: true,
    trim: true
  },
  postcode: {
    type: String,
    required: true,
    minlength: 1,
    uppercase: true,
    trim: true
  }
});

clientSchema.statics.isValid = function (id) {
  return this.findById(id)
    .then(result => {
      if (!result) {return false} else {return id};
    })
}

clientSchema.statics.withId = function (id) {
  return this.findOne({_id: id});
}

clientSchema.statics.orderedByName = function () {
  return this.aggregate([
    {"$project" : { _id:1, name:1}},
    {"$sort": {name : 1}}
  ]);
};

let Client = mongoose.model('Client', clientSchema);

module.exports = {Client};
