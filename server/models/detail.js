const mongoose = require('mongoose');

let DetailSchema = new mongoose.Schema({
    utr       : {type: String},
    email     : {type:String},
    phone     : {type:String},
    bank      : {type:String},
    sortcode  : {type:String},
    accountNo : {type:String},
    terms     : {type:String}
  });


let Detail = mongoose.model('Detail', DetailSchema);
module.exports = {Detail};
