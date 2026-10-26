(function () {
  const books = window.BIMA_BOOKS || [];
  const config = window.BIMA_CONFIG || {};
  const cart = window.BimaCart;

  const form = document.getElementById('checkoutForm');
  const orderList = document.getElementById('orderList');
  const orderEmpty = document.getElementById('orderEmpty');
  const orderTotal = document.getElementById('orderTotal');
  const submitBtn = document.getElementById('checkoutSubmit');
  const checkoutNote = document.getElementById('checkoutNote');
  const emailInput = document.getElementById('email');
  const paystackRadio = document.getElementById('paystackOption');
  const paystackLabel = document.getElementById('paystackOptionLabel');
  const paystackNote = document.getElementById('paystackNote');
  const whatsappRadio = form.querySelector('input[name="payment"][value="whatsapp"]');
  const toastEl = document.getElementById('toast');

  let toastTimer;
  let canPayOnline = false;
  let currentTotal = null;

  function getBooks() {
    return cart.read().map((id) => books.find((book) => book.id === id)).filter(Boolean);
  }

  function priceFor(book) {
    return Number((config.prices || {})[book.id] || 0);
  }

  function calculateTotal(items) {
    if (items.length === 0) return null;
    const prices = items.map(priceFor);
    if (prices.some((price) => !price || price <= 0)) return null;
    return prices.reduce((sum, price) => sum + price, 0);
  }

  function formatMoney(amount) {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: config.currency || 'NGN',
      maximumFractionDigits: 0
    }).format(amount);
  }

  function render() {
    const ids = cart.read();
    const items = getBooks();
    orderList.innerHTML = '';
    orderEmpty.hidden = items.length > 0;

    ids.forEach((id) => {
      const book = books.find((item) => item.id === id);
      if (!book) return;
      const row = document.createElement('div');
      row.className = 'order-item';
      row.innerHTML = `
        <div class="order-thumb"><img src="${book.image}" alt="" loading="lazy"></div>
        <div class="order-info">
          <span class="order-title"></span>
          <span class="order-author"></span>
        </div>
        <button class="order-remove" type="button">Remove</button>
      `;
      row.querySelector('.order-title').textContent = book.title;
      row.querySelector('.order-author').textContent = book.author ? `by ${book.author}` : '';
      row.querySelector('.order-remove').addEventListener('click', () => {
        cart.remove(id);
        showToast('Removed from your order');
      });
      orderList.appendChild(row);
    });

    currentTotal = calculateTotal(items);
    orderTotal.textContent = currentTotal ? formatMoney(currentTotal) : 'Confirmed on WhatsApp';

    canPayOnline = Boolean(config.paystackPublicKey) && items.length > 0 && currentTotal !== null;
    paystackRadio.disabled = !canPayOnline;
    paystackLabel.classList.toggle('is-disabled', !canPayOnline);
    paystackNote.textContent = canPayOnline
      ? 'Pay securely by card. Your total is shown with your order.'
      : 'Card payment is being set up. Please use WhatsApp for now.';

    if (!canPayOnline && paystackRadio.checked) {
      whatsappRadio.checked = true;
    }

    updatePaymentUI();
  }

  function selectedPayment() {
    return form.querySelector('input[name="payment"]:checked').value;
  }

  function updatePaymentUI() {
    const isPaystack = selectedPayment() === 'paystack';
    emailInput.required = isPaystack;
    submitBtn.textContent = isPaystack ? 'Pay securely with Paystack' : 'Send order on WhatsApp';
    submitBtn.className = `btn ${isPaystack ? 'btn-primary' : 'btn-whatsapp'}`;
    checkoutNote.textContent = isPaystack
      ? 'You will be redirected to Paystack to pay securely. After payment, your order details will open in WhatsApp.'
      : "You'll be taken to WhatsApp to send your order. We'll confirm the total, delivery fee and payment details with you.";
  }

  form.addEventListener('change', (event) => {
    if (event.target.name === 'payment') updatePaymentUI();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const items = getBooks();
    if (items.length === 0) {
      showToast('Your order is empty. Add a book first.');
      return;
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    if (data.payment === 'paystack') {
      if (!canPayOnline || !currentTotal) {
        showToast('Card payment is not ready yet. Please order on WhatsApp.');
        whatsappRadio.checked = true;
        updatePaymentUI();
        return;
      }
      startPaystack(items, data, currentTotal);
      return;
    }

    sendWhatsApp(items, data, currentTotal, false, '');
  });

  function buildMessage(items, data, total, paid, reference) {
    const lines = items.map((book, index) => {
      const price = priceFor(book);
      const priceText = price ? ` — ${formatMoney(price)}` : '';
      return `${index + 1}. ${book.title}${book.author ? ` — ${book.author}` : ''}${priceText}`;
    });

    const totalText = total ? formatMoney(total) : 'Please confirm the total and delivery fee';
    const paymentText = paid
      ? `Paid online via Paystack${reference ? ` (ref: ${reference})` : ''}`
      : 'To be confirmed on WhatsApp';

    return [
      'Hi BIMA Books! I would like to place an order.',
      '',
      'BOOKS',
      ...lines,
      '',
      `Total: ${totalText}`,
      `Payment: ${paymentText}`,
      '',
      'DELIVERY',
      `Name: ${data.name}`,
      `Phone: ${data.phone}`,
      data.email ? `Email: ${data.email}` : '',
      `Address: ${data.address}`,
      `City: ${data.city}`,
      `State: ${data.state}`,
      data.note ? `Note: ${data.note}` : '',
      '',
      'Thank you!'
    ].filter((line) => line !== '').join('\n');
  }

  function sendWhatsApp(items, data, total, paid, reference) {
    const message = buildMessage(items, data, total, paid, reference);
    const number = (config.whatsappNumber || '').replace(/[^\d]/g, '');
    const url = number
      ? `https://wa.me/${number}?text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;

    if (paid) {
      window.location.href = url;
    } else {
      const opened = window.open(url, '_blank', 'noopener');
      if (!opened) window.location.href = url;
      showToast('Opening WhatsApp…');
    }
  }

  async function loadPaystack() {
    if (window.PaystackPop) return;
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://js.paystack.co/v1/inline.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function startPaystack(items, data, total) {
    submitBtn.disabled = true;
    submitBtn.textContent = 'Opening secure payment…';

    try {
      await loadPaystack();
      const reference = `BIMA-${Date.now()}`;
      const handler = window.PaystackPop.setup({
        key: config.paystackPublicKey,
        email: data.email,
        amount: Math.round(total * 100),
        currency: config.currency || 'NGN',
        ref: reference,
        metadata: {
          custom_fields: [
            {
              display_name: 'Books',
              variable_name: 'books',
              value: items.map((book) => book.title).join(', ')
            },
            {
              display_name: 'Delivery',
              variable_name: 'delivery',
              value: `${data.address}, ${data.city}, ${data.state}`
            }
          ]
        },
        callback(response) {
          showToast('Payment received. Opening WhatsApp…');
          cart.clear();
          sendWhatsApp(items, data, total, true, response.reference || reference);
        },
        onClose() {
          showToast('Payment window closed. Your order is still here.');
          submitBtn.disabled = false;
          updatePaymentUI();
        }
      });
      handler.openIframe();
    } catch (error) {
      showToast('Could not start Paystack. Please order on WhatsApp.');
      submitBtn.disabled = false;
      updatePaymentUI();
    }
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2800);
  }

  window.addEventListener('bima:cart', render);
  render();
})();
