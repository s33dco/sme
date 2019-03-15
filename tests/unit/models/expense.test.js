const {Expense}    = require('../../../server/models/expense');
const {makeExpense}= require('../../seed/expense');
const moment = require('moment');
const mongoose     = require('mongoose');
const app          = require('../../../app');

let expense;

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

});
