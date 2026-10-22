import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://voice.dontseekme.ru';
const today = '2026-09-13';
const bot = 'https://t.me/VoicePresetBot?start=landing';

const ARTICLES_DATA = new Function(
  `${fs.readFileSync(path.join(root, 'articles-data.js'), 'utf8')}\nreturn ARTICLES_DATA;`
)();

const SEO_TITLES = {
  'anatomy-formants-voice-mechanics': 'Анатомия тембра и форманты — Voice Changer',
  'praat-psola-algorithm-acoustics': 'Алгоритм Praat PSOLA — Voice Changer',
  'psychoacoustics-voice-perception': 'Психоакустика голоса — Voice Changer',
  'cloud-audio-dsp-ffmpeg-opus': 'Студийный DSP и Opus — Voice Changer',
  'voice-privacy-biometrics-security': 'Голосовая приватность — Voice Changer',
  'dsp-vs-rvc-speed-artifacts-comparison': 'DSP против RVC — Voice Changer',
};

const MONTHS = {
  января: '01', февраля: '02', марта: '03', апреля: '04', мая: '05', июня: '06', июля: '07',
  августа: '08', сентября: '09', октября: '10', ноября: '11', декабря: '12',
};

function clip(s, n = 155) {
  const text = String(s);
  if (text.length <= n) return text;
  const cut = text.slice(0, n);
  const i = cut.lastIndexOf(' ');
  return `${(i > 80 ? cut.slice(0, i) : cut).trim()}`;
}

function escape(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function toIso(date) {
  const m = String(date).match(/(\d{1,2})\s+(\S+)\s+(\d{4})/);
  if (!m) return '2026-08-10';
  return `${m[3]}-${MONTHS[m[2]] || '08'}-${m[1].padStart(2, '0')}`;
}

function chrome({ title, description, canonical, type = 'website', jsonLd, body }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="theme-color" content="#07080d">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <link rel="canonical" href="${canonical}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="Voice Changer">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:url" content="${canonical}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${origin}/assets/og-image.jpg">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${origin}/assets/og-image.jpg">
  <link rel="icon" type="image/x-icon" href="/assets/favicon/favicon.ico">
  <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon/favicon-32x32.png">
  <link rel="apple-touch-icon" sizes="192x192" href="/assets/favicon/android-chrome-192x192.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/style.css">
  <script src="/consent.js" defer></script>
  ${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body>
  <header class="site-header">
    <div class="container header-container">
      <a href="/" class="logo-brand" title="Изменение Голоса — на главную">
        <img src="/assets/logo.webp" alt="Логотип Изменение Голоса Voice Changer" class="logo-img" width="48" height="48">
        <div class="logo-text-group">
          <span class="brand-title gradient-text">ИЗМЕНЕНИЕ ГОЛОСА</span>
          <span class="brand-subtitle">VOICE CHANGER AI</span>
        </div>
      </a>
      <a href="${bot}" class="btn btn-primary header-cta-btn" target="_blank" rel="noopener noreferrer">Запустить бота</a>
    </div>
  </header>
  ${body}
  <footer class="site-footer">
    <div class="container">
      <div class="footer-bottom">
        <p>© 2026 Изменение Голоса | Voice Changer Bot</p>
        <p>
          <a href="/privacy.html">Конфиденциальность</a> ·
          <a href="/cookies.html">Политика cookies</a> ·
          <a href="/terms.html">Условия</a> ·
          <a href="${bot}" target="_blank" rel="noopener noreferrer">@VoicePresetBot</a>
        </p>
      </div>
    </div>
  </footer>
</body>
</html>
`;
}

for (const art of ARTICLES_DATA) {
  const slug = art.id;
  const title = SEO_TITLES[slug] || art.title;
  const canonical = `${origin}/articles/${slug}/`;
  const published = toIso(art.date);
  const related = ARTICLES_DATA.filter((a) => a.id !== slug).slice(0, 3);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: art.title,
    description: art.summary,
    datePublished: published,
    dateModified: published,
    inLanguage: 'ru',
    mainEntityOfPage: canonical,
    image: `${origin}/assets/og-image.jpg`,
    author: { '@type': 'Organization', name: 'Voice Changer', url: origin },
    publisher: { '@type': 'Organization', name: 'Voice Changer', url: origin },
  };
  const body = `
  <main class="legal-page article-page">
    <div class="container">
      <p class="legal-lead">${escape(art.category)} · ${escape(art.readTime)} · ${escape(art.date)}</p>
      <h1>${escape(art.title)}</h1>
      <p class="article-lead">${escape(art.summary)}</p>
      <div class="modal-article-content">${art.contentHtml}</div>
      <p><a class="btn btn-primary" href="${bot.replace('landing', `article_${slug}`)}" target="_blank" rel="noopener noreferrer">Попробовать в @VoicePresetBot</a></p>
      <h2>Ещё статьи</h2>
      <div class="related">
        ${related.map((a) => `<a href="/articles/${a.id}/">${escape(a.title)}</a>`).join('\n        ')}
      </div>
      <p><a href="/#articles">← Все статьи</a></p>
    </div>
  </main>`;
  const dir = path.join(root, 'articles', slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), chrome({
    title,
    description: clip(art.summary),
    canonical,
    type: 'article',
    jsonLd,
    body,
  }), 'utf8');
}

const urls = [
  { loc: `${origin}/`, lastmod: today, changefreq: 'weekly', priority: '1.0' },
  ...ARTICLES_DATA.map((a) => ({
    loc: `${origin}/articles/${a.id}/`,
    lastmod: toIso(a.date),
    changefreq: 'monthly',
    priority: '0.7',
  })),
  { loc: `${origin}/cookies.html`, lastmod: '2026-10-22', changefreq: 'yearly', priority: '0.3' },
  { loc: `${origin}/privacy.html`, lastmod: today, changefreq: 'yearly', priority: '0.3' },
  { loc: `${origin}/terms.html`, lastmod: today, changefreq: 'yearly', priority: '0.3' },
];

fs.writeFileSync(
  path.join(root, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`,
  'utf8'
);

fs.writeFileSync(
  path.join(root, 'robots.txt'),
  `User-agent: *
Allow: /

User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Google-Extended
Allow: /

User-agent: ClaudeBot
Allow: /

User-agent: PerplexityBot
Allow: /

Sitemap: ${origin}/sitemap.xml
`,
  'utf8'
);

fs.writeFileSync(
  path.join(root, 'llms.txt'),
  `# Voice Changer (@VoicePresetBot)

Telegram-бот для изменения голоса: 18 пресетов, Praat PSOLA, отправка без цитирования.

- Старт: 5 бесплатных генераций
- Пакеты: +20 за 49 ₽, +100 за 199 ₽, безлимит 30 дней за 499 ₽
- Оплата: СБП, карты МИР, ЮMoney через ЮKassa
- Бот: ${bot}

## Страницы
- Главная: ${origin}/
- Конфиденциальность: ${origin}/privacy.html
- Условия: ${origin}/terms.html
${ARTICLES_DATA.map((a) => `- ${a.title}: ${origin}/articles/${a.id}/`).join('\n')}
`,
  'utf8'
);

console.log('articles', ARTICLES_DATA.length);
console.log('wrote sitemap, robots, llms');
