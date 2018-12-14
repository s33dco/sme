<form method="patch" action="/invoices/paid" novalidate>
  <input type="hidden" name="_csrf" value="<%= csrfToken %>">
	<input type="hidden" name="id" value="<%= invoice._id %>">
  <div class="form-actions">
    <button class="btn" type="submit">Mark as Paid</button>
  </div>
</form>
