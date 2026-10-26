(function () {
  const KEY = 'bima-cart';
  const LEGACY_KEY = 'bimaOrder';

  function normalize(value) {
    if (Array.isArray(value)) {
      return value.reduce((items, id) => {
        if (typeof id === 'string' && id) items[id] = (items[id] || 0) + 1;
        return items;
      }, {});
    }

    if (!value || typeof value !== 'object') return {};

    return Object.entries(value).reduce((items, [id, quantity]) => {
      const qty = Math.max(0, Math.floor(Number(quantity) || 0));
      if (qty > 0) items[id] = qty;
      return items;
    }, {});
  }

  function read() {
    try {
      return normalize(JSON.parse(localStorage.getItem(KEY) || '{}'));
    } catch (error) {
      return {};
    }
  }

  function write(items) {
    const normalized = normalize(items);
    localStorage.setItem(KEY, JSON.stringify(normalized));
    updateBadges();
    window.dispatchEvent(new CustomEvent('bima:cart', { detail: { items: normalized } }));
  }

  function set(id, quantity) {
    const items = read();
    const qty = Math.max(0, Math.floor(Number(quantity) || 0));
    if (qty > 0) {
      items[id] = qty;
    } else {
      delete items[id];
    }
    write(items);
    return items;
  }

  function add(id, quantity = 1) {
    return set(id, (read()[id] || 0) + quantity);
  }

  function remove(id) {
    return set(id, 0);
  }

  function clear() {
    write({});
  }

  function has(id) {
    return (read()[id] || 0) > 0;
  }

  function qty(id) {
    return read()[id] || 0;
  }

  function count() {
    return Object.values(read()).reduce((total, quantity) => total + quantity, 0);
  }

  function entries() {
    return Object.entries(read());
  }

  function ids() {
    return Object.keys(read());
  }

  function updateBadges() {
    const total = count();
    document.querySelectorAll('[data-cart-count]').forEach((node) => {
      node.textContent = String(total);
    });
    document.querySelectorAll('[data-cart-fab]').forEach((node) => {
      node.classList.toggle('is-visible', total > 0);
    });
  }

  function migrateLegacyCart() {
    if (localStorage.getItem(KEY)) return;
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
      if (Array.isArray(legacy) && legacy.length) {
        localStorage.setItem(KEY, JSON.stringify(normalize(legacy)));
      }
    } catch (error) {
      return;
    }
  }

  migrateLegacyCart();

  window.BimaCart = { read, write, set, add, remove, clear, has, qty, count, entries, ids, updateBadges, KEY };
  document.addEventListener('DOMContentLoaded', updateBadges);
  window.addEventListener('storage', updateBadges);
})();
