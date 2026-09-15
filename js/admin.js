/* ============================================================
   ADMIN DASHBOARD — admin.js
   Reads/writes orders through OrdersStore (see js/orders-store.js).
   This file never touches localStorage directly, so swapping
   OrdersStore's internals to Supabase later needs no change here.
   ============================================================ */

var STATUS_OPTIONS = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

function money(n) {
  return '$' + Number(n || 0).toLocaleString();
}

function renderStats(orders) {
  var pending   = orders.filter(function (o) { return o.status === 'Pending'; }).length;
  var delivered = orders.filter(function (o) { return o.status === 'Delivered'; }).length;
  var revenue   = orders.reduce(function (s, o) { return s + (o.total || 0); }, 0);

  document.getElementById('ad-stat-total').textContent     = orders.length;
  document.getElementById('ad-stat-pending').textContent   = pending;
  document.getElementById('ad-stat-delivered').textContent = delivered;
  document.getElementById('ad-stat-revenue').textContent   = money(revenue);
}

function statusSelectHTML(order) {
  var opts = STATUS_OPTIONS.map(function (s) {
    return '<option value="' + s + '"' + (s === order.status ? ' selected' : '') + '>' + s + '</option>';
  }).join('');
  return '<select class="ad-status-select" onchange="changeStatus(\'' + order.id + '\', this.value)">' + opts + '</select>';
}

function renderTable() {
  var orders = OrdersStore.getAll();
  var search = document.getElementById('ad-search').value.trim().toLowerCase();
  var status = document.getElementById('ad-status-filter').value;

  var filtered = orders.filter(function (o) {
    var matchesStatus = status === 'all' || o.status === status;
    var haystack = (o.id + ' ' + o.customer.name + ' ' + o.customer.phone).toLowerCase();
    var matchesSearch = !search || haystack.indexOf(search) !== -1;
    return matchesStatus && matchesSearch;
  });

  renderStats(orders);

  var emptyEl = document.getElementById('ad-empty');
  var tableWrap = document.getElementById('ad-table-wrap');

  if (!orders.length) {
    emptyEl.classList.add('is-visible');
    tableWrap.style.display = 'none';
    return;
  }
  emptyEl.classList.remove('is-visible');
  tableWrap.style.display = 'block';

  var body = document.getElementById('ad-table-body');
  if (!filtered.length) {
    body.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-color-light);padding:2rem;">কোনো order মেলেনি।</td></tr>';
    return;
  }

  body.innerHTML = filtered.map(function (o) {
    return '<tr>' +
      '<td><div class="ad-order-id">' + o.id + '</div><div class="ad-order-date">' + o.date + '</div></td>' +
      '<td><div class="ad-cust-name">' + o.customer.name + '</div><div class="ad-cust-phone">' + o.customer.phone + '</div></td>' +
      '<td>' + o.itemCount + '</td>' +
      '<td>' + o.shipping.label + '<br><span style="font-size:.75rem;color:var(--text-color-light);">৳' + o.shipping.cost + '</span></td>' +
      '<td>' + o.payment.label + '</td>' +
      '<td class="ad-total">' + money(o.total) + '</td>' +
      '<td>' + statusSelectHTML(o) + '</td>' +
      '<td><button class="ad-view-btn" onclick="openOrderModal(\'' + o.id + '\')">View</button></td>' +
    '</tr>';
  }).join('');
}

function changeStatus(orderId, status) {
  OrdersStore.updateStatus(orderId, status);
  renderTable();
}

function openOrderModal(orderId) {
  var o = OrdersStore.getById(orderId);
  if (!o) return;

  var itemsHTML = o.items.map(function (i) {
    return '<div class="ad-modal-item"><span>' + i.name + ' × ' + i.qty + '</span><span>' + money(i.price * i.qty) + '</span></div>';
  }).join('');

  document.getElementById('ad-modal-body').innerHTML =
    '<h3>' + o.id + '</h3>' +
    '<p class="ad-modal-sub">' + o.date + '</p>' +

    '<div class="ad-modal-section">' +
      '<h4>Customer</h4>' +
      '<div class="ad-modal-row"><span>Name</span><span>' + o.customer.name + '</span></div>' +
      '<div class="ad-modal-row"><span>Phone</span><span>' + o.customer.phone + '</span></div>' +
      '<div class="ad-modal-row"><span>Billing</span><span>' + o.customer.billingAddress + '</span></div>' +
      '<div class="ad-modal-row"><span>Delivery</span><span>' + o.customer.deliveryAddress + '</span></div>' +
    '</div>' +

    '<div class="ad-modal-section">' +
      '<h4>Items</h4>' +
      itemsHTML +
    '</div>' +

    '<div class="ad-modal-section">' +
      '<h4>Shipping & Payment</h4>' +
      '<div class="ad-modal-row"><span>Zone</span><span>' + o.shipping.label + '</span></div>' +
      '<div class="ad-modal-row"><span>Shipping Cost</span><span>৳' + o.shipping.cost + '</span></div>' +
      '<div class="ad-modal-row"><span>Payment Method</span><span>' + o.payment.label + (o.payment.mobileNumber ? ' (' + o.payment.mobileNumber + ')' : '') + '</span></div>' +
    '</div>' +

    '<div class="ad-modal-total"><span>Total</span><span>' + money(o.total) + '</span></div>';

  document.getElementById('ad-modal-overlay').classList.add('is-open');
}

function closeOrderModal(e) {
  if (e && e.target !== document.getElementById('ad-modal-overlay')) return;
  document.getElementById('ad-modal-overlay').classList.remove('is-open');
}

document.addEventListener('DOMContentLoaded', function () {
  renderTable();
  document.getElementById('ad-search').addEventListener('input', renderTable);
  document.getElementById('ad-status-filter').addEventListener('change', renderTable);
});
