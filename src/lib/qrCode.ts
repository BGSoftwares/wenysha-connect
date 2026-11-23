/**
 * Minimal QR Code generator (byte mode, error correction level M, versions 1-9) so report cards
 * can carry a scannable link without adding a dependency. Follows ISO/IEC 18004.
 */

// Per version (index = version): [data codewords per block layout, EC codewords per block].
// Each layout entry is [blockCount, dataCodewordsPerBlock].
const VERSIONS: { ecPerBlock: number; blocks: [number, number][]; align: number[] }[] = [
  { ecPerBlock: 0, blocks: [], align: [] }, // unused (versions are 1-based)
  { ecPerBlock: 10, blocks: [[1, 16]], align: [] },
  { ecPerBlock: 16, blocks: [[1, 28]], align: [6, 18] },
  { ecPerBlock: 26, blocks: [[1, 44]], align: [6, 22] },
  { ecPerBlock: 18, blocks: [[2, 32]], align: [6, 26] },
  { ecPerBlock: 24, blocks: [[2, 43]], align: [6, 30] },
  { ecPerBlock: 16, blocks: [[4, 27]], align: [6, 34] },
  { ecPerBlock: 18, blocks: [[4, 31]], align: [6, 22, 38] },
  { ecPerBlock: 22, blocks: [[2, 38], [2, 39]], align: [6, 24, 42] },
  { ecPerBlock: 22, blocks: [[3, 36], [2, 37]], align: [6, 26, 46] },
];

const dataCapacity = (version: number) =>
  VERSIONS[version].blocks.reduce((sum, [count, size]) => sum + count * size, 0);

const MAX_VERSION = VERSIONS.length - 1;

// GF(256) arithmetic with the QR polynomial 0x11D.
const EXP = new Array<number>(512);
const LOG = new Array<number>(256);
(() => {
  let value = 1;
  for (let i = 0; i < 255; i += 1) {
    EXP[i] = value;
    LOG[value] = i;
    value <<= 1;
    if (value & 0x100) value ^= 0x11d;
  }
  for (let i = 255; i < 512; i += 1) EXP[i] = EXP[i - 255];
})();

const gfMultiply = (a: number, b: number) => (a === 0 || b === 0 ? 0 : EXP[LOG[a] + LOG[b]]);

const reedSolomon = (data: number[], degree: number) => {
  let generator = [1];
  for (let i = 0; i < degree; i += 1) {
    const next = new Array<number>(generator.length + 1).fill(0);
    generator.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= gfMultiply(coefficient, EXP[i]);
    });
    generator = next;
  }
  const remainder = new Array<number>(degree).fill(0);
  data.forEach((byte) => {
    const factor = byte ^ remainder.shift()!;
    remainder.push(0);
    for (let i = 0; i < degree; i += 1) remainder[i] ^= gfMultiply(generator[i + 1], factor);
  });
  return remainder;
};

const toUtf8 = (text: string) => Array.from(new TextEncoder().encode(text));

const buildCodewords = (bytes: number[], version: number) => {
  const capacity = dataCapacity(version);
  const bits: number[] = [];
  const push = (value: number, length: number) => {
    for (let i = length - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
  };
  push(0b0100, 4); // byte mode
  push(bytes.length, 8); // character count (8 bits up to version 9)
  bytes.forEach((byte) => push(byte, 8));
  const capacityBits = capacity * 8;
  push(0, Math.min(4, capacityBits - bits.length));
  while (bits.length % 8 !== 0) bits.push(0);
  const data: number[] = [];
  for (let i = 0; i < bits.length; i += 8) {
    data.push(bits.slice(i, i + 8).reduce((acc, bit) => (acc << 1) | bit, 0));
  }
  for (let pad = 0xec; data.length < capacity; pad ^= 0xec ^ 0x11) data.push(pad);

  const { ecPerBlock, blocks } = VERSIONS[version];
  const dataBlocks: number[][] = [];
  let offset = 0;
  blocks.forEach(([count, size]) => {
    for (let i = 0; i < count; i += 1) {
      dataBlocks.push(data.slice(offset, offset + size));
      offset += size;
    }
  });
  const ecBlocks = dataBlocks.map((block) => reedSolomon(block, ecPerBlock));
  const result: number[] = [];
  const longest = Math.max(...dataBlocks.map((block) => block.length));
  for (let i = 0; i < longest; i += 1) dataBlocks.forEach((block) => { if (i < block.length) result.push(block[i]); });
  for (let i = 0; i < ecPerBlock; i += 1) ecBlocks.forEach((block) => result.push(block[i]));
  return result;
};

const bchRemainder = (value: number, generator: number, generatorBits: number) => {
  let remainder = value;
  for (let i = 31 - Math.clz32(value | 1); i >= generatorBits - 1; i -= 1) {
    if ((remainder >>> i) & 1) remainder ^= generator << (i - (generatorBits - 1));
  }
  return remainder;
};

const MASKS: ((row: number, column: number) => boolean)[] = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (_, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

const penalty = (grid: boolean[][]) => {
  const size = grid.length;
  let score = 0;
  const runScore = (line: boolean[]) => {
    let result = 0;
    let run = 1;
    for (let i = 1; i <= line.length; i += 1) {
      if (i < line.length && line[i] === line[i - 1]) {
        run += 1;
      } else {
        if (run >= 5) result += run - 2;
        run = 1;
      }
    }
    return result;
  };
  const finderLike = (line: boolean[]) => {
    const pattern = [true, false, true, true, true, false, true];
    let result = 0;
    for (let i = 0; i + 7 <= line.length; i += 1) {
      if (!pattern.every((cell, k) => line[i + k] === cell)) continue;
      const before = i >= 4 && [1, 2, 3, 4].every((k) => !line[i - k]);
      const after = i + 11 <= line.length && [7, 8, 9, 10].every((k) => !line[i + k]);
      if (before || after) result += 40;
    }
    return result;
  };
  for (let i = 0; i < size; i += 1) {
    const row = grid[i];
    const column = grid.map((line) => line[i]);
    score += runScore(row) + runScore(column) + finderLike(row) + finderLike(column);
  }
  for (let r = 0; r < size - 1; r += 1) {
    for (let c = 0; c < size - 1; c += 1) {
      const cell = grid[r][c];
      if (cell === grid[r][c + 1] && cell === grid[r + 1][c] && cell === grid[r + 1][c + 1]) score += 3;
    }
  }
  const dark = grid.reduce((sum, row) => sum + row.filter(Boolean).length, 0);
  score += Math.floor(Math.abs((dark * 20) / (size * size) - 10)) * 10;
  return score;
};

const draw = (codewords: number[], version: number, maskIndex: number) => {
  const size = version * 4 + 17;
  const modules = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const reserved = Array.from({ length: size }, () => new Array<boolean>(size).fill(false));
  const set = (r: number, c: number, dark: boolean, reserve = true) => {
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    modules[r][c] = dark;
    if (reserve) reserved[r][c] = true;
  };

  const finder = (top: number, left: number) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
        set(top + dr, left + dc, ring !== 2 && ring !== 4);
      }
    }
  };
  finder(0, 0);
  finder(0, size - 7);
  finder(size - 7, 0);

  // Reserve format areas and the dark module, then fill them once the mask is known (before the timing pattern, which must stay intact).
  for (let i = 0; i < 9; i += 1) {
    set(8, i, false);
    set(i, 8, false);
  }
  for (let i = 0; i < 8; i += 1) {
    set(8, size - 1 - i, false);
    set(size - 1 - i, 8, false);
  }
  set(size - 8, 8, true);

  for (let i = 8; i < size - 8; i += 1) {
    set(6, i, i % 2 === 0);
    set(i, 6, i % 2 === 0);
  }

  const positions = VERSIONS[version].align;
  positions.forEach((r) => positions.forEach((c) => {
    const overlapsFinder = (r === 6 && c === 6) || (r === 6 && c === positions[positions.length - 1]) || (c === 6 && r === positions[positions.length - 1]);
    if (overlapsFinder) return;
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
    }
  }));

  if (version >= 7) {
    const info = (version << 12) | bchRemainder(version << 12, 0x1f25, 13);
    for (let i = 0; i < 18; i += 1) {
      const bit = ((info >>> i) & 1) === 1;
      const a = size - 11 + (i % 3);
      const b = Math.floor(i / 3);
      set(a, b, bit);
      set(b, a, bit);
    }
  }

  // Data bits in the zig-zag order.
  const bits: boolean[] = [];
  codewords.forEach((byte) => { for (let i = 7; i >= 0; i -= 1) bits.push(((byte >>> i) & 1) === 1); });
  let bitIndex = 0;
  let upward = true;
  for (let column = size - 1; column > 0; column -= 2) {
    if (column === 6) column -= 1;
    for (let step = 0; step < size; step += 1) {
      const r = upward ? size - 1 - step : step;
      for (let offset = 0; offset < 2; offset += 1) {
        const c = column - offset;
        if (reserved[r][c]) continue;
        const bit = bitIndex < bits.length ? bits[bitIndex] : false;
        bitIndex += 1;
        modules[r][c] = bit !== MASKS[maskIndex](r, c);
      }
    }
    upward = !upward;
  }

  // Format information: error level M (00) + mask, BCH protected.
  const formatData = (0b00 << 3) | maskIndex;
  const format = ((formatData << 10) | bchRemainder(formatData << 10, 0x537, 11)) ^ 0x5412;
  const formatBit = (i: number) => ((format >>> i) & 1) === 1;
  for (let i = 0; i <= 5; i += 1) set(i, 8, formatBit(i));
  set(7, 8, formatBit(6));
  set(8, 8, formatBit(7));
  set(8, 7, formatBit(8));
  for (let i = 9; i < 15; i += 1) set(8, 14 - i, formatBit(i));
  for (let i = 0; i < 8; i += 1) set(8, size - 1 - i, formatBit(i));
  for (let i = 8; i < 15; i += 1) set(size - 15 + i, 8, formatBit(i));
  set(size - 8, 8, true);

  return modules;
};

/** Returns the QR module grid (true = dark) for the text, or null if it is too long for versions 1-9. */
export const qrMatrix = (text: string): boolean[][] | null => {
  const bytes = toUtf8(text);
  let version = 1;
  while (version <= MAX_VERSION && bytes.length > dataCapacity(version) - 3) version += 1;
  if (version > MAX_VERSION) return null;
  const codewords = buildCodewords(bytes, version);
  let best: boolean[][] | null = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask += 1) {
    const grid = draw(codewords, version, mask);
    const score = penalty(grid);
    if (score < bestScore) {
      best = grid;
      bestScore = score;
    }
  }
  return best;
};
