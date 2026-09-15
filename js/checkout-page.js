/* ============================================================
   CHECKOUT PAGE — checkout-page.js
   Standalone full-page checkout (checkout.html)
   ============================================================ */

const SELLER_WHATSAPP = '8801881870349';

/* ── Apply saved theme on load ── */
(function () {
  if (localStorage.getItem('rolex-theme') === 'dark') {
    document.documentElement.classList.add('dark-theme');
  }
})();

/* ============================================================
   STEP NAVIGATION
   ============================================================ */
let currentStep = 1;

function showStep(n) {
  currentStep = n;
  document.querySelectorAll('.co-step').forEach(function (el, i) {
    el.classList.toggle('is-active', i + 1 === n);
  });
  document.querySelectorAll('.co-indicator__dot').forEach(function (dot, i) {
    dot.classList.toggle('is-done', i + 1 < n);
    dot.classList.toggle('is-active', i + 1 === n);
  });
  var backBtn  = document.getElementById('co-back-btn');
  var nextBtn  = document.getElementById('co-next-btn');
  var orderBtn = document.getElementById('co-order-btn');
  if (backBtn)  { backBtn.style.display = n > 1 ? '' : 'none'; }
  if (nextBtn)  nextBtn.style.display  = n < 3 ? '' : 'none';
  if (orderBtn) orderBtn.style.display = n === 3 ? '' : 'none';
  if (n === 3) { renderOrderSummary(); renderCustomerRecap(); }
}

function nextStep() {
  if (currentStep === 1 && !validateShipping()) return;
  if (currentStep < 3) showStep(currentStep + 1);
}

function prevStep() {
  if (currentStep > 1) showStep(currentStep - 1);
}

/* ============================================================
   VALIDATION
   ============================================================ */
function validateShipping() {
  var fields = ['co-name', 'co-phone', 'co-address', 'co-delivery'];
  var ok = true;
  fields.forEach(function (id) {
    var el  = document.getElementById(id);
    var err = el ? el.nextElementSibling : null;
    if (!el || !el.value.trim()) {
      if (el) el.classList.add('is-error');
      if (err && err.classList.contains('co-error')) err.style.display = 'block';
      ok = false;
    } else {
      el.classList.remove('is-error');
      if (err && err.classList.contains('co-error')) err.style.display = 'none';
    }
  });
  var phoneEl = document.getElementById('co-phone');
  var phone   = phoneEl ? phoneEl.value.trim() : '';
  if (phone && !/^(?:\+88|88)?01[3-9]\d{8}$/.test(phone)) {
    if (phoneEl) phoneEl.classList.add('is-error');
    var perr = phoneEl ? phoneEl.nextElementSibling : null;
    if (perr && perr.classList.contains('co-error')) {
      perr.textContent = 'Valid phone number দাও (01XXXXXXXXX)';
      perr.style.display = 'block';
    }
    ok = false;
  }

  var shipGrid  = document.getElementById('co-shipping-grid');
  var shipError = document.getElementById('co-shipping-error');
  if (!getSelectedShipping()) {
    if (shipGrid)  shipGrid.classList.add('is-error');
    if (shipError) shipError.style.display = 'block';
    ok = false;
  } else {
    if (shipGrid)  shipGrid.classList.remove('is-error');
    if (shipError) shipError.style.display = 'none';
  }

  return ok;
}

/* ============================================================
   PAYMENT METHOD
   ============================================================ */
function selectPayment(method) {
  document.querySelectorAll('.co-payment__card').forEach(function (c) {
    c.classList.remove('is-selected');
  });
  var card = document.querySelector('.co-payment__card[data-method="' + method + '"]');
  if (card) card.classList.add('is-selected');
  var wrap  = document.getElementById('co-mobile-number-wrap');
  var label = document.getElementById('co-mobile-number-label');
  if (method === 'bkash' || method === 'nagad') {
    if (label) label.textContent = method === 'bkash' ? 'bKash Number' : 'Nagad Number';
    if (wrap) wrap.style.display = 'block';
  } else {
    if (wrap) wrap.style.display = 'none';
  }
}

function getSelectedPayment() {
  var sel = document.querySelector('.co-payment__card.is-selected');
  return sel ? sel.dataset.method : null;
}

/* ============================================================
   SHIPPING ZONE
   ============================================================ */
function selectShippingZone(zone, cost) {
  document.querySelectorAll('.co-shipping__card').forEach(function (c) {
    c.classList.remove('is-selected');
  });
  var card = document.querySelector('.co-shipping__card[data-zone="' + zone + '"]');
  if (card) card.classList.add('is-selected');

  localStorage.setItem('rolex-shipping-zone', JSON.stringify({ zone: zone, cost: cost }));

  var grid  = document.getElementById('co-shipping-grid');
  var error = document.getElementById('co-shipping-error');
  if (grid)  grid.classList.remove('is-error');
  if (error) error.style.display = 'none';

  renderSidebar();
  if (currentStep === 3) renderOrderSummary();
}

function getSelectedShipping() {
  var sel = document.querySelector('.co-shipping__card.is-selected');
  if (sel) return { zone: sel.dataset.zone, cost: Number(sel.dataset.cost) };
  var saved = JSON.parse(localStorage.getItem('rolex-shipping-zone') || 'null');
  return saved;
}

function shippingZoneLabel(zone) {
  return zone === 'dhaka' ? 'Inside Dhaka' : zone === 'outside' ? 'Outside Dhaka' : '—';
}

/* ============================================================
   SIDEBAR RENDER
   ============================================================ */
function sidebarChangeQty(id, delta) {
  var cart = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  var item = cart.find(function(i) { return i.id === id; });
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) {
    cart = cart.filter(function(i) { return i.id !== id; });
  }
  localStorage.setItem('rolex-cart', JSON.stringify(cart));
  renderSidebar();
  /* If on review step, re-render summary too */
  if (currentStep === 3) renderOrderSummary();
  /* If cart empty, go to empty state */
  if (!cart.length) {
    var flowEl = document.getElementById('co-flow');
    var sidebarEl = document.getElementById('co-sidebar');
    var emptyEl = document.getElementById('co-empty-state');
    if (flowEl) flowEl.style.display = 'none';
    if (sidebarEl) sidebarEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

function sidebarRemove(id) {
  var cart = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  cart = cart.filter(function(i) { return i.id !== id; });
  localStorage.setItem('rolex-cart', JSON.stringify(cart));
  renderSidebar();
  if (currentStep === 3) renderOrderSummary();
  if (!cart.length) {
    var flowEl = document.getElementById('co-flow');
    var sidebarEl = document.getElementById('co-sidebar');
    var emptyEl = document.getElementById('co-empty-state');
    if (flowEl) flowEl.style.display = 'none';
    if (sidebarEl) sidebarEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

function renderSidebar() {
  var cart  = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  var list  = document.getElementById('co-sidebar-list');
  if (!list) return;
  var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  var items    = cart.reduce(function (s, i) { return s + i.qty; }, 0);

  var cartIds = cart.map(function (i) { return i.id; });
  var existingRows = list.querySelectorAll('.co-sidebar-row');
  for (var r = 0; r < existingRows.length; r++) {
    if (cartIds.indexOf(existingRows[r].dataset.id) === -1) existingRows[r].remove();
  }

  cart.forEach(function (i) {
    var row = list.querySelector('.co-sidebar-row[data-id="' + i.id + '"]');
    if (row) {
      /* Already rendered — just update the changing numbers, no full re-render */
      var qtyEl   = row.querySelector('.co-sidebar-qty-num');
      var priceEl = row.querySelector('.co-sidebar-price');
      if (qtyEl)   qtyEl.textContent = i.qty;
      if (priceEl) priceEl.textContent = '$' + (i.price * i.qty).toLocaleString();
    } else {
      row = document.createElement('div');
      row.className = 'co-sidebar-row';
      row.dataset.id = i.id;
      row.innerHTML =
        '<div class="co-sidebar-info">' +
          '<img src="' + i.image + '" alt="' + i.name + '" class="co-sidebar-img">' +
          '<div>' +
            '<p class="co-sidebar-name">' + i.name + '</p>' +
            '<div class="co-sidebar-controls">' +
              '<button class="co-sidebar-qty-btn" onclick="sidebarChangeQty(\'' + i.id + '\',-1)">−</button>' +
              '<span class="co-sidebar-qty-num">' + i.qty + '</span>' +
              '<button class="co-sidebar-qty-btn" onclick="sidebarChangeQty(\'' + i.id + '\',1)">+</button>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:.3rem;">' +
          '<p class="co-sidebar-price">$' + (i.price * i.qty).toLocaleString() + '</p>' +
          '<button class="co-sidebar-remove" onclick="sidebarRemove(\'' + i.id + '\')" title="Remove">🗑</button>' +
        '</div>';
      list.appendChild(row);
    }
  });

  var shipping    = getSelectedShipping();
  var shippingCost = shipping ? shipping.cost : 0;
  var grandTotal   = subtotal + shippingCost;

  var sItemsEl = document.getElementById('co-sidebar-items');
  var sTotalEl = document.getElementById('co-sidebar-total');
  var sShipEl  = document.getElementById('co-sidebar-shipping-amount');
  if (sItemsEl) sItemsEl.textContent = items + ' item' + (items > 1 ? 's' : '');
  if (sTotalEl) sTotalEl.textContent = '$' + grandTotal.toLocaleString();
  if (sShipEl) {
    if (shipping) {
      sShipEl.textContent = '৳' + shipping.cost.toLocaleString();
      sShipEl.classList.remove('co-sidebar-free');
      sShipEl.classList.add('co-sidebar-shipping-cost');
    } else {
      sShipEl.textContent = 'Select delivery zone';
      sShipEl.classList.remove('co-sidebar-shipping-cost');
      sShipEl.classList.add('co-sidebar-free');
    }
  }
}

/* ============================================================
   ORDER SUMMARY (step 3)
   ============================================================ */
function renderOrderSummary() {
  var cart  = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  var list  = document.getElementById('co-summary-list');
  if (!list) return;
  var subtotal = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  var items    = cart.reduce(function (s, i) { return s + i.qty; }, 0);
  var shipping = getSelectedShipping();
  var shippingCost = shipping ? shipping.cost : 0;
  var total = subtotal + shippingCost;
  list.innerHTML = cart.map(function (i) {
    return '<div class="co-summary__row">' +
      '<div class="co-summary__info">' +
        '<img src="' + i.image + '" alt="' + i.name + '" class="co-summary__img">' +
        '<div>' +
          '<p class="co-summary__name">' + i.name + '</p>' +
          '<p class="co-summary__qty">Qty: ' + i.qty + '</p>' +
        '</div>' +
      '</div>' +
      '<p class="co-summary__price">$' + (i.price * i.qty).toLocaleString() + '</p>' +
    '</div>';
  }).join('');
  var itemsEl = document.getElementById('co-summary-items');
  var totalEl = document.getElementById('co-summary-total');
  if (itemsEl) itemsEl.textContent = items + ' item' + (items > 1 ? 's' : '');
  if (totalEl) totalEl.textContent = '$' + total.toLocaleString();
}

function renderCustomerRecap() {
  var name    = (document.getElementById('co-name')    || {}).value || '';
  var phone   = (document.getElementById('co-phone')   || {}).value || '';
  var addr    = (document.getElementById('co-address') || {}).value || '';
  var del     = (document.getElementById('co-delivery')|| {}).value || '';
  var payEl   = document.querySelector('.co-payment__card.is-selected');
  var payName = payEl ? payEl.querySelector('.co-payment__name').textContent : '—';
  var shipping = getSelectedShipping();
  var shipName = shipping ? shippingZoneLabel(shipping.zone) + ' (৳' + shipping.cost + ')' : '—';
  var recap   = document.getElementById('co-customer-recap');
  if (!recap) return;
  recap.innerHTML =
    '<div><span>Name</span><strong> '    + name    + '</strong></div>' +
    '<div><span>Phone</span><strong> '   + phone   + '</strong></div>' +
    '<div><span>Billing</span><strong> ' + addr    + '</strong></div>' +
    '<div><span>Delivery</span><strong> '+ del     + '</strong></div>' +
    '<div><span>Shipping</span><strong> '+ shipName+ '</strong></div>' +
    '<div><span>Payment</span><strong> ' + payName + '</strong></div>';
}

/* ============================================================
   PLACE ORDER
   → 1. Generate & download PDF invoice (client copy)
   → 2. Auto-open WhatsApp to ADMIN with full order details
   → 3. Show success state
   ============================================================ */
async function placeOrder() {
  var payment = getSelectedPayment();
  if (!payment) { alert('Payment method select koro!'); return; }

  var shipping = getSelectedShipping();
  if (!shipping) { alert('Delivery zone select koro!'); return; }

  var cart      = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  var name      = document.getElementById('co-name').value.trim();
  var phone     = document.getElementById('co-phone').value.trim();
  var addr      = document.getElementById('co-address').value.trim();
  var del       = document.getElementById('co-delivery').value.trim();
  var mobNumEl  = document.getElementById('co-mobile-number');
  var mobNum    = mobNumEl ? mobNumEl.value.trim() : '';
  var subtotal  = cart.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  var shippingCost = shipping.cost;
  var total     = subtotal + shippingCost;
  var items     = cart.reduce(function (s, i) { return s + i.qty; }, 0);
  var orderId   = 'ORD-' + Date.now().toString().slice(-6);
  var orderDate = new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });
  var paymentLabels = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', card: 'Card / Online' };
  var shipLabel = shippingZoneLabel(shipping.zone);

  /* Save order to the data store (localStorage now — swaps to Supabase later) */
  if (window.OrdersStore) {
    OrdersStore.save({
      id: orderId,
      date: orderDate,
      timestamp: Date.now(),
      status: 'Pending',
      customer: { name: name, phone: phone, billingAddress: addr, deliveryAddress: del },
      items: cart.map(function (i) { return { id: i.id, name: i.name, price: i.price, qty: i.qty }; }),
      shipping: { zone: shipping.zone, label: shipLabel, cost: shippingCost },
      payment: { method: payment, label: paymentLabels[payment], mobileNumber: mobNum || null },
      subtotal: subtotal,
      total: total,
      itemCount: items
    });
  }

  /* 1. Download PDF invoice for client */
  await generateInvoicePDF({ orderId, orderDate, name, phone, addr, del, cart, subtotal, shippingCost, shipLabel, total, items, payment, mobNum, paymentLabels });

  /* 2. Build WhatsApp message → ADMIN receives it */
  var itemLines = cart.map(function (i) {
    return '  \u2022 ' + i.name + ' x' + i.qty + ' = $' + (i.price * i.qty).toLocaleString();
  }).join('\n');
  var payInfo = (payment === 'bkash' || payment === 'nagad') && mobNum
    ? paymentLabels[payment] + ' (' + mobNum + ')'
    : paymentLabels[payment];

  var msg =
    '\uD83D\uDED2 *NEW ORDER \u2014 ' + orderId + '*\n\n' +
    '\uD83D\uDCC5 Date: ' + orderDate + '\n\n' +
    '\uD83D\uDC64 *Customer*\n  Name: ' + name + '\n  Phone: ' + phone + '\n\n' +
    '\uD83D\uDCCD *Address*\n  Billing: ' + addr + '\n  Delivery: ' + del + '\n\n' +
    '\uD83D\uDCE6 *Items*\n' + itemLines + '\n\n' +
    '\uD83D\uDE9A Shipping: ' + shipLabel + ' (\u09F3' + shippingCost.toLocaleString() + ')\n' +
    '\uD83D\uDCB3 Payment: ' + payInfo + '\n' +
    '\uD83E\uDDFE Total: *$' + total.toLocaleString() + '* (' + items + ' item' + (items > 1 ? 's' : '') + ' + shipping)\n\n' +
    '_Invoice PDF downloaded on client device_';

  window.open('https://wa.me/' + SELLER_WHATSAPP + '?text=' + encodeURIComponent(msg), '_blank');

  /* 3. Clear cart & shipping selection */
  localStorage.removeItem('rolex-cart');
  localStorage.removeItem('rolex-shipping-zone');

  /* 4. Show success state */
  var flowEl    = document.getElementById('co-flow');
  var sidebarEl = document.getElementById('co-sidebar');
  var successEl = document.getElementById('co-success-state');
  var oidEl     = document.getElementById('co-success-oid');
  if (flowEl)    flowEl.style.display    = 'none';
  if (sidebarEl) sidebarEl.style.display = 'none';
  if (oidEl)     oidEl.textContent       = orderId;
  if (successEl) successEl.style.display = 'flex';

  /* 5. Toast banner */
  var banner = document.getElementById('co-success-banner');
  var bidEl  = document.getElementById('co-success-order-id');
  if (bidEl)  bidEl.textContent = orderId;
  if (banner) {
    banner.classList.add('is-visible');
    setTimeout(function () { banner.classList.remove('is-visible'); }, 5000);
  }
}

/* ============================================================
   PDF INVOICE
   ============================================================ */
async function generateInvoicePDF({ orderId, orderDate, name, phone, addr, del, cart, subtotal, shippingCost, shipLabel, total, items, payment, mobNum, paymentLabels }) {
  if (!window.jspdf) { console.warn('jsPDF not loaded'); return; }
  var jsPDF  = window.jspdf.jsPDF;
  var doc    = new jsPDF({ unit: 'mm', format: 'a4' });

  var orange = [229, 132, 48],  darkBg = [20,  20,  20],  dark   = [30,  30,  30];
  var mid    = [80,  80,  80],  grey   = [130, 130, 130],  light  = [248, 248, 248];
  var white  = [255, 255, 255], border = [220, 220, 220];
  var PW = 210, PH = 297, ML = 14, MR = 196;

  doc.setFillColor(...darkBg); doc.rect(0, 0, 110, 38, 'F');
  doc.setFillColor(...orange); doc.rect(110, 0, 100, 38, 'F');
  doc.setDrawColor(...white); doc.setLineWidth(1.2); doc.circle(24, 19, 10, 'S');
  doc.setLineWidth(0.6); doc.circle(24, 19, 7.5, 'S');
  doc.line(24, 19, 24, 13.5); doc.line(24, 19, 28, 19);
  doc.setLineWidth(1);
  doc.line(22, 9.5, 26, 9.5); doc.line(22, 9.5, 22, 8); doc.line(26, 9.5, 26, 8); doc.line(22, 8, 26, 8);
  doc.line(22, 28.5, 26, 28.5); doc.line(22, 28.5, 22, 30); doc.line(26, 28.5, 26, 30); doc.line(22, 30, 26, 30);
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.text('ROLEX', 38, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(200, 200, 200); doc.text('WATCH', 38, 23);
  doc.setFontSize(7.5); doc.text('Premium Timepieces', 38, 30);
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(22); doc.text('INVOICE', MR, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(255, 230, 190); doc.text(orderId, MR, 26, { align: 'right' });
  doc.setFontSize(7.5); doc.setTextColor(255, 210, 160); doc.text(orderDate, MR, 33, { align: 'right' });

  doc.setFillColor(...light); doc.rect(0, 38, PW, 22, 'F');
  doc.setDrawColor(...border); doc.setLineWidth(0.3); doc.line(0, 60, PW, 60);
  var infoY1 = 46, infoY2 = 54, cols = [ML + 2, 80, 148];
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...grey);
  doc.text('ORDER ID', cols[0], infoY1); doc.text('PAYMENT METHOD', cols[1], infoY1); doc.text('ORDER STATUS', cols[2], infoY1);
  var payLabel = paymentLabels[payment] + (mobNum ? ' (' + mobNum + ')' : '');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
  doc.text(orderId, cols[0], infoY2); doc.text(payLabel, cols[1], infoY2);
  doc.setFillColor(...orange); doc.roundedRect(cols[2] - 1, infoY2 - 5.5, 32, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
  doc.text('CONFIRMED', cols[2] + 15, infoY2 - 0.5, { align: 'center' });
  doc.setDrawColor(...border); doc.setLineWidth(0.4);
  doc.line(75, 40, 75, 59); doc.line(143, 40, 143, 59);

  var secY = 68;
  function sectionHeader(label, x, y) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...orange); doc.text(label, x, y);
    doc.setDrawColor(...orange); doc.setLineWidth(0.5); doc.line(x, y + 1.5, x + 82, y + 1.5);
  }
  sectionHeader('CUSTOMER DETAILS', ML, secY);
  sectionHeader('DELIVERY ADDRESS', 112, secY);
  var rowGap = 7.5, cy = secY + 10;
  [['Name', name], ['Phone', phone], ['Address', addr]].forEach(function ([lbl, val]) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...grey); doc.text(lbl, ML, cy);
    doc.setTextColor(...dark); doc.setFont('helvetica', 'bold');
    var lines = doc.splitTextToSize(val, 82); doc.text(lines, ML + 20, cy);
    cy += rowGap * (lines.length > 1 ? lines.length * 0.9 : 1);
  });
  var dy = secY + 10;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...grey); doc.text('To', 112, dy);
  doc.setTextColor(...dark); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  var delLines = doc.splitTextToSize(del, 82); doc.text(delLines, 122, dy);

  var tableY = Math.max(cy, dy + 20) + 8;
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...orange);
  doc.text('ORDER ITEMS', ML, tableY);
  doc.setDrawColor(...orange); doc.setLineWidth(0.5); doc.line(ML, tableY + 1.5, MR, tableY + 1.5);
  var tHY = tableY + 6;
  doc.setFillColor(...darkBg); doc.rect(ML, tHY, MR - ML, 8, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('#', ML + 3, tHY + 5.2); doc.text('PRODUCT', ML + 12, tHY + 5.2);
  doc.text('UNIT PRICE', 130, tHY + 5.2, { align: 'right' });
  doc.text('QTY', 155, tHY + 5.2, { align: 'right' });
  doc.text('SUBTOTAL', MR, tHY + 5.2, { align: 'right' });
  var ry = tHY + 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  cart.forEach(function (item, idx) {
    var even = idx % 2 === 0;
    doc.setFillColor(...(even ? white : light)); doc.rect(ML, ry, MR - ML, 9, 'F');
    if (!even) { doc.setFillColor(...orange); doc.rect(ML, ry, 2, 9, 'F'); }
    doc.setTextColor(...grey); doc.text('' + (idx + 1), ML + 3, ry + 6);
    doc.setTextColor(...dark); doc.setFont('helvetica', even ? 'normal' : 'bold'); doc.text(item.name, ML + 12, ry + 6);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...mid);
    doc.text('$' + item.price.toLocaleString(), 130, ry + 6, { align: 'right' });
    doc.text('' + item.qty, 155, ry + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
    doc.text('$' + (item.price * item.qty).toLocaleString(), MR, ry + 6, { align: 'right' });
    doc.setDrawColor(...border); doc.setLineWidth(0.2); doc.line(ML, ry + 9, MR, ry + 9);
    ry += 9;
  });
  ry += 4;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...grey);
  doc.text('Subtotal', 150, ry, { align: 'right' }); doc.setTextColor(...dark);
  doc.text('$' + subtotal.toLocaleString(), MR, ry, { align: 'right' });
  ry += 6;
  doc.setTextColor(...grey);
  doc.text('Shipping (' + shipLabel + ')', 150, ry, { align: 'right' }); doc.setTextColor(...dark);
  doc.text('Tk ' + shippingCost.toLocaleString(), MR, ry, { align: 'right' });
  ry += 3; doc.setDrawColor(...orange); doc.setLineWidth(0.6); doc.line(130, ry, MR, ry);
  ry += 8;
  doc.setFillColor(...orange); doc.roundedRect(128, ry - 7, 68, 12, 2, 2, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('TOTAL', 132, ry); doc.text('$' + total.toLocaleString(), MR - 1, ry, { align: 'right' });
  ry += 5; doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...grey);
  doc.text(items + ' item' + (items > 1 ? 's' : ''), MR, ry, { align: 'right' });

  doc.setFillColor(...orange); doc.rect(0, PH - 18, PW, 18, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Thank you for choosing ROLEX WATCH!', PW / 2, PH - 11, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(255, 230, 190);
  doc.text('rolexwatch.com  \u2022  support@rolexwatch.com  \u2022  WhatsApp: +88 01XXXXXXXXX', PW / 2, PH - 5, { align: 'center' });
  doc.setTextColor(229, 132, 48); doc.setFont('helvetica', 'bold'); doc.setFontSize(72);
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.text('RW', PW / 2, PH / 2 + 10, { align: 'center' });
  doc.setGState(new doc.GState({ opacity: 1 }));

  doc.save('Invoice_' + orderId + '.pdf');
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', function () {
  var cart = JSON.parse(localStorage.getItem('rolex-cart') || '[]');

  if (!cart.length) {
    var emptyEl   = document.getElementById('co-empty-state');
    var flowEl    = document.getElementById('co-flow');
    var sidebarEl = document.getElementById('co-sidebar');
    if (emptyEl)   emptyEl.style.display   = 'block';
    if (flowEl)    flowEl.style.display    = 'none';
    if (sidebarEl) sidebarEl.style.display = 'none';
    return;
  }

  renderSidebar();
  showStep(1);
  selectPayment('cod');

  var savedShipping = JSON.parse(localStorage.getItem('rolex-shipping-zone') || 'null');
  if (savedShipping) {
    var savedCard = document.querySelector('.co-shipping__card[data-zone="' + savedShipping.zone + '"]');
    if (savedCard) savedCard.classList.add('is-selected');
  }

  document.querySelectorAll('.co-field').forEach(function (el) {
    el.addEventListener('input', function () {
      el.classList.remove('is-error');
      var err = el.nextElementSibling;
      if (err && err.classList.contains('co-error')) err.style.display = 'none';
    });
  });
});
