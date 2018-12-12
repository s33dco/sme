inv = [
	{
		"_id" : ObjectId("5c10503b68ced74f621aaf90"),
		"date" : ISODate("2018-12-12T00:00:00Z"),
		"desc" : "trimming trees in Rodmel",
		"fee" : "120"
	},
	{
		"_id" : ObjectId("5c10503b68ced74f621aaf8f"),
		"date" : ISODate("2018-12-13T00:00:00Z"),
		"desc" : "chipping Lewes",
		"fee" : "140"
	}
];

total = inv.items.map( item => item.fee).reduce((total, fee) => total + fee)

console.log(total);
