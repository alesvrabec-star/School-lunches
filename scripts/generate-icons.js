import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generate() {
  const iconSvg = fs.readFileSync(path.resolve('./public/icon.svg'));
  const maskableSvg = fs.readFileSync(path.resolve('./public/icon-maskable.svg'));

  console.log('Generating PWA and Apple Touch PNG icons...');

  // 180x180 Apple Touch Icon (Required for iOS Safari Home Screen!)
  await sharp(iconSvg)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('./public/apple-touch-icon.png'));

  // 192x192 PWA Icon (Android Home Screen)
  await sharp(iconSvg)
    .resize(192, 192)
    .png()
    .toFile(path.resolve('./public/pwa-192x192.png'));

  // 512x512 PWA Icon (Android Splash & High-Res)
  await sharp(iconSvg)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('./public/pwa-512x512.png'));

  // 512x512 Maskable PWA Icon (Adaptive Android Icons)
  await sharp(maskableSvg)
    .resize(512, 512)
    .png()
    .toFile(path.resolve('./public/pwa-maskable-512x512.png'));

  // 32x32 Favicon PNG
  await sharp(iconSvg)
    .resize(32, 32)
    .png()
    .toFile(path.resolve('./public/favicon-32x32.png'));

  // 16x16 Favicon PNG
  await sharp(iconSvg)
    .resize(16, 16)
    .png()
    .toFile(path.resolve('./public/favicon-16x16.png'));

  console.log('All PWA PNG icons generated successfully!');
}

generate().catch(console.error);
