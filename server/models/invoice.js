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
                  required: true},
      address1: { type: String,
                  required: true},
      address2: { type: String,
                  required: true},
      address3: { type: String,
                  required: true},
      postcode: { type: String,
                  required: true},
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
                  required: true},
    farewell  : { type: String,
                required: true}
              },

  paid        : { type: Boolean },
  datePaid    : { type: Date },
  items       : [
                {  date: {type: Date, required: true},
                  type: {type: String,required: true},
                  desc: {type: String,required: true},
                  fee : {type: mongoose.Schema.Types.Decimal, required: true}}
                ]
});

// InvoiceSchema.methods.totalInvoiceValue = function  () {
//   inv = this;
//   return inv.items.map( item => item.fee).reduce((total, fee) => total + fee);
// };

InvoiceSchema.statics.sumOfInvoice = async function (id){
  const result = await this.aggregate([
    {"$match" : { '_id' : mongoose.Types.ObjectId(id) }},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
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

InvoiceSchema.statics.countUniqueClients = async function () {
  result = await this.aggregate([
    { "$group"   :  { _id: "$client._id" }},
    { "$group"   :  { _id: null, count: {$sum :1}}},
    { "$project" : {count:1 , _id: 0}}
  ]);
  return result[0].count;
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
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$group": {
     "_id" : {invoice: "$invNo", date: "$invDate", invoice_id: "$_id", client: "$client.name", clientLink: "$client._id"},
     "total": {"$sum": "$items.fee"}
      }
    },
    {"$sort": {"_id.invoice": -1}}
  ]);
};

InvoiceSchema.statics.firstItemDate = async function () {
  const result = await this.aggregate([
    {$project : { items:1 }},
    {"$unwind" : "$items"},
    {"$project" : { "items.date":1}},
    {$sort : { "items.date": 1}},
    {$limit : 1}
  ]);
  return result[0].items.date;
};

InvoiceSchema.statics.listUnpaidInvoices = function () {
  return this.aggregate([
    {"$match" : { paid : false}},
    {"$project" : { invNo:1, invDate:1, "client.name":1, "client._id":1, items:1}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
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
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$project" : { _id:1, "items.fee":1}},
    {"$group": {_id: 1, total: {$sum: "$items.fee"}}},
    {"$project" : { _id:0, "total":1}}
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

InvoiceSchema.statics.sumOfPaidInvoices = async function () {
  const result = await this.aggregate([
    {"$project" : { paid:1 , items:1 }},
    {"$match" : { paid : true }},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$project" : { _id:1, "items.fee":1}},
    {"$group": {_id: 1, total: {$sum: "$items.fee"}}},
    {"$project" : { _id:0, "total":1}}
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

InvoiceSchema.statics.averageWeeklyGrossEarnings = async function (days) {
    const result = await this.aggregate([
      {"$project" : { paid:1 , items:1 }},
      {"$match" : { paid : true }},
      {"$unwind" : "$items"},
      {"$match" : { 'items.type' : 'Invoice' }},
      {"$project" : { _id:1, "items.fee":1}},
      {"$group": {_id: 1, total: {$sum: "$items.fee"}}},
      {"$project" : { _id:null, "AvdayEarnings": { $divide: [ "$total", days ]}}},
      {"$project": { avPerWeek: { $divide: [
        {
        $trunc: {
            $multiply: [
              "$AvdayEarnings", 700
            ]
          }
        },
        100
      ] }}}
    ]);

    if (result.length === 0) {
      return 0
    } else {
      return result[0].avPerWeek;
    }

};
//
// InvoiceSchema.statics.averageWeeklyNettEarnings = async function (days) {
//     const result = await this.aggregate([
//       {"$project": {items :1}},
//       {"$unwind" : "$items"},
//       {"$match" : { 'items.type' : 'Invoice' }},
//       {"$project" : { _id:1, "items.fee":1}},
//       {"$group": {_id: 1, earnings: {$sum: "$items.fee"}}},
//       {"$match" : { "items.type" : { "$in": ['Cost', 'Expense' ] }}},
//       {"$group": {_id: 1, outgoings: {$sum: "$items.fee"}}},
//       {"$project" : { _id:1, total: {"$subtract": [ earnings, outgoings ]}}},
//       {"$project" : { _id:null, "AvdayEarnings": { $divide: [ "$total", days ]}}},
//       {"$project": { avPerWeek: { $divide: [
//         {
//         $trunc: {
//             $multiply: [
//               "$AvdayEarnings", 700
//             ]
//           }
//         },
//         100
//       ] }}}
//     ]);
//
//     if (result.length === 0) {
//       return 0
//     } else {
//       return result[0].avPerWeek;
//     }
//
// };

InvoiceSchema.statics.listChargedItemsByClient = function (id) {
  return this.aggregate([
    {"$match" : { 'client._id' : mongoose.Types.ObjectId(id) }},
    {"$project" : { _id:1 , invNo:1 , items:1, paid:1, datePaid:1 }},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$project" : { invNo:1, "items.date":1, "items.desc":1,"items.fee":1, "items.type":1,paid:1, datePaid:1}},
    {"$sort": {"items.date": -1}}
  ]);
};

InvoiceSchema.statics.totalBilledtoClient = async function (id) {
  const result = await this.aggregate([
    {"$match" : { 'client._id' : mongoose.Types.ObjectId(id) }},
    {"$project" : { items:1 }},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$project" : { _id:0, "items.fee":1}},
    {"$group": { _id: null, "total": {"$sum": "$items.fee"} }},
    {"$project" : {_id:0, total:1}}
  ]);
  return result[0].total;
};

InvoiceSchema.statics.countItems = async function (){
  const result = await this.aggregate([
    {"$project" : {items:1}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$count": "invoiceItems"}
  ]);
  return result[0].invoiceItems;
};

InvoiceSchema.statics.numberOfInvoices = async function (){
  const result = await this.aggregate([
    {"$project" : {invNo:1, _id:0}},
    {"$count": "invoices"}
  ]);
  return result[0].invoices;
};

// InvoiceSchema.statics.sumCosts = async function () {
//   const result = await this.aggregate([
//     {"$project" : { items:1}},
//     {"$unwind" : "$items"},
//     {"$match" : { 'items.type' : 'Cost' }},
//     {"$project": {"items.fee":1}},
//     { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
//   ]);
//
//   if (result.length === 0) {
//     return "0.00"
//   } else {
//     return result[0].total;
//   }
// };
//
// InvoiceSchema.statics.sumExpenses = async function () {
//   const result = await this.aggregate([
//     {"$project" : { items:1}},
//     {"$unwind" : "$items"},
//     {"$match" : { 'items.type' : 'Expense' }},
//     {"$project": {"items.fee":1}},
//     { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
//   ]);
//   if (result.length === 0) {
//     return "0.00"
//   } else {
//     return result[0].total;
//   }
// };

InvoiceSchema.statics.sumOutgoings = async function () {
  const result = await this.aggregate([
    {"$project" : { items:1}},
    {"$unwind" : "$items"},
    {"$match" : { "items.type" : { "$in": ['Cost', 'Expense' ] }}},
    {"$project": {"items.fee":1}},
    { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

InvoiceSchema.statics.numberOfInvoicesProducedBetween = async function (start, end ){
  const result = await this.aggregate([
    {"$match" : { invDate : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$project" : {invNo:1, _id:0}},
    {"$count": "invoices"}
  ]);

  if (result.length === 0) {
    return 'no'
  } else {
    return result[0].invoices;
  }
};

InvoiceSchema.statics.numberOfInvoicesPaidBetween = async function (start, end ){
  const result = await this.aggregate([
    {"$match" : { datePaid : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$project" : {invNo:1, _id:0}},
    {"$count": "invoices"}
  ]);
  if (result.length === 0) {
    return 'none'
  } else {
    return result[0].invoices;
  }

};

InvoiceSchema.statics.sumOfPaidInvoicesBetween = async function (start, end) {

  const result = await this.aggregate([
     {"$match" : {"datePaid": {"$gte": new Date(start), "$lte": new Date(end)}}},
     {"$project" : {items:1}}, {"$unwind" : "$items"},
     {"$match" : { 'items.type' : 'Invoice' }},
     {"$project": {"items.fee":1}},
     { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
   ])

  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

InvoiceSchema.statics.sumOfOwedInvoicesBetween = async function (start, end) {
    const result = await this.aggregate([
       {"$match" : {paid : false}},
       {"$project" : {items:1}},
       {"$unwind" : "$items"},
       {"$match" : { 'items.type' : 'Invoice' }},
       {"$match" : {'items.date': {"$gte": new Date(start), "$lte": new Date(end)}}},
       {"$project": {"items.fee":1}},
       { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
     ])

    if (result.length === 0) {
      return "none"
    } else {
      return result[0].total;
    }
};

InvoiceSchema.statics.countItemsInvoicedBetween = async function (start, end){
  const result = await this.aggregate([
    {"$project" : {items:1}},
    {"$unwind" : "$items"},
    {"$match" : { "items.date" : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$count": "invoiceItems"}
  ]);
  if (result.length === 0) {
    return "no"
  } else {
    return result[0].invoiceItems;
  }
};

InvoiceSchema.statics.countItemsPaidBetween = async function (start, end){
  const result = await this.aggregate([
    {"$project" : {datePaid:1, items:1}},
    {"$match" : { datePaid : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$count": "invoiceItems"}
  ]);
  if (result.length === 0) {
    return "none"
  } else {
    return result[0].invoiceItems;
  }
};

InvoiceSchema.statics.listPaidItemsBetween = function (start, end) {
  return this.aggregate([
    {"$match" : { datePaid : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$project" : { _id:1 , invNo:1 , items:1, paid:1, datePaid:1, invDate:1, "client.name" :1 }},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$project" : { invNo:1, "items.date":1, "items.desc":1,"items.fee":1, paid:1, datePaid:1, invDate:1, "client.name" :1}},
    {"$sort": {datePaid: 1}}
  ]);
};

InvoiceSchema.statics.listUnpaidItemsBetween = function (start, end) {
  return this.aggregate([
    {"$match" : { invDate : {"$gte": new Date(start), "$lte": new Date(end) }, paid: false}},
    {"$project" : { _id:1 , invNo:1 , items:1, paid:1, datePaid:1, invDate:1, "client.name" :1 }},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Invoice' }},
    {"$project" : { invNo:1, "items.date":1, "items.desc":1,"items.fee":1, paid:1, datePaid:1, invDate:1, "client.name" :1}},
    {"$sort": {invDate: 1}}
  ]);
};

InvoiceSchema.statics.listExpensesBetween = function (start, end) {
  return this.aggregate([
    {"$project" : { _id:1 , invNo:1 , items:1}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Expense' }},
    {"$match" : { 'items.date' : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$project" : { invNo:1, "items.date":1, "items.desc":1,"items.fee":1}},
    {"$sort": {"items.date": 1}}
  ]);
};

InvoiceSchema.statics.sumOfExpensesBetween = async function (start, end) {
  const result = await this.aggregate([
    {"$project" : { items:1}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.date' : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$match" : { 'items.type' : 'Expense' }},
    {"$project": {"items.fee":1}},
    { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

InvoiceSchema.statics.listCostsBetween = function (start, end) {
  return this.aggregate([
    {"$project" : { _id:1 , invNo:1 , items:1}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.type' : 'Cost' }},
    {"$match" : { 'items.date' : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$project" : { invNo:1, "items.date":1, "items.desc":1,"items.fee":1}},
    {"$sort": {"items.date": 1}}
  ]);
};

InvoiceSchema.statics.sumOfCostsBetween = async function (start, end) {
  const result = await this.aggregate([
    {"$project" : { items:1}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.date' : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$match" : { 'items.type' : 'Cost' }},
    {"$project": {"items.fee":1}},
    { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

InvoiceSchema.statics.sumOfOutgoingsBetween = async function (start, end) {
  const result = await this.aggregate([
    {"$project" : { items:1}},
    {"$unwind" : "$items"},
    {"$match" : { 'items.date' : {"$gte": new Date(start), "$lte": new Date(end) }}},
    {"$match" : { "items.type" : { "$in": ['Cost', 'Expense' ] }}},
    {"$project": {"items.fee":1}},
    { "$group": { "_id":1, "total" : { "$sum" : "$items.fee"  }  }  }
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};


let Invoice = mongoose.model('Invoice', InvoiceSchema);

module.exports = {Invoice};
