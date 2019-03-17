const {Expense}     = require('../../../server/models/expense');
const {makeExpense,
makeExpenseCategory}= require('../../seed/expense');
const moment        = require('moment');
const mongoose      = require('mongoose');
const app           = require('../../../app');

let expense, start, end;

describe('Expense', () => {

  describe('saving an expense', () => {

    beforeEach( async () => {
      expense =  await makeExpense();
    })

    afterEach( async () => {
      await Expense.deleteMany();
    });

    it('should save record with valid data', () => {
        expect(expense).toHaveProperty('date', new Date(moment().startOf('day')));
        expect(expense).toHaveProperty('category', "Office, property and equipment");
        expect(expense).toHaveProperty('desc', 'lots of equipment');
        expect(expense.amount.toJSON()).toEqual({"$numberDecimal": "200"});
    });
  });

  describe('expense.statics', () => {
    beforeEach( async () => {
      end   = moment().toISOString();
      start = moment().subtract(13, 'days').toISOString();
      await makeExpenseCategory("Office, property and equipment");
      await makeExpenseCategory("Car, van and travel expenses");
      await makeExpenseCategory("Clothing expenses");
      await makeExpenseCategory("Staff expenses");
      await makeExpenseCategory("Reselling goods");
      await makeExpenseCategory("Legal and financial costs");
      await makeExpenseCategory("Mktg, entertainment and subs");
    });

    afterEach( async () => {
      await Expense.deleteMany();
    });

    it('should add up deductions between 2 dates', async () => {
      
    });


  });


});
