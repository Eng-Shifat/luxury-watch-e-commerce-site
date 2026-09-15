/* ============================================================
   ORDERS DATA STORE
   ------------------------------------------------------------
   Single place that reads/writes order data. Right now it's
   backed by localStorage so the site works end-to-end without
   a backend. When the Supabase database is ready, only the
   function BODIES below need to change (e.g. getAll() becomes
   a `supabase.from('orders').select()` call) — checkout.js and
   admin.js never touch localStorage directly, so nothing else
   in the app has to change.
   ============================================================ */
const OrdersStore = (function () {
  var KEY = 'rolex-orders';

  /** Return all orders, newest first. */
  function getAll() {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  }

  /** Save a brand-new order. Returns the saved order. */
  function save(order) {
    var orders = getAll();
    orders.unshift(order);
    localStorage.setItem(KEY, JSON.stringify(orders));
    return order;
  }

  /** Update an order's status (Pending / Confirmed / Shipped / Delivered / Cancelled). */
  function updateStatus(orderId, status) {
    var orders = getAll();
    var order = orders.find(function (o) { return o.id === orderId; });
    if (order) {
      order.status = status;
      localStorage.setItem(KEY, JSON.stringify(orders));
    }
    return order;
  }

  /** Fetch a single order by id. */
  function getById(orderId) {
    return getAll().find(function (o) { return o.id === orderId; }) || null;
  }

  return { getAll: getAll, save: save, updateStatus: updateStatus, getById: getById };
})();
