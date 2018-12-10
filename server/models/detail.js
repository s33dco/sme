const mongoose = require('mongoose');
const {ObjectID}    = require('mongodb');

let DetailSchema = new mongoose.Schema({
    utr   : {type: String},
    email : {type:String},
    phone : {type:String}
  });



let Detail = mongoose.model('Details', DetailSchema);


module.exports = {Detail};
