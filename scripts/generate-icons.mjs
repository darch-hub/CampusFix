// Generates CampusFix PWA icons with zero dependencies (pure Node + zlib).
// Design: #1a56db background, white "C" from a 5x7 bitmap, centered.
import { writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import zlib from "zlib";

const __dirname = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(__dirname, { recursive: true });

const BG = [26, 86, 219];
const FG = [255, 255, 255];
const C = [".XXX.", "X...X", "X....", "X....", "X....", "X...X", ".XXX."];

function crc32(buf) {
  let table = crc32.t;
  if (!table) {
    table = crc32.t = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, draw) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b] = draw(x, y, size);
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlib.deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// scale: fraction of canvas the glyph block occupies
function drawC(scale, padTop = 0) {
  const cols = 5, rows = 7;
  return (x, y, size) => {
    const s = Math.floor((size * scale) / Math.max(cols, rows));
    const w = cols * s, h = rows * s;
    const ox = Math.floor((size - w) / 2), oy = Math.floor((size - h) / 2) + padTop;
    const cx = Math.floor((x - ox) / s), cy = Math.floor((y - oy) / s);
    if (cx >= 0 && cx < cols && cy >= 0 && cy < rows && C[cy][cx] === "X") return FG;
    return BG;
  };
}

for (const [name, size, scale] of [
  ["icon-192.png", 192, 0.62],
  ["icon-512.png", 512, 0.62],
  ["maskable-512.png", 512, 0.5],
  ["apple-touch-icon.png", 180, 0.62],
]) {
  writeFileSync(join(__dirname, name), png(size, drawC(scale)));
  console.log("wrote", name);
}
