window.VV_Cart = (() => {
  function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 2400);
  }

  function open() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer) return;
    drawer.classList.add('is-open');
    overlay.classList.add('is-open');
    drawer.setAttribute('aria-hidden', 'false');
  }

  function close() {
    const drawer = document.getElementById('cart-drawer');
    const overlay = document.getElementById('cart-overlay');
    if (!drawer) return;
    drawer.classList.remove('is-open');
    overlay.classList.remove('is-open');
    drawer.setAttribute('aria-hidden', 'true');
  }

  function updateBadge(count) {
    document.querySelectorAll('.cart-count').forEach((el) => {
      el.textContent = count;
      el.classList.toggle('is-visible', count > 0);
    });
  }

  function refreshFromCartJson() {
    return fetch('/cart.js')
      .then((res) => res.json())
      .then((cart) => {
        updateBadge(cart.item_count);
        const body = document.getElementById('cart-body');
        const foot = document.getElementById('cart-foot');
        if (!body || !foot) return;

        if (cart.item_count === 0) {
          body.innerHTML = `<p class="cart-empty">Your bag is empty — browse the <a href="/collections/all">shop</a> to find something.</p>`;
          foot.innerHTML = '';
          return;
        }

        body.innerHTML = cart.items
          .map(
            (item, index) => `
          <div class="cart-item" data-line="${index + 1}">
            <img src="${item.image}" alt="${item.product_title}" width="72" height="90">
            <div class="cart-item-info">
              <p class="cart-item-name">${item.product_title}</p>
              <p class="cart-item-meta">${item.variant_title || ''} &middot; ${formatMoney(item.final_price)}</p>
              <div class="cart-item-qty">
                <button type="button" data-cart-decrease="${index + 1}" aria-label="Decrease quantity">&minus;</button>
                <span>${item.quantity}</span>
                <button type="button" data-cart-increase="${index + 1}" aria-label="Increase quantity">+</button>
              </div>
            </div>
            <button type="button" class="cart-item-remove" data-cart-remove="${index + 1}" aria-label="Remove ${item.product_title} from bag">&times;</button>
          </div>`
          )
          .join('');

        foot.innerHTML = `
          <div class="cart-subtotal"><span>Subtotal</span><span>${formatMoney(cart.total_price)}</span></div>
          <a class="btn btn-solid cart-checkout" href="/cart">Checkout</a>
        `;
      });
  }

  function formatMoney(cents) {
    return (cents / 100).toLocaleString(undefined, { style: 'currency', currency: (window.Shopify && Shopify.currency && Shopify.currency.active) || 'USD' });
  }

  function add(variantId, quantity) {
    return fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: variantId, quantity: quantity || 1 })
    })
      .then((res) => {
        if (!res.ok) return res.json().then((err) => Promise.reject(err));
        return res.json();
      })
      .then(() => refreshFromCartJson())
      .then(() => {
        open();
        showToast('Added to bag');
      })
      .catch((err) => {
        showToast((err && err.description) || 'Could not add to bag');
      });
  }

  function changeLine(line, quantity) {
    return fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ line, quantity })
    })
      .then((res) => res.json())
      .then(() => refreshFromCartJson());
  }

  function init() {
    refreshFromCartJson();

    const openBtns = document.querySelectorAll('[data-cart-open]');
    const closeBtn = document.getElementById('cart-close');
    const overlay = document.getElementById('cart-overlay');

    openBtns.forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); open(); }));
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (overlay) overlay.addEventListener('click', close);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });

    const body = document.getElementById('cart-body');
    if (body) {
      body.addEventListener('click', (e) => {
        const target = e.target;
        if (target.dataset.cartIncrease !== undefined) {
          const line = Number(target.dataset.cartIncrease);
          const span = target.previousElementSibling;
          const qty = Number(span.textContent) + 1;
          changeLine(line, qty);
        } else if (target.dataset.cartDecrease !== undefined) {
          const line = Number(target.dataset.cartDecrease);
          const span = target.nextElementSibling;
          const qty = Math.max(0, Number(span.textContent) - 1);
          changeLine(line, qty);
        } else if (target.dataset.cartRemove !== undefined) {
          const line = Number(target.dataset.cartRemove);
          changeLine(line, 0);
        }
      });
    }
  }

  return { add, changeLine, open, close, init, showToast, refresh: refreshFromCartJson };
})();

document.addEventListener('DOMContentLoaded', window.VV_Cart.init);
