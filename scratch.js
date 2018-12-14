invoices =  [						// [ { _id: {}}, { _id: {}}, { _id: {}} ]
	{ _id:
     { invoice: 1,
       date: "2018-08-29T23:00:00.000Z",
       invoice_id: "5c111c553cbb6c074d73c84c",
       client: 'Becky Chatter',
       clientLink: "5c111bce25bb04bf2cfa0f3c" },
    total: 520 },
  { _id:
     { invoice: 2,
       date: "2018-09-08T23:00:00.000Z",
       invoice_id: "5c111cce3cbb6c074d73c84f",
       client: 'Delbert Wilkins',
       clientLink: "5c111bce25bb04bf2cfa0f3a" },
    total: 1030 },
  { _id:
     { invoice: 5,
       date: "2018-09-28T23:00:00.000Z",
       invoice_id: 5c112bb53cbb6c074d73c852,
       client: 'Freddy Fox',
       clientLink: "5c111bce25bb04bf2cfa0f39" },
    total: 180 },
  { _id:
     { invoice: 17,
       date: 2018-11-15T00:00:00.000Z,
       invoice_id: 5c115ebe3cbb6c074d73c858,
       client: 'Tony Soprano',
       clientLink: 5c111bce25bb04bf2cfa0f3b },
    total: 350 },
  { _id:
     { invoice: 7,
       date: 2018-10-04T23:00:00.000Z,
       invoice_id: 5c115e1d3cbb6c074d73c855,
       client: 'Richard Rich',
       clientLink: 5c111bce25bb04bf2cfa0f38 },
    total: 310 },
  { _id:
     { invoice: 26,
       date: 2018-11-30T00:00:00.000Z,
       invoice_id: 5c118c1f5aac1e12fe2c62c7,
       client: 'Freddy Fox',
       clientLink: 5c111bce25bb04bf2cfa0f39 },
    total: 400 } ]
console.log(invoices);


invoices.forEach((inv) => {
	console.log(inv._id.client)
})
