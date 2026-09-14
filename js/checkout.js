/* ============================================================
   CHECKOUT — config
   ============================================================ */
const SELLER_WHATSAPP = '8801881870349';

/* ============================================================
   CART VIEW ↔ CHECKOUT VIEW toggle (inside drawer)
   ============================================================ */
function openCheckout() {
  const cart = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  if (!cart.length) { alert('Your cart is empty!'); return; }
  document.getElementById('cart-view').style.display = 'none';
  document.getElementById('checkout-view').style.display = 'flex';
  showStep(1);
  selectPayment('cod');
}

function backToCart() {
  document.getElementById('checkout-view').style.display = 'none';
  document.getElementById('cart-view').style.display = '';
}

function closeCheckout() {
  // closeCheckout = just close the whole drawer
  backToCart();
  document.getElementById('cart').classList.remove('is-open');
  document.getElementById('cart-overlay').classList.remove('is-open');
}

/* ============================================================
   STEP NAVIGATION
   ============================================================ */
let currentStep = 1;

function showStep(n) {
  currentStep = n;
  document.querySelectorAll('.co-step').forEach((el, i) => {
    el.classList.toggle('is-active', i + 1 === n);
  });
  document.querySelectorAll('.co-indicator__dot').forEach((dot, i) => {
    dot.classList.toggle('is-done', i + 1 < n);
    dot.classList.toggle('is-active', i + 1 === n);
  });
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
  const fields = ['co-name', 'co-phone', 'co-address', 'co-delivery'];
  let ok = true;
  fields.forEach(id => {
    const el = document.getElementById(id);
    const err = el.nextElementSibling;
    if (!el.value.trim()) {
      el.classList.add('is-error');
      if (err && err.classList.contains('co-error')) err.style.display = 'block';
      ok = false;
    } else {
      el.classList.remove('is-error');
      if (err && err.classList.contains('co-error')) err.style.display = 'none';
    }
  });

  // Phone validation (BD format)
  const phone = document.getElementById('co-phone').value.trim();
  if (phone && !/^(?:\+88|88)?01[3-9]\d{8}$/.test(phone)) {
    const el = document.getElementById('co-phone');
    el.classList.add('is-error');
    const err = el.nextElementSibling;
    if (err && err.classList.contains('co-error')) {
      err.textContent = 'Valid phone number দাও (01XXXXXXXXX)';
      err.style.display = 'block';
    }
    ok = false;
  }
  return ok;
}

/* ============================================================
   PAYMENT METHOD SELECT
   ============================================================ */
function selectPayment(method) {
  document.querySelectorAll('.co-payment__card').forEach(c => c.classList.remove('is-selected'));
  document.querySelector(`.co-payment__card[data-method="${method}"]`).classList.add('is-selected');

  // Show/hide number input for bKash / Nagad
  const numberWrap = document.getElementById('co-mobile-number-wrap');
  const label = document.getElementById('co-mobile-number-label');
  if (method === 'bkash' || method === 'nagad') {
    label.textContent = method === 'bkash' ? 'bKash Number' : 'Nagad Number';
    numberWrap.style.display = 'block';
  } else {
    numberWrap.style.display = 'none';
  }
}

function getSelectedPayment() {
  const sel = document.querySelector('.co-payment__card.is-selected');
  return sel ? sel.dataset.method : null;
}

/* ============================================================
   ORDER SUMMARY RENDER
   ============================================================ */
function renderOrderSummary() {
  const cart = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  const list = document.getElementById('co-summary-list');
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const items = cart.reduce((s, i) => s + i.qty, 0);

  list.innerHTML = cart.map(i => `
    <div class="co-summary__row">
      <div class="co-summary__info">
        <img src="${i.image}" alt="${i.name}" class="co-summary__img">
        <div>
          <p class="co-summary__name">${i.name}</p>
          <p class="co-summary__qty">Qty: ${i.qty}</p>
        </div>
      </div>
      <p class="co-summary__price">$${(i.price * i.qty).toLocaleString()}</p>
    </div>
  `).join('');

  document.getElementById('co-summary-items').textContent = `${items} item${items > 1 ? 's' : ''}`;
  document.getElementById('co-summary-total').textContent = `$${total.toLocaleString()}`;
}

/* ============================================================
   PLACE ORDER → generate invoice → WhatsApp
   ============================================================ */
async function placeOrder() {
  const payment = getSelectedPayment();
  if (!payment) { alert('Payment method select koro!'); return; }

  const cart   = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  const name   = document.getElementById('co-name').value.trim();
  const phone  = document.getElementById('co-phone').value.trim();
  const addr   = document.getElementById('co-address').value.trim();
  const del    = document.getElementById('co-delivery').value.trim();
  const mobNum = document.getElementById('co-mobile-number')?.value.trim() || '';
  const total  = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const items  = cart.reduce((s, i) => s + i.qty, 0);
  const orderId = 'ORD-' + Date.now().toString().slice(-6);
  const orderDate = new Date().toLocaleString('en-BD', { timeZone: 'Asia/Dhaka' });

  const paymentLabels = { cod: 'Cash on Delivery', bkash: 'bKash', nagad: 'Nagad', card: 'Card' };

  // ── 1. Generate PDF invoice ──────────────────────────────
  await generateInvoicePDF({ orderId, orderDate, name, phone, addr, del, cart, total, items, payment, mobNum, paymentLabels });

  // ── 2. Build WhatsApp message ────────────────────────────
  const itemLines = cart.map(i => `  • ${i.name} x${i.qty} = $${(i.price * i.qty).toLocaleString()}`).join('\n');
  const payInfo = (payment === 'bkash' || payment === 'nagad') && mobNum
    ? `${paymentLabels[payment]} (${mobNum})`
    : paymentLabels[payment];

  const msg = `🛒 *NEW ORDER — ${orderId}*\n\n` +
    `📅 Date: ${orderDate}\n\n` +
    `👤 *Customer*\n` +
    `  Name: ${name}\n` +
    `  Phone: ${phone}\n\n` +
    `📍 *Address*\n` +
    `  Billing: ${addr}\n` +
    `  Delivery: ${del}\n\n` +
    `📦 *Items*\n${itemLines}\n\n` +
    `💳 Payment: ${payInfo}\n` +
    `🧾 Total: *$${total.toLocaleString()}* (${items} item${items > 1 ? 's' : ''})\n\n` +
    `_Invoice PDF sent separately_`;

  const waUrl = `https://wa.me/${SELLER_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  window.open(waUrl, '_blank');

  // ── 3. Clear cart & close drawer ─────────────────────────
  localStorage.removeItem('rolex-cart');
  if (typeof updateCartCount === 'function') { window.cart = []; updateCartCount(); renderCart(); }
  backToCart();
  document.getElementById('cart').classList.remove('is-open');
  document.getElementById('cart-overlay').classList.remove('is-open');
  showSuccessBanner(orderId);
}

/* ============================================================
   PDF INVOICE  (jsPDF via CDN)
   ============================================================ */
async function generateInvoicePDF({ orderId, orderDate, name, phone, addr, del, cart, total, items, payment, mobNum, paymentLabels }) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  /* ── colour palette ── */
  const orange  = [229, 132, 48];
  const darkBg  = [20,  20,  20];
  const dark    = [30,  30,  30];
  const mid     = [80,  80,  80];
  const grey    = [130, 130, 130];
  const light   = [248, 248, 248];
  const white   = [255, 255, 255];
  const border  = [220, 220, 220];

  const PW = 210, PH = 297;
  const ML = 14, MR = 196; // left / right margin x

  /* ══════════════════════════════════════════════
     HEADER — two-tone bar
  ══════════════════════════════════════════════ */
  // Dark left panel
  doc.setFillColor(...darkBg);
  doc.rect(0, 0, 110, 38, 'F');
  // Orange right panel
  doc.setFillColor(...orange);
  doc.rect(110, 0, 100, 38, 'F');

  // Watch SVG logo drawn as jsPDF lines (favicon style)
  // Outer circle
  doc.setDrawColor(...white); doc.setLineWidth(1.2);
  doc.circle(24, 19, 10, 'S');
  // Inner clock face
  doc.setLineWidth(0.6);
  doc.circle(24, 19, 7.5, 'S');
  // Hour hand
  doc.line(24, 19, 24, 13.5);
  // Minute hand
  doc.line(24, 19, 28, 19);
  // Crown top
  doc.setLineWidth(1);
  doc.line(22, 9.5, 26, 9.5);
  doc.line(22, 9.5, 22, 8);
  doc.line(26, 9.5, 26, 8);
  doc.line(22, 8, 26, 8);
  // Crown bottom
  doc.line(22, 28.5, 26, 28.5);
  doc.line(22, 28.5, 22, 30);
  doc.line(26, 28.5, 26, 30);
  doc.line(22, 30, 26, 30);

  // Brand name
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(18);
  doc.text('ROLEX', 38, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(200, 200, 200);
  doc.text('WATCH', 38, 23);
  doc.setFontSize(7.5);
  doc.text('Premium Timepieces', 38, 30);

  // Right panel — INVOICE label
  doc.setTextColor(...white);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  doc.text('INVOICE', MR, 17, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.setTextColor(255, 230, 190);
  doc.text(orderId, MR, 26, { align: 'right' });
  doc.setFontSize(7.5);
  doc.setTextColor(255, 210, 160);
  doc.text(orderDate, MR, 33, { align: 'right' });

  /* ══════════════════════════════════════════════
     INFO STRIP — 3 columns below header
  ══════════════════════════════════════════════ */
  doc.setFillColor(...light);
  doc.rect(0, 38, PW, 22, 'F');
  doc.setDrawColor(...border); doc.setLineWidth(0.3);
  doc.line(0, 60, PW, 60);

  const infoY1 = 46, infoY2 = 54;
  const cols = [ML + 2, 80, 148];

  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(...grey);
  doc.text('ORDER ID', cols[0], infoY1);
  doc.text('PAYMENT METHOD', cols[1], infoY1);
  doc.text('ORDER STATUS', cols[2], infoY1);

  const payLabel = paymentLabels[payment] + (mobNum ? ` (${mobNum})` : '');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(...dark);
  doc.text(orderId, cols[0], infoY2);
  doc.text(payLabel, cols[1], infoY2);

  // Status badge
  doc.setFillColor(...orange);
  doc.roundedRect(cols[2] - 1, infoY2 - 5.5, 32, 7, 1.5, 1.5, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5);
  doc.text('CONFIRMED', cols[2] + 15, infoY2 - 0.5, { align: 'center' });

  // Divider lines between columns
  doc.setDrawColor(...border); doc.setLineWidth(0.4);
  doc.line(75, 40, 75, 59);
  doc.line(143, 40, 143, 59);

  /* ══════════════════════════════════════════════
     CUSTOMER + DELIVERY — side by side
  ══════════════════════════════════════════════ */
  const secY = 68;

  // Section headers
  function sectionHeader(label, x, y) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...orange);
    doc.text(label, x, y);
    doc.setDrawColor(...orange); doc.setLineWidth(0.5);
    doc.line(x, y + 1.5, x + 82, y + 1.5);
  }

  sectionHeader('CUSTOMER DETAILS', ML, secY);
  sectionHeader('DELIVERY ADDRESS', 112, secY);

  // Customer left column
  const rowGap = 7.5;
  let cy = secY + 10;
  const custData = [
    ['Name',  name],
    ['Phone', phone],
    ['Address', addr],
  ];
  custData.forEach(([lbl, val]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...grey);
    doc.text(lbl, ML, cy);
    doc.setTextColor(...dark); doc.setFont('helvetica', 'bold');
    // wrap long values
    const lines = doc.splitTextToSize(val, 82);
    doc.text(lines, ML + 20, cy);
    cy += rowGap * (lines.length > 1 ? lines.length * 0.9 : 1);
  });

  // Delivery right column
  let dy = secY + 10;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(...grey);
  doc.text('To', 112, dy);
  doc.setTextColor(...dark); doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5);
  const delLines = doc.splitTextToSize(del, 82);
  doc.text(delLines, 112 + 10, dy);

  /* ══════════════════════════════════════════════
     ITEMS TABLE
  ══════════════════════════════════════════════ */
  // Calculate table start Y (below the longer of the two columns)
  const tableY = Math.max(cy, dy + 20) + 8;

  // Table title
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(...orange);
  doc.text('ORDER ITEMS', ML, tableY);
  doc.setDrawColor(...orange); doc.setLineWidth(0.5);
  doc.line(ML, tableY + 1.5, MR, tableY + 1.5);

  // Header row
  const tHY = tableY + 6;
  doc.setFillColor(...darkBg);
  doc.rect(ML, tHY, MR - ML, 8, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('#',         ML + 3,  tHY + 5.2);
  doc.text('PRODUCT',  ML + 12, tHY + 5.2);
  doc.text('UNIT PRICE', 130,   tHY + 5.2, { align: 'right' });
  doc.text('QTY',       155,    tHY + 5.2, { align: 'right' });
  doc.text('SUBTOTAL',  MR,     tHY + 5.2, { align: 'right' });

  // Rows
  let ry = tHY + 8;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  cart.forEach((item, idx) => {
    const even = idx % 2 === 0;
    doc.setFillColor(...(even ? white : light));
    doc.rect(ML, ry, MR - ML, 9, 'F');

    // left accent bar on odd rows
    if (!even) {
      doc.setFillColor(...orange);
      doc.rect(ML, ry, 2, 9, 'F');
    }

    doc.setTextColor(...grey);
    doc.text(`${idx + 1}`, ML + 3, ry + 6);
    doc.setTextColor(...dark); doc.setFont('helvetica', even ? 'normal' : 'bold');
    doc.text(item.name, ML + 12, ry + 6);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...mid);
    doc.text(`$${item.price.toLocaleString()}`, 130, ry + 6, { align: 'right' });
    doc.text(`${item.qty}`, 155, ry + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold'); doc.setTextColor(...dark);
    doc.text(`$${(item.price * item.qty).toLocaleString()}`, MR, ry + 6, { align: 'right' });

    // bottom border
    doc.setDrawColor(...border); doc.setLineWidth(0.2);
    doc.line(ML, ry + 9, MR, ry + 9);
    ry += 9;
  });

  /* ── Totals block ── */
  ry += 4;
  // Subtotal row
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(...grey);
  doc.text('Subtotal', 150, ry, { align: 'right' });
  doc.setTextColor(...dark);
  doc.text(`$${total.toLocaleString()}`, MR, ry, { align: 'right' });

  ry += 6;
  doc.text('Shipping', 150, ry, { align: 'right' });
  doc.setTextColor(...orange);
  doc.text('FREE', MR, ry, { align: 'right' });

  // Divider
  ry += 3;
  doc.setDrawColor(...orange); doc.setLineWidth(0.6);
  doc.line(130, ry, MR, ry);

  // Grand total
  ry += 8;
  doc.setFillColor(...orange);
  doc.roundedRect(128, ry - 7, 68, 12, 2, 2, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('TOTAL', 132, ry);
  doc.text(`$${total.toLocaleString()}`, MR - 1, ry, { align: 'right' });
  ry += 5;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.setTextColor(...grey);
  doc.text(`${items} item${items > 1 ? 's' : ''}`, MR, ry, { align: 'right' });

  /* ══════════════════════════════════════════════
     FOOTER
  ══════════════════════════════════════════════ */
  // Orange bottom bar
  doc.setFillColor(...orange);
  doc.rect(0, PH - 18, PW, 18, 'F');
  doc.setTextColor(...white); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text('Thank you for choosing ROLEX WATCH!', PW / 2, PH - 11, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
  doc.setTextColor(255, 230, 190);
  doc.text('rolexwatch.com  •  support@rolexwatch.com  •  WhatsApp: +88 01XXXXXXXXX', PW / 2, PH - 5, { align: 'center' });

  // Watermark logo (faint centre)
  doc.setTextColor(229, 132, 48); doc.setFont('helvetica', 'bold'); doc.setFontSize(72);
  doc.setGState(new doc.GState({ opacity: 0.04 }));
  doc.text('RW', PW / 2, PH / 2 + 10, { align: 'center' });
  doc.setGState(new doc.GState({ opacity: 1 }));

  doc.save(`Invoice_${orderId}.pdf`);
}

/* ============================================================
   SUCCESS BANNER
   ============================================================ */
function showSuccessBanner(orderId) {
  const banner = document.getElementById('co-success-banner');
  document.getElementById('co-success-order-id').textContent = orderId;
  banner.classList.add('is-visible');
  setTimeout(() => banner.classList.remove('is-visible'), 6000);
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  // Clear error on input
  document.querySelectorAll('.co-field').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('is-error');
      const err = el.nextElementSibling;
      if (err && err.classList.contains('co-error')) err.style.display = 'none';
    });
  });
});
