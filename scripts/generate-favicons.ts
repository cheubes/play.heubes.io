// Generates public/favicon.ico and public/apple-touch-icon.png from public/favicon.svg.
// Needs rsvg-convert (librsvg). Run from the repository root: node scripts/generate-favicons.ts
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const SOURCE = 'public/favicon.svg';
const ICO_SIZES = [16, 32];
const APPLE_TOUCH_SIZE = 180;

function render(svg: string, size: number): Buffer {
  return execFileSync('rsvg-convert', ['--width', String(size), '--height', String(size)], { input: svg });
}

// An ICO file whose images are stored as PNG, which every browser supports.
function encodeIco(images: { size: number; png: Buffer }[]): Buffer {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  let offset = header.length + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;
    return entry;
  });
  return Buffer.concat([header, ...entries, ...images.map(({ png }) => png)]);
}

const svg = readFileSync(SOURCE, 'utf8');
writeFileSync('public/favicon.ico', encodeIco(ICO_SIZES.map((size) => ({ size, png: render(svg, size) }))));
// iOS masks the icon with its own rounded corners: the square must be full and opaque.
writeFileSync('public/apple-touch-icon.png', render(svg.replace(' rx="7"', ''), APPLE_TOUCH_SIZE));
