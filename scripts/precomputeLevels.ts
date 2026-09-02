/**
 * Build-time script: generates all 500 matrix levels and writes them out as a
 * static TypeScript module. Runtime code loads the constant directly — no
 * generation on device, no delay when tapping a level.
 *
 * Run with:  npx tsx scripts/precomputeLevels.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { MATRIX_LEVEL_SPECS } from '../src/engine/matrixLevels';
import { PRECOMPUTED_LEVELS } from '../src/engine/precomputedLevels';
import { arrowPatternSignature, generateSnakeMazeLevel } from '../src/engine/mazeGenerator';
import { isLevelSolvable } from '../src/engine/solver';
import { MultiCellArrow } from '../src/types/game';

const OUT_PATH = path.join(__dirname, '..', 'src', 'engine', 'precomputedLevels.ts');
const OUT_DATA_DIR = path.join(__dirname, '..', 'src', 'engine');
const LEVELS_PER_CHUNK = 100;
const PRESERVED_LEVEL_COUNT = Math.min(250, PRECOMPUTED_LEVELS.length);

const start = Date.now();
const levels: any[] = PRECOMPUTED_LEVELS.slice(0, PRESERVED_LEVEL_COUNT);
let unsolvable: string[] = [];
let invalidLengths: string[] = [];
let undersized: string[] = [];
let repetitive: string[] = [];
let misalignedHeads: string[] = [];
const fingerprintFor = (level: any) => JSON.stringify(level.arrows.map((arrow: MultiCellArrow) => [
  arrow.head.row,
  arrow.head.col,
  arrow.direction,
  arrow.tail,
]));
const fingerprints = new Set<string>(levels.map(fingerprintFor));

console.log(`Preserving ${PRESERVED_LEVEL_COUNT} previously validated levels.`);

for (let i = PRESERVED_LEVEL_COUNT; i < MATRIX_LEVEL_SPECS.length; i++) {
  const art = MATRIX_LEVEL_SPECS[i];
  const t0 = Date.now();
  // Search deterministic seeds until the layout is both solvable and contains
  // no tiny arrow fragments.
  // until we find a solvable layout for problematic masks.
  let lvl: any = null;
  let arrows: MultiCellArrow[] = [];
  let ok = false;
  let lengthOk = false;
  let countOk = false;
  let varietyOk = false;
  let directionOk = false;
  let attemptsUsed = 0;
  for (let attempt = 0; attempt < 60; attempt++) {
    attemptsUsed = attempt + 1;
    const idForGen = (i + 1) + attempt * 10007;
    lvl = generateSnakeMazeLevel(
      idForGen,
      art.name,
      art.mask,
      art.difficulty,
      art.themeColor,
      art.bgColor,
      art.borderColor,
      0
    );
    arrows = lvl.arrows.map((a: any) => ({
      id: a.id!,
      head: a.head,
      tail: a.tail,
      direction: a.direction,
    }));
    ok = isLevelSolvable(lvl.rows, lvl.cols, arrows);
    lengthOk = Math.min(...arrows.map((arrow) => arrow.tail.length)) >= 2;
    const tierArrowFloor = art.rows >= 42 ? 160 : art.rows >= 39 ? 125 : art.rows >= 36 ? 110 : art.rows >= 34 ? 100 : 90;
    countOk = arrows.length >= tierArrowFloor;
    const patternCounts = new Map<string, number>();
    for (const arrow of arrows) {
      const key = arrowPatternSignature(arrow.tail);
      patternCounts.set(key, (patternCounts.get(key) ?? 0) + 1);
    }
    varietyOk = Math.max(...patternCounts.values()) <= 12;
    directionOk = arrows.every((arrow) => {
      const neck = arrow.tail[arrow.tail.length - 2];
      if (!neck) return false;
      const expected = arrow.head.row < neck.row
        ? 'up'
        : arrow.head.row > neck.row
          ? 'down'
          : arrow.head.col < neck.col
            ? 'left'
            : 'right';
      return arrow.direction === expected;
    });
    if (ok && lengthOk && countOk && varietyOk && directionOk) break;
  }
  // Normalize id to sequential (1..N) regardless of internal seed we ended up using
  lvl.id = i + 1;
  if (!ok) unsolvable.push(`L${i + 1} ${art.name}`);
  const shortest = Math.min(...lvl.arrows.map((arrow: MultiCellArrow) => arrow.tail.length));
  if (shortest < 2) invalidLengths.push(`L${i + 1} ${art.name} (shortest=${shortest})`);
  const requiredCount = art.rows >= 42 ? 160 : art.rows >= 39 ? 125 : art.rows >= 36 ? 110 : art.rows >= 34 ? 100 : 90;
  if (lvl.arrows.length < requiredCount) undersized.push(`L${i + 1} ${art.name} (arrows=${lvl.arrows.length}, required=${requiredCount})`);
  if (!varietyOk) repetitive.push(`L${i + 1} ${art.name}`);
  if (!directionOk) misalignedHeads.push(`L${i + 1} ${art.name}`);
  const fingerprint = fingerprintFor(lvl);
  if (fingerprints.has(fingerprint)) {
    console.error(`\nABORT — duplicate matrix layout at L${i + 1} ${art.name}`);
    process.exit(1);
  }
  fingerprints.add(fingerprint);
  console.log(
    `L${(i + 1).toString().padStart(2)} ${art.name.padEnd(22)}` +
      ` arrows=${lvl.arrows.length.toString().padStart(4)}  ${Date.now() - t0}ms  ${ok ? 'OK' : 'UNSOLVABLE'}` +
      (attemptsUsed > 1 ? `  (attempts=${attemptsUsed})` : '')
  );
  levels.push(lvl);
}

if (unsolvable.length) {
  console.error('\nABORT — unsolvable levels:', unsolvable);
  process.exit(1);
}

if (invalidLengths.length) {
  console.error('\nABORT — levels contain invalid single-cell arrows:', invalidLengths);
  process.exit(1);
}

if (undersized.length) {
  console.error('\nABORT — matrix levels below the 90-arrow floor:', undersized);
  process.exit(1);
}

if (repetitive.length) {
  console.error('\nABORT — levels exceeded the repeated-pattern safety limit:', repetitive);
  process.exit(1);
}

if (misalignedHeads.length) {
  console.error('\nABORT — levels contain arrowheads misaligned with their neck:', misalignedHeads);
  process.exit(1);
}

const wrapper = `// AUTO-GENERATED by scripts/precomputeLevels.ts — do not edit by hand.
// Payloads stay in JSON chunks so TypeScript does not infer a 500-level AST
// and every tracked file remains safely below GitHub's 100 MB limit.
import { LevelDefinition } from '../types/game';
// Metro can expose JSON either directly (native) or under \`default\` (web/HMR).
const unwrap = (data: LevelDefinition[] | { default: LevelDefinition[] }) =>
  Array.isArray(data) ? data : data.default;
export const PRECOMPUTED_LEVELS: LevelDefinition[] = [
${Array.from({ length: Math.ceil(levels.length / LEVELS_PER_CHUNK) }, (_, index) => `  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ...unwrap(require('./precomputedLevels-${index + 1}.json')),`).join('\n')}
];
`;

const chunkPaths: string[] = [];
for (let offset = 0; offset < levels.length; offset += LEVELS_PER_CHUNK) {
  const chunkNumber = Math.floor(offset / LEVELS_PER_CHUNK) + 1;
  const chunkPath = path.join(OUT_DATA_DIR, `precomputedLevels-${chunkNumber}.json`);
  fs.writeFileSync(chunkPath, JSON.stringify(levels.slice(offset, offset + LEVELS_PER_CHUNK)), 'utf8');
  chunkPaths.push(chunkPath);
}
fs.writeFileSync(OUT_PATH, wrapper, 'utf8');

const totalMs = Date.now() - start;
const kb = (chunkPaths.reduce((sum, chunkPath) => sum + fs.statSync(chunkPath).size, 0) / 1024).toFixed(1);
console.log(
  `\nWrote ${levels.length} levels across ${chunkPaths.length} JSON chunks (${kb} KB) in ${totalMs}ms`
);
