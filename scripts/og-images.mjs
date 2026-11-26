// Share-card images (1200x630 JPG, the size WhatsApp, LinkedIn, X and Facebook expect) for the
// product pages and journal articles. Cropped from the site's own photos; run after adding an
// article: `node scripts/og-images.mjs`. Output: public/og/<name>.jpg (referenced in src/seo/meta.js).
import sharp from 'sharp';
import { journalPage } from '../src/data/pages.js';
import { products } from '../src/data/content.js';

const jobs = [
  ['origin', products.origin.shopImage.name],
  ['restore', products.restore.shopImage.name],
  ...journalPage.articles.map((a) => [`journal-${a.slug}`, a.image]),
];
for (const [out, img] of jobs) {
  await sharp(`public/img/${img}-1600.webp`)
    .resize(1200, 630, { fit: 'cover', position: sharp.strategy.attention })
    .jpeg({ quality: 82, mozjpeg: true })
    .toFile(`public/og/${out}.jpg`);
  console.log(`public/og/${out}.jpg`);
}
