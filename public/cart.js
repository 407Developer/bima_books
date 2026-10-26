(function () {
  const KEY = 'bimaOrder';

  function read() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch (error) {
      return [];
    }
  }

  function write(items) {
    localStorage.setItem(KEY, JSON.stringify(items));
    updateBadges();
    window.dispatchEvent(new CustomEvent('bima:cart', { detail: { items } }));
  }

  function add(id) {
    const items = read();
    if (!items.includes(id)) {
      items.push(id);
      write(items);
    }
    return items;
  }

  function remove(id) {
    const items = read().filter((item) => item !== id);
    write(items);
    return items;
  }

  function clear() {
    write([]);
  }

  function has(id) {
    return read().includes(id);
  }

  function count() {
    return read().length;
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

  window.BimaCart = { read, add, remove, clear, has, count, updateBadges };
  document.addEventListener('DOMContentLoaded', updateBadges);
  window.addEventListener('storage', updateBadges);
})();
