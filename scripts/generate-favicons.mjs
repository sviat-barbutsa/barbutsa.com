// Generates public/favicon.ico (32px, PNG-in-ICO) and public/apple-touch-icon.png
// (180px) from the same design as public/favicon.svg (atlas constellation: lime
// center node, gray satellites, dark spokes on near-black), without native deps:
// shapes are rasterized analytically with 4x supersampling and PNG-encoded by
// hand on top of node:zlib. Run: node scripts/generate-favicons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";

const BG = [0x14, 0x14, 0x12];
const LIME = [0xd4, 0xf3, 0x4a];
const GRAY = [0x9a, 0x96, 0x8a];
const SPOKE = [0x2b, 0x2a, 0x24];

// Geometry in the 32-unit viewBox of favicon.svg.
const CENTER = [16, 16];
const SATELLITES = [
  [7, 8],
  [25, 7],
  [26, 24],
  [6, 25],
];
const SPOKE_ENDS = [
  [7, 8],
  [25, 7],
  [26, 24],
  [6, 25],
];
const SPOKE_HALF = 0.5; // stroke-width 1

function distanceToSegment(px, py, [ax, ay], [bx, by]) {
  const abx = bx - ax;
  const aby = by - ay;
  const lengthSq = abx * abx + aby * aby;
  const t = lengthSq === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * abx + (py - ay) * aby) / lengthSq));
  return Math.hypot(px - (ax + abx * t), py - (ay + aby * t));
}

function inCircle(x, y, [cx, cy], radius) {
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= radius * radius;
}

// Paint order mirrors the SVG: bg, center node, satellites, spokes on top.
function sample(x, y) {
  for (const end of SPOKE_ENDS) {
    if (distanceToSegment(x, y, CENTER, end) <= SPOKE_HALF) {
      return SPOKE;
    }
  }
  if (inCircle(x, y, CENTER, 4)) return LIME;
  for (const satellite of SATELLITES) {
    if (inCircle(x, y, satellite, 1.6)) return GRAY;
  }
  return BG;
}

function render(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const grid = 4;

  for (let py = 0; py < size; py += 1) {
    for (let px = 0; px < size; px += 1) {
      let r = 0;
      let g = 0;
      let b = 0;

      for (let sy = 0; sy < grid; sy += 1) {
        for (let sx = 0; sx < grid; sx += 1) {
          const x = ((px + (sx + 0.5) / grid) / size) * 32;
          const y = ((py + (sy + 0.5) / grid) / size) * 32;
          const color = sample(x, y);
          r += color[0];
          g += color[1];
          b += color[2];
        }
      }

      const count = grid * grid;
      const offset = (py * size + px) * 4;
      pixels[offset] = Math.round(r / count);
      pixels[offset + 1] = Math.round(g / count);
      pixels[offset + 2] = Math.round(b / count);
      pixels[offset + 3] = 255;
    }
  }

  return pixels;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(pixels, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;

  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let row = 0; row < size; row += 1) {
    pixels.copy(raw, row * (size * 4 + 1) + 1, row * size * 4, (row + 1) * size * 4);
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

function encodeIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);

  const entry = Buffer.alloc(16);
  entry[0] = size === 256 ? 0 : size;
  entry[1] = size === 256 ? 0 : size;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(22, 12);

  return Buffer.concat([header, entry, png]);
}

writeFileSync(new URL("../public/favicon.ico", import.meta.url), encodeIco(encodePng(render(32), 32), 32));
writeFileSync(new URL("../public/apple-touch-icon.png", import.meta.url), encodePng(render(180), 180));
console.log("Wrote public/favicon.ico and public/apple-touch-icon.png");
