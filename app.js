/**
 * 🎙️ Изменение Голоса | Voice Changer — Interactive JavaScript
 * Real Audio Player (19 converted presets), Web Audio API FFT Waveform Visualizer & UI Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  initHamburgerMenu();
  initRealAudioPlayer();
  initCategoryFilters();
  initComparisonToggle();
  initFaqAccordion();
  initStickyMobileCta();
  initWaveformVisualizer();
});

// ==========================================================================
// 1. Real Audio Player & Web Audio API Analyzer
// ==========================================================================
let currentAudio = null;
let currentPlayingPresetId = null;
let audioCtx = null;
let analyserNode = null;
let audioSourceNode = null;
let isVisualizerActive = false;

// Map of all 18 voice presets + original
const AUDIO_PATHS = {
  // Female
  girl_alisa: 'assets/audio/girl_alisa.mp3',
  girl_mia: 'assets/audio/girl_mia.mp3',
  girl_victoria: 'assets/audio/girl_victoria.mp3',
  girl_kira: 'assets/audio/girl_kira.mp3',
  girl_eva: 'assets/audio/girl_eva.mp3',

  // Male
  man_maxim: 'assets/audio/man_maxim.mp3',
  man_artem: 'assets/audio/man_artem.mp3',
  man_dmitry: 'assets/audio/man_dmitry.mp3',
  man_mark: 'assets/audio/man_mark.mp3',
  man_viktor: 'assets/audio/man_viktor.mp3',

  // Original & Effects
  original: 'assets/audio/original.mp3',
  child: 'assets/audio/child.mp3',
  chipmunk: 'assets/audio/chipmunk.mp3',
  robot: 'assets/audio/robot.mp3',
  monster: 'assets/audio/monster.mp3',
  radio: 'assets/audio/radio.mp3',
  alien: 'assets/audio/alien.mp3',
  speed: 'assets/audio/speed.mp3',
  slowed_reverb: 'assets/audio/slowed_reverb.mp3',
};

function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContext();
    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 64;
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function stopCurrentAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  document.querySelectorAll('.preset-card').forEach(card => card.classList.remove('is-playing'));
  document.querySelectorAll('.toggle-switch-btn').forEach(btn => btn.classList.remove('is-playing'));
  currentPlayingPresetId = null;
  isVisualizerActive = false;
}

function playPresetSound(presetId) {
  const audioSrc = AUDIO_PATHS[presetId];
  if (!audioSrc) return;

  // Toggle if clicked again
  if (currentPlayingPresetId === presetId && currentAudio && !currentAudio.paused) {
    stopCurrentAudio();
    return;
  }

  stopCurrentAudio();
  currentPlayingPresetId = presetId;
  isVisualizerActive = true;

  // UI Active state
  const card = document.querySelector(`.preset-card[data-preset="${presetId}"]`);
  if (card) card.classList.add('is-playing');

  const toggleBtn = document.querySelector(`.toggle-switch-btn[data-target="${presetId}"]`);
  if (toggleBtn) toggleBtn.classList.add('is-playing');

  // Create new HTML5 Audio
  const audio = new Audio(audioSrc);
  currentAudio = audio;

  // Hook into Web Audio Analyser for live frequency spectrum
  try {
    const ctx = getAudioContext();
    if (ctx) {
      // Connect to analyser node (safe cross-browser)
      const source = ctx.createMediaElementSource(audio);
      source.connect(analyserNode);
      analyserNode.connect(ctx.destination);
    }
  } catch (e) {
    // If MediaElementSource already connected or CORS, fallback gracefully
  }

  audio.play().then(() => {
    isVisualizerActive = true;
  }).catch(err => {
    console.warn("Audio playback error:", err);
  });

  audio.onended = () => {
    if (currentPlayingPresetId === presetId) {
      stopCurrentAudio();
    }
  };

  audio.onerror = () => {
    stopCurrentAudio();
  };
}

function initRealAudioPlayer() {
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
// 4. Live Canvas Waveform FFT Visualizer
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
  const dataArray = new Uint8Array(32);

  function renderWave() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    const barCount = Math.floor(width / 6);
    let realFreqSum = 0;

    if (analyserNode && isVisualizerActive) {
      try {
        analyserNode.getByteFrequencyData(dataArray);
        for (let j = 0; j < dataArray.length; j++) {
          realFreqSum += dataArray[j];
        }
      } catch (e) {}
    }

    const freqBoost = realFreqSum > 0 ? (realFreqSum / dataArray.length) / 5 : (isVisualizerActive ? 25 : 4);

    for (let i = 0; i < barCount; i++) {
      const x = i * 6;
      const progress = i / barCount;
      
      let barHeight;
      if (isVisualizerActive && realFreqSum > 0) {
        const freqIndex = Math.floor((i / barCount) * (dataArray.length - 1));
        const val = dataArray[freqIndex] || 20;
        barHeight = Math.max(5, (val / 255) * (height * 0.85));
      } else {
        const wave = Math.sin(progress * Math.PI * 4 + phase) * Math.cos(progress * Math.PI * 2);
        barHeight = Math.max(4, Math.abs(wave) * freqBoost + (isVisualizerActive ? Math.random() * 6 : 2));
      }

      // Gradient color (Cyan to Magenta)
      const grad = ctx.createLinearGradient(0, centerY - barHeight / 2, 0, centerY + barHeight / 2);
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
