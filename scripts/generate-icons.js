import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function createPng(width, height, r, g, b) {
  // Simple uncompressed RGBA PNG generator
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = makeChunk('IHDR', ihdrData);

  // Raw image data with filter byte 0 at start of each scanline
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      // Draw a rounded emerald shield/badge
      const dx = (x - width / 2) / (width / 2);
      const dy = (y - height / 2) / (height / 2);
      const dist = dx * dx + dy * dy;

      if (dist <= 0.85) {
        // Center checkmark or bright core
        const isCore = dist < 0.25;
        rawData[pos++] = isCore ? 255 : r; // R
        rawData[pos++] = isCore ? 255 : g; // G
        rawData[pos++] = isCore ? 255 : b; // B
        rawData[pos++] = 255;              // A
      } else {
        // Transparent border
        rawData[pos++] = 0;
        rawData[pos++] = 0;
        rawData[pos++] = 0;
        rawData[pos++] = 0;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idat = makeChunk('IDAT', compressedData);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(len + 12);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const crc = crc32(chunk.subarray(4, len + 8));
  chunk.writeUInt32BE(crc, len + 8);
  return chunk;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = (c ^ buf[i]) >>> 0;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

const iconsDir = path.resolve('public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Emerald theme: R=16, G=185, B=129 (#10b981)
fs.writeFileSync(path.join(iconsDir, 'icon16.png'), createPng(16, 16, 16, 185, 129));
fs.writeFileSync(path.join(iconsDir, 'icon48.png'), createPng(48, 48, 16, 185, 129));
fs.writeFileSync(path.join(iconsDir, 'icon128.png'), createPng(128, 128, 16, 185, 129));
console.log('Icons generated successfully!');
