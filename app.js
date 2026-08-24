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
  initArticlesModal();
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
// 2. Category Filtering & Collapsible Showcase
// ==========================================================================
let isVoicesExpanded = false;
const INITIAL_VISIBLE_COUNT = 6;

function updateVoiceCardsVisibility() {
  const activeTab = document.querySelector('.tab-btn.active');
  const filter = activeTab ? activeTab.getAttribute('data-filter') : 'all';
  const cards = document.querySelectorAll('.preset-card');
  const expandWrapper = document.getElementById('voicesExpandWrapper');
  const fadeOverlay = document.getElementById('voicesGridFade');
  const toggleBtn = document.getElementById('toggleVoicesBtn');

  let matchIndex = 0;

  cards.forEach(card => {
    const category = card.getAttribute('data-category');
    const matchesFilter = (filter === 'all' || category === filter);

    if (!matchesFilter) {
      card.style.display = 'none';
      card.style.opacity = '0';
    } else {
      if (filter === 'all' && !isVoicesExpanded && matchIndex >= INITIAL_VISIBLE_COUNT) {
        card.style.display = 'none';
        card.style.opacity = '0';
      } else {
        card.style.display = 'flex';
        card.style.opacity = '1';
      }
      matchIndex++;
    }
  });

  if (expandWrapper && toggleBtn) {
    if (filter === 'all') {
      expandWrapper.style.display = 'flex';
      if (fadeOverlay) {
        fadeOverlay.style.display = isVoicesExpanded ? 'none' : 'block';
      }
      const btnText = toggleBtn.querySelector('.expand-btn-text');
      const btnIcon = toggleBtn.querySelector('.expand-btn-icon');
      if (isVoicesExpanded) {
        if (btnText) btnText.textContent = 'Свернуть каталог';
        if (btnIcon) btnIcon.style.transform = 'rotate(180deg)';
        toggleBtn.setAttribute('aria-expanded', 'true');
      } else {
        if (btnText) btnText.textContent = '🎧 Показать все 18 голосов и эффектов';
        if (btnIcon) btnIcon.style.transform = 'rotate(0deg)';
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
    } else {
      expandWrapper.style.display = 'none';
      if (fadeOverlay) fadeOverlay.style.display = 'none';
    }
  }
}

function initCategoryFilters() {
  const tabs = document.querySelectorAll('.tab-btn');
  const toggleBtn = document.getElementById('toggleVoicesBtn');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      updateVoiceCardsVisibility();
    });
  });

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      isVoicesExpanded = !isVoicesExpanded;
      updateVoiceCardsVisibility();
      if (!isVoicesExpanded) {
        const voicesSection = document.getElementById('voices');
        if (voicesSection) {
          voicesSection.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  }

  updateVoiceCardsVisibility();
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
function setMenuOpen(isOpen) {
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const siteNav = document.getElementById('siteNav');
  if (!hamburgerBtn || !siteNav) return;

  siteNav.classList.toggle('is-open', isOpen);
  hamburgerBtn.classList.toggle('is-active', isOpen);
  hamburgerBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  document.body.classList.toggle('menu-open', isOpen);
}

function initStickyMobileCta() {
  const stickyBar = document.querySelector('.sticky-mobile-cta');
  if (!stickyBar) return;

  const updateStickyBar = () => {
    const shouldShow = window.scrollY > 400 && window.innerWidth <= 768;
    stickyBar.classList.toggle('is-visible', shouldShow);
    stickyBar.hidden = !shouldShow;
    document.body.classList.toggle('has-sticky-cta', shouldShow);
  };

  updateStickyBar();
  window.addEventListener('scroll', updateStickyBar, { passive: true });
  window.addEventListener('resize', updateStickyBar);
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
    setMenuOpen(!siteNav.classList.contains('is-open'));
  });

  // Close when clicking any nav link
  siteNav.querySelectorAll('.nav-link, .mobile-nav-cta a').forEach(link => {
    link.addEventListener('click', () => {
      setMenuOpen(false);
    });
  });

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!siteNav.contains(e.target) && !hamburgerBtn.contains(e.target)) {
      setMenuOpen(false);
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1120) {
      setMenuOpen(false);
    }
  });
}

// ==========================================================================
// 8. Scientific & Educational Articles Data and Modal Reader
// ==========================================================================
const ARTICLES_DATA = [
  {
    id: 'anatomy-formants-voice-mechanics',
    category: 'Биоакустика & Голос',
    readTime: '6 мин чтения',
    date: '22 августа 2026',
    title: 'Анатомия тембра: почему мужской и женский голос отличаются формантами, а не просто высотой тона',
    summary: 'Биомеханика речевого тракта, модель источник-фильтр Гуннара Фанта и секрет того, почему наивный питч-шифт превращает речь в «бурундука», а раздельный формантный сдвиг создаёт живой естественный тембр.',
    icon: '🧬',
    badgeGradient: 'var(--grad-magenta)',
    keywords: ['изменение голоса онлайн', 'мужской голос в женский', 'форманты голоса', 'изменить голос в телеграм онлайн Москва', 'натуральный женский голос'],
    contentHtml: `
      <p class="article-lead">
        Большинство людей интуитивно полагают, что разница между мужским и женским голосом заключается исключительно в высоте звучания (частоте основного тона). Однако любой звукорежиссёр или фонетист знает: если просто поднять мужскую запись на октаву вверх, получится не девушка, а комичный персонаж из мультфильма — эффект «Элвина и бурундуков». Почему так происходит и как современная наука решает эту задачу?
      </p>

      <h3>Модель «Источник — Фильтр» (Source-Filter Model)</h3>
      <p>
        В 1960 году шведский акустик Гуннар Фант сформулировал фундаментальную модель голосообразования, которая легла в основу всей современной речевой акустики. Голосовой аппарат человека состоит из двух независимых функциональных блоков:
      </p>
      <ul>
        <li><strong>Источник (Source):</strong> Голосовые связки в гортани. При прохождении воздуха из лёгких они вибрируют, создавая базовый импульсный сигнал с частотой основного тона (F₀). У взрослых мужчин частота F₀ обычно находится в диапазоне 85–155 Гц, у женщин — 165–255 Гц.</li>
        <li><strong>Акустический фильтр (Filter):</strong> Речевой тракт — полость глотки, рта и носа (Vocal Tract). Этот объём работает как акустический резонатор сложной формы, избирательно усиливая одни гармоники и подавляя другие. Пики усиления в спектре называются <em>формантами</em> (F₁, F₂, F₃, F₄).</li>
      </ul>

      <div class="article-quote-box">
        <p>«Индивидуальность, биологический пол и тембральная зрелость голоса закодированы именно в формантах речевого тракта, а не только в частоте вибрации связок.»</p>
      </div>

      <h3>Анатомическая разница длины гортани: ключ к 10–12%</h3>
      <p>
        Анатомическая длина мужского речевого тракта составляет в среднем 17–18 см, тогда как женского — около 14.5–15.5 см. Разница составляет всего <strong>10–12%</strong>! 
      </p>
      <p>
        Когда неопытные программы делают <code>изменение голоса онлайн</code> обычным питч-шифтером, они пропорционально растягивают весь спектр частот на +40–50%. В итоге форманты улетают в диапазон детского или карликового речевого тракта длиной 9–10 см — возникает неизбежный эффект мультяшности.
      </p>

      <h3>Как работает умное преобразование в Telegram</h3>
      <p>
        Чтобы преобразовать <code>мужской голос в женский</code> с естественным звучанием взрослого человека (как в наших пресетах «Алиса», «Ева», «Виктория»), алгоритм разделяет обработку:
      </p>
      <ol>
        <li><strong>Основной тон F₀</strong> аккуратно транспонируется в женский регистр (например, с 115 Гц до 210 Гц).</li>
        <li><strong>Форманты речевого тракта</strong> масштабируются строго на анатомические 10.8–12.2%, моделируя физиологию женской гортани.</li>
        <li><strong>Грудной резонатор</strong> (область 200–400 Гц) полируется параметрическим фильтром, убирая избыточную маскулинную мутность.</li>
      </ol>
      <p>
        Благодаря этому пользователи из Москвы, Санкт-Петербурга и других городов России получают кристально чистое голосовое сообщение, которое звучит абсолютно органично и не выдает следов грубого цифрового питча.
      </p>
    `
  },
  {
    id: 'praat-psola-algorithm-acoustics',
    category: 'Алгоритмы & DSP',
    readTime: '7 мин чтения',
    date: '20 августа 2026',
    title: 'Алгоритм Praat PSOLA: как работает золотой стандарт мировой акустики для манипуляции речью',
    summary: 'Математика временной области, фазовая синхронизация Pitch-Synchronous Overlap and Add и почему Амстердамский фонетический стандарт превосходит обычные вокодеры в чистоте звука.',
    icon: '🔬',
    badgeGradient: 'var(--grad-cyan)',
    keywords: ['praat psola алгоритм', 'преобразование голоса в телеграмме', 'обработка звука спб', 'voice changer telegram бот', 'фонетический анализ'],
    contentHtml: `
      <p class="article-lead">
        Среди сотен алгоритмов цифровой обработки сигналов (DSP) существует метод, который уже более 30 лет остаётся эталоном в академических лабораториях фонетики по всему миру — от Массачусетского технологического института до СПбГУ. Это алгоритм <strong>PSOLA</strong> (Pitch-Synchronous Overlap and Add), реализованный в знаменитом научном комплексе <em>Praat</em> профессорами Полом Бурсмой и Дэвидом Веенинком в Амстердамском университете.
      </p>

      <h3>В чём проблема классического изменения высоты тона?</h3>
      <p>
        Большинство потребительских плагинов используют фазовый вокодер (Phase Vocoder) в частотной области через быстрое преобразование Фурье (FFT). У этого подхода есть критический недостаток — <em>размытие фаз (Phase Smearing)</em>. Речь теряет резкость согласных звуков (транзиентов), появляется металлический призвук «робота в трубе» и ощущение реверберации в жестяной банке.
      </p>

      <h3>Принцип работы PSOLA: ювелирная нарезка периодов</h3>
      <p>
        В отличие от частотных методов, <code>praat psola алгоритм</code> работает напрямую во <strong>временной области (Time Domain)</strong> с высочайшей точностью:
      </p>
      <ol>
        <li><strong>Детекция меток основного тона (Pitch Marks):</strong> Алгоритм с микросекундной точностью находит моменты смыкания голосовых связок (Glottal Closure Instants) в каждом периоде колебания.</li>
        <li><strong>Оконное сегментирование:</strong> Вокруг каждого пика вырезается короткий фрагмент звуковой волны с использованием симметричного окна Ханна (Hanning Window) двойной длины периода.</li>
        <li><strong>Ресинтез с новым интервалом (Overlap & Add):</strong> При смене высоты тона вырезанные окна накладываются друг на друга с новыми, более частыми интервалами (для повышения тона) или более редкими (для баса), сохраняя исходную форму акустического импульса.</li>
      </ol>

      <div class="article-quote-box">
        <p>«Поскольку форма импульса внутри окна остаётся неизменной, естественные резонансы формант не размываются, а перекрытие по синусоидальному закону гарантирует 100% отсутствие щелчков и фазовых выпадений.»</p>
      </div>

      <h3>Почему наш Telegram-бот использует PSOLA в бэкенде</h3>
      <p>
        Когда вам нужно качественное <code>преобразование голоса в телеграмме</code> за доли секунды, чистый математический алгоритм Praat PSOLA на C++/Python обеспечивает:
      </p>
      <ul>
        <li>Мгновенный рендеринг: обработка 10-секундного голосового сообщения занимает всего <strong>0.3–0.6 секунды</strong> на стандартном сервере.</li>
        <li>Нулевой уровень фазовых артефактов и металлического дребезга.</li>
        <li>Идеальную артикуляцию шипящих и взрывных звуков («п», «т», «к», «с», «ш»).</li>
      </ul>
      <p>
        Это делает наш <code>voice changer telegram бот</code> профессиональным решением студийного качества, доступным прямо в телефоне для пользователей из любого региона — от СПб до Владивостока.
      </p>
    `
  },
  {
    id: 'psychoacoustics-voice-perception',
    category: 'Психоакустика & Мозг',
    readTime: '5 мин чтения',
    date: '18 августа 2026',
    title: 'Психоакустика восприятия: как мозг за 200 миллисекунд считывает пол, возраст и искренность по аудио',
    summary: 'Шкала Барков, эффект предшествования, слуховые фильтры улитки уха и тембральные маркеры уверенности: как акустические частоты формируют доверие и эмоциональный контакт.',
    icon: '🧠',
    badgeGradient: 'var(--grad-magenta)',
    keywords: ['психоакустика голоса', 'озвучка видео телеграм бот', 'голос девушки в телеграм онлайн', 'смена голоса для пранков Россия'],
    contentHtml: `
      <p class="article-lead">
        Человеческий слуховой аппарат развивался миллионы лет как важнейший инструмент выживания и социальной коммуникации. Эксперименты когнитивных психологов показывают: коре головного мозга требуется всего <strong>150–200 миллисекунд</strong> (длительность одного слога), чтобы с точностью до 95% определить пол говорящего, его эмоциональный настрой, физический размер и даже степень уверенности в себе.
      </p>

      <h3>Шкала Барков и критические полосы слуха</h3>
      <p>
        Ухо человека воспринимает частоты нелинейно. В улитке внутреннего уха около 20 000 волосковых клеток сгруппированы в так называемые <em>критические полосы (Critical Bands)</em>, описываемые шкалой Барков (Цвикер, 1961).
      </p>
      <p>
        В низкочастотной области (до 500 Гц) разрешение слуха максимально высоко — мозг мгновенно улавливает малейшие микроколебания основного тона. В высокочастотной области (2–8 кГц) слух больше ориентируется на общий спектральный баланс и «воздух».
      </p>

      <h3>Секреты тембральных пресетов: как мы настраиваем голоса</h3>
      <p>
        При разработке пресетов в боте мы применяем глубокие законы психоакустики, создавая психологически выверенные архетипы звучания:
      </p>

      <table class="article-table">
        <thead>
          <tr>
            <th>Пресет</th>
            <th>Частотный акцент</th>
            <th>Психологический эффект</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>🌸 Алиса</strong></td>
            <td>Ясный презенс 2.8–4.2 кГц, деликатный F₀ 210 Гц</td>
            <td>Ощущение открытости, молодости, чистоты и дружелюбия</td>
          </tr>
          <tr>
            <td><strong>🌙 Ева</strong></td>
            <td>Мягкий спад на 6 кГц, шелковый суб-реверб</td>
            <td>Интонация доверия, уюта, интимности и спокойствия</td>
          </tr>
          <tr>
            <td><strong>🦁 Артём</strong></td>
            <td>Грудной резонанс 90–130 Гц + тёплая сатурация</td>
            <td>Впечатление физической силы, брутальности и авторитета</td>
          </tr>
          <tr>
            <td><strong>🎙️ Максим</strong></td>
            <td>Плотные 160–240 Гц, динамическая компрессия</td>
            <td>Уверенность радиоведущего, деловая солидность и харизма</td>
          </tr>
        </tbody>
      </table>

      <h3>Практическое применение для контента и пранков</h3>
      <p>
        Благодаря психологической достоверности, создаваемый <code>голос девушки в телеграм онлайн</code> идеально подходит для озвучки роликов в TikTok/Reels, стримов, мемов, дубляжа авторских подкастов и дружеских пранков по всей России. Собеседник реагирует на глубокие психоакустические маркеры, воспринимая голос как на 100% живой и аутентичный.
      </p>
    `
  },
  {
    id: 'cloud-audio-dsp-ffmpeg-opus',
    category: 'Инженерия звука',
    readTime: '6 мин чтения',
    date: '15 августа 2026',
    title: 'Студийный тракт в облаке: как связка DSP, параметрического EQ и OGG Opus создаёт чистый звук',
    summary: 'Полный путь аудиофайла на сервере: от сырого микрофонного входа до динамического сайдчейна, обрезных фильтров и нативной упаковки в кодек Opus 48 kHz.',
    icon: '🎛️',
    badgeGradient: 'var(--grad-cyan)',
    keywords: ['натуральный женский голос телеграм', 'ffmpeg обработка голоса', 'бот изменения голоса онлайн Москва', 'ogg opus телеграм'],
    contentHtml: `
      <p class="article-lead">
        Запись голосового сообщения в мессенджере — это суровое испытание для любого звукового алгоритма. Люди записывают сообщения на ветру, в метро, через бюджетные микрофоны гарнитур, с расстояния в 5 сантиметров или полуметра от телефона. Как превратить неподготовленную запись в кристально чистое студийное аудио?
      </p>

      <h3>Архитектура облачного тракта обработки (Mastering Chain)</h3>
      <p>
        Внутри нашего бэкенда каждое входящее аудио проходит через многокаскадный процессинг:
      </p>

      <ol>
        <li>
          <strong>Пре-фильтрация (High-Pass / Low-Cut):</strong> 
          Удаление инфразвукового гула и ударов воздуха (поп-эффект микрофона) ниже 65 Гц с крутизной спада 18 дБ/октава.
        </li>
        <li>
          <strong>Акустический ресинтез Praat PSOLA:</strong> 
          Точный анатомический перенос тона и формант в выбранный целевой тембр.
        </li>
        <li>
          <strong>Параметрическая эквализация (Parametric EQ):</strong> 
          Вырезание паразитных резонансов помещения (комнатных мод в районе 500–800 Гц) и деликатный «эир-буст» на 10–12 кГц для бархатной воздушности женских тембров.
        </li>
        <li>
          <strong>Двухступенчатая динамическая компрессия (DSP Compressor):</strong> 
          Быстрая атака (15 мс) для сглаживания резких всплесков громкости и плавный релиз (120 мс) для поднятия тихих согласных и хвостов слов.
        </li>
        <li>
          <strong>Пиковый лимитер (True Peak Limiter):</strong> 
          Гарантия отсутствия цифрового клиппинга и интерсэмпловых перегрузок при воспроизведении на любых динамиках смартфонов.
        </li>
      </ol>

      <div class="article-quote-box">
        <p>«Telegram использует аудиокодек Opus с частотой дискретизации 48 000 Гц. Наш бот сразу формирует нативный OGG Opus контейнер без двойного пересжатия, сохраняя 100% детализации.»</p>
      </div>

      <h3>Результат: премиальное качество за 1 секунду</h3>
      <p>
        Благодаря связке <code>ffmpeg обработка голоса</code> и кастомных C++/Python DSP-модулей, бот выдаёт готовый результат мгновенно. Пользователи в Москве, Санкт-Петербурге и регионах получают плотное, разборчивое и коммерчески звучащее голосовое сообщение без необходимости открывать громоздкие DAW вроде Cubase, FL Studio или Ableton.
      </p>
    `
  },
  {
    id: 'voice-privacy-biometrics-security',
    category: 'Безопасность & Приватность',
    readTime: '5 мин чтения',
    date: '12 августа 2026',
    title: 'Голосовая приватность и биометрия: как защитить свой цифровой отпечаток в эпоху ИИ',
    summary: 'Что такое Voiceprint (голосовой отпечаток), почему открытые голосовые сообщения в соцсетях несут риски для биометрии и как анонимная модификация голоса защищает персональные данные.',
    icon: '🛡️',
    badgeGradient: 'var(--grad-magenta)',
    keywords: ['анонимные голосовые телеграм', 'отправить голосовое без пересылки', 'конфиденциальность в сети онлайн', 'защита голоса телеграм'],
    contentHtml: `
      <p class="article-lead">
        С развитием нейросетей голосовой тембр человека стал полноценным биометрическим идентификатором, наряду с отпечатками пальцев и сканом лица FaceID. Банки используют голос для подтверждения транзакций, а сервисы авторизации — для входа в аккаунты. Публикуя голосовые сообщения в открытых чатах и каналах, пользователи часто не задумываются о цифровом следе.
      </p>

      <h3>Что такое голосовой отпечаток (Voiceprint)?</h3>
      <p>
        Голосовой биометрический профиль строится на основе более чем 100 физических параметров: геометрии гортани, индивидуального спектрального паттерна формант, микро-тремора связок и речевой артикуляции. Достаточно всего 15–20 секунд чистой речи, чтобы составить устойчивый профиль для биометрической базы.
      </p>

      <h3>Где изменение голоса становится инструментом защиты приватности:</h3>
      <ul>
        <li><strong>Публичные Telegram-сообщества и группы:</strong> Общение и высказывание мнений по чувствительным темам без риска привязки реальной личности по биометрии.</li>
        <li><strong>Продажи на досках объявлений (Авито, маркетплейсы):</strong> Коммуникация с незнакомыми покупателями без раскрытия персонального тембра и номера.</li>
        <li><strong>Творчество и стриминг:</strong> Ведение анонимных блогов, игровых стримов и авторских каналов с сохранением полного инкогнито.</li>
      </ul>

      <div class="article-quote-box">
        <p>«Функция "Отправить в чат без цитирования" в боте отправляет модифицированное голосовое сообщение напрямую от вашего имени, не оставляя ссылки на бота и плашки "Переслано от..."»</p>
      </div>

      <h3>Принцип Zero-Storage: полная гарантия безопасности</h3>
      <p>
        Наш сервис спроектирован по стандарту Privacy-First:
      </p>
      <ol>
        <li>Все исходные и обработанные аудиофайлы обрабатываются исключительно в оперативной памяти и во временных файлах сервера.</li>
        <li>Сразу после отправки сообщения в Telegram файлы безвозвратно удаляются (TTL < 5 секунд).</li>
        <li>Мы никогда не храним, не индексируем и не передаём пользовательские голосовые данные третьим лицам.</li>
      </ol>
      <p>
        Используйте <code>анонимные голосовые телеграм</code> для защиты вашей личной приватности и безопасного комфортного общения онлайн.
      </p>
    `
  },
  {
    id: 'dsp-vs-rvc-speed-artifacts-comparison',
    category: 'ИИ против DSP',
    readTime: '6 мин чтения',
    date: '10 августа 2026',
    title: 'Классический DSP против нейросетей RVC: почему PSOLA выигрывает в скорости генерации',
    summary: 'Честное инженерное сравнение: когда нужен тяжелый нейросетевой клон на GPU (RVC), а когда классический DSP Praat обеспечивает идеальный баланс мгновенного отклика (<1.5с) и нулевых артефактов.',
    icon: '⚡',
    badgeGradient: 'var(--grad-cyan)',
    keywords: ['rvc voice changer сравнение', 'быстрое изменение голоса бот', 'voice changer онлайн телеграм', 'преобразовать голос за секунду'],
    contentHtml: `
      <p class="article-lead">
        В 2024–2026 годах вокруг технологий клонирования голоса нейросетями (RVC — Retrieval-based Voice Conversion, VITS, Sovits) возник огромный ажиотаж. Однако при попытке развернуть подобные модели для миллионов пользователей в Telegram разработчики сталкиваются с непреодолимой стеной задержек и аппаратных затрат. Разберём, почему гибридный подход остаётся королём мессенджеров.
      </p>

      <h3>Инженерное сравнение подходов</h3>
      <table class="article-table">
        <thead>
          <tr>
            <th>Параметр</th>
            <th>Нейросети RVC (GPU)</th>
            <th>Акустический DSP PSOLA (CPU)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Задержка генерации</strong></td>
            <td>8–25 секунд (очередь к видеокарте)</td>
            <td><strong>0.3–0.8 секунды (мгновенно)</strong></td>
          </tr>
          <tr>
            <td><strong>Стабильность интонаций</strong></td>
            <td>Склонность к «галлюцинациям» и проглатыванию слов</td>
            <td><strong>100% сохранение дикции и интонаций</strong></td>
          </tr>
          <tr>
            <td><strong>Потребление ресурсов</strong></td>
            <td>Дорогой GPU-кластер (VRAM 12–24 ГБ)</td>
            <td><strong>Лёгкий CPU-пайплайн</strong></td>
          </tr>
          <tr>
            <td><strong>Надёжность под нагрузкой</strong></td>
            <td>Падения при пиках онлайна</td>
            <td><strong>Стабильная работа 24/7</strong></td>
          </tr>
        </tbody>
      </table>

      <h3>В чём главная сила Praat PSOLA для мессенджера?</h3>
      <p>
        В реальной переписке в Telegram никто не готов ждать 30 секунд, пока видеокарта просчитает нейросетевую диффузию. Голосовые сообщения — это живой разговор, требующий реакции «здесь и сейчас».
      </p>
      <p>
        Кроме того, классический <code>praat psola алгоритм</code> абсолютно математически детерминирован: он никогда не исказит редкую фамилию, не проглотит согласную и не добавит странный электронный свист в тишине. Вы получаете ровно вашу живую интонацию и энергетику речи, перенесенную в красивый женский или брутальный мужской тембр.
      </p>

      <div class="article-quote-box">
        <p>«Мгновенный отклик менее 1 секунды и кристальная разборчивость речи — вот формула идеального голосового бота для повседневного общения.»</p>
      </div>

      <h3>Вывод</h3>
      <p>
        Для быстрого и надежного преображения звука в Telegram связка PSOLA + FFmpeg остаётся вне конкуренции по скорости, экономичности и комфорту пользователя по всей России и СНГ.
      </p>
    `
  }
];

function initArticlesModal() {
  const container = document.getElementById('articlesGrid');
  const modal = document.getElementById('articleModal');
  if (!container || !modal) return;

  // Render Article Cards into container if empty or dynamically
  if (container.children.length === 0) {
    container.innerHTML = ARTICLES_DATA.map(article => `
      <article class="article-card" data-article-id="${article.id}">
        <div class="article-card-header">
          <span class="article-badge" style="background: ${article.badgeGradient}">${article.icon} ${article.category}</span>
          <span class="article-read-time">${article.readTime}</span>
        </div>
        <h3 class="article-card-title">${article.title}</h3>
        <p class="article-card-desc">${article.summary}</p>
        <div class="article-card-footer">
          <span class="article-date">${article.date}</span>
          <button class="btn-read-article" aria-label="Читать статью ${article.title}">
            <span>Читать статью</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      </article>
    `).join('');
  }

  const modalBody = document.getElementById('articleModalBody');
  const closeBtn = document.getElementById('closeArticleModalBtn');
  const backdrop = modal.querySelector('.article-modal-backdrop');

  function openArticle(articleId) {
    const article = ARTICLES_DATA.find(a => a.id === articleId);
    if (!article || !modalBody) return;

    modalBody.innerHTML = `
      <div class="modal-article-header">
        <div class="modal-article-meta">
          <span class="article-badge" style="background: ${article.badgeGradient}">${article.icon} ${article.category}</span>
          <span class="article-read-time">⏱️ ${article.readTime}</span>
          <span class="article-date">📅 ${article.date}</span>
        </div>
        <h1 class="modal-article-title">${article.title}</h1>
      </div>

      <div class="modal-article-content">
        ${article.contentHtml}
      </div>

      <div class="modal-article-tags">
        ${article.keywords.map(kw => `<span class="article-kw-tag">#${kw}</span>`).join('')}
      </div>

      <div class="modal-article-cta-box">
        <div class="modal-cta-text">
          <h4>Попробуйте этот алгоритм со своим голосом прямо сейчас!</h4>
          <p>Отправьте любое голосовое в Telegram-бота и оцените студийное преобразование за 1 секунду.</p>
        </div>
        <a href="https://t.me/VoicePresetBot?start=article_${article.id}" class="btn btn-primary btn-large" target="_blank" rel="noopener noreferrer">
          <span>🚀 Запустить @VoicePresetBot</span>
        </a>
      </div>
    `;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    modal.scrollTop = 0;
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  }

  // Card click handlers
  container.addEventListener('click', (e) => {
    const card = e.target.closest('.article-card');
    if (card) {
      const articleId = card.getAttribute('data-article-id');
      if (articleId) openArticle(articleId);
    }
  });

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (backdrop) backdrop.addEventListener('click', closeModal);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('is-open')) {
      closeModal();
    }
  });

  // Handle URL hash on load (e.g. #article-anatomy-formants-voice-mechanics)
  if (window.location.hash && window.location.hash.startsWith('#article-')) {
    const targetId = window.location.hash.replace('#article-', '');
    openArticle(targetId);
  }
}
