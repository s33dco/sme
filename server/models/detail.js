const mongoose = require('mongoose');

let detailSchema = new mongoose.Schema({
    business  : {type:String, required: true},
    utr       : {type:String, required: true},
    email     : {type:String, required: true},
    phone     : {type:String, required: true},
    bank      : {type:String, lowercase: true, required: true},
    sortcode  : {type:String, required: true},
    accountNo : {type:String, required: true},
    terms     : {type:String, required: true, lowercase: true,},
    farewell  : {type:String, required: true, lowercase: true,},
    contact   : {type:String, required: true, lowercase: true,},
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

detailSchema.statics.getBusinessName = async function () {
  const result = await this.findOne({});
  return result.business;
}

let Detail = mongoose.model('Detail', detailSchema);
module.exports = {Detail};
