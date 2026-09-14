/* ============================================================
   DATA
   ============================================================ */
const featuredProducts = [
  { id: 'baroncelli', name: 'Baroncelli', price: 890, image: 'assets/image/watches/baroncelli.png', tag: 'Popular' },
  { id: 'dreyfuss-gold', name: 'Dreyfuss Gold', price: 1340, image: 'assets/image/watches/dreyfuss-gold.png', tag: 'New' },
  { id: 'duchen', name: 'Duchen', price: 720, image: 'assets/image/watches/duchen.png', tag: 'Sale' },
];

const products = [
  { id: 'fosil-me3', name: 'Fossil ME3', price: 340, image: 'assets/image/watches/fosil-me3.png' },
  { id: 'ingersoll', name: 'Ingersoll', price: 510, image: 'assets/image/watches/ingersoll.png' },
  { id: 'jazzmaster', name: 'Jazzmaster', price: 870, image: 'assets/image/watches/jazzmaster.png' },
  { id: 'jubilee-black', name: 'Jubilee Black', price: 1200, image: 'assets/image/watches/jubilee-black.png' },
  { id: 'khaki-pilot', name: 'Khaki Pilot', price: 650, image: 'assets/image/watches/khaki-pilot.png' },
  { id: 'longines-rose', name: 'Longines Rose', price: 980, image: 'assets/image/watches/longines-rose.png' },
];

const newArrivals = [
  { id: 'portuguese-rose', name: 'Portuguese Rose', price: 1450, image: 'assets/image/watches/portuguese-rose.png', tag: 'New', accent: true },
  { id: 'rose-gold', name: 'Rose Gold', price: 1180, image: 'assets/image/watches/rose-gold.png', tag: 'Hot' },
  { id: 'spirit-rose', name: 'Spirit Rose', price: 760, image: 'assets/image/watches/spirit-rose.png', tag: 'New' },
  { id: 'hero-watch', name: 'Hero Edition', price: 2100, image: 'assets/image/watches/hero-watch.png', tag: 'Limited' },
];

/* Testimonial data — many messages, 3 visible at once */
const testimonials = [
  { name: 'Lee Doe', role: 'Director of a company', date: 'March 27. 2021', img: 'assets/image/ui/testimonial-person.jpg',
    text: 'They are the best watches that one acquires, also they are always with the latest news and trends, with a very comfortable price and especially with the attention you receive, they are always attentive to your questions.' },
  { name: 'Samantha Mey', role: 'Creative Director', date: 'April 12. 2021', img: 'assets/image/ui/testimonial-person.jpg',
    text: 'Absolutely stunning collection. The craftsmanship is second to none and the delivery was surprisingly fast. I have been a loyal customer for three years and they never disappoint.' },
  { name: 'Raul Zaman', role: 'Marketing Manager', date: 'May 3. 2021', img: 'assets/image/ui/testimonial-person.jpg',
    text: 'I bought the B720 as a gift for my father and he was speechless. The quality of the materials, the weight, the finishing — everything is premium. Highly recommend this store.' },
  { name: 'Elena Voss', role: 'Entrepreneur', date: 'June 18. 2021', img: 'assets/image/ui/testimonial-person.jpg',
    text: 'The customer support team is exceptional. They guided me through the entire selection process and made sure I got exactly what I was looking for. Will definitely buy again.' },
  { name: 'James Park', role: 'Watch Enthusiast', date: 'July 5. 2021', img: 'assets/image/ui/testimonial-person.jpg',
    text: 'As someone who has collected watches for over a decade, I can say with confidence that this store offers some of the best curated selections available. Every piece tells a story.' },
  { name: 'Natalia Cruz', role: 'Fashion Designer', date: 'August 22. 2021', img: 'assets/image/ui/testimonial-person.jpg',
    text: 'The Rose Gold collection is breathtaking. I wear mine to every important meeting and it always gets noticed. Timeless elegance at a price that actually makes sense.' },
];

/* ============================================================
   CART STATE
   ============================================================ */
let cart = JSON.parse(localStorage.getItem('rolex-cart') || '[]');

function saveCart() { localStorage.setItem('rolex-cart', JSON.stringify(cart)); }

function addToCart(product) {
  const existing = cart.find(i => i.id === product.id);
  if (existing) { existing.qty++; }
  else { cart.push({ ...product, qty: 1 }); }
  saveCart(); renderCart(); updateCartCount();
  openCart();
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  saveCart(); renderCart(); updateCartCount();
}

function changeQty(id, delta) {
  const item = cart.find(i => i.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty < 1) { removeFromCart(id); return; }
  saveCart(); renderCart(); updateCartCount();
}

function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const el = document.querySelector('.cart-count');
  el.textContent = total;
  el.classList.toggle('visible', total > 0);
}

function renderCart() {
  const list = document.getElementById('cart-list');
  const prices = document.getElementById('cart-prices');
  if (!cart.length) {
    list.innerHTML = '<p class="cart__empty">Your cart is empty</p>';
    prices.innerHTML = '<span class="cart__prices-item">0 items</span><span class="cart__prices-total">$0</span>';
    return;
  }
  list.innerHTML = cart.map(item => `
    <div class="cart__card">
      <div class="cart__thumb"><img src="${item.image}" alt="${item.name}"></div>
      <div>
        <p class="cart__name">${item.name}</p>
        <p class="cart__price">$${item.price.toLocaleString()}</p>
        <div class="cart__amount">
          <button class="cart__qty-btn" onclick="changeQty('${item.id}',-1)">−</button>
          <span>${item.qty}</span>
          <button class="cart__qty-btn" onclick="changeQty('${item.id}',1)">+</button>
        </div>
      </div>
      <button class="cart__delete" onclick="removeFromCart('${item.id}')" aria-label="Remove item">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
          <path d="M10 11v6"/>
          <path d="M14 11v6"/>
          <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
        </svg>
      </button>
    </div>
  `).join('');
  const totalItems = cart.reduce((s, i) => s + i.qty, 0);
  const totalPrice = cart.reduce((s, i) => s + i.price * i.qty, 0);
  prices.innerHTML = `<span class="cart__prices-item">${totalItems} item${totalItems > 1 ? 's' : ''}</span><span class="cart__prices-total">$${totalPrice.toLocaleString()}</span>`;
}

function openCart() {
  document.getElementById('cart').classList.add('is-open');
  document.getElementById('cart-overlay').classList.add('is-open');
}
function closeCart() {
  document.getElementById('cart').classList.remove('is-open');
  document.getElementById('cart-overlay').classList.remove('is-open');
}

/* ============================================================
   THEME
   ============================================================ */
function setThemeIcons(dark) {
  const moon = document.getElementById('icon-moon');
  const sun  = document.getElementById('icon-sun');
  if (!moon || !sun) return;
  moon.style.display = dark ? 'none' : '';
  sun.style.display  = dark ? ''     : 'none';
}

function toggleTheme() {
  const dark = document.documentElement.classList.toggle('dark-theme');
  setThemeIcons(dark);
  localStorage.setItem('rolex-theme', dark ? 'dark' : 'light');
}

if (localStorage.getItem('rolex-theme') === 'dark') {
  document.documentElement.classList.add('dark-theme');
  document.addEventListener('DOMContentLoaded', () => setThemeIcons(true));
}

/* ============================================================
   NAVIGATION
   ============================================================ */
function openMenu() { document.getElementById('nav-menu').classList.add('is-open'); }
function closeMenu() { document.getElementById('nav-menu').classList.remove('is-open'); }

window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  header.classList.toggle('scroll-header', window.scrollY >= 50);
  document.querySelector('.scrollup').classList.toggle('show-scroll', window.scrollY >= 350);
});

/* ============================================================
   RENDER PRODUCTS
   ============================================================ */
function renderFeatured() {
  const grid = document.getElementById('featured-grid');
  grid.innerHTML = featuredProducts.map(p => `
    <div class="featured__card reveal">
      <span class="featured__tag">${p.tag}</span>
      <img class="featured__img" src="${p.image}" alt="${p.name}">
      <h3 class="featured__title">${p.name}</h3>
      <span class="featured__price">$${p.price.toLocaleString()}</span>
      <button class="button button--small featured__button" onclick="addToCart({id:'${p.id}',name:'${p.name}',price:${p.price},image:'${p.image}'})">ADD TO CART</button>
    </div>
  `).join('');
}

function renderProducts() {
  const grid = document.getElementById('products-grid');
  grid.innerHTML = products.map(p => `
    <div class="products__card reveal">
      <img class="products__img" src="${p.image}" alt="${p.name}">
      <h3 class="products__title">${p.name}</h3>
      <span class="products__price">$${p.price.toLocaleString()}</span>
      <button class="products__button" onclick="addToCart({id:'${p.id}',name:'${p.name}',price:${p.price},image:'${p.image}'})">+</button>
    </div>
  `).join('');
}

function renderNew() {
  const grid = document.getElementById('new-grid');
  grid.innerHTML = newArrivals.map(p => `
    <div class="new__card${p.accent ? ' is-accent' : ''} reveal">
      <span class="new__tag">${p.tag}</span>
      <img class="new__img" src="${p.image}" alt="${p.name}">
      <h3 class="new__title">${p.name}</h3>
      <span class="new__price">$${p.price.toLocaleString()}</span>
      <button class="button button--small new__button" onclick="addToCart({id:'${p.id}',name:'${p.name}',price:${p.price},image:'${p.image}'})">ADD TO CART</button>
    </div>
  `).join('');
}

/* ============================================================
   TESTIMONIAL — single card, slide on arrow click
   ============================================================ */
let testiIndex = 0;

function renderTestimonials() {
  const card = document.getElementById('testimonial-card');
  if (!card) return;
  const t = testimonials[testiIndex];
  card.innerHTML = `
    <span class="testimonial__quote">❝</span>
    <p class="testimonial__description">${t.text}</p>
    <p class="testimonial__date">${t.date}</p>
    <div class="testimonial__profile">
      <img class="testimonial__profile-img" src="${t.img}" alt="${t.name}">
      <div>
        <h3 class="testimonial__profile-name">${t.name}</h3>
        <span class="testimonial__profile-role">${t.role}</span>
      </div>
    </div>
  `;
  card.classList.remove('fade-out');
  void card.offsetWidth; // force reflow
  card.classList.add('fade-in');
}

function switchTesti(dir) {
  const card = document.getElementById('testimonial-card');
  card.classList.remove('fade-in');
  card.classList.add('fade-out');
  setTimeout(() => {
    testiIndex = (testiIndex + dir + testimonials.length) % testimonials.length;
    renderTestimonials();
  }, 340);
}

function testiNext() { switchTesti(1); }
function testiPrev() { switchTesti(-1); }

/* Auto-advance every 5 seconds */
let testiAutoInterval = setInterval(testiNext, 5000);
function resetTestiTimer() {
  clearInterval(testiAutoInterval);
  testiAutoInterval = setInterval(testiNext, 5000);
}

/* ============================================================
   SCROLL REVEAL
   ============================================================ */
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObs.unobserve(e.target); } });
}, { threshold: 0.12 });

function initReveal() {
  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => revealObs.observe(el));
}

/* ============================================================
   ACTIVE NAV LINK ON SCROLL
   ============================================================ */
function updateActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY;
  sections.forEach(s => {
    const top = s.offsetTop - 80;
    const bottom = top + s.offsetHeight;
    const link = document.querySelector(`.nav__link[href="#${s.id}"]`);
    if (link) link.classList.toggle('active-link', scrollY >= top && scrollY < bottom);
  });
}
window.addEventListener('scroll', updateActiveNav);

/* ============================================================
   NEWSLETTER
   ============================================================ */
function submitNewsletter(e) {
  e.preventDefault();
  const input = document.getElementById('newsletter-email');
  alert(`✅ Subscribed with ${input.value}!`);
  input.value = '';
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  renderProducts();
  renderNew();
  renderTestimonials();
  renderCart();
  updateCartCount();
  initReveal();

  document.getElementById('testi-next').addEventListener('click', () => { testiNext(); resetTestiTimer(); });
  document.getElementById('testi-prev').addEventListener('click', () => { testiPrev(); resetTestiTimer(); });
});
