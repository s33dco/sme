// add fields for nested invoice docs

let add_item_fields = () => {
   let itemfields = document.getElementById("invoiceItems");
   let position = itemfields.childElementCount
   console.log(position);
   let html = `<fieldset><div class='form-field'><input class='input' id='items[${position}][date]' name='items[${position}][date]' type='date' placeholder='date' value='' /></div><div class='form-field'><textarea class='input' id='items[${position}][desc]' name='items[${position}][desc]' placeholder='details' rows='6'></textarea></div><div class='form-field'><textarea class='input' id='items[${position}][amount]' name='items[${position}][amount]' type='text' placeholder='£amount'></textarea></div></fieldset>`
   itemfields.insertAdjacentHTML('beforeend', html);
};
