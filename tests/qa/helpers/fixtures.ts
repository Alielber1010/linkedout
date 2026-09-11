import { deflateSync } from "node:zlib";
import { randomBytes } from "node:crypto";
import { mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Real image fixtures, generated at run time instead of checked in — one of
 * them is deliberately >5MB and has no business living in git.
 */

function crc32(buf: Buffer): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typed = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typed));
  return Buffer.concat([len, typed, crc]);
}

/**
 * Minimal truecolor PNG encoder. `pixel(x, y)` returns [r, g, b].
 */
export function makePng(
  width: number,
  height: number,
  pixel: (x: number, y: number) => [number, number, number]
): Buffer {
  const raw = Buffer.alloc(height * (1 + width * 3));
  let o = 0;
  for (let y = 0; y < height; y++) {
    raw[o++] = 0; // filter: none
    for (let x = 0; x < width; x++) {
      const [r, g, b] = pixel(x, y);
      raw[o++] = r;
      raw[o++] = g;
      raw[o++] = b;
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: truecolor

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 6 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export type Fixtures = {
  dir: string;
  /** Small loud-orange PNG with a white cross — easy to spot in a screenshot. */
  avatarPng: string;
  /** Small teal/blue gradient PNG, wide, for the banner. */
  bannerPng: string;
  /** Valid PNG, >5MB (incompressible noise) — should trip the size guard. */
  oversizedPng: string;
  /** Not an image at all — should trip the type guard. */
  textFile: string;
};

export function buildFixtures(): Fixtures {
  const dir = mkdtempSync(join(tmpdir(), "linkedout-qa-"));

  const avatarPng = join(dir, "avatar.png");
  writeFileSync(
    avatarPng,
    makePng(240, 240, (x, y) => {
      const inCross =
        (x > 100 && x < 140 && y > 40 && y < 200) ||
        (y > 100 && y < 140 && x > 40 && x < 200);
      return inCross ? [255, 255, 255] : [235, 110, 30];
    })
  );

  const bannerPng = join(dir, "banner.png");
  writeFileSync(
    bannerPng,
    makePng(900, 300, (x, y) => [
      20 + Math.floor((x / 900) * 40),
      90 + Math.floor((y / 300) * 90),
      160 + Math.floor((x / 900) * 60),
    ])
  );

  // 1500x1400 of CSPRNG noise: deflate can't shrink it, so the file lands
  // around 6.3MB — comfortably over MAX_PROFILE_MEDIA_BYTES. (A cheap LCG is
  // not good enough here; deflate squeezed that down to 90KB.)
  const noise = randomBytes(1500 * 1400 * 3);
  let n = 0;
  const oversizedPng = join(dir, "oversized.png");
  writeFileSync(
    oversizedPng,
    makePng(1500, 1400, () => [noise[n++], noise[n++], noise[n++]])
  );
  if (statSync(oversizedPng).size <= 5 * 1024 * 1024) {
    throw new Error("oversized fixture came out under 5MB — test would be a no-op");
  }

  const textFile = join(dir, "resignation-letter.txt");
  writeFileSync(textFile, "I quit. Effective immediately.\n");

  return { dir, avatarPng, bannerPng, oversizedPng, textFile };
}
