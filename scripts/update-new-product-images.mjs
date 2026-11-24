/**
 * Replace site product photography with finalized packaging from
 * assets/New images - 2. Writes responsive WebPs into public/img,
 * plus turn posters / cutouts used as product thumbs.
 *
 * Run: node scripts/update-new-product-images.mjs
 */
import sharp from 'sharp';
import { mkdir, readdir } from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'assets', 'New images - 2');
const OUT = path.join(ROOT, 'public', 'img');
const WIDTHS = [640, 1080, 1600];

/** Exact basename fragments → site slot (product packaging only). */
const MAP = {
  // Clean product heroes
  'image_20261123183746.png': 'origin-jar',
  'image_20261123184613.png': 'restore-jar',

  // Duo / set
  'Origin_and_Restore_products_disp': 'ritual-duo',
  'Products_displayed_side_by_side_4954d300_2K.png': 'ritual-set',
  'Product_photography_of_Origin_f00496b9_2K.png': 'unboxing',

  // Pour / mix — prefer the Nov 24 pack for hero + lifestyle
  'Pouring_powder_into_water_glass_25e94dbc.png': 'origin-pour', // Origin tub + pour (homepage morning hero)
  'Pouring_powder_into_water_glass_0f0f64b0_2K.png': 'restore-evening', // Restore tub + pour (homepage evening hero)
  'Sachet_pouring_powder_into_bottle_b19699e0.png': 'powder-pour', // Origin into branded bottle
  'Original_sachet_and_primal_logo_cec522af.png': 'bottle-tilt', // Tilted branded bottle on black

  // Lifestyle
  'Origin_product_on_office_desk_cdba8004_2K.png': 'origin-stir',
  'Restore_product_on_bedside_table_180cd30e_2K.png': 'restore-dusk',
  'Product_photography_of_Origin_sa': 'origin-sachet',
  'Product_photography_of_Origin_ee0b94e2_2K.png': 'origin-scoop',
  'Product_photography_of_Origin_pr': 'sage-powder',
  'Restore_product_lifestyle_photog': 'fitness',
  'Restore_product_sachet_image_968d23e3_2K.png': 'restore-sachet',
};

async function resolveSources() {
  const files = await readdir(SRC);
  const resolved = {};
  for (const [key, slot] of Object.entries(MAP)) {
    const match = files.find((f) => f === key || f.startsWith(key) || f.includes(key));
    if (!match) {
      console.error('MISSING source for', slot, '←', key);
      process.exitCode = 1;
      continue;
    }
    if (resolved[slot]) {
      console.warn('Duplicate slot', slot, 'keeping', resolved[slot], 'ignoring', match);
      continue;
    }
    resolved[slot] = path.join(SRC, match);
  }
  return resolved;
}

async function writeResponsive(src, name) {
  const meta = await sharp(src).metadata();
  for (const w of WIDTHS) {
    await sharp(src)
      .resize({ width: Math.min(w, meta.width), withoutEnlargement: true })
      .webp({ quality: 78 })
      .toFile(path.join(OUT, `${name}-${w}.webp`));
  }
  console.log('photo', name, `${meta.width}x${meta.height}`);
}

/** Tight product-centered still for pack cards / cart thumbs. */
async function writeTurnPoster(src, outName, { left, top, width, height }) {
  await sharp(src)
    .extract({ left, top, width, height })
    .resize({ width: 720, height: 1280, fit: 'cover', position: 'centre' })
    .webp({ quality: 84 })
    .toFile(path.join(OUT, outName));
  console.log('poster', outName);
}

/** Soft cutout: product crop on transparent-ish cream edge trim. */
async function writeCutout(src, outName, region) {
  await sharp(src)
    .extract(region)
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 88, alphaQuality: 100 })
    .toFile(path.join(OUT, outName));
  console.log('cutout', outName);
}

await mkdir(OUT, { recursive: true });
const sources = await resolveSources();

for (const [name, src] of Object.entries(sources)) {
  await writeResponsive(src, name);
}

// Also publish restore-sachet under a gallery-friendly alias used nowhere yet —
// mirror into restore page needs via restore-evening already. Keep file for future.

// Turn posters / cutouts from clean heroes (1344×756)
const originHero = sources['origin-jar'];
const restoreHero = sources['restore-jar'];
if (originHero) {
  // Tub is centered-left in the Origin hero
  await writeTurnPoster(originHero, 'origin-turn-poster.webp', {
    left: 380, top: 40, width: 420, height: 700,
  });
  await writeCutout(originHero, 'origin-jar-cutout.webp', {
    left: 360, top: 20, width: 460, height: 720,
  });
}
if (restoreHero) {
  await writeTurnPoster(restoreHero, 'restore-turn-poster.webp', {
    left: 420, top: 30, width: 400, height: 700,
  });
  await writeCutout(restoreHero, 'restore-jar-cutout.webp', {
    left: 400, top: 10, width: 440, height: 720,
  });
}

// Learn visual: clean studio plate (strip pale mask fringe, center on pure black)
if (sources['bottle-tilt']) {
  const { data, info } = await sharp(sources['bottle-tilt']).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const C = 3;
  const at = (x, y) => (y * W + x) * C;
  const lum = (i) => (data[i] + data[i + 1] + data[i + 2]) / 3;
  const isBlack = (i) => lum(i) <= 14;
  const out = Buffer.from(data);
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = at(x, y);
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const L = lum(i);
      const halo = r > 40 && g > 40 && b > 40 && Math.abs(r - g) < 28 && Math.abs(g - b) < 28 && L > 55 && L < 230;
      if (!halo) continue;
      let nearBlack = false;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2]]) {
        if (isBlack(at(x + dx, y + dy))) { nearBlack = true; break; }
      }
      if (nearBlack) { out[i] = 0; out[i + 1] = 0; out[i + 2] = 0; }
    }
  }
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = at(x, y);
      if (out[i] > 16 || out[i + 1] > 16 || out[i + 2] > 16) {
        if (x < minX) minX = x; if (y < minY) minY = y;
        if (x > maxX) maxX = x; if (y > maxY) maxY = y;
      }
    }
  }
  const bw = maxX - minX + 1, bh = maxY - minY + 1;
  const pad = Math.round(Math.max(bw, bh) * 0.12);
  const side = Math.max(bw, bh) + pad * 2;
  const canvas = Buffer.alloc(side * side * 3, 0);
  const ox = Math.round((side - bw) / 2);
  const oy = Math.round((side - bh) / 2);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const si = at(minX + x, minY + y);
      const di = ((oy + y) * side + (ox + x)) * 3;
      canvas[di] = out[si]; canvas[di + 1] = out[si + 1]; canvas[di + 2] = out[si + 2];
    }
  }
  await sharp(canvas, { raw: { width: side, height: side, channels: 3 } })
    .resize({ width: 900 })
    .webp({ quality: 95 })
    .toFile(path.join(OUT, 'learn-bottle.webp'));
  console.log('learn-bottle (cleaned plate)');
}

// OG share image from duo kitchen shot
const ogSrc = sources['ritual-duo'] || sources['ritual-set'] || originHero;
if (ogSrc) {
  await sharp(ogSrc)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(ROOT, 'public', 'og-image.jpg'));
  console.log('og-image');
}

console.log('Done. Slots written:', Object.keys(sources).sort().join(', '));
