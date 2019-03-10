const mongoose = require('mongoose');

let expenseSchema = new mongoose.Schema({
    date      : {type: Date, default: Date.now},
    category  : {type:String},
    desc      : {type:String},
    amount    : {type: mongoose.Schema.Types.Decimal, required: true}
  });


expenseSchema.statics.listExpensesByDate = function () {
  return this.aggregate([
    {"$project" : { _id:1, date:1, desc:1, amount:1, category:1}},
    {"$sort": {date : 1}}
  ]);
};

const categories =  [ "Office, property and equipment",
                      "Car, van and travel expenses",
                      "Staff expenses", "Reselling goods",
                      "Legal and financial costs",
                      "Mktg, entertainment and subs"
                    ]



let Expense = mongoose.model('Expense', expenseSchema);
module.exports = {Expense, categories};
