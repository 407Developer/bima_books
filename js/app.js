const steps = [
    {
        id: 'age',
        title: "How old is your little one?",
        subtitle: "We'll match to board books they can actually hold.",
        options: [
            { value: 'newborn', emoji: '👶', title: '0-3 months', desc: 'High-contrast & soothing' },
            { value: 'baby', emoji: '🍼', title: '4-12 months', desc: 'Board books & lift-the-flaps' },
            { value: 'toddler', emoji: '🧸', title: '1-2 years', desc: 'First words & sturdy pages' },
            { value: 'preschool', emoji: '🎈', title: '2-4 years', desc: 'Storytime favorites' }
        ]
    },
    {
        id: 'time',
        title: "When do you read together most?",
        subtitle: "Set the tone for your snuggle time.",
        options: [
            { value: 'bedtime', emoji: '🌙', title: 'Bedtime wind-down', desc: 'Calm, cozy & rhythmic' },
            { value: 'morning', emoji: '☀️', title: 'Morning snuggles', desc: 'Bright & silly to start the day' },
            { value: 'on-the-go', emoji: '🚗', title: 'On-the-go', desc: 'Tiny books for diaper bags' },
            { value: 'anytime', emoji: '❤️', title: 'Anytime snuggles', desc: 'Mix it all up' }
        ]
    },
    {
        id: 'interest',
        title: "What sparks their curiosity?",
        subtitle: "Follow their wonder.",
        options: [
            { value: 'animals', emoji: '🐻', title: 'Animals & creatures', desc: 'Fur, feathers & fun sounds' },
            { value: 'first-words', emoji: '🔤', title: 'First words', desc: 'Everyday objects & labels' },
            { value: 'feelings', emoji: '😊', title: 'Feelings & kindness', desc: 'Big feelings, gentle lessons' },
            { value: 'rhyme', emoji: '🎶', title: 'Rhymes & songs', desc: 'Clap, bounce & giggle' }
        ]
    },
    {
        id: 'sensory',
        title: "Which sensory play do they love?",
        subtitle: "The more touchy-feely, the better.",
        options: [
            { value: 'lift-flap', emoji: '👀', title: 'Lift-the-flaps', desc: 'Peekaboo surprises' },
            { value: 'textures', emoji: '🧵', title: 'Touch & feel', desc: 'Soft, fuzzy, bumpy' },
            { value: 'board', emoji: '📚', title: 'Classic board books', desc: 'Chew-proof & durable' },
            { value: 'minimal', emoji: '✨', title: 'Simple & minimal', desc: 'High-contrast for tiny eyes' }
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
        title: "Pick your snuggle vibe",
        subtitle: "One last touch of personality.",
        options: [
            { value: 'cozy', emoji: '☁️', title: 'Cozy & gentle', desc: 'Whispery sweet stories' },
            { value: 'silly', emoji: '😂', title: 'Silly & giggly', desc: 'Tummy tickles guaranteed' },
            { value: 'adventurous', emoji: '🦁', title: 'Adventurous', desc: 'Explore the wide world' },
            { value: 'classic', emoji: '🎀', title: 'Timeless & sweet', desc: 'Stories to pass down' }
        ]
    }
];

const bookLibrary = [
    {
        id: 'peekaboo',
        title: 'Peekaboo Pals',
        reason: 'Perfect for lift-the-flap giggles and building object permanence.',
        tag: 'Lift-the-flap',
        covers: ['sky', 'butter']
    },
    {
        id: 'first-words',
        title: 'First Words Farm',
        reason: 'Bright labels help tiny ones start naming animals and things.',
        tag: 'First words',
        covers: ['mint', 'sky']
    },
    {
        id: 'bedtime',
        title: 'Starry Snuggles',
        reason: 'Soft rhymes lull little ones into the coziest bedtime.',
        tag: 'Bedtime',
        covers: ['butter', 'rose']
    },
    {
        id: 'animals',
        title: 'Big Little Animal Book',
        reason: 'Chunky pages with bold animals made for little hands.',
        tag: 'Animals',
        covers: ['mint', 'butter']
    },
    {
        id: 'feelings',
        title: 'My Big Feelings',
        reason: 'Gentle stories that help little hearts name and navigate feelings.',
        tag: 'Feelings',
        covers: ['rose', 'sky']
    },
    {
        id: 'textures',
        title: 'Touch & Tumble',
        reason: 'Irresistible textures beg to be stroked, patted and explored.',
        tag: 'Touch & feel',
        covers: ['sky', 'mint']
    }
];

const startQuizBtn = document.getElementById('startQuiz');
const quizSection = document.getElementById('quiz');
const quizCard = document.getElementById('quizCard');
const progressBar = document.getElementById('progressBar');
const currentStepEl = document.getElementById('currentStep');
const totalStepsEl = document.getElementById('totalSteps');
const resultsSection = document.getElementById('results');
const stackGrid = document.getElementById('stackGrid');
const restartQuizBtn = document.getElementById('restartQuiz');

const stepTemplate = document.getElementById('stepTemplate');
const optionTemplate = document.getElementById('optionTemplate');
const bookCardTemplate = document.getElementById('bookCardTemplate');

let currentStepIndex = 0;
const answers = {};

totalStepsEl.textContent = steps.length;

startQuizBtn.addEventListener('click', () => {
    quizSection.classList.add('active');
    window.scrollTo({ top: quizSection.offsetTop - 80, behavior: 'smooth' });
    renderStep(currentStepIndex);
});

restartQuizBtn.addEventListener('click', () => {
    currentStepIndex = 0;
    Object.keys(answers).forEach((key) => delete answers[key]);
    resultsSection.classList.remove('active');
    quizSection.classList.add('active');
    quizCard.innerHTML = '';
    renderStep(currentStepIndex);
    window.scrollTo({ top: quizSection.offsetTop - 80, behavior: 'smooth' });
});

function renderStep(index) {
    quizCard.innerHTML = '';
    const step = steps[index];
    const fragment = stepTemplate.content.cloneNode(true);
    const stepEl = fragment.querySelector('.step');
    stepEl.classList.add('active');
    
    fragment.querySelector('.step-title').textContent = step.title;
    fragment.querySelector('.step-subtitle').textContent = step.subtitle;
    
    const optionsGrid = fragment.querySelector('.options-grid');
    const backBtn = fragment.querySelector('.btn-back');
    const nextBtn = fragment.querySelector('.btn-next');
    
    step.options.forEach((option) => {
        const optionFrag = optionTemplate.content.cloneNode(true);
        const card = optionFrag.querySelector('.option-card');
        card.dataset.value = option.value;
        optionFrag.querySelector('.option-emoji').textContent = option.emoji;
        optionFrag.querySelector('.option-title').textContent = option.title;
        optionFrag.querySelector('.option-desc').textContent = option.desc;
        
        card.addEventListener('click', (e) => {
            // Prevent event bubbling issues
            e.preventDefault();
            optionsGrid.querySelectorAll('.option-card').forEach((btn) => btn.classList.remove('active'));
            card.classList.add('active');
            answers[step.id] = option.value;
            if (nextBtn) {
                nextBtn.disabled = false;
            }
        });
        
        optionsGrid.appendChild(optionFrag);
    });
    
    backBtn.style.visibility = index === 0 ? 'hidden' : 'visible';
    
    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (index === 0) return;
        currentStepIndex--;
        renderStep(currentStepIndex);
    });
    
    nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        if (!answers[step.id]) {
            nextBtn.disabled = true;
            return;
        }
        if (index < steps.length - 1) {
            currentStepIndex++;
            renderStep(currentStepIndex);
        } else {
            showResults();
        }
    });
    
    if (answers[step.id]) {
        optionsGrid.querySelectorAll('.option-card').forEach((btn) => {
            if (btn.dataset.value === answers[step.id]) {
                btn.classList.add('active');
                if (nextBtn) nextBtn.disabled = false;
            }
        });
    } else {
        if (nextBtn) nextBtn.disabled = true;
    }
    
    quizCard.appendChild(fragment);
    updateProgress();
    // Ensure button is properly enabled/disabled
    setTimeout(() => {
        const nb = quizCard.querySelector('.btn-next');
        if (nb && answers[step.id]) nb.disabled = false;
        else if (nb) nb.disabled = true;
    }, 0);
}

function updateProgress() {
    const progress = ((currentStepIndex + 1) / steps.length) * 100;
    progressBar.style.width = progress + '%';
    currentStepEl.textContent = currentStepIndex + 1;
}

function showResults() {
    quizSection.classList.remove('active');
    resultsSection.classList.add('active');
    stackGrid.innerHTML = '';
    
    const picks = getPicks();
    
    picks.forEach((book, index) => {
        const frag = bookCardTemplate.content.cloneNode(true);
        const card = frag.querySelector('.book-card');
        const cover = frag.querySelector('.book-cover');
        const colors = book.covers;
        cover.style.background = `radial-gradient(circle at top, var(--${colors[1] || colors[0]}), var(--${colors[0]}))`;
        frag.querySelector('.book-title').textContent = book.title;
        frag.querySelector('.book-reason').textContent = book.reason;
        frag.querySelector('.book-tag').textContent = book.tag;
        card.style.animation = `fadeUp 320ms ease ${index * 80}ms forwards`;
        card.style.opacity = '0';
        card.style.transform = 'translateY(16px)';
        stackGrid.appendChild(frag);
    });
    
    window.scrollTo({ top: resultsSection.offsetTop - 80, behavior: 'smooth' });
}

function getPicks() {
    const picks = [];
    const used = new Set();
    
    if (answers.interest === 'animals') addPick('animals', picks, used);
    if (answers.interest === 'first-words') addPick('first-words', picks, used);
    if (answers.time === 'bedtime') addPick('bedtime', picks, used);
    if (answers.sensory === 'lift-flap') addPick('peekaboo', picks, used);
    if (answers.sensory === 'textures') addPick('textures', picks, used);
    if (answers.interest === 'feelings') addPick('feelings', picks, used);
    
    while (picks.length < 3) {
        const remaining = bookLibrary.filter((book) => !used.has(book.id));
        if (remaining.length === 0) break;
        const book = remaining[Math.floor(Math.random() * remaining.length)];
        addPick(book.id, picks, used);
    }
    
    return picks;
}

function addPick(id, picks, used) {
    if (used.has(id)) return;
    const book = bookLibrary.find((b) => b.id === id);
    if (!book) return;
    picks.push(book);
    used.add(id);
}

const style = document.createElement('style');
style.textContent = `
@keyframes fadeUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;
document.head.appendChild(style);
