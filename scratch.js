let itemList = [ {
					    invNo: 1,
					    items:
					     {
					       desc:
					        'rehang two doors in the front room, sand and varnish kitchen window.',
					       fee: 240 }
							 },
					  {
					    invNo: 1,
					    items:
					     {
					       desc:
					        'hang four kitchen cabinets, sand and varnish kitchen work top.',
					       fee: 280 }
						}]

total = itemList.map(item => item.items.fee).reduce((total, fee) => total + fee)

console.log(total);
