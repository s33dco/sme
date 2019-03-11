const mongoose = require('mongoose');

let expenseSchema = new mongoose.Schema({
    date      : {type: Date, default: Date.now},
    category  : {type:String},
    desc      : {type:String},
    amount    : {type: mongoose.Schema.Types.Decimal, required: true}
  });

const categories =  [ "Office, property and equipment",
                      "Car, van and travel expenses",
                      "Staff expenses", "Reselling goods",
                      "Legal and financial costs",
                      "Mktg, entertainment and subs"];

expenseSchema.statics.listExpensesByDate = function () {
  return this.aggregate([
    {"$project" : { _id:1, date:1, desc:1, amount:1, category:1}},
    {"$sort": {date : 1}}
  ]);
};

expenseSchema.statics.withId = function (id) {
  return this.findOne({_id: id});
};

expenseSchema.statics.sumOfExpenses = async function () {
  const result = await this.aggregate([
    {"$project" : { amount:1 }},
    {"$group": {_id: 1, total: {$sum: "$amount"}}},
    {"$project" : { _id:0, "total":1}}
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

expenseSchema.statics.sumOfExpensesBetween = async function (start, end) {
  const result = await this.aggregate([
    {"$match" : {"date": {"$gte": new Date(start), "$lte": new Date(end)}}},
    {"$project" : { amount:1 }},
    {"$group": {_id: 1, total: {$sum: "$amount"}}},
    {"$project" : { _id:0, "total":1}}
  ]);
  if (result.length === 0) {
    return "0.00"
  } else {
    return result[0].total;
  }
};

expenseSchema.statics.listOfExpensesBetween = async function (start, end) {
  return await this.aggregate([
    {"$match" : {"date": {"$gte": new Date(start), "$lte": new Date(end)}}},
    {"$project" : { date:1, category:1, desc:1, amount:1 }},
  ]);
};

let Expense = mongoose.model('Expense', expenseSchema);
module.exports = {Expense, categories};
