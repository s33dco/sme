// add fields for nested invoice docs

let add_item_fields = () => {
   let itemfields = document.getElementById("invoiceItems");
   let position = itemfields.childElementCount;
   console.log(position);
   let html = `<fieldset id='item-${position}'><div class='form-field'><input class='input' id='items[${position}][date]' name='items[${position}][date]' type='date' placeholder='date' value='' /></div><div class='form-field'><select name='items[${position}][type]' id='items[${position}][type]'><option value='Invoice'>Invoice</option><option value='Expense'>Expense</option><option value='Cost'>Cost</option></select></div><div class='form-field'><textarea class='input' id='items[${position}][desc]' name='items[${position}][desc]' placeholder='details' rows='6'></textarea></div><div class='form-field'><textarea class='input' id='items[${position}][fee]' name='items[${position}][fee]' type='number' placeholder='£amount'></textarea></div><div class='form-actions'><button onclick='remove_fieldset(${position})' class='btn danger'  type='button'>remove</button></fieldset></div>`;
   itemfields.insertAdjacentHTML('beforeend', html);
};

let remove_fieldset = (index) => {
   let item = document.getElementById(`item-${index}`);
   item.parentNode.removeChild(item);
};
