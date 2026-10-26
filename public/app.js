const steps = [
  {
    id: 'age',
    title: 'How old is your little one?',
    subtitle: "We'll match books to the stage they're at right now.",
    options: [
      { value: 'newborn', emoji: '👶', title: '0-3 months', desc: 'High-contrast & soothing' },
      { value: 'baby', emoji: '🍼', title: '4-12 months', desc: 'Board books & lift-the-flaps' },
      { value: 'toddler', emoji: '🧸', title: '1-2 years', desc: 'First words & sturdy pages' },
      { value: 'preschool', emoji: '🎈', title: '2-4 years', desc: 'Storytime favourites' }
    ]
  },
  {
    id: 'time',
    title: 'When do you read together most?',
    subtitle: 'Set the tone for your snuggle time.',
    options: [
      { value: 'bedtime', emoji: '🌙', title: 'Bedtime wind-down', desc: 'Calm, cosy & rhythmic' },
      { value: 'morning', emoji: '☀️', title: 'Morning snuggles', desc: 'Bright & silly to start the day' },
      { value: 'on-the-go', emoji: '🚗', title: 'On-the-go', desc: 'Tiny books for diaper bags' },
      { value: 'anytime', emoji: '❤️', title: 'Anytime snuggles', desc: 'Mix it all up' }
    ]
  },
  {
    id: 'interest',
    title: 'What sparks their curiosity?',
    subtitle: 'Follow their wonder.',
    options: [
      { value: 'animals', emoji: '🐻', title: 'Animals & creatures', desc: 'Fur, feathers & fun sounds' },
      { value: 'first-words', emoji: '🔤', title: 'First words', desc: 'Everyday objects & labels' },
      { value: 'feelings', emoji: '😊', title: 'Feelings & kindness', desc: 'Big feelings, gentle lessons' },
      { value: 'rhyme', emoji: '🎶', title: 'Rhymes & songs', desc: 'Clap, bounce & giggle' }
    ]
  },
  {
    id: 'goal',
    title: "What's your goal right now?",
    subtitle: "We'll lean into it.",
    options: [
      { value: 'vocab', emoji: '🗣️', title: 'Build vocabulary', desc: 'Name the world together' },
      { value: 'bond', emoji: '🤗', title: 'Stronger bond', desc: 'More snuggles, less screen time' },
      { value: 'routine', emoji: '🛏️', title: 'Create a routine', desc: 'A book before bed becomes magic' },
      { value: 'collection', emoji: '💚', title: 'Start a collection', desc: 'Build a library to grow into' }
    ]
  },
  {
    id: 'vibe',
    title: 'Pick your snuggle vibe',
    subtitle: 'One last touch of personality.',
    options: [
      { value: 'cozy', emoji: '☁️', title: 'Cosy & gentle', desc: 'Whispery sweet stories' },
      { value: 'silly', emoji: '😂', title: 'Silly & giggly', desc: 'Tummy tickles guaranteed' },
      { value: 'adventurous', emoji: '🦁', title: 'Adventurous', desc: 'Explore the wide world' },
      { value: 'classic', emoji: '🎀', title: 'Timeless & sweet', desc: 'Stories to pass down' }
    ]
  }
];

const books = window.BIMA_CATALOG || [];
const config = window.BIMA_CONFIG || {};
const cart = window.BimaCart;
const AGE_RANGES = { newborn: [0, 0.3], baby: [0.3, 1], toddler: [1, 2], preschool: [2, 4] };

function money(amount) {
  return `₦${Number(amount).toLocaleString('en-NG')}`;
}

function ageMatches(book, answer) {
  const range = AGE_RANGES[answer] || [0, 12];
  return book.ages[0] <= range[1] && book.ages[1] >= range[0];
}

function bookLabel(book) {
  if (book.kind === 'toy') return 'Learning toy';
  if (book.kind === 'bundle') return 'Bundle';
  return 'Storybook';
}

function pickReason(book) {
  const kind = book.kind === 'toy' ? 'hands-on learning pick' : book.kind === 'bundle' ? 'ready-made set' : 'story pick';
  return `${book.note}. A ${kind} for ages ${book.ages[0]}–${book.ages[1]}.`;
}

const startQuizBtn = document.getElementById('startQuiz');
const exitQuizBtn = document.getElementById('exitQuiz');
const quizSection = document.getElementById('quiz');
const quizCard = document.getElementById('quizCard');
const progressBar = document.getElementById('progressBar');
const currentStepEl = document.getElementById('currentStep');
const totalStepsEl = document.getElementById('totalSteps');
const resultsSection = document.getElementById('results');
const stackGrid = document.getElementById('stackGrid');
const shelfGrid = document.getElementById('shelfGrid');
const restartQuizBtn = document.getElementById('restartQuiz');
const addAllPicksBtn = document.getElementById('addAllPicks');
const whatsappOrderBtn = document.getElementById('whatsappOrder');
const toastEl = document.getElementById('toast');

const stepTemplate = document.getElementById('stepTemplate');
const optionTemplate = document.getElementById('optionTemplate');
const bookCardTemplate = document.getElementById('bookCardTemplate');
const shelfCardTemplate = document.getElementById('shelfCardTemplate');

const state = { stepIndex: 0, answers: {} };
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let currentPicks = [];
let toastTimer;
let isTransitioning = false;

totalStepsEl.textContent = steps.length;

startQuizBtn.addEventListener('click', () => {
  isTransitioning = false;
  document.body.classList.add('quiz-open');
  resultsSection.classList.remove('active');
  quizSection.classList.add('active');
  renderStep(state.stepIndex);
  scrollToQuiz();
});

exitQuizBtn.addEventListener('click', () => {
  document.body.classList.remove('quiz-open');
  quizSection.classList.remove('active');
  resultsSection.classList.remove('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

restartQuizBtn.addEventListener('click', () => {
  isTransitioning = false;
  state.stepIndex = 0;
  Object.keys(state.answers).forEach((key) => delete state.answers[key]);
  document.body.classList.add('quiz-open');
  resultsSection.classList.remove('active');
  quizSection.classList.add('active');
  quizCard.innerHTML = '';
  renderStep(state.stepIndex);
  scrollToQuiz();
});

addAllPicksBtn.addEventListener('click', () => {
  currentPicks.forEach((book) => cart.add(book.id));
  showToast('All 3 picks are in your order');
  syncButtons();
});

window.addEventListener('bima:cart', syncButtons);

function scrollToQuiz() {
  requestAnimationFrame(() => {
    const top = quizSection.getBoundingClientRect().top + window.scrollY - 68;
    window.scrollTo({ top: Math.max(top, 0), behavior: 'smooth' });
  });
}

function renderStep(index) {
  quizCard.innerHTML = '';
  const step = steps[index];
  const fragment = stepTemplate.content.cloneNode(true);
  const stepEl = fragment.querySelector('.step');
  const optionsGrid = fragment.querySelector('.options-grid');
  const backBtn = fragment.querySelector('.btn-back');
  const nextBtn = fragment.querySelector('.btn-next');

  stepEl.dataset.step = step.id;
  stepEl.classList.add('active');
  fragment.querySelector('.step-title').textContent = step.title;
  fragment.querySelector('.step-subtitle').textContent = step.subtitle;

  step.options.forEach((option) => {
    const optionFrag = optionTemplate.content.cloneNode(true);
    const card = optionFrag.querySelector('.option-card');
    card.dataset.value = option.value;
    card.setAttribute('aria-pressed', state.answers[step.id] === option.value ? 'true' : 'false');
    optionFrag.querySelector('.option-emoji').textContent = option.emoji;
    optionFrag.querySelector('.option-title').textContent = option.title;
    optionFrag.querySelector('.option-desc').textContent = option.desc;

    if (state.answers[step.id] === option.value) {
      card.classList.add('active');
    }

    card.addEventListener('click', () => {
      optionsGrid.querySelectorAll('.option-card').forEach((node) => {
        node.classList.remove('active');
        node.setAttribute('aria-pressed', 'false');
      });
      card.classList.add('active');
      card.setAttribute('aria-pressed', 'true');
      state.answers[step.id] = option.value;
      nextBtn.disabled = false;
    });

    optionsGrid.appendChild(optionFrag);
  });

  backBtn.style.display = index === 0 ? 'none' : 'inline-flex';
  backBtn.addEventListener('click', () => {
    if (index === 0) return;
    goToStep(index - 1, -1);
  });

  nextBtn.disabled = !state.answers[step.id];
  nextBtn.textContent = index === steps.length - 1 ? 'See my picks' : 'Next';
  nextBtn.addEventListener('click', () => {
    if (!state.answers[step.id]) return;
    if (index < steps.length - 1) {
      goToStep(index + 1, 1);
    } else {
      goToResults();
    }
  });

  quizCard.appendChild(fragment);
  updateProgress();
  return stepEl;
}

function animateStepOut(step, direction, done) {
  if (prefersReducedMotion || !step || typeof step.animate !== 'function') {
    done();
    return;
  }

  isTransitioning = true;
  step.style.pointerEvents = 'none';
  let settled = false;

  const exit = step.animate(
    [
      { transform: 'translateX(0) scale(1)', opacity: 1 },
      { transform: `translateX(${direction > 0 ? '-24px' : '24px'}) scale(0.985)`, opacity: 0 }
    ],
    {
      duration: 180,
      easing: 'cubic-bezier(0.4, 0, 1, 1)',
      fill: 'forwards'
    }
  );

  exit.onfinish = () => {
    if (settled) return;
    settled = true;
    done();
  };

  exit.oncancel = () => {
    if (settled) return;
    settled = true;
    isTransitioning = false;
    step.style.pointerEvents = '';
  };
}

function animateStepIn(step, direction) {
  if (prefersReducedMotion || !step || typeof step.animate !== 'function') return;

  step.animate(
    [
      { transform: `translateX(${direction > 0 ? '26px' : '-26px'}) scale(0.985)`, opacity: 0 },
      { transform: 'translateX(0) scale(1)', opacity: 1 }
    ],
    {
      duration: 300,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)'
    }
  );

  step.querySelectorAll('.option-card').forEach((card, index) => {
    card.animate(
      [
        { transform: 'translateY(10px)', opacity: 0 },
        { transform: 'translateY(0)', opacity: 1 }
      ],
      {
        duration: 240,
        delay: 50 + index * 35,
        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
        fill: 'backwards'
      }
    );
  });
}

function goToStep(nextIndex, direction) {
  if (isTransitioning) return;
  const currentStep = quizCard.querySelector('.step');

  animateStepOut(currentStep, direction, () => {
    state.stepIndex = nextIndex;
    const nextStep = renderStep(nextIndex);
    animateStepIn(nextStep, direction);
    isTransitioning = false;
    scrollToQuiz();
  });
}

function goToResults() {
  if (isTransitioning) return;
  const currentStep = quizCard.querySelector('.step');

  animateStepOut(currentStep, 1, () => {
    isTransitioning = false;
    showResults();
  });
}

function updateProgress() {
  const progress = ((state.stepIndex + 1) / steps.length) * 100;
  progressBar.style.width = `${progress}%`;
  currentStepEl.textContent = state.stepIndex + 1;
}

function showResults() {
  currentPicks = pickBooks(state.answers);
  quizSection.classList.remove('active');
  resultsSection.classList.add('active');
  renderPicks();
  renderShelf();
  updateWhatsAppLink();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scoreBook(book) {
  let score = 0;
  if (ageMatches(book, state.answers.age)) score += 4;
  Object.entries(state.answers).forEach(([key, value]) => {
    if (key !== 'age' && book.tags.includes(value)) score += 2;
  });
  if (state.answers.goal === 'routine' && book.tags.includes('routine')) score += 2;
  return score;
}

function pickBooks() {
  return [...books]
    .map((book, index) => ({ book, score: scoreBook(book), index }))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3)
    .map((entry) => entry.book);
}

function renderPicks() {
  stackGrid.innerHTML = '';
  currentPicks.forEach((book, index) => {
    const frag = bookCardTemplate.content.cloneNode(true);
    const card = frag.querySelector('.book-card');
    const source = frag.querySelector('source');
    const img = frag.querySelector('.book-cover-img');

    source.srcset = book.imageWebp || book.image;
    img.src = book.image;
    img.alt = `${book.title} cover`;
    frag.querySelector('.book-badge').textContent = bookLabel(book);
    frag.querySelector('.book-tag').textContent = 'A BIMA pick';
    frag.querySelector('.book-title').textContent = book.title;
    frag.querySelector('.book-author').textContent = `${money(book.price)} · Ages ${book.ages[0]}–${book.ages[1]}`;
    frag.querySelector('.book-reason').textContent = pickReason(book);

    const addBtn = frag.querySelector('.add-to-order');
    addBtn.dataset.bookId = book.id;
    addBtn.addEventListener('click', () => toggleBook(book.id));
    syncButton(addBtn, book.id);

    card.style.animation = `fadeUp 320ms ease ${index * 80}ms forwards`;
    card.style.opacity = '0';
    card.style.transform = 'translateY(16px)';
    stackGrid.appendChild(frag);
  });
}

function renderShelf() {
  shelfGrid.innerHTML = '';
  const pickIds = new Set(currentPicks.map((book) => book.id));
  books
    .filter((book) => !pickIds.has(book.id))
    .forEach((book) => {
      const frag = shelfCardTemplate.content.cloneNode(true);
      const source = frag.querySelector('source');
      const img = frag.querySelector('.shelf-cover-img');
      source.srcset = book.imageWebp || book.image;
      img.src = book.image;
      img.alt = `${book.title} cover`;
      frag.querySelector('.shelf-title').textContent = book.title;
      frag.querySelector('.shelf-author').textContent = `${money(book.price)} · ${bookLabel(book)}`;

      const addBtn = frag.querySelector('.shelf-add');
      addBtn.dataset.bookId = book.id;
      addBtn.addEventListener('click', () => toggleBook(book.id));
      syncShelfButton(addBtn, book.id);
      shelfGrid.appendChild(frag);
    });
}

function toggleBook(id) {
  if (cart.has(id)) {
    cart.remove(id);
    showToast('Removed from your order');
  } else {
    cart.add(id);
    showToast('Added to your order');
  }
  syncButtons();
}

function syncButtons() {
  document.querySelectorAll('.add-to-order').forEach((btn) => syncButton(btn, btn.dataset.bookId));
  document.querySelectorAll('.shelf-add').forEach((btn) => syncShelfButton(btn, btn.dataset.bookId));
  updateWhatsAppLink();
}

function syncButton(btn, id) {
  const added = cart.has(id);
  btn.textContent = added ? 'In your order ✓' : 'Add to order';
  btn.classList.toggle('is-added', added);
  btn.setAttribute('aria-pressed', added ? 'true' : 'false');
}

function syncShelfButton(btn, id) {
  const added = cart.has(id);
  btn.textContent = added ? 'Added ✓' : 'Add';
  btn.classList.toggle('is-added', added);
  btn.setAttribute('aria-pressed', added ? 'true' : 'false');
}

function updateWhatsAppLink() {
  const ids = cart.count() > 0 ? cart.ids() : currentPicks.map((book) => book.id);
  if (ids.length === 0) return;
  const lines = ids.map((id) => {
    const book = books.find((item) => item.id === id);
    if (!book) return '';
    const qty = cart.count() > 0 ? cart.qty(id) : 1;
    return `- ${qty} x ${book.title} (${money(book.price * qty)})`;
  }).filter(Boolean);
  const age = ageLabel(state.answers.age);
  const total = ids.reduce((sum, id) => {
    const book = books.find((item) => item.id === id);
    return book ? sum + book.price * (cart.count() > 0 ? cart.qty(id) : 1) : sum;
  }, 0);
  const message = `Hi BIMA Books! I'd like to order these books:\n\n${lines.join('\n')}\n\nTotal: ${money(total)}\nMy little reader: ${age || 'not sure yet'}\nThank you!`;
  const number = (config.whatsappNumber || '').replace(/[^\d]/g, '');
  const encoded = encodeURIComponent(message);
  whatsappOrderBtn.href = number
    ? `https://wa.me/${number}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;
  whatsappOrderBtn.textContent = `Order via WhatsApp (${cart.count() || ids.length})`;
}

function ageLabel(value) {
  return {
    newborn: '0-3 months',
    baby: '4-12 months',
    toddler: '1-2 years',
    preschool: '2-4 years'
  }[value] || '';
}

function showToast(message) {
  toastEl.textContent = message;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 2600);
}

const style = document.createElement('style');
style.textContent = `
@keyframes fadeUp {
  to { opacity: 1; transform: translateY(0); }
}
`;
document.head.appendChild(style);
