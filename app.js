
async function fetchProducts() {
  try { const res = await fetch('products.json'); if (!res.ok) throw 0; return await res.json(); }
  catch(e) { return []; }
}
const CART_KEY = 'cart';
function getCart() { return JSON.parse(localStorage.getItem(CART_KEY) || '[]'); }
function saveCart(items) { localStorage.setItem(CART_KEY, JSON.stringify(items)); syncCartCount(); }
function addToCart(item) {
  const cart = getCart();
  if (cart.find(i => i.sku === item.sku)) { alert('Article déjà dans le panier (stock 1).'); return; }
  if (item.stock <= 0) { alert('Désolé, cet article n’est plus disponible.'); return; }
  cart.push({ sku:item.sku, titre:item.titre, prix:item.prix, tva:item.tva, image:item.image, qte:1, taille:item.taille, etat:item.etat, marque:item.marque });
  saveCart(cart); renderCart();
}
function removeFromCart(sku) { const cart = getCart().filter(i => i.sku !== sku); saveCart(cart); renderCart(); }
function syncCartCount() { const c = getCart().reduce((n,i)=>n+i.qte,0); const el = document.getElementById('cart-count'); if (el) el.textContent = c; }
let ALL_PRODUCTS = [];
function formatEUR(n) { return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' }); }
function renderProducts(list) {
  const grid = document.getElementById('grid'); if (!grid) return;
  grid.innerHTML='';
  list.forEach(p => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <img alt="${p.titre}" src="${p.image}">
      <div class="card-body">
        <div class="card-title"><span>${p.titre}</span><span class="badge-sm">Seconde main</span></div>
        <div class="muted">${p.categorie} • ${p.marque} • Taille ${p.taille} • ${p.etat}</div>
        <div class="price">${formatEUR(p.prix)}</div>
        <p class="muted">${p.description}</p>
        <button class="button primary" data-sku="${p.sku}">Ajouter au panier</button>
      </div>`;
    grid.appendChild(card);
  });
  grid.querySelectorAll('button[data-sku]').forEach(btn => {
    btn.addEventListener('click', () => {
      const product = ALL_PRODUCTS.find(p => p.sku === btn.dataset.sku);
      addToCart(product);
    });
  });
}
function uniqueSorted(values) { return Array.from(new Set(values.filter(Boolean))).sort((a,b)=>a.localeCompare(b,'fr')); }
function populateFilters() {
  const catSel = document.getElementById('filter-categorie');
  const tailleSel = document.getElementById('filter-taille');
  const marqueSel = document.getElementById('filter-marque');
  if (catSel) { catSel.innerHTML = '<option value="">Toutes</option>'; uniqueSorted(ALL_PRODUCTS.map(p=>p.categorie)).forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=c; catSel.appendChild(o); }); }
  if (tailleSel) { uniqueSorted(ALL_PRODUCTS.map(p=>p.taille)).forEach(t=>{ const o=document.createElement('option'); o.value=t; o.textContent=t; tailleSel.appendChild(o); }); }
  if (marqueSel) { uniqueSorted(ALL_PRODUCTS.map(p=>p.marque)).forEach(m=>{ const o=document.createElement('option'); o.value=m; o.textContent=m; marqueSel.appendChild(o); }); }
}
function applyFilters() {
  const q = (document.getElementById('q')?.value || '').toLowerCase();
  const cat = document.getElementById('filter-categorie')?.value || '';
  const taille = document.getElementById('filter-taille')?.value || '';
  const etat = document.getElementById('filter-etat')?.value || '';
  const marque = document.getElementById('filter-marque')?.value || '';
  const sort = document.getElementById('sort')?.value || 'pop';
  let list = ALL_PRODUCTS.filter(p =>
    (!cat || p.categorie === cat) && (!taille || p.taille === taille) && (!etat || p.etat === etat) && (!marque || p.marque === marque) &&
    (p.titre.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.marque.toLowerCase().includes(q) || String(p.taille).toLowerCase().includes(q) || p.etat.toLowerCase().includes(q))
  );
  if (sort === 'price-asc') list.sort((a,b)=>a.prix-b.prix);
  if (sort === 'price-desc') list.sort((a,b)=>b.prix-a.prix);
  if (sort === 'alpha') list.sort((a,b)=>a.titre.localeCompare(b.titre,'fr'));
  renderProducts(list);
}
function renderCart() {
  const wrap = document.getElementById('cart-items'); if (!wrap) return;
  const cart = getCart();
  wrap.innerHTML = '';
  let subtotal = 0, vat = 0;
  cart.forEach(i => {
    const lineHT = i.prix * i.qte;
    const lineTVA = lineHT * (i.tva/100);
    subtotal += lineHT; vat += lineTVA;
    const el = document.createElement('div');
    el.className = 'cart-item';
    el.innerHTML = `
      <img alt="${i.titre}" src="${i.image || ''}">
      <div>
        <div style="font-weight:600">${i.titre}</div>
        <div class="muted">${i.marque} • Taille ${i.taille} • ${i.etat}</div>
        <div class="muted">${formatEUR(i.prix)} • TVA ${i.tva}%</div>
        <div class="qty"><span>Qté: 1 (stock unique)</span><button class="button ghost" style="margin-left:8px;" data-action="rm" data-sku="${i.sku}">Retirer</button></div>
      </div>
      <div style="font-weight:700">${formatEUR(lineHT + lineTVA)}</div>`;
    wrap.appendChild(el);
  });
  const subtotalEl = document.getElementById('subtotal');
  const vatEl = document.getElementById('vat');
  const totalEl = document.getElementById('total');
  if (subtotalEl) subtotalEl.textContent = formatEUR(subtotal);
  if (vatEl) vatEl.textContent = formatEUR(vat);
  // Free shipping >= 99€ TTC
  const TTC = subtotal + vat;
  let shipping = 4.90;
  const shipRadios = document.querySelectorAll('input[name="ship"]');
  if (shipRadios && shipRadios.length) {
    shipRadios.forEach(r => { if (r.checked && r.value === 'express') shipping = 9.90; });
  }
  let free = false;
  if (TTC >= 99) { shipping = 0; free = true; }
  const shipEl = document.getElementById('shipping'); if (shipEl) shipEl.textContent = shipping === 0 ? 'Gratuite' : formatEUR(shipping);
  const badge = document.getElementById('free-ship-badge');
  if (badge) {
    badge.style.display = 'block';
    const missing = Math.max(0, 99 - TTC);
    badge.innerHTML = free ? '✅ Livraison gratuite appliquée (≥ 99 € TTC)' : '🚚 Plus que ' + formatEUR(missing) + ' pour la livraison gratuite (≥ 99 € TTC)';
  }
  if (totalEl) totalEl.textContent = formatEUR(TTC + (isNaN(shipping) ? 0 : shipping));
  wrap.querySelectorAll('button[data-action="rm"]').forEach(btn => btn.addEventListener('click', ()=>removeFromCart(btn.dataset.sku)));
  syncCartCount();
}
(async function init() {
  const y = document.getElementById('year'); if (y) y.textContent = new Date().getFullYear();
  ALL_PRODUCTS = await fetchProducts();
  populateFilters(); applyFilters(); renderCart();
  ['q','filter-categorie','filter-taille','filter-etat','filter-marque','sort'].forEach(id => { const el=document.getElementById(id); if (el) el.addEventListener('input', applyFilters); });
  document.querySelectorAll('input[name="ship"]').forEach(r => r.addEventListener('change', renderCart));
})();