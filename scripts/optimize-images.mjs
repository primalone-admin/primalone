// Converts the original PNGs in /assets into responsive WebP files in /public/img.
// Originals are never modified. Re-run with `npm run images` after adding photography.
import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const SRC = 'assets';
const OUT = 'public/img';

const photos = {
  'PrimalOne origin and restore ritual-1.png': 'ritual-duo',
  'PrimalOne Restore Powder in Evening Light-2.png': 'restore-jar',
  'PrimalOne Origin jar with walnut scoop-3.png': 'origin-jar',
  'Origin powder pour into clear glass-4.png': 'origin-pour',
  'Olive-beige powder in walnut scoop-5.png': 'origin-scoop',
  'PrimalOne Origin morning ritual-6.png': 'origin-sachet',
  'PrimalOne Restore dusk ritual-7.png': 'restore-dusk',
  'Morning Stir with PrimalOne Origin-8.png': 'origin-stir',
  // Second photography set
  'PrimalOne premium ritual unboxing-1.png': 'unboxing',
  'Tilted PrimalOne Bottle with Sage Drink-2.png': 'bottle-tilt',
  'PrimalOne Powder Pour-3.png': 'powder-pour',
  'PrimalOne Daily Ritual Set-4.png': 'ritual-set',
  'Sage powder with walnut scoop-5.png': 'sage-powder',
  'PrimalOne fitness ritual in sage-6.png': 'fitness',
  'Precision Droplet Into a Sage Vial-7.png': 'lab-droplet',
  'PrimalOne Restore Evening Ritual-8.png': 'restore-evening',
  // About · everyday gap lifestyle photos
  'Rushed mornings.jpg': 'rushed-mornings',
  'as day go on.jpg': 'days-on-go',
  'late desk.jpg': 'late-desk',
};
// Every photo gets all three files. The largest is capped at the original width (never upscaled),
// so a "-1600" file may be slightly narrower than 1600px; browsers only use the number to pick a file.
const widths = [640, 1080, 1600];

await mkdir(OUT, { recursive: true });

for (const [file, name] of Object.entries(photos)) {
  const img = sharp(`${SRC}/${file}`);
  const { width, height } = await img.metadata();
  for (const w of widths) {
    await sharp(`${SRC}/${file}`).resize({ width: Math.min(w, width) }).webp({ quality: 78 }).toFile(`${OUT}/${name}-${w}.webp`);
  }
  console.log(name, `${width}x${height}`);
}

// Logos: the supplied PNGs are transparent. Keep the brand colours for light
// backgrounds and make a light variant for dark sections: "primal" (black)
// becomes cream, "one" and the leaf (green) become a lighter brand green.
async function logo(file, name, maxW) {
  const { data, info } = await sharp(`${SRC}/${file}`).trim().resize({ width: maxW })
    .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const dark = Buffer.from(data), light = Buffer.from(data);
  for (let i = 0; i < data.length; i += 4) {
    const isGreen = data[i + 1] - data[i] > 40;
    dark[i] = isGreen ? 0x1a : 0x12; dark[i + 1] = isGreen ? 0x73 : 0x17; dark[i + 2] = isGreen ? 0x3c : 0x13;
    light[i] = isGreen ? 0x8f : 0xf6; light[i + 1] = isGreen ? 0xc9 : 0xf1; light[i + 2] = isGreen ? 0x8a : 0xe7;
  }
  const raw = { raw: { width: info.width, height: info.height, channels: 4 } };
  await sharp(dark, raw).png({ compressionLevel: 9 }).toFile(`${OUT}/${name}.png`);
  await sharp(light, raw).png({ compressionLevel: 9 }).toFile(`${OUT}/${name}-light.png`);
  console.log(name, `${info.width}x${info.height}`);
}
await logo('Final Logo-02.png', 'logo-wordmark', 520);
await logo('Final Logo-01.png', 'logo-mark', 192);

// Social share image (1200x630) and a square favicon built from the logo mark.
await sharp(`${SRC}/PrimalOne origin and restore ritual-1.png`)
  .resize(1200, 630, { fit: 'cover', position: 'right' }).jpeg({ quality: 80, mozjpeg: true })
  .toFile('public/og-image.jpg');
const mark = await sharp(`${OUT}/logo-mark-light.png`).resize({ height: 120 }).toBuffer();
await sharp({ create: { width: 180, height: 180, channels: 4, background: '#14261b' } })
  .composite([{ input: mark, gravity: 'center' }]).png().toFile('public/favicon.png');
console.log('og-image + favicon');
