import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const sharp = require('c:/p/BOTS/web/landing/node_modules/sharp');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const logo = path.join(root, 'assets', 'logo.png');
const meta = await sharp(logo).metadata();
console.log('logo', meta.width, meta.height);

await sharp(logo)
  .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
  .webp({ quality: 78, effort: 6 })
  .toFile(path.join(root, 'assets', 'logo.webp'));

const ogPath = path.join(root, 'assets', 'og-image.jpg');
let ogW = 1200;
let ogH = 630;
for (const attempt of [
  { w: 1200, h: 630, quality: 52 },
  { w: 1200, h: 630, quality: 42 },
  { w: 1100, h: 578, quality: 42 },
]) {
  ogW = attempt.w;
  ogH = attempt.h;
  await sharp(logo)
    .resize(attempt.w, attempt.h, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: attempt.quality, mozjpeg: true })
    .toFile(ogPath);
  const size = fs.statSync(ogPath).size;
  console.log('og attempt', attempt, size);
  if (size < 100 * 1024) break;
}

const icon512 = path.join(root, 'assets', 'favicon', 'android-chrome-512x512.png');
fs.writeFileSync(
  icon512,
  await sharp(icon512)
    .resize(512, 512)
    .png({ compressionLevel: 9, adaptiveFiltering: true, palette: true })
    .toBuffer()
);

for (const rel of ['assets/logo.webp', 'assets/og-image.jpg', 'assets/favicon/android-chrome-512x512.png']) {
  console.log(rel, fs.statSync(path.join(root, rel)).size);
}
console.log('og dims', ogW, ogH);
