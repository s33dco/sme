const mongoose = require('mongoose');

let DetailSchema = new mongoose.Schema({
    utr       : {type:String},
    email     : {type:String},
    phone     : {type:String},
    bank      : {type:String,    lowercase: true,},
    sortcode  : {type:String},
    accountNo : {type:String},
    terms     : {type:String,    lowercase: true,},
    farewell  : {type:String,    lowercase: true,},
    contact   : {type:String,    lowercase: true,}
  });


let Detail = mongoose.model('Detail', DetailSchema);
module.exports = {Detail};
