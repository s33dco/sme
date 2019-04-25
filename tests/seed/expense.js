const { Expense } = require("../../server/models/expense")
const mongoose = require("mongoose")
const moment = require("moment")

const makeExpense = async () => {
	return await new Expense({
		date: moment()
			.utc()
			.format("YYYY-MM-DD"),
		category: "Office, property and equipment",
		desc: "lots of equipment",
		amount: 200.0
	}).save()
}

const makeExpenseCategory = async category => {
	return await new Expense({
		date: moment().format("YYYY-MM-DD"),
		category: category,
		desc: "lots of equipment",
		amount: 200.0
	}).save()
}

module.exports = { makeExpense, makeExpenseCategory }
