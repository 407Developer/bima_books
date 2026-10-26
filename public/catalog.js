(function () {
  const catalog = window.BIMA_CATALOG || [];
  const config = window.BIMA_CONFIG || {};
  const cart = window.BimaCart;
  const byId = new Map(catalog.map((item) => [item.id, item]));
  const WHATSAPP = (config.whatsappNumber || '2349025742445').replace(/[^\d]/g, '');

  const cartButton = document.querySelector('.cart-btn');
  const cartDialog = document.querySelector('dialog.cart');
  const rows = cartDialog.querySelector('.rows');
  const rowTemplate = document.querySelector('#row');
  const sendButton = cartDialog.querySelector('.send');
  const nameInput = cartDialog.querySelector('[name="name"]');
  const areaInput = cartDialog.querySelector('[name="area"]');
  const announce = document.querySelector('#announce');
  const items = [...document.querySelectorAll('.item')];
  const ageChips = [...document.querySelectorAll('[data-age]')];
  const kindChips = [...document.querySelectorAll('[data-kind]')];
  const filters = { age: '0-12', kind: 'all' };

  function money(amount) {
    return `₦${Number(amount).toLocaleString('en-NG')}`;
  }

  function totalQuantity() {
    return cart.count();
  }

  function totalPrice() {
    return cart.entries().reduce((sum, [id, qty]) => {
      const item = byId.get(id);
      return item ? sum + item.price * qty : sum;
    }, 0);
  }

  function whatsappUrl(message) {
    return `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  function buildCartMessage() {
    const lines = cart.entries().map(([id, qty]) => {
      const item = byId.get(id);
      return item ? `- ${qty} x ${item.title} (${money(item.price * qty)})` : '';
    }).filter(Boolean);

    return [
      'Hello Bima Books, I would like to order:',
      ...lines,
      `Total: ${money(totalPrice())}`,
      nameInput.value.trim() && `Name: ${nameInput.value.trim()}`,
      areaInput.value.trim() && `Delivery area: ${areaInput.value.trim()}`,
      'Please confirm stock and send the invoice.'
    ].filter(Boolean).join('\n');
  }

  function moonPath(phase) {
    const t = 12 + 10 * (1 - 2 * phase);
    const n = 12 + 5.5 * (1 - 2 * phase);
    return `M12 2A10 10 0 0 1 12 22C${n} 22 ${t} 17.5 ${t} 12C${t} 6.5 ${n} 2 12 2Z`;
  }

  function createCartRow(id) {
    const item = byId.get(id);
    const row = rowTemplate.content.firstElementChild.cloneNode(true);
    row.dataset.row = id;
    row.querySelector('img').src = item.image;
    row.querySelector('img').alt = '';
    row.querySelector('.row-title').textContent = item.title;

    row.querySelectorAll('[data-step]').forEach((button) => {
      button.dataset.id = id;
      button.ariaLabel = `${button.dataset.step === '1' ? 'Add one more' : 'Remove one'} ${item.title}`;
    });

    return row;
  }

  function renderCart() {
    for (const row of rows.querySelectorAll('[data-row]')) {
      if (!cart.has(row.dataset.row)) row.remove();
    }

    for (const [id, qty] of cart.entries()) {
      const row = rows.querySelector(`[data-row="${id}"]`) || rows.appendChild(createCartRow(id));
      const item = byId.get(id);
      row.querySelector('.row-price').textContent = money(item.price * qty);
      row.querySelector('output').textContent = String(qty);
    }

    cartDialog.querySelector('.total strong').textContent = money(totalPrice());
    cartDialog.dataset.empty = String(totalQuantity() === 0);
    sendButton.href = whatsappUrl(buildCartMessage());
  }

  function render() {
    const count = totalQuantity();
    const total = totalPrice();
    const phase = Math.min(count / 6, 1);
    const path = moonPath(phase);

    cartButton.style.setProperty('--phase', String(phase));
    cartButton.querySelector('.moon-lit').setAttribute('d', path);
    cartButton.querySelector('.moon-lit').style.setProperty('d', `path("${path}")`);
    cartButton.querySelector('.cart-count').textContent = String(count);
    cartButton.querySelector('.cart-label').textContent = count ? money(total) : 'Order';
    cartButton.ariaLabel = count
      ? `Your order: ${count} item${count > 1 ? 's' : ''}, ${money(total)}`
      : 'Your order is empty';

    for (const item of items) {
      const qty = cart.qty(item.querySelector('[data-add]').dataset.add);
      item.classList.toggle('in-order', qty > 0);
      item.querySelector('output').textContent = String(qty);
    }

    renderCart();
  }

  function setQuantity(id, quantity) {
    cart.set(id, quantity);
    render();
  }

  function applyFilters() {
    const [min, max] = filters.age.split('-').map(Number);
    let visible = 0;

    for (const item of items) {
      const matchesAge = Number(item.dataset.min) <= max && Number(item.dataset.max) >= min;
      const matchesKind = filters.kind === 'all' || item.dataset.kind === filters.kind;
      const show = matchesAge && matchesKind;
      item.hidden = !show;
      if (show) visible += 1;
    }

    for (const chip of ageChips) chip.ariaPressed = String(chip.dataset.age === filters.age);
    for (const chip of kindChips) chip.ariaPressed = String(chip.dataset.kind === filters.kind);

    document.querySelector('.count').textContent = `${visible} pick${visible === 1 ? '' : 's'}` +
      (filters.age === '0-12' ? '' : ` for ages ${min} to ${max}`);
    document.querySelector('.empty').hidden = visible > 0;
  }

  document.addEventListener('click', (event) => {
    const target = event.target;
    const add = target.closest('[data-add]');
    const step = target.closest('[data-step]');
    const age = target.closest('[data-age]');
    const kind = target.closest('[data-kind]');

    if (add) {
      const id = add.dataset.add;
      cart.add(id, 1);
      render();
      add.parentElement.querySelector('[data-step="1"]').focus();
      announce.textContent = `${byId.get(id).title} added. ${totalQuantity()} in your order.`;
      return;
    }

    if (step) {
      const id = step.dataset.id;
      const qty = Math.max(0, cart.qty(id) + Number(step.dataset.step));
      const inDialog = cartDialog.contains(step);
      setQuantity(id, qty);

      if (!cart.has(id)) {
        const fallback = inDialog ? cartDialog.querySelector('[data-close]') : document.querySelector(`[data-add="${id}"]`);
        fallback?.focus({ preventScroll: true });
      }
      return;
    }

    if (age) {
      filters.age = age.dataset.age;
      applyFilters();
      if (age.closest('.hero')) document.querySelector('#shelf').scrollIntoView();
      return;
    }

    if (kind) {
      filters.kind = kind.dataset.kind;
      applyFilters();
      return;
    }

    if (target.closest('[data-close]') || (target === cartDialog && isBackdropClick(cartDialog, event))) {
      cartDialog.close();
    }
  });

  function isBackdropClick(dialog, event) {
    const rect = dialog.getBoundingClientRect();
    return event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  }

  cartButton.addEventListener('click', () => {
    if (!cartDialog.open) cartDialog.showModal();
  });

  cartDialog.addEventListener('input', () => {
    sendButton.href = whatsappUrl(buildCartMessage());
  });

  const pickForm = document.querySelector('.pick-form');
  pickForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(pickForm);
    const age = pickForm.querySelector('select');
    const error = pickForm.querySelector('.error');

    error.hidden = Boolean(age.value);
    age.ariaInvalid = String(!age.value);
    if (!age.value) {
      age.focus();
      return;
    }

    const loves = String(data.get('loves') || '').trim();
    const budget = String(data.get('budget') || '').trim();
    const message = [
      'Hello Bima Books, please help me pick books for my child.',
      `Age: ${age.value}`,
      `For: ${data.get('for')}`,
      loves && `They love: ${loves}`,
      budget && `Budget: ₦${budget.replace(/^₦/, '')}`
    ].filter(Boolean).join('\n');

    window.open(whatsappUrl(message), '_blank', 'noopener');
  });

  window.addEventListener('bima:cart', render);
  render();
})();
