// add fields for nested invoice docs

let add_item_fields = () => {
   let itemfields = document.getElementById("invoiceItems");
   let position = itemfields.childElementCount;
   let html = `<fieldset id='item-${position}'><div class='form-field'><input class='input' id='items[${position}][date]' name='items[${position}][date]' type='date' placeholder='date' value='' /></div><div class='form-field'><select name='items[${position}][type]' id='items[${position}][type]'><option value='Labour'>Labour</option><option value='Materials'>Materials</option><option value='Expense'>Expense</option></select></div><div class='form-field'><textarea class='input' id='items[${position}][desc]' name='items[${position}][desc]' placeholder='details' rows='6'></textarea></div><div class='form-field'><textarea class='input' id='items[${position}][fee]' name='items[${position}][fee]' type='number' placeholder='£amount'></textarea></div><div class='form-actions'><button onclick='remove_fieldset(${position})' class='btn danger'  type='button'>remove item</button></div></fieldset>`;
   itemfields.insertAdjacentHTML('beforeend', html);
};

let remove_fieldset = (index) => {
   let item = document.getElementById(`item-${index}`);
   item.parentNode.removeChild(item);
};


// show hide divs onclick for reports
// Show an element
var show = function (elem) {

	// Get the natural height of the element
	var getHeight = function () {
		elem.style.display = 'block'; // Make it visible
		var height = elem.scrollHeight + 'px'; // Get it's height
		elem.style.display = ''; //  Hide it again
		return height;
	};

	var height = getHeight(); // Get the natural height
	elem.classList.add('is-visible'); // Make the element visible
	elem.style.height = height; // Update the max-height

	// Once the transition is complete, remove the inline max-height so the content can scale responsively
	window.setTimeout(function () {
		elem.style.height = '';
	}, 350);

};

// Hide an element
var hide = function (elem) {

	// Give the element a height to change from
	elem.style.height = elem.scrollHeight + 'px';

	// Set the height back to 0
	window.setTimeout(function () {
		elem.style.height = '0';
	}, 1);

	// When the transition is complete, hide it
	window.setTimeout(function () {
		elem.classList.remove('is-visible');
	}, 350);

};

// Toggle element visibility
var toggle = function (elem, timing) {

	// If the element is visible, hide it
	if (elem.classList.contains('is-visible')) {
		hide(elem);
		return;
	}

	// Otherwise, show it
	show(elem);

};

// Listen for click events
document.addEventListener('click', function (event) {

	// Make sure clicked element is our toggle
	if (!event.target.classList.contains('toggle')) return;

	// Prevent default link behavior
	event.preventDefault();

	// Get the content
	var content = document.querySelector(event.target.hash);
	if (!content) return;

	// Toggle the content
	toggle(content);

}, false);
