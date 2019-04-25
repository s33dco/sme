const mongoose = require("mongoose")

let expenseSchema = new mongoose.Schema({
	date: { type: Date, default: Date.now },
	category: { type: String },
	desc: { type: String },
	amount: { type: mongoose.Schema.Types.Decimal, required: true }
})

const categories = [
	"Office, property and equipment",
	"Car, van and travel expenses",
	"Clothing expenses",
	"Staff expenses",
	"Reselling goods",
	"Legal and financial costs",
	"Mktg, entertainment and subs"
]

expenseSchema.statics.listExpenses = function() {
	return this.aggregate([
		{ $project: { _id: 1, date: 1, desc: 1, amount: 1, category: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.withId = function(id) {
	return this.findOne({ _id: id })
}

expenseSchema.statics.sumOfExpenses = async function() {
	const result = await this.aggregate([
		{ $project: { amount: 1 } },
		{ $group: { _id: 1, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.sumOfDeductionsBetween = async function(start, end) {
	const result = await this.aggregate([
		{ $match: { date: { $gte: new Date(start), $lte: new Date(end) } } },
		{ $project: { amount: 1 } },
		{ $group: { _id: 1, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.listOfExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{ $match: { date: { $gte: new Date(start), $lte: new Date(end) } } },
		{ $project: { _id: 0, date: 1, category: 1, desc: 1, amount: 1 } }
	])
}

expenseSchema.statics.listOfficeExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Office, property and equipment"
			}
		},
		{ $project: { _id: 1, date: 1, category: 1, desc: 1, amount: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.sumOfficeExpensesBetween = async function(start, end) {
	const result = await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Office, property and equipment"
			}
		},
		{ $project: { amount: 1 } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.listCarExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Car, van and travel expenses"
			}
		},
		{ $project: { _id: 1, date: 1, category: 1, desc: 1, amount: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.sumCarExpensesBetween = async function(start, end) {
	const result = await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Car, van and travel expenses"
			}
		},
		{ $project: { amount: 1 } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.listStaffExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{
			$match: { date: { $gte: new Date(start), $lte: new Date(end) }, category: "Staff expenses" }
		},
		{ $project: { _id: 1, date: 1, category: 1, desc: 1, amount: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.sumStaffExpensesBetween = async function(start, end) {
	const result = await this.aggregate([
		{
			$match: { date: { $gte: new Date(start), $lte: new Date(end) }, category: "Staff expenses" }
		},
		{ $project: { amount: 1 } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.listResellingExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{
			$match: { date: { $gte: new Date(start), $lte: new Date(end) }, category: "Reselling goods" }
		},
		{ $project: { _id: 1, date: 1, category: 1, desc: 1, amount: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.sumResellingExpensesBetween = async function(start, end) {
	const result = await this.aggregate([
		{
			$match: { date: { $gte: new Date(start), $lte: new Date(end) }, category: "Reselling goods" }
		},
		{ $project: { amount: 1 } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.listLegalExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Legal and financial costs"
			}
		},
		{ $project: { _id: 1, date: 1, category: 1, desc: 1, amount: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.sumLegalExpensesBetween = async function(start, end) {
	const result = await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Legal and financial costs"
			}
		},
		{ $project: { amount: 1 } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.listMktgExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Mktg, entertainment and subs"
			}
		},
		{ $project: { _id: 1, date: 1, category: 1, desc: 1, amount: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.sumMktgExpensesBetween = async function(start, end) {
	const result = await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Mktg, entertainment and subs"
			}
		},
		{ $project: { amount: 1 } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

expenseSchema.statics.listClothingExpensesBetween = async function(start, end) {
	return await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Clothing expenses"
			}
		},
		{ $project: { _id: 1, date: 1, category: 1, desc: 1, amount: 1 } },
		{ $sort: { date: 1 } }
	])
}

expenseSchema.statics.sumClothingExpensesBetween = async function(start, end) {
	const result = await this.aggregate([
		{
			$match: {
				date: { $gte: new Date(start), $lte: new Date(end) },
				category: "Clothing expenses"
			}
		},
		{ $project: { amount: 1 } },
		{ $group: { _id: null, total: { $sum: "$amount" } } },
		{ $project: { _id: 0, total: 1 } }
	])
	if (result.length === 0) {
		return 0
	} else {
		return result[0].total
	}
}

let Expense = mongoose.model("Expense", expenseSchema)
module.exports = { Expense, categories }
