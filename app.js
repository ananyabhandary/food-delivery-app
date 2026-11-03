'use strict';

/* =====================================================================
   Bitezy – Food Delivery & Restaurant Discovery (vanilla JS, no build)
   Flows: Discover -> Restaurant menu -> Cart -> Checkout -> Order tracking
   ===================================================================== */

/* ---------- Helpers ---------- */
const $ = (sel, el = document) => el.querySelector(sel);
const money = (n) => '₹' + Math.round(n);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const findRestaurant = (id) => RESTAURANTS.find((r) => r.id === id);

const storage = {
  load(key, fallback) {
    try { const v = JSON.parse(localStorage.getItem(key)); return v ?? fallback; } catch { return fallback; }
  },
  save(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage unavailable */ }
  }
};

/* ---------- State ---------- */
let cart = storage.load('bitezy_cart', { rid: null, items: {}, promo: null });
let orders = storage.load('bitezy_orders', []);
const filters = { q: '', cuisine: 'All', veg: false, sort: 'rating' };
let trackTimer = null;

const persistCart = () => { storage.save('bitezy_cart', cart); updateBadge(); };
const persistOrders = () => storage.save('bitezy_orders', orders);

/* ---------- Cart logic ---------- */
const cartCount = () => Object.values(cart.items).reduce((a, b) => a + b, 0);

function cartLines() {
  const r = findRestaurant(cart.rid);
  if (!r) return [];
  return Object.entries(cart.items)
    .map(([id, qty]) => ({ ...r.menu.find((m) => m.id === id), qty }))
    .filter((l) => l.name);
}

function calcTotals(c = cart) {
  const r = findRestaurant(c.rid);
  const lines = r ? Object.entries(c.items).map(([id, qty]) => ({ ...r.menu.find((m) => m.id === id), qty })).filter((l) => l.name) : [];
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const delivery = !r || subtotal === 0 || subtotal >= FREE_DELIVERY_ABOVE ? 0 : r.fee;
  const tax = subtotal * 0.05;
  const promo = c.promo && PROMOS[c.promo];
  const discount = promo ? Math.min(subtotal * promo.percent / 100, promo.max) : 0;
  return { subtotal, delivery, tax, discount, total: subtotal + delivery + tax - discount };
}

function changeQty(rid, itemId, delta) {
  const hasItems = Object.keys(cart.items).length > 0;
  if (hasItems && cart.rid !== rid) {
    if (delta < 0) return;
    if (!confirm('Your cart has items from another restaurant. Start a new cart?')) return;
    cart = { rid, items: {}, promo: null };
  }
  cart.rid = rid;
  const q = (cart.items[itemId] || 0) + delta;
  if (q <= 0) delete cart.items[itemId]; else cart.items[itemId] = Math.min(q, 20);
  if (!Object.keys(cart.items).length) cart = { rid: null, items: {}, promo: null };
  persistCart();
}

function updateBadge() {
  const n = cartCount();
  const badge = $('#cart-badge');
  badge.textContent = n;
  badge.hidden = n === 0;
  $('#cart-link').setAttribute('aria-label', `Cart, ${n} item${n === 1 ? '' : 's'}`);
}

/* ---------- Reusable UI components (return HTML strings) ---------- */
const VegDot = (veg) => `<span class="veg-dot ${veg ? '' : 'veg-dot--non'}" role="img" aria-label="${veg ? 'Vegetarian' : 'Non-vegetarian'}"></span>`;

const Stepper = (rid, id, qty, name) => `
  <div class="stepper" role="group" aria-label="Quantity of ${esc(name)}">
    <button data-action="qty" data-rid="${rid}" data-id="${id}" data-d="-1" aria-label="Remove one ${esc(name)}">−</button>
    <span aria-live="polite">${qty}</span>
    <button data-action="qty" data-rid="${rid}" data-id="${id}" data-d="1" aria-label="Add one ${esc(name)}">+</button>
  </div>`;

const RestaurantCard = (r) => `
  <a class="rcard" href="#/restaurant/${r.id}" aria-label="${esc(r.name)}, rated ${r.rating}, ${r.time} minutes">
    <div class="rcard__cover" style="background:linear-gradient(135deg, ${r.colors[0]}, ${r.colors[1]})">
      <span aria-hidden="true">${r.emoji}</span>
      <span class="rcard__offer">${esc(r.offer)}</span>
    </div>
    <div class="rcard__body">
      <div class="rcard__row">
        <span class="rcard__name">${esc(r.name)}</span>
        <span class="rating">★ ${r.rating}</span>
      </div>
      <p class="muted">${r.cuisine.map(esc).join(' • ')}</p>
      <div class="rcard__meta">
        <span>⏱ ${r.time} min</span>
        <span>🛵 ${money(r.fee)}</span>
        <span>${'₹'.repeat(r.price)}</span>
        ${r.veg ? '<span class="tag">Pure veg</span>' : ''}
      </div>
    </div>
  </a>`;

const MenuItem = (r, m) => {
  const qty = cart.rid === r.id ? cart.items[m.id] || 0 : 0;
  return `
  <div class="mitem">
    <div class="mitem__info">
      <div class="mitem__name">${VegDot(m.veg)} ${esc(m.name)}</div>
      <div class="mitem__price">${money(m.price)}</div>
      <p class="muted">${esc(m.desc)}</p>
    </div>
    <div class="mitem__side">
      <div class="mitem__img" aria-hidden="true">${m.emoji}</div>
      ${qty
        ? Stepper(r.id, m.id, qty, m.name)
        : `<button class="btn btn--ghost" data-action="qty" data-rid="${r.id}" data-id="${m.id}" data-d="1" aria-label="Add ${esc(m.name)} to cart">Add</button>`}
    </div>
  </div>`;
};

const BillSummary = (t) => `
  <div class="bill">
    <div><span>Item total</span><span>${money(t.subtotal)}</span></div>
    <div><span>Delivery fee</span><span>${t.delivery ? money(t.delivery) : 'FREE'}</span></div>
    <div><span>Taxes (5%)</span><span>${money(t.tax)}</span></div>
    ${t.discount ? `<div class="discount"><span>Promo (${esc(cart.promo)})</span><span>−${money(t.discount)}</span></div>` : ''}
    <div class="total"><span>To pay</span><span>${money(t.total)}</span></div>
  </div>`;

const EmptyState = (icon, title, text, cta = true) => `
  <div class="empty">
    <span class="big" aria-hidden="true">${icon}</span>
    <h2>${title}</h2>
    <p>${text}</p>
    ${cta ? '<a class="btn" href="#/">Browse restaurants</a>' : ''}
  </div>`;

/* ---------- Views ---------- */
function filteredRestaurants() {
  const q = filters.q.trim().toLowerCase();
  let list = RESTAURANTS.filter((r) => {
    if (filters.cuisine !== 'All' && !r.cuisine.includes(filters.cuisine)) return false;
    if (filters.veg && !r.veg) return false;
    if (!q) return true;
    return r.name.toLowerCase().includes(q) ||
      r.cuisine.some((c) => c.toLowerCase().includes(q)) ||
      r.menu.some((m) => m.name.toLowerCase().includes(q));
  });
  const sorters = {
    rating: (a, b) => b.rating - a.rating,
    time: (a, b) => a.time - b.time,
    fee: (a, b) => a.fee - b.fee,
    price: (a, b) => a.price - b.price
  };
  return list.sort(sorters[filters.sort]);
}

function resultsHtml() {
  const list = filteredRestaurants();
  if (!list.length) return EmptyState('🔍', 'No restaurants found', 'Try a different dish, cuisine or clear the filters.', false);
  return `<p class="muted" style="margin-bottom:10px">${list.length} restaurant${list.length === 1 ? '' : 's'} near you</p>
          <div class="grid">${list.map(RestaurantCard).join('')}</div>`;
}

function viewHome() {
  const cuisines = ['All', ...new Set(RESTAURANTS.flatMap((r) => r.cuisine))];
  return `
  <section class="hero">
    <h1>Hungry? Find something delicious.</h1>
    <p>Search restaurants, cuisines or dishes.</p>
    <form class="search" role="search" data-form="search">
      <span aria-hidden="true">🔍</span>
      <input id="search" type="search" placeholder="Try “biryani”, “pizza” or “dosa”" aria-label="Search restaurants or dishes" value="${esc(filters.q)}" autocomplete="off" />
    </form>
  </section>
  <div class="chips" role="group" aria-label="Filter by cuisine">
    ${cuisines.map((c) => `<button class="chip" data-action="cuisine" data-value="${esc(c)}" aria-pressed="${filters.cuisine === c}">${esc(c)}</button>`).join('')}
  </div>
  <div class="toolbar">
    <button class="chip" data-action="veg" aria-pressed="${filters.veg}">🥬 Pure veg</button>
    <label class="muted">Sort by
      <select id="sort" aria-label="Sort restaurants">
        <option value="rating" ${filters.sort === 'rating' ? 'selected' : ''}>Rating</option>
        <option value="time" ${filters.sort === 'time' ? 'selected' : ''}>Delivery time</option>
        <option value="fee" ${filters.sort === 'fee' ? 'selected' : ''}>Delivery fee</option>
        <option value="price" ${filters.sort === 'price' ? 'selected' : ''}>Price: low to high</option>
      </select>
    </label>
  </div>
  <h2 class="section-title">Restaurants</h2>
  <div id="results" aria-live="polite">${resultsHtml()}</div>`;
}

function viewRestaurant(id) {
  const r = findRestaurant(id);
  if (!r) return EmptyState('🤷', 'Restaurant not found', 'It may have been removed.');
  const cats = [...new Set(r.menu.map((m) => m.cat))];
  const count = cartCount();
  const t = calcTotals();
  return `
  <a class="back" href="#/">← All restaurants</a>
  <section class="rhead" style="background:linear-gradient(135deg, ${r.colors[0]}, ${r.colors[1]})">
    <div class="rhead__emoji" aria-hidden="true">${r.emoji}</div>
    <div>
      <h1>${esc(r.name)}</h1>
      <p>${r.cuisine.map(esc).join(' • ')}</p>
      <div class="rhead__meta"><span>★ ${r.rating}</span><span>⏱ ${r.time} min</span><span>🛵 ${money(r.fee)}</span><span>🎁 ${esc(r.offer)}</span></div>
    </div>
  </section>
  <nav class="cat-nav chips" aria-label="Menu categories">
    ${cats.map((c) => `<a class="chip" href="#" data-action="scroll" data-target="cat-${esc(c.replace(/\W+/g, '-'))}">${esc(c)}</a>`).join('')}
  </nav>
  ${cats.map((c) => `
    <section class="menu-cat card-box" id="cat-${esc(c.replace(/\W+/g, '-'))}" style="margin-bottom:16px">
      <h2>${esc(c)}</h2>
      ${r.menu.filter((m) => m.cat === c).map((m) => MenuItem(r, m)).join('')}
    </section>`).join('')}
  ${count && cart.rid === r.id ? `
    <a class="cartbar" href="#/cart">
      <span>${count} item${count > 1 ? 's' : ''} • ${money(t.subtotal)}</span>
      <span>View cart →</span>
    </a>` : ''}`;
}

function viewCart() {
  const r = findRestaurant(cart.rid);
  const lines = cartLines();
  if (!r || !lines.length) return EmptyState('🛒', 'Your cart is empty', 'Add a few dishes to get started.');
  const t = calcTotals();
  const toFree = FREE_DELIVERY_ABOVE - t.subtotal;
  return `
  <a class="back" href="#/restaurant/${r.id}">← ${esc(r.name)}</a>
  <h1 class="page-title">Your cart</h1>
  <div class="two-col">
    <section class="card-box" aria-label="Cart items">
      <p class="muted">Ordering from <strong>${esc(r.name)}</strong></p>
      ${lines.map((l) => `
        <div class="line">
          <div>
            <div class="line__name">${VegDot(l.veg)} ${esc(l.name)}</div>
            <div class="muted">${money(l.price)} each</div>
          </div>
          <div style="display:flex;align-items:center;gap:14px">
            ${Stepper(r.id, l.id, l.qty, l.name)}
            <strong>${money(l.price * l.qty)}</strong>
          </div>
        </div>`).join('')}
      <button class="btn btn--ghost" style="margin-top:14px" data-action="clear-cart">Clear cart</button>
    </section>
    <aside class="card-box sticky" aria-label="Bill summary">
      ${toFree > 0 ? `<div class="free-hint">Add ${money(toFree)} more for free delivery</div>` : '<div class="free-hint">🎉 You get free delivery</div>'}
      <form class="promo" data-form="promo">
        <input id="promo" placeholder="Promo code (try WELCOME50)" aria-label="Promo code" value="${esc(cart.promo || '')}" />
        <button class="btn btn--ghost" type="submit">Apply</button>
      </form>
      ${BillSummary(t)}
      <a class="btn btn--block" style="margin-top:16px" href="#/checkout">Proceed to checkout</a>
    </aside>
  </div>`;
}

function viewCheckout() {
  const r = findRestaurant(cart.rid);
  if (!r || !cartCount()) return EmptyState('🛒', 'Nothing to checkout', 'Your cart is empty.');
  const t = calcTotals();
  const saved = storage.load('bitezy_profile', { name: '', phone: '', address: '' });
  return `
  <a class="back" href="#/cart">← Back to cart</a>
  <h1 class="page-title">Checkout</h1>
  <div class="two-col">
    <form class="card-box" id="checkout-form" data-form="checkout" novalidate>
      <h2 style="margin-bottom:14px">Delivery details</h2>
      <div class="field" data-field="name">
        <label for="name">Full name</label>
        <input id="name" name="name" autocomplete="name" value="${esc(saved.name)}" aria-describedby="name-err" />
        <span class="error" id="name-err"></span>
      </div>
      <div class="field" data-field="phone">
        <label for="phone">Mobile number</label>
        <input id="phone" name="phone" inputmode="numeric" maxlength="10" autocomplete="tel" placeholder="10-digit number" value="${esc(saved.phone)}" aria-describedby="phone-err" />
        <span class="error" id="phone-err"></span>
      </div>
      <div class="field" data-field="address">
        <label for="address">Delivery address</label>
        <textarea id="address" name="address" rows="3" autocomplete="street-address" aria-describedby="address-err">${esc(saved.address)}</textarea>
        <span class="error" id="address-err"></span>
      </div>
      <fieldset>
        <legend style="font-weight:700;font-size:.92rem">Payment method</legend>
        <label class="pay-opt"><input type="radio" name="pay" value="UPI" checked /> UPI</label>
        <label class="pay-opt"><input type="radio" name="pay" value="Card" /> Credit / Debit card</label>
        <label class="pay-opt"><input type="radio" name="pay" value="Cash" /> Cash on delivery</label>
      </fieldset>
      <button class="btn btn--block" type="submit">Place order • ${money(t.total)}</button>
    </form>
    <aside class="card-box sticky" aria-label="Order summary">
      <h2 style="margin-bottom:6px">${esc(r.name)}</h2>
      ${cartLines().map((l) => `<div class="line"><span>${l.qty} × ${esc(l.name)}</span><span>${money(l.price * l.qty)}</span></div>`).join('')}
      <div style="margin-top:12px">${BillSummary(t)}</div>
    </aside>
  </div>`;
}

/* Order tracking */
const STAGES = [
  { at: 0,  icon: '🧾', title: 'Order placed',       text: 'The restaurant has received your order.' },
  { at: 8,  icon: '👨‍🍳', title: 'Preparing your food', text: 'Your meal is being freshly prepared.' },
  { at: 22, icon: '🛵', title: 'Out for delivery',    text: 'Your delivery partner is on the way.' },
  { at: 40, icon: '✅', title: 'Delivered',           text: 'Enjoy your meal!' }
];
const DEMO_TOTAL = STAGES[STAGES.length - 1].at;

function stageIndex(order) {
  const elapsed = (Date.now() - order.createdAt) / 1000;
  let idx = 0;
  STAGES.forEach((s, i) => { if (elapsed >= s.at) idx = i; });
  return { idx, elapsed };
}

function trackerHtml(order) {
  const { idx, elapsed } = stageIndex(order);
  const pct = Math.min(100, (elapsed / DEMO_TOTAL) * 100);
  const done = idx === STAGES.length - 1;
  return `
    <div class="track-head">
      <span class="big" aria-hidden="true">${STAGES[idx].icon}</span>
      <h2>${STAGES[idx].title}</h2>
      <p class="muted">${done ? 'Delivered successfully.' : `Estimated arrival: ${order.eta} min (demo runs faster)`}</p>
    </div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}" aria-label="Order progress">
      <div class="progress__bar" style="width:${pct}%"></div>
    </div>
    <ol class="steps">
      ${STAGES.map((s, i) => `
        <li class="step ${i < idx || done ? 'step--done' : i === idx ? 'step--current' : 'step--todo'}" ${i === idx ? 'aria-current="step"' : ''}>
          <span class="step__dot" aria-hidden="true">${s.icon}</span>
          <div><div class="step__title">${s.title}</div><div class="muted">${s.text}</div></div>
        </li>`).join('')}
    </ol>`;
}

function viewTrack(id) {
  const order = orders.find((o) => o.id === id);
  if (!order) return EmptyState('📦', 'Order not found', 'We could not find that order.');
  return `
  <a class="back" href="#/orders">← All orders</a>
  <h1 class="page-title">Order #${esc(order.id)}</h1>
  <div class="two-col">
    <section class="card-box" id="tracker" aria-live="polite">${trackerHtml(order)}</section>
    <aside class="card-box">
      <h2 style="margin-bottom:6px">${esc(order.restaurant)}</h2>
      ${order.items.map((l) => `<div class="line"><span>${l.qty} × ${esc(l.name)}</span><span>${money(l.price * l.qty)}</span></div>`).join('')}
      <div style="margin-top:12px" class="bill">
        <div class="total"><span>Paid via ${esc(order.pay)}</span><span>${money(order.total)}</span></div>
      </div>
      <p class="muted" style="margin-top:12px"><strong>Delivering to</strong><br>${esc(order.name)}, ${esc(order.phone)}<br>${esc(order.address)}</p>
    </aside>
  </div>`;
}

function viewOrders() {
  if (!orders.length) return EmptyState('📦', 'No orders yet', 'Your past orders will show up here.');
  return `
  <h1 class="page-title">Your orders</h1>
  <div style="display:grid;gap:12px">
    ${orders.slice().reverse().map((o) => {
      const { idx } = stageIndex(o);
      return `
      <a class="card-box order-row" href="#/track/${o.id}">
        <div>
          <strong>${esc(o.restaurant)}</strong>
          <div class="muted">#${esc(o.id)} • ${new Date(o.createdAt).toLocaleString()} • ${o.items.reduce((s, l) => s + l.qty, 0)} items</div>
        </div>
        <div style="text-align:right"><strong>${money(o.total)}</strong><div class="tag">${STAGES[idx].title}</div></div>
      </a>`;
    }).join('')}
  </div>`;
}

/* ---------- Router ---------- */
function render() {
  const hash = location.hash.slice(1) || '/';
  const [, page, arg] = hash.split('/');
  clearInterval(trackTimer);

  let html;
  switch (page) {
    case '':           html = viewHome(); break;
    case 'restaurant': html = viewRestaurant(arg); break;
    case 'cart':       html = viewCart(); break;
    case 'checkout':   html = viewCheckout(); break;
    case 'track':      html = viewTrack(arg); break;
    case 'orders':     html = viewOrders(); break;
    default:           html = EmptyState('🧭', 'Page not found', 'That page does not exist.');
  }
  const y = window.scrollY;
  $('#app').innerHTML = html;
  document.title = 'Bitezy – ' + ({ restaurant: 'Menu', cart: 'Cart', checkout: 'Checkout', track: 'Track order', orders: 'Orders' }[page] || 'Food Delivery');
  document.querySelectorAll('.navlink').forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#/' + (page === 'orders' ? 'orders' : '')));
  updateBadge();
  return { page, arg, y };
}

function renderRoute(keepScroll) {
  const { page, arg, y } = render();
  if (keepScroll) window.scrollTo(0, y); else window.scrollTo(0, 0);
  if (page === 'track') {
    trackTimer = setInterval(() => {
      const order = orders.find((o) => o.id === arg);
      const el = $('#tracker');
      if (!order || !el) return clearInterval(trackTimer);
      el.innerHTML = trackerHtml(order);
      if (stageIndex(order).idx === STAGES.length - 1) clearInterval(trackTimer);
    }, 1000);
  }
}

/* ---------- Toast ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

/* ---------- Checkout validation ---------- */
function validateCheckout(form) {
  const data = Object.fromEntries(new FormData(form));
  const errors = {};
  if (!data.name || data.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!/^[6-9]\d{9}$/.test((data.phone || '').trim())) errors.phone = 'Enter a valid 10-digit mobile number.';
  if (!data.address || data.address.trim().length < 10) errors.address = 'Please enter a complete delivery address.';
  ['name', 'phone', 'address'].forEach((f) => {
    const wrap = form.querySelector(`[data-field="${f}"]`);
    wrap.classList.toggle('invalid', Boolean(errors[f]));
    $(`#${f}-err`).textContent = errors[f] || '';
    $(`#${f}`).setAttribute('aria-invalid', Boolean(errors[f]));
  });
  const first = Object.keys(errors)[0];
  if (first) $(`#${first}`).focus();
  return { ok: !first, data };
}

function placeOrder(data) {
  const r = findRestaurant(cart.rid);
  const t = calcTotals();
  const order = {
    id: String(Date.now()).slice(-6),
    restaurant: r.name,
    eta: r.time,
    items: cartLines().map((l) => ({ name: l.name, price: l.price, qty: l.qty })),
    total: t.total,
    name: data.name.trim(),
    phone: data.phone.trim(),
    address: data.address.trim(),
    pay: data.pay,
    createdAt: Date.now()
  };
  orders.push(order);
  persistOrders();
  storage.save('bitezy_profile', { name: order.name, phone: order.phone, address: order.address });
  cart = { rid: null, items: {}, promo: null };
  persistCart();
  location.hash = '#/track/' + order.id;
  toast('Order placed! 🎉');
}

/* ---------- Event delegation ---------- */
document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el) return;
  const { action } = el.dataset;

  if (action === 'qty') {
    changeQty(el.dataset.rid, el.dataset.id, Number(el.dataset.d));
    renderRoute(true);
  } else if (action === 'cuisine') {
    filters.cuisine = el.dataset.value;
    renderRoute(true);
  } else if (action === 'veg') {
    filters.veg = !filters.veg;
    renderRoute(true);
  } else if (action === 'clear-cart') {
    cart = { rid: null, items: {}, promo: null };
    persistCart();
    renderRoute();
  } else if (action === 'scroll') {
    e.preventDefault();
    document.getElementById(el.dataset.target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
});

document.addEventListener('input', (e) => {
  if (e.target.id === 'search') {
    filters.q = e.target.value;
    $('#results').innerHTML = resultsHtml();
  }
});

document.addEventListener('change', (e) => {
  if (e.target.id === 'sort') {
    filters.sort = e.target.value;
    $('#results').innerHTML = resultsHtml();
  }
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;

  if (kind === 'promo') {
    const code = $('#promo').value.trim().toUpperCase();
    if (!code) { cart.promo = null; persistCart(); renderRoute(true); return; }
    if (PROMOS[code]) { cart.promo = code; persistCart(); renderRoute(true); toast(`Promo ${code} applied`); }
    else toast('Invalid promo code');
  } else if (kind === 'checkout') {
    const { ok, data } = validateCheckout(form);
    if (ok) placeOrder(data);
  }
});

window.addEventListener('hashchange', () => renderRoute(false));
window.addEventListener('DOMContentLoaded', () => renderRoute(false));
