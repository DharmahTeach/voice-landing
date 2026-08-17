/**
 * 🎙️ Изменение Голоса | Voice Changer — Interactive JavaScript
 * Web Audio API Acoustic Synthesizer & Demo Player, Waveform Visualizer & UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initHamburgerMenu();
  initAudioPlayer();
  initCategoryFilters();
  initComparisonToggle();
  initFaqAccordion();
  initStickyMobileCta();
  initWaveformVisualizer();
});

// ==========================================================================
// 1. Web Audio API Acoustic Synthesizer & Demo Player
// ==========================================================================
let audioCtx = null;
let currentOscillator = null;
let currentGain = null;
let currentPlayingPresetId = null;
let isVisualizerActive = false;

const PRESET_AUDIO_DATA = {
  // Female Voices
  girl_alisa: { freq: 215, type: 'sine', modFreq: 5, modGain: 15, filterFreq: 3200, duration: 2.2, label: 'Алиса' },
  girl_mia: { freq: 235, type: 'triangle', modFreq: 6, modGain: 18, filterFreq: 3800, duration: 2.0, label: 'Мия' },
  girl_victoria: { freq: 185, type: 'sine', modFreq: 4.5, modGain: 12, filterFreq: 2400, duration: 2.3, label: 'Виктория' },
  girl_kira: { freq: 210, type: 'sine', modFreq: 5.5, modGain: 16, filterFreq: 2800, duration: 2.1, label: 'Кира' },
  girl_eva: { freq: 200, type: 'sine', modFreq: 4, modGain: 10, filterFreq: 3400, echo: true, duration: 2.4, label: 'Ева' },

  // Male Voices
  man_maxim: { freq: 115, type: 'sawtooth', modFreq: 4, modGain: 8, filterFreq: 1800, duration: 2.2, label: 'Максим' },
  man_artem: { freq: 88, type: 'sawtooth', modFreq: 3.5, modGain: 6, filterFreq: 1200, duration: 2.4, label: 'Артём' },
  man_dmitry: { freq: 138, type: 'sawtooth', modFreq: 5, modGain: 10, filterFreq: 2200, duration: 2.0, label: 'Дмитрий' },
  man_mark: { freq: 106, type: 'sine', modFreq: 3.8, modGain: 7, filterFreq: 1600, duration: 2.3, label: 'Марк' },
  man_viktor: { freq: 78, type: 'sawtooth', modFreq: 3.0, modGain: 5, filterFreq: 950, duration: 2.5, label: 'Виктор' },

  // Original & Effects
  original: { freq: 125, type: 'sawtooth', modFreq: 4.2, modGain: 8, filterFreq: 2000, duration: 2.2, label: 'Оригинал' },
  child: { freq: 290, type: 'sine', modFreq: 7, modGain: 20, filterFreq: 4500, duration: 1.8, label: 'Ребёнок' },
  chipmunk: { freq: 380, type: 'triangle', modFreq: 8, modGain: 25, filterFreq: 5000, duration: 1.7, label: 'Бурундук' },
  robot: { freq: 100, type: 'square', modFreq: 25, modGain: 40, filterFreq: 1500, duration: 2.2, label: 'Робот' },
  monster: { freq: 58, type: 'sawtooth', modFreq: 15, modGain: 20, filterFreq: 600, echo: true, duration: 2.5, label: 'Монстр' },
  radio: { freq: 130, type: 'sawtooth', modFreq: 4, modGain: 8, filterFreq: 1800, isRadio: true, duration: 2.1, label: 'Рация' },
  alien: { freq: 160, type: 'sine', modFreq: 12, modGain: 35, filterFreq: 2500, duration: 2.3, label: 'Пришелец' },
  speed: { freq: 130, type: 'sawtooth', modFreq: 6.5, modGain: 10, filterFreq: 2400, duration: 1.4, label: 'Ускорение' },
  slowed_reverb: { freq: 105, type: 'sawtooth', modFreq: 3, modGain: 6, filterFreq: 1400, echo: true, duration: 2.8, label: 'Slowed' }
};

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopCurrentAudio() {
  if (currentOscillator) {
    try {
      currentOscillator.stop();
      currentOscillator.disconnect();
    } catch (e) {}
    currentOscillator = null;
  }
  if (currentGain) {
    try {
      currentGain.disconnect();
    } catch (e) {}
    currentGain = null;
  }
  document.querySelectorAll('.preset-card').forEach(card => card.classList.remove('is-playing'));
  currentPlayingPresetId = null;
  isVisualizerActive = false;
}

function playPresetSound(presetId) {
  const data = PRESET_AUDIO_DATA[presetId] || PRESET_AUDIO_DATA.girl_alisa;
  const ctx = getAudioContext();

  if (currentPlayingPresetId === presetId) {
    stopCurrentAudio();
    return;
  }

  stopCurrentAudio();
  currentPlayingPresetId = presetId;
  isVisualizerActive = true;

  const card = document.querySelector(`.preset-card[data-preset="${presetId}"]`);
  if (card) card.classList.add('is-playing');

  // Master Gain
  const now = ctx.currentTime;
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.35, now + 0.08);

  // Main Vocal Oscillator
  const osc = ctx.createOscillator();
  osc.type = data.type;
  osc.frequency.setValueAtTime(data.freq, now);

  // Pitch envelope (intonation arc)
  osc.frequency.exponentialRampToValueAtTime(data.freq * 1.08, now + data.duration * 0.4);
  osc.frequency.exponentialRampToValueAtTime(data.freq * 0.92, now + data.duration * 0.9);

  // Vibrato / Pitch Modulation
  const vibrato = ctx.createOscillator();
  const vibratoGain = ctx.createGain();
  vibrato.frequency.setValueAtTime(data.modFreq, now);
  vibratoGain.gain.setValueAtTime(data.modGain, now);
  vibrato.connect(osc.frequency);
  vibrato.start(now);

  // Formant Filter
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(data.filterFreq, now);
  filter.Q.setValueAtTime(3.5, now);

  // Connect chain
  osc.connect(filter);
  filter.connect(masterGain);

  // Delay / Echo effect
  if (data.echo) {
    const delay = ctx.createDelay();
    delay.delayTime.value = 0.18;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.35;
    filter.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(masterGain);
  }

  masterGain.connect(ctx.destination);

  // Envelope decay
  masterGain.gain.setValueAtTime(0.35, now + data.duration - 0.2);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + data.duration);

  osc.start(now);
  osc.stop(now + data.duration);
  vibrato.stop(now + data.duration);

  currentOscillator = osc;
  currentGain = masterGain;

  osc.onended = () => {
    if (currentPlayingPresetId === presetId) {
      stopCurrentAudio();
    }
  };
}

function initAudioPlayer() {
  document.querySelectorAll('.preset-card').forEach(card => {
    card.addEventListener('click', () => {
      const presetId = card.getAttribute('data-preset');
      if (presetId) {
        playPresetSound(presetId);
      }
    });
  });
}

// ==========================================================================
// 2. Category Filtering Tabs
// ==========================================================================
function initCategoryFilters() {
  const tabs = document.querySelectorAll('.tab-btn');
  const cards = document.querySelectorAll('.preset-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      cards.forEach(card => {
        const category = card.getAttribute('data-category');
        if (filter === 'all' || category === filter) {
          card.style.display = 'flex';
          card.style.opacity = '1';
        } else {
          card.style.display = 'none';
          card.style.opacity = '0';
        }
      });
    });
  });
}

// ==========================================================================
// 3. Before / After Interactive Comparison Widget
// ==========================================================================
function initComparisonToggle() {
  const toggleBtns = document.querySelectorAll('.toggle-switch-btn');
  toggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toggleBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const target = btn.getAttribute('data-target'); // 'original' or 'girl_alisa'
      playPresetSound(target);
    });
  });
}

// ==========================================================================
// 4. Live Canvas Waveform Visualizer
// ==========================================================================
function initWaveformVisualizer() {
  const canvas = document.getElementById('waveformCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = 90;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let phase = 0;

  function renderWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    const barCount = Math.floor(width / 6);
    const amp = isVisualizerActive ? 32 : 6;

    for (let i = 0; i < barCount; i++) {
      const x = i * 6;
      const progress = i / barCount;
      const wave = Math.sin(progress * Math.PI * 4 + phase) * Math.cos(progress * Math.PI * 2);
      const barHeight = Math.max(4, Math.abs(wave) * amp + (isVisualizerActive ? Math.random() * 8 : 2));

      // Gradient color (Cyan to Magenta)
      const grad = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY + barHeight);
      grad.addColorStop(0, '#00d2ff');
      grad.addColorStop(0.5, '#7928ca');
      grad.addColorStop(1, '#ff007a');

      ctx.fillStyle = grad;
      ctx.fillRect(x, centerY - barHeight / 2, 3.5, barHeight);
    }

    phase += isVisualizerActive ? 0.12 : 0.02;
    requestAnimationFrame(renderWave);
  }

  renderWave();
}

// ==========================================================================
// 5. FAQ Accordion Logic
// ==========================================================================
function initFaqAccordion() {
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    const answer = item.querySelector('.faq-answer');

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      faqItems.forEach(i => {
        i.classList.remove('active');
        const a = i.querySelector('.faq-answer');
        if (a) a.style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
}

// ==========================================================================
// 6. Sticky Mobile CTA Bar
// ==========================================================================
function initStickyMobileCta() {
  const stickyBar = document.querySelector('.sticky-mobile-cta');
  if (!stickyBar) return;

  window.addEventListener('scroll', () => {
    if (window.scrollY > 400 && window.innerWidth <= 768) {
      stickyBar.style.display = 'flex';
    } else {
      stickyBar.style.display = 'none';
    }
  });
}

// ==========================================================================
// 7. Responsive Hamburger Menu Logic
// ==========================================================================
function initHamburgerMenu() {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const siteNav = document.getElementById('siteNav');
  if (!hamburgerBtn || !siteNav) return;

  hamburgerBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = siteNav.classList.contains('is-open');
    if (isOpen) {
      siteNav.classList.remove('is-open');
      hamburgerBtn.classList.remove('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    } else {
      siteNav.classList.add('is-open');
      hamburgerBtn.classList.add('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'true');
    }
  });

  // Close when clicking any nav link
  siteNav.querySelectorAll('.nav-link, .mobile-nav-cta a').forEach(link => {
    link.addEventListener('click', () => {
      siteNav.classList.remove('is-open');
      hamburgerBtn.classList.remove('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!siteNav.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      siteNav.classList.remove('is-open');
      hamburgerBtn.classList.remove('is-active');
      hamburgerBtn.setAttribute('aria-expanded', 'false');
    }
  });
}

