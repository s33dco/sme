const mongoose = require('mongoose');

let InvoiceSchema = new mongoose.Schema({
  invNo       : { type: Number},
  invDate     : { type: Date, default: Date.now},
  client      : {
      _id     : { type: mongoose.Schema.Types.ObjectId},
      name    : { type: String},
      email   : { type: String}},
  message     : { type: String},
  details     : {
    utr       : { type: String},
    email     : { type: String},
    phone     : { type: String},
    bank      : { type: String},
    sortcode  : { type: String},
    accountNo : { type: String},
    terms     : { type: String}},
  paid        : { type: Boolean },
  datePaid    : { type: Date },
  items       : [{  date: {type: Date},
                    desc: {type: String},
                    fee : {type: Number} }]
});


InvoiceSchema.methods.totalInvoiceValue = function () {
  inv = this;
  return inv.items.map( item => item.fee).reduce((total, fee) => total + fee);
}

InvoiceSchema.statics.listInvoices = function () {
  let invoiceList =
  this.aggregate([
    {$project : { invNo:1, invDate:1, "client.name":1, items:1}},
    {"$unwind" : "$items"},
    {"$sort": {"items.date" : -1}},
    {"$group": {
     "_id" : {invoice: "$invNo", date: "$invDate", invoice_id: "$_id", client: "$client.name"},
     "total": {"$sum": "$items.fee"}
      }
    },
    {"$sort": {"_id.invoice": -1}}
  ]);
  return invoiceList;
}

let Invoice = mongoose.model('Invoice', InvoiceSchema);
module.exports = {Invoice};
