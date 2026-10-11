import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
const crcT = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
for (const s of [16, 48, 128]) {
  const row = Buffer.concat([Buffer.from([0]), ...Array.from({ length: s }, (_, x) => Buffer.from(x > s * 0.3 && x < s * 0.7 ? [255, 255, 255, 255] : [79, 70, 229, 255]))]);
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(s, 0); ihdr.writeUInt32BE(s, 4); ihdr[8] = 8; ihdr[9] = 6;
  writeFileSync(`public/icons/${s}.png`, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(Buffer.concat(Array(s).fill(row)))), chunk("IEND", Buffer.alloc(0))]));
}
