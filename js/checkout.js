/* ============================================================
   CHECKOUT — config
   ============================================================ */
const SELLER_WHATSAPP = '8801XXXXXXXXX'; // ← seller er number change koro

/* ============================================================
   MODAL OPEN / CLOSE
   ============================================================ */
function openCheckout() {
  const cart = JSON.parse(localStorage.getItem('rolex-cart') || '[]');
  if (!cart.length) { alert('Your cart is empty!'); return; }
  document.getElementById('checkout-modal').classList.add('is-open');
  document.getElementById('checkout-overlay').classList.add('is-open');
  document.body.style.overflow = 'hidden';
  showStep(1);
  renderOrderSummary();
}

function closeCheckout() {
  document.getElementById('checkout-modal').classList.remove('is-open');
  document.getElementById('checkout-overlay').classList.remove('is-open');
  document.body.style.overflow = '';
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

  // ── 3. Clear cart & close ────────────────────────────────
  localStorage.removeItem('rolex-cart');
  if (typeof updateCartCount === 'function') { window.cart = []; updateCartCount(); renderCart(); }
  closeCheckout();
  showSuccessBanner(orderId);
}

/* ============================================================
   PDF INVOICE  (jsPDF via CDN)
   ============================================================ */
async function generateInvoicePDF({ orderId, orderDate, name, phone, addr, del, cart, total, items, payment, mobNum, paymentLabels }) {
  // jsPDF already loaded via script tag in HTML
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  const orange = [229, 132, 48];
  const dark   = [30, 30, 30];
  const grey   = [120, 120, 120];
  const light  = [245, 245, 245];

  // Header bar
  doc.setFillColor(...orange);
  doc.rect(0, 0, 210, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20); doc.setFont('helvetica', 'bold');
  doc.text('MODERN WATCH', 14, 13);
  doc.setFontSize(9); doc.setFont('helvetica', 'normal');
  doc.text('Premium Timepieces', 14, 20);
  doc.setFontSize(10); doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 180, 13, { align: 'right' });
  doc.setFontSize(8); doc.setFont('helvetica', 'normal');
  doc.text(orderId, 180, 20, { align: 'right' });

  // Order info box
  doc.setFillColor(...light);
  doc.roundedRect(14, 34, 182, 22, 2, 2, 'F');
  doc.setTextColor(...grey); doc.setFontSize(8);
  doc.text('Order Date', 18, 41);
  doc.text('Order ID', 80, 41);
  doc.text('Payment', 145, 41);
  doc.setTextColor(...dark); doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  doc.text(orderDate, 18, 48);
  doc.text(orderId, 80, 48);
  const payLabel = paymentLabels[payment] + (mobNum ? ` (${mobNum})` : '');
  doc.text(payLabel, 145, 48);

  // Customer info
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...orange);
  doc.text('Customer Details', 14, 67);
  doc.setDrawColor(...orange); doc.line(14, 69, 100, 69);

  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(...dark);
  doc.text(`Name      : ${name}`, 14, 76);
  doc.text(`Phone     : ${phone}`, 14, 83);
  doc.text(`Address   : ${addr}`, 14, 90);
  doc.text(`Delivery  : ${del}`, 14, 97);

  // Items table
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...orange);
  doc.text('Order Items', 14, 112);
  doc.line(14, 114, 196, 114);

  // Table header
  doc.setFillColor(...orange);
  doc.rect(14, 116, 182, 8, 'F');
  doc.setTextColor(255, 255, 255); doc.setFontSize(8.5); doc.setFont('helvetica', 'bold');
  doc.text('#', 17, 122);
  doc.text('Product', 28, 122);
  doc.text('Unit Price', 120, 122, { align: 'right' });
  doc.text('Qty', 148, 122, { align: 'right' });
  doc.text('Subtotal', 194, 122, { align: 'right' });

  // Table rows
  let y = 130;
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  cart.forEach((item, idx) => {
    const bg = idx % 2 === 0 ? [255, 255, 255] : light;
    doc.setFillColor(...bg);
    doc.rect(14, y - 5, 182, 9, 'F');
    doc.setTextColor(...dark);
    doc.text(`${idx + 1}`, 17, y);
    doc.text(item.name, 28, y);
    doc.text(`$${item.price.toLocaleString()}`, 120, y, { align: 'right' });
    doc.text(`${item.qty}`, 148, y, { align: 'right' });
    doc.text(`$${(item.price * item.qty).toLocaleString()}`, 194, y, { align: 'right' });
    y += 9;
  });

  // Total row
  y += 4;
  doc.setFillColor(...dark);
  doc.rect(130, y - 5, 66, 10, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text(`TOTAL  $${total.toLocaleString()}`, 194, y + 1, { align: 'right' });
  doc.text(`${items} item${items > 1 ? 's' : ''}`, 134, y + 1);

  // Footer
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...grey);
  doc.text('Thank you for shopping with Modern Watch!', 105, 280, { align: 'center' });
  doc.setDrawColor(...orange); doc.line(14, 282, 196, 282);
  doc.text('modernwatch.com  •  support@modernwatch.com', 105, 287, { align: 'center' });

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
  // Wire checkout button inside cart
  const checkoutBtn = document.querySelector('.cart__checkout');
  if (checkoutBtn) checkoutBtn.addEventListener('click', openCheckout);

  // Default payment select
  selectPayment('cod');

  // Clear error on input
  document.querySelectorAll('.co-field').forEach(el => {
    el.addEventListener('input', () => {
      el.classList.remove('is-error');
      const err = el.nextElementSibling;
      if (err && err.classList.contains('co-error')) err.style.display = 'none';
    });
  });
});
