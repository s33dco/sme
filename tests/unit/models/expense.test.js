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
      result = await Expense.sumOfDeductionsBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "1400"});
    });

    it('returns 0 if no deductions between 2 dates', async () => {
      result = await Expense.sumOfDeductionsBetween('2014-01-01','2015-01-01');
      expect(result).toBe(0);
    });

    it('should add up all deductions', async () => {
      result = await Expense.sumOfExpenses();
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "1400"});
    });

    it('should add up office expenses between 2 dates', async () => {
      result = await Expense.sumOfficeExpensesBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "200"});
    });

    it('should list office expenses between 2 dates', async () => {
      result = await Expense.listOfficeExpensesBetween(start,end);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('desc', "lots of equipment");
      expect(result[0]).toHaveProperty("category", "Office, property and equipment");
    });

    it('should add up car expenses between 2 dates', async () => {
      result = await Expense.sumCarExpensesBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "200"});
    });

    it('should list car expenses between 2 dates', async () => {
      result = await Expense.listCarExpensesBetween(start,end);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('desc', "lots of equipment");
      expect(result[0]).toHaveProperty("category", "Car, van and travel expenses");
    });

    it('should add up staff expenses between 2 dates', async () => {
      result = await Expense.sumStaffExpensesBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "200"});
    });

    it('should list staff expenses between 2 dates', async () => {
      result = await Expense.listStaffExpensesBetween(start,end);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('desc', "lots of equipment");
      expect(result[0]).toHaveProperty("category", "Staff expenses");
    });

    it('should add up reselling expenses between 2 dates', async () => {
      result = await Expense.sumResellingExpensesBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "200"});
    });

    it('should list reselling expenses between 2 dates', async () => {
      result = await Expense.listResellingExpensesBetween(start,end);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('desc', "lots of equipment");
      expect(result[0]).toHaveProperty("category", "Reselling goods");
    });

    it('should add up legal expenses between 2 dates', async () => {
      result = await Expense.sumLegalExpensesBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "200"});
    });

    it('should list legal expenses between 2 dates', async () => {
      result = await Expense.listLegalExpensesBetween(start,end);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('desc', "lots of equipment");
      expect(result[0]).toHaveProperty("category", "Legal and financial costs");
    });

    it('should add up Mktg expenses between 2 dates', async () => {
      result = await Expense.sumMktgExpensesBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "200"});
    });

    it('should list Mktg expenses between 2 dates', async () => {
      result = await Expense.listMktgExpensesBetween(start,end);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('desc', "lots of equipment");
      expect(result[0]).toHaveProperty("category", "Mktg, entertainment and subs");
    });

    it('should add up clothing expenses between 2 dates', async () => {
      result = await Expense.sumClothingExpensesBetween(start,end);
      expect(result.toJSON()).toMatchObject({"$numberDecimal": "200"});
    });

    it('should list clothing expenses between 2 dates', async () => {
      result = await Expense.listClothingExpensesBetween(start,end);
      expect(result.length).toBe(1);
      expect(result[0]).toHaveProperty('desc', "lots of equipment");
      expect(result[0]).toHaveProperty("category", "Clothing expenses");
    });

  });
});
