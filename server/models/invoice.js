const mongoose = require('mongoose');

let InvoiceSchema = new mongoose.Schema({
  invNo       : { type: Number},
  invDate     : { type: Date, default: Date.now},

  client      : {
      _id     : { type: mongoose.Schema.Types.ObjectId,
                  required: true},
      name    : { type: String,
                  required: true},
      phone   : { type: String,
                  required: true},
      email   : { type: String,
                  required: true}
                },

  message     : { type: String},

  details     : {
    utr       : { type: String,
                  required: true},
    email     : { type: String,
                  required: true},
    phone     : { type: String,
                  required: true},
    bank      : { type: String,
                  required: true},
    sortcode  : { type: String,
                  required: true},
    accountNo : { type: String,
                  required: true},
    contact   : { type: String,
                  required: true},
    terms     : { type: String,
                  required: true}
              },

  paid        : { type: Boolean },
  datePaid    : { type: Date },
  items       : [
                {  date: {type: Date, required: true},
                  desc: {type: String,required: true},
                  fee : {type: mongoose.Schema.Types.Decimal, required: true}}
                ]
});

InvoiceSchema.methods.totalInvoiceValue = function  () {
  inv = this;
  return inv.items.map( item => item.fee).reduce((total, fee) => total + fee);
};

InvoiceSchema.statics.sumOfInvoice = async function (id){
  const result = await this.aggregate([
    {"$match" : { '_id' : mongoose.Types.ObjectId(id) }},
    {"$unwind" : "$items"},
    {"$project" : { _id:0, "items.fee":1}},
    {"$group": { _id: null, "total": {"$sum": "$items.fee"} }},
    {"$project" : {_id:0, total:1}}
  ]);
  return result[0].total;
};

InvoiceSchema.statics.withId = function (id) {
  return this.findOne({_id: id});
};

InvoiceSchema.statics.withClientId = function (id) {
  return this.aggregate([
    {"$match" : { 'client._id' : mongoose.Types.ObjectId(id) }},
    {"$project" : { _id:1 , invNo:1}}
  ]);
};

InvoiceSchema.statics.countUniqueClients = function () {
  return this.aggregate([
    { "$group"   :  { _id: "$client._id" }},
    { "$group"   :  { _id: 1, count: {$sum :1}}},
    { "$project" : {count:1 }}
  ]);
};

InvoiceSchema.statics.newestInvoiceNumber = function () {
  return this.aggregate([
    {"$project" : {_id:0, invNo :1}},
    {"$sort"    : {invNo : -1 }},
    {"$limit"   : 1}
  ]);
};

InvoiceSchema.statics.listInvoices = function () {
  return this.aggregate([
    {$project : { invNo:1, invDate:1, "client.name":1, "client._id":1, items:1}},
    {"$unwind" : "$items"},
    {"$sort": {"items.date" : -1}},
    {"$group": {
     "_id" : {invoice: "$invNo", date: "$invDate", invoice_id: "$_id", client: "$client.name", clientLink: "$client._id"},
     "total": {"$sum": "$items.fee"}
      }
    },
    {"$sort": {"_id.invoice": -1}}
  ]);
};

InvoiceSchema.statics.listUnpaidInvoices = function () {
  return this.aggregate([
    {"$match" : { paid : false}},
    {"$project" : { invNo:1, invDate:1, "client.name":1, "client._id":1, items:1}},
    {"$unwind" : "$items"},
    {"$sort": {"items.date" : -1}},
    {"$group": {
     "_id" : {invoice: "$invNo", date: "$invDate", invoice_id: "$_id", client: "$client.name", clientLink: "$client._id"},
     "total": {"$sum": "$items.fee"}
    }}
  ]);
};

InvoiceSchema.statics.sumOfOwedInvoices = async function () {
  const result = await this.aggregate([
    {"$project" : { paid:1 , items:1 }},
    {"$match" : { paid : false }},
    {"$unwind" : "$items"},
    {"$project" : { _id:1, "items.fee":1}},
    {"$group": {_id: 1, total: {$sum: "$items.fee"}}},
    {"$project" : { _id:0, "total":1}}
  ]);
  return result[0].total;
};

InvoiceSchema.statics.sumOfPaidInvoices = async function () {
    const result = await this.aggregate([
      {"$project" : { paid:1 , items:1 }},
      {"$match" : { paid : true }},
      {"$unwind" : "$items"},
      {"$project" : { _id:1, "items.fee":1}},
      {"$group": {_id: 1, total: {$sum: "$items.fee"}}},
      {"$project" : { _id:0, "total":1}}
    ]);
    return result[0].total;
};

InvoiceSchema.statics.listItemsByClient = function (id) {
  return this.aggregate([
    {"$match" : { 'client._id' : mongoose.Types.ObjectId(id) }},
    {"$project" : { _id:1 , invNo:1 , items:1 }},
    {"$unwind" : "$items"},
    {"$project" : { invNo:1, "items.date":1, "items.desc":1,"items.fee":1}},
    {"$sort": {"items.date": -1}}
  ]);
};

let Invoice = mongoose.model('Invoice', InvoiceSchema);

module.exports = {Invoice};
