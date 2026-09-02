import { MultiCellArrow, Direction, Point, LevelDefinition } from '../types/game';
import { isLevelSolvable } from './solver';

const DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left'];

const DIR_OFFSETS: Record<Direction, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

const DIR_OFFSETS_LIST: { dir: Direction; dr: number; dc: number }[] = [
  { dir: 'up', dr: -1, dc: 0 },
  { dir: 'down', dr: 1, dc: 0 },
  { dir: 'left', dr: 0, dc: -1 },
  { dir: 'right', dr: 0, dc: 1 },
];

function stepDirection(from: Point, to: Point): Direction {
  if (to.row === from.row) return to.col > from.col ? 'right' : 'left';
  return to.row > from.row ? 'down' : 'up';
}

/**
 * Fast deterministic PRNG (Mulberry32)
 */
function createPrng(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Generates an interlocking labyrinth maze within a custom silhouette mask.
 * Every arrow is strictly orthogonal (0 diagonals, 0 jumps), length >= 2,
 * perfectly aligned arrowheads, and 100% solvable.
 */
export function generateShapeMazeLevel(
  id: number,
  name: string,
  mask: string[],
  difficulty: 'Normal' | 'Hard' = 'Hard',
  minArrowTarget: number = 30,
  themeColor?: string,
  bgColor?: string,
  borderColor?: string
): LevelDefinition {
  const rows = mask.length;
  const cols = Math.max(...mask.map((m) => m.length));
  const rand = createPrng(id * 10007 + 77);

  const isInside = (r: number, c: number) => {
    return r >= 0 && r < rows && c >= 0 && c < mask[r].length && mask[r][c] === '#';
  };

  const validCells: Point[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isInside(r, c)) validCells.push({ row: r, col: c });
    }
  }

  const grid: (MultiCellArrow | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );
  const placedArrows: MultiCellArrow[] = [];
  let arrowId = 0;

  // 1. Interlocking Vertical Columns
  const verticalCols = new Set<number>();
  for (let c = 2; c < cols - 2; c += 3) {
    if (rand() > 0.45) verticalCols.add(c);
  }

  for (const c of verticalCols) {
    const colCells = validCells.filter((pt) => pt.col === c).sort((a, b) => a.row - b.row);
    if (colCells.length < 4) continue;

    const vGroups: Point[][] = [];
    let curV: Point[] = [colCells[0]];
    for (let i = 1; i < colCells.length; i++) {
      if (colCells[i].row === colCells[i - 1].row + 1) {
        curV.push(colCells[i]);
      } else {
        vGroups.push(curV);
        curV = [colCells[i]];
      }
    }
    vGroups.push(curV);

    const dir: Direction = c % 2 === 0 ? 'down' : 'up';
    for (const vGroup of vGroups) {
      if (vGroup.length < 3) continue;
      const segLen = 5; // minimum length 5
      let rIdx = 0;
      while (rIdx < vGroup.length) {
        let endIdx = Math.min(vGroup.length - 1, rIdx + segLen - 1);
        if (vGroup.length - endIdx === 2 || vGroup.length - endIdx === 3 || vGroup.length - endIdx === 4) {
          endIdx = vGroup.length - 1;
        }
        const seg = vGroup.slice(rIdx, endIdx + 1);
        if (seg.length >= 2) {
          const pts = [...seg];
          if (dir === 'up') pts.reverse();
          const arrow: MultiCellArrow = {
            id: `arrow_${id}_${arrowId++}`,
            head: pts[pts.length - 1],
            tail: pts,
            direction: dir,
          };
          for (const p of pts) {
            grid[p.row][p.col] = arrow;
          }
          placedArrows.push(arrow);
        }
        rIdx = endIdx + 1;
      }
    }
  }

  // 2. Interlocking Horizontal Rows
  for (let r = 0; r < rows; r++) {
    const rowCells = validCells
      .filter((pt) => pt.row === r && grid[r][pt.col] === null)
      .sort((a, b) => a.col - b.col);
    if (rowCells.length === 0) continue;

    const contiguousGroups: Point[][] = [];
    let curGroup: Point[] = [rowCells[0]];
    for (let i = 1; i < rowCells.length; i++) {
      if (rowCells[i].col === rowCells[i - 1].col + 1) {
        curGroup.push(rowCells[i]);
      } else {
        contiguousGroups.push(curGroup);
        curGroup = [rowCells[i]];
      }
    }
    contiguousGroups.push(curGroup);

    const dir: Direction = r % 2 === 0 ? 'right' : 'left';

    for (const group of contiguousGroups) {
      if (group.length === 1) {
        const cell = group[0];
        for (const off of Object.values(DIR_OFFSETS)) {
          const nr = cell.row + off.dr;
          const nc = cell.col + off.dc;
          if (isInside(nr, nc) && grid[nr][nc] !== null) {
            const neighbor = grid[nr][nc]!;
            if (neighbor.tail[0].row === nr && neighbor.tail[0].col === nc) {
              neighbor.tail.unshift(cell);
              grid[cell.row][cell.col] = neighbor;
              break;
            }
          }
        }
        continue;
      }

      const segLen = 5; // minimum length 5
      let cIdx = 0;
      while (cIdx < group.length) {
        let endIdx = Math.min(group.length - 1, cIdx + segLen - 1);
        if (group.length - endIdx === 2 || group.length - endIdx === 3 || group.length - endIdx === 4) {
          endIdx = group.length - 1;
        }
        const seg = group.slice(cIdx, endIdx + 1);
        if (seg.length >= 2) {
          const pts = [...seg];
          if (dir === 'left') pts.reverse();
          const arrow: MultiCellArrow = {
            id: `arrow_${id}_${arrowId++}`,
            head: pts[pts.length - 1],
            tail: pts,
            direction: dir,
          };
          for (const p of pts) {
            grid[p.row][p.col] = arrow;
          }
          placedArrows.push(arrow);
        }
        cIdx = endIdx + 1;
      }
    }
  }

  // 3. Absorb any residual 1-cell strictly into tail[0]
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!isInside(r, c) || grid[r][c] !== null) continue;
      for (const off of Object.values(DIR_OFFSETS)) {
        const nr = r + off.dr;
        const nc = c + off.dc;
        if (isInside(nr, nc) && grid[nr][nc] !== null) {
          const neighbor = grid[nr][nc]!;
          if (neighbor.tail[0].row === nr && neighbor.tail[0].col === nc) {
            neighbor.tail.unshift({ row: r, col: c });
            grid[r][c] = neighbor;
            break;
          }
        }
      }
    }
  }

  return {
    id,
    name,
    difficulty,
    rows,
    cols,
    mask,
    themeColor,
    bgColor,
    borderColor,
    arrows: placedArrows.map((a) => ({
      id: a.id,
      head: a.head,
      tail: a.tail,
      direction: a.direction,
    })),
  };
}

/**
 * Generates continuous labyrinth arrows for square Master Levels.
 * 100% orthogonal (0 diagonals, 0 jumps), length >= 2, and 100% solvable.
 */
export function generateInterlockingMazeLevel(
  id: number,
  name: string,
  rows: number = 20,
  cols: number = 20,
  difficulty: 'Normal' | 'Hard' = 'Hard',
  minArrows: number = 35
): LevelDefinition {
  const rand = createPrng(id * 20011 + 77);
  const grid: (MultiCellArrow | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );
  const placedArrows: MultiCellArrow[] = [];
  let arrowId = 0;

  // 1. Interlocking Vertical Columns
  const verticalCols = new Set<number>();
  for (let c = 2; c < cols - 2; c += 4) {
    if (rand() > 0.4) verticalCols.add(c);
  }

  for (const c of verticalCols) {
    const colCells: Point[] = [];
    for (let r = 0; r < rows; r++) {
      colCells.push({ row: r, col: c });
    }

    const dir: Direction = c % 2 === 0 ? 'down' : 'up';
    const segLen = Math.floor(colCells.length / 3);
    let rIdx = 0;
    while (rIdx < colCells.length) {
      let endIdx = Math.min(colCells.length - 1, rIdx + segLen - 1);
      if (colCells.length - endIdx === 2) {
        endIdx = colCells.length - 1;
      }
      const seg = colCells.slice(rIdx, endIdx + 1);
      if (seg.length >= 2) {
        const pts = [...seg];
        if (dir === 'up') pts.reverse();
        const arrow: MultiCellArrow = {
          id: `arrow_${id}_${arrowId++}`,
          head: pts[pts.length - 1],
          tail: pts,
          direction: dir,
        };
        for (const p of pts) {
          grid[p.row][p.col] = arrow;
        }
        placedArrows.push(arrow);
      }
      rIdx = endIdx + 1;
    }
  }

  // 2. Interlocking Horizontal Rows
  for (let r = 0; r < rows; r++) {
    const rowCells: Point[] = [];
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === null) {
        rowCells.push({ row: r, col: c });
      }
    }
    if (rowCells.length === 0) continue;

    const contiguousGroups: Point[][] = [];
    let curGroup: Point[] = [rowCells[0]];
    for (let i = 1; i < rowCells.length; i++) {
      if (rowCells[i].col === rowCells[i - 1].col + 1) {
        curGroup.push(rowCells[i]);
      } else {
        contiguousGroups.push(curGroup);
        curGroup = [rowCells[i]];
      }
    }
    contiguousGroups.push(curGroup);

    const dir: Direction = r % 2 === 0 ? 'right' : 'left';

    for (const group of contiguousGroups) {
      if (group.length === 1) {
        const cell = group[0];
        for (const off of Object.values(DIR_OFFSETS)) {
          const nr = cell.row + off.dr;
          const nc = cell.col + off.dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== null) {
            const neighbor = grid[nr][nc]!;
            if (neighbor.tail[0].row === nr && neighbor.tail[0].col === nc) {
              neighbor.tail.unshift(cell);
              grid[cell.row][cell.col] = neighbor;
              break;
            }
          }
        }
        continue;
      }

      const segLen = Math.max(3, Math.min(6, Math.floor(group.length / 2)));
      let cIdx = 0;
      while (cIdx < group.length) {
        let endIdx = Math.min(group.length - 1, cIdx + segLen - 1);
        if (group.length - endIdx === 2) {
          endIdx = group.length - 1;
        }
        const seg = group.slice(cIdx, endIdx + 1);
        if (seg.length >= 2) {
          const pts = [...seg];
          if (dir === 'left') pts.reverse();
          const arrow: MultiCellArrow = {
            id: `arrow_${id}_${arrowId++}`,
            head: pts[pts.length - 1],
            tail: pts,
            direction: dir,
          };
          for (const p of pts) {
            grid[p.row][p.col] = arrow;
          }
          placedArrows.push(arrow);
        }
        cIdx = endIdx + 1;
      }
    }
  }

  // 3. Absorb any leftover single cells
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== null) continue;
      for (const off of Object.values(DIR_OFFSETS)) {
        const nr = r + off.dr;
        const nc = c + off.dc;
        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && grid[nr][nc] !== null) {
          const neighbor = grid[nr][nc]!;
          if (neighbor.tail[0].row === nr && neighbor.tail[0].col === nc) {
            neighbor.tail.unshift({ row: r, col: c });
            grid[r][c] = neighbor;
            break;
          }
        }
      }
    }
  }

  return {
    id,
    name,
    difficulty,
    rows,
    cols,
    arrows: placedArrows.map((a) => ({
      id: a.id,
      head: a.head,
      tail: a.tail,
      direction: a.direction,
    })),
  };
}

function upscaleMaskIfNeeded(mask: string[], minTargetCells = 720): string[] {
  let count = 0;
  mask.forEach((r) => {
    for (const c of r) if (c === '#') count++;
  });
  if (count >= minTargetCells) return mask;

  const scale = Math.sqrt(minTargetCells / Math.max(1, count));
  const origRows = mask.length;
  const origCols = Math.max(...mask.map((r) => r.length));
  const newRows = Math.round(origRows * Math.max(1.25, scale));
  const newCols = Math.round(origCols * Math.max(1.25, scale));

  const newMask: string[] = [];
  for (let r = 0; r < newRows; r++) {
    let rowStr = '';
    const srcR = Math.min(origRows - 1, Math.floor((r / newRows) * origRows));
    for (let c = 0; c < newCols; c++) {
      const srcC = Math.min(origCols - 1, Math.floor((c / newCols) * origCols));
      rowStr += (mask[srcR] && mask[srcR][srcC]) || '.';
    }
    newMask.push(rowStr);
  }
  return newMask;
}

/**
 * Removes unused source-canvas space around an illustration. Several authored
 * masks intentionally live inside a 30x30 editing canvas; retaining that empty
 * area made wide or asymmetric objects render tiny and off-centre in-game.
 */
function cropMaskToArtwork(mask: string[], padding = 1): string[] {
  const width = Math.max(0, ...mask.map((row) => row.length));
  let minRow = mask.length;
  let maxRow = -1;
  let minCol = width;
  let maxCol = -1;

  for (let row = 0; row < mask.length; row++) {
    for (let col = 0; col < width; col++) {
      if (mask[row]?.[col] !== '#') continue;
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
      minCol = Math.min(minCol, col);
      maxCol = Math.max(maxCol, col);
    }
  }

  if (maxRow < 0 || maxCol < 0) return mask;

  const contentWidth = maxCol - minCol + 1;
  const emptyRow = '.'.repeat(contentWidth + padding * 2);
  const cropped: string[] = Array.from({ length: padding }, () => emptyRow);
  for (let row = minRow; row <= maxRow; row++) {
    const content = Array.from({ length: contentWidth }, (_, offset) =>
      mask[row]?.[minCol + offset] === '#' ? '#' : '.'
    ).join('');
    cropped.push('.'.repeat(padding) + content + '.'.repeat(padding));
  }
  cropped.push(...Array.from({ length: padding }, () => emptyRow));
  return cropped;
}

/**
 * Fills a shape with snake-shaped arrows (bent L/U-shape tails), like a real
 * maze puzzle. Strategy:
 *   1. Try ring-order snake construction (heads outward, tails wind inward).
 *      Retries with different seeds; keeps whichever is solvable.
 *   2. If none pass, fall back to the guaranteed-solvable straight-line generator.
 *   3. Regardless of source, run a bend post-processor that swaps cells between
 *      adjacent arrows to bend more tails. Each swap is verified with the solver
 *      and reverted if it breaks solvability.
 */
export function generateSnakeMazeLevel(
  id: number,
  name: string,
  rawMask: string[],
  difficulty: 'Normal' | 'Hard' = 'Hard',
  themeColor?: string,
  bgColor?: string,
  borderColor?: string,
  minTargetCells: number = 1750
): LevelDefinition {
  // Crop before scaling so the device fits the artwork—not its authoring canvas.
  // High-resolution artwork provides enough occupied cells for 100+ distinct
  // snakes while still allowing each snake to carry a long, winding body.
  const croppedMask = cropMaskToArtwork(rawMask, minTargetCells > 0 ? 1 : 0);
  const mask = minTargetCells > 0
    ? upscaleMaskIfNeeded(croppedMask, minTargetCells)
    : croppedMask;
  const rows = mask.length;
  const cols = Math.max(...mask.map((m) => m.length));

  const isInside = (r: number, c: number) =>
    r >= 0 && r < rows && c >= 0 && c < mask[r].length && mask[r][c] === '#';

  const validCells: Point[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (isInside(r, c)) validCells.push({ row: r, col: c });
    }
  }

  const distFromOutside = computeDistFromOutside(rows, cols, validCells, isInside);

  // Try ring-order snake fill first
  let arrows: MultiCellArrow[] | null = null;
  const MAX_SNAKE_ATTEMPTS = 40;
  for (let attempt = 0; attempt < MAX_SNAKE_ATTEMPTS; attempt++) {
    const rand = createPrng(id * 10007 + 77 + attempt * 991);
    const snake = peelingMazeFill(
      id,
      rows,
      cols,
      isInside,
      validCells,
      rand
    );
    if (snake && isLevelSolvable(rows, cols, snake)) {
      arrows = snake;
      break;
    }
  }

  // Fallback: straight-line skeleton
  if (!arrows) {
    const base = generateShapeMazeLevel(
      id,
      name,
      mask,
      difficulty,
      30,
      themeColor,
      bgColor,
      borderColor
    );
    arrows = base.arrows.map((a) => ({
      id: a.id!,
      head: a.head,
      tail: [...a.tail],
      direction: a.direction,
    }));
  }

  // Build occupancy grid
  const grid: (MultiCellArrow | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );
  for (const arr of arrows) {
    for (const pt of arr.tail) grid[pt.row][pt.col] = arr;
  }

  // Solvability repair: if the base is unsolvable (can happen for complex masks),
  // try reversing individual arrows until it becomes solvable.
  if (!isLevelSolvable(rows, cols, arrows)) {
    repairSolvability(arrows, rows, cols);
  }

  // Prefer fewer, readable paths over a field of tiny 2–4 cell fragments.
  mergeShortArrows(arrows, grid, rows, cols, 7);

  // Bend post-processor (verified swaps only; also tries arrow reversal)
  const rand = createPrng(id * 10007 + 77);
  const bendBudgetMs = 300;
  bendTails(arrows, grid, rows, cols, rand, bendBudgetMs);

  // Final cleanup after bending can expose a few short paths again.
  mergeShortArrows(arrows, grid, rows, cols, 7);

  // Enforce visual variety on the exact post-merge geometry the player sees.
  // A normalized run/turn pattern may occur at most four times per board.
  diversifyRepeatedPatterns(arrows, grid, rows, cols, rand, 350);
  const tierArrowFloor = rows >= 42 ? 160 : rows >= 39 ? 125 : rows >= 36 ? 110 : rows >= 34 ? 100 : 90;
  mergeExcessPatterns(arrows, grid, rows, cols, tierArrowFloor);
  diversifyRepeatedPatterns(arrows, grid, rows, cols, rand, 250);
  mergeExcessPatterns(arrows, grid, rows, cols, tierArrowFloor);

  // Re-orient selected snakes to build deeper blocker chains. Geometry and
  // coverage stay identical; a reversal is accepted only when the full board
  // remains solvable and the number of exposed choices decreases.
  // Larger boards receive more optimization time, creating a deliberate
  // difficulty ramp with fewer exposed exits and deeper blocker chains.
  const dependencyBudgetMs = Math.min(420, 180 + Math.floor((rows * cols) / 5));
  hardenArrowDependencies(arrows, rows, cols, rand, dependencyBudgetMs);
  balanceArrowDirections(arrows, rows, cols, rand, 650);

  return {
    id,
    name,
    difficulty,
    rows,
    cols,
    mask,
    themeColor,
    bgColor,
    borderColor,
    arrows: arrows.map((a) => ({
      id: a.id,
      head: a.head,
      tail: a.tail,
      direction: a.direction,
    })),
  };
}

function directionBalanceScore(arrows: MultiCellArrow[]): number {
  const counts: Record<Direction, number> = { up: 0, down: 0, left: 0, right: 0 };
  for (const arrow of arrows) counts[arrow.direction]++;
  const target = arrows.length / 4;
  return (Object.values(counts) as number[]).reduce(
    (score, count) => score + (count - target) * (count - target),
    0
  );
}

/** Reorient paths only when both solvability and four-way balance improve. */
function balanceArrowDirections(
  arrows: MultiCellArrow[],
  rows: number,
  cols: number,
  rand: () => number,
  budgetMs: number
) {
  const deadline = Date.now() + budgetMs;
  let bestScore = directionBalanceScore(arrows);
  for (let pass = 0; pass < 6 && Date.now() < deadline; pass++) {
    const order = arrows.map((_, index) => index);
    for (let index = order.length - 1; index > 0; index--) {
      const swapIndex = Math.floor(rand() * (index + 1));
      [order[index], order[swapIndex]] = [order[swapIndex], order[index]];
    }
    let improved = false;
    for (const index of order) {
      if (Date.now() >= deadline) return;
      const arrow = arrows[index];
      reverseArrow(arrow);
      const score = directionBalanceScore(arrows);
      if (score < bestScore && isLevelSolvable(rows, cols, arrows)) {
        bestScore = score;
        improved = true;
      } else {
        reverseArrow(arrow);
      }
    }
    if (!improved) break;
  }
}

function mergeExcessPatterns(
  arrows: MultiCellArrow[],
  grid: (MultiCellArrow | null)[][],
  rows: number,
  cols: number,
  minimumArrowCount: number
) {
  let progress = true;
  while (progress && arrows.length > minimumArrowCount) {
    progress = false;
    const counts = new Map<string, number>();
    for (const arrow of arrows) {
      const key = arrowPatternSignature(arrow.tail);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    for (let index = arrows.length - 1; index >= 0; index--) {
      const arrow = arrows[index];
      const key = arrowPatternSignature(arrow.tail);
      if ((counts.get(key) ?? 0) <= 4 && arrow.tail.length >= 5) continue;
      const endpoints = [
        { point: arrow.head, reversed: false },
        { point: arrow.tail[0], reversed: true },
      ];
      let merged = false;
      for (const endpoint of endpoints) {
        for (const offset of DIR_OFFSETS_LIST) {
          const row = endpoint.point.row + offset.dr;
          const col = endpoint.point.col + offset.dc;
          if (row < 0 || col < 0 || row >= rows || col >= cols) continue;
          const host = grid[row][col];
          if (!host || host === arrow) continue;
          let hostReversed = false;
          if (host.tail[0].row !== row || host.tail[0].col !== col) {
            if (host.head.row !== row || host.head.col !== col) continue;
            reverseArrow(host);
            hostReversed = true;
          }
          const originalTail = host.tail;
          const contribution = endpoint.reversed ? [...arrow.tail].reverse() : arrow.tail;
          host.tail = [...contribution, ...host.tail];
          const candidate = arrows.filter((item) => item !== arrow);
          if (isLevelSolvable(rows, cols, candidate)) {
            for (const point of arrow.tail) grid[point.row][point.col] = host;
            arrows.splice(index, 1);
            counts.set(key, (counts.get(key) ?? 1) - 1);
            progress = true;
            merged = true;
            break;
          }
          host.tail = originalTail;
          if (hostReversed) reverseArrow(host);
        }
        if (merged) break;
      }
      if (arrows.length <= minimumArrowCount) return;
    }
  }
}

function patternExcess(arrows: MultiCellArrow[], cap = 4): number {
  const counts = new Map<string, number>();
  for (const arrow of arrows) {
    const signature = arrowPatternSignature(arrow.tail);
    counts.set(signature, (counts.get(signature) ?? 0) + 1);
  }
  let excess = 0;
  for (const count of counts.values()) excess += Math.max(0, count - cap);
  return excess;
}

function diversifyRepeatedPatterns(
  arrows: MultiCellArrow[],
  grid: (MultiCellArrow | null)[][],
  rows: number,
  cols: number,
  rand: () => number,
  budgetMs: number
) {
  const deadline = Date.now() + budgetMs;
  let score = patternExcess(arrows);
  while (score > 0 && Date.now() < deadline) {
    const counts = new Map<string, number>();
    for (const arrow of arrows) {
      const key = arrowPatternSignature(arrow.tail);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const repeated = arrows.filter(
      (arrow) => arrow.tail.length >= 2 && (counts.get(arrowPatternSignature(arrow.tail)) ?? 0) > 4
    );
    if (repeated.length === 0) break;
    const arrow = repeated[Math.floor(rand() * repeated.length)];
    const snapshot = arrows.map((item) => ({
      item,
      tail: [...item.tail],
      head: item.head,
      direction: item.direction,
    }));
    let changed = false;
    // Reversal changes the visible run order and arrowhead placement while
    // preserving every occupied cell. Keep it only when the puzzle remains
    // solvable; otherwise try a one-cell tail exchange with a neighbour.
    reverseArrow(arrow);
    if (isLevelSolvable(rows, cols, arrows)) {
      changed = true;
    } else {
      reverseArrow(arrow);
      changed =
        tryExtendTailStart(arrow, arrows, grid, rows, cols, rand) ||
        tryReverseAndExtend(arrow, arrows, grid, rows, cols, rand);
    }
    const nextScore = changed ? patternExcess(arrows) : score;
    if (changed && nextScore < score) {
      score = nextScore;
      continue;
    }
    for (const saved of snapshot) {
      saved.item.tail = saved.tail;
      saved.item.head = saved.head;
      saved.item.direction = saved.direction;
    }
    for (let row = 0; row < rows; row++) grid[row].fill(null);
    for (const item of arrows) {
      for (const point of item.tail) grid[point.row][point.col] = item;
    }
  }
}

/**
 * Difficulty score for a deterministic solve path. Squaring each free-arrow
 * count strongly penalizes boards that expose a large easy perimeter, while
 * the extra opening weight makes the first decision genuinely puzzle-like.
 */
function freedomScore(rows: number, cols: number, source: MultiCellArrow[]): number {
  const occupancy: (string | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );
  for (const arrow of source) {
    for (const point of arrow.tail) occupancy[point.row][point.col] = arrow.id;
  }

  // An arrow can leave only after every distinct arrow intersecting its forward
  // ray has gone. Building this dependency graph once avoids rebuilding the
  // entire occupancy grid at every simulated move.
  const blockers = new Map<string, Set<string>>();
  for (const arrow of source) {
    const blockedBy = new Set<string>();
    const offset = DIR_OFFSETS[arrow.direction];
    let row = arrow.head.row + offset.dr;
    let col = arrow.head.col + offset.dc;
    while (row >= 0 && row < rows && col >= 0 && col < cols) {
      const blockerId = occupancy[row][col];
      if (blockerId && blockerId !== arrow.id) blockedBy.add(blockerId);
      row += offset.dr;
      col += offset.dc;
    }
    blockers.set(arrow.id, blockedBy);
  }

  const remaining = new Set(source.map((arrow) => arrow.id));
  let score = 0;
  let step = 0;
  while (remaining.size > 0) {
    const free = source.filter(
      (arrow) => remaining.has(arrow.id) && blockers.get(arrow.id)?.size === 0
    );
    if (free.length === 0) return Number.POSITIVE_INFINITY;
    score += free.length * free.length;
    if (step === 0) score += free.length * source.length * 3;
    const removedId = free[0].id;
    remaining.delete(removedId);
    for (const dependencies of blockers.values()) dependencies.delete(removedId);
    step++;
  }
  return score;
}

function reverseArrow(arrow: MultiCellArrow) {
  if (arrow.tail.length < 2) return;
  const reversed = [...arrow.tail].reverse();
  arrow.tail = reversed;
  arrow.head = reversed[reversed.length - 1];
  arrow.direction = stepDirection(reversed[reversed.length - 2], arrow.head);
}

function hardenArrowDependencies(
  arrows: MultiCellArrow[],
  rows: number,
  cols: number,
  rand: () => number,
  budgetMs: number
) {
  const deadline = Date.now() + budgetMs;
  let bestScore = freedomScore(rows, cols, arrows);

  for (let pass = 0; pass < 3 && Date.now() < deadline; pass++) {
    const order = arrows.map((_, index) => index);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }

    let improved = false;
    for (const index of order) {
      if (Date.now() >= deadline) return;
      const arrow = arrows[index];
      if (arrow.tail.length < 2) continue;

      reverseArrow(arrow);
      const candidateScore = freedomScore(rows, cols, arrows);
      if (candidateScore < bestScore) {
        bestScore = candidateScore;
        improved = true;
      } else {
        reverseArrow(arrow);
      }
    }
    if (!improved) break;
  }

  // A pair reversal can escape local minima where either reversal alone would
  // deadlock or expose more choices. Spend the remaining bounded budget trying
  // deterministic pairs, still accepting only a fully solvable improvement.
  while (Date.now() < deadline && arrows.length > 1) {
    const first = Math.floor(rand() * arrows.length);
    let second = Math.floor(rand() * (arrows.length - 1));
    if (second >= first) second++;
    reverseArrow(arrows[first]);
    reverseArrow(arrows[second]);
    const candidateScore = freedomScore(rows, cols, arrows);
    if (candidateScore < bestScore) {
      bestScore = candidateScore;
    } else {
      reverseArrow(arrows[second]);
      reverseArrow(arrows[first]);
    }
  }
}

function computeDistFromOutside(
  rows: number,
  cols: number,
  validCells: Point[],
  isInside: (r: number, c: number) => boolean
): number[][] {
  const dist: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => Infinity)
  );
  const q: Point[] = [];
  for (const pt of validCells) {
    for (const off of DIR_OFFSETS_LIST) {
      if (!isInside(pt.row + off.dr, pt.col + off.dc)) {
        dist[pt.row][pt.col] = 1;
        q.push(pt);
        break;
      }
    }
  }
  let head = 0;
  while (head < q.length) {
    const p = q[head++];
    for (const off of DIR_OFFSETS_LIST) {
      const nr = p.row + off.dr;
      const nc = p.col + off.dc;
      if (isInside(nr, nc) && dist[nr][nc] > dist[p.row][p.col] + 1) {
        dist[nr][nc] = dist[p.row][p.col] + 1;
        q.push({ row: nr, col: nc });
      }
    }
  }
  return dist;
}

/**
 * Merges arrows that have fewer than `minLength` cells (default 5)
 * into adjacent compatible arrows so all arrows have long, winding tails.
 */
function mergeShortArrows(
  arrows: MultiCellArrow[],
  grid: (MultiCellArrow | null)[][],
  rows: number,
  cols: number,
  minLength: number = 5
) {
  let progress = true;
  let passes = 0;
  while (progress && passes < 14) {
    progress = false;
    passes++;

    for (let i = arrows.length - 1; i >= 0; i--) {
      const arr = arrows[i];
      if (arr.tail.length >= minLength) continue;

      const a0 = arr.tail[0];
      const aHead = arr.head;

      // Option 1: arr's head touches host's tail[0] -> merge arr into host
      let merged = false;
      for (const off of DIR_OFFSETS_LIST) {
        const nr = aHead.row + off.dr;
        const nc = aHead.col + off.dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const host = grid[nr][nc];
        if (!host || host === arr) continue;
        if (host.tail[0].row === nr && host.tail[0].col === nc) {
          const origHostTail = host.tail;
          host.tail = [...arr.tail, ...host.tail];
          for (const pt of arr.tail) grid[pt.row][pt.col] = host;
          const candidateList = arrows.filter((a) => a !== arr);

          if (isLevelSolvable(rows, cols, candidateList)) {
            arrows.splice(i, 1);
            progress = true;
            merged = true;
            break;
          } else {
            host.tail = origHostTail;
            for (const pt of arr.tail) grid[pt.row][pt.col] = arr;
          }
        }
      }
      if (merged) continue;

      // Option 2: arr's tail[0] touches host's tail[0] -> reverse arr and merge into host
      for (const off of DIR_OFFSETS_LIST) {
        const nr = a0.row + off.dr;
        const nc = a0.col + off.dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const host = grid[nr][nc];
        if (!host || host === arr) continue;
        if (host.tail[0].row === nr && host.tail[0].col === nc) {
          const origHostTail = host.tail;
          const reversedArr = [...arr.tail].reverse();
          host.tail = [...reversedArr, ...host.tail];
          for (const pt of arr.tail) grid[pt.row][pt.col] = host;
          const candidateList = arrows.filter((a) => a !== arr);

          if (isLevelSolvable(rows, cols, candidateList)) {
            arrows.splice(i, 1);
            progress = true;
            merged = true;
            break;
          } else {
            host.tail = origHostTail;
            for (const pt of arr.tail) grid[pt.row][pt.col] = arr;
          }
        }
      }
      if (merged) continue;

      // Option 3: host with > minLength donates cells to arr.tail[0]
      for (const off of DIR_OFFSETS_LIST) {
        const nr = a0.row + off.dr;
        const nc = a0.col + off.dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const donor = grid[nr][nc];
        if (!donor || donor === arr || donor.tail.length <= minLength) continue;
        if (donor.tail[0].row === nr && donor.tail[0].col === nc) {
          arr.tail.unshift({ row: nr, col: nc });
          donor.tail.shift();
          grid[nr][nc] = arr;
          if (isLevelSolvable(rows, cols, arrows)) {
            progress = true;
            break;
          } else {
            arr.tail.shift();
            donor.tail.unshift({ row: nr, col: nc });
            grid[nr][nc] = donor;
          }
        }
      }
    }
  }
}

/**
 * Best-effort attempt to make an unsolvable arrow set solvable by flipping
 * individual arrows (swap head to the other end, invert direction).
 */
function repairSolvability(
  arrows: MultiCellArrow[],
  rows: number,
  cols: number
) {
  const MAX_PASSES = 5;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (isLevelSolvable(rows, cols, arrows)) return;
    let changed = false;
    for (const arr of arrows) {
      if (arr.tail.length < 2) continue;
      const origTail = arr.tail;
      const origHead = arr.head;
      const origDir = arr.direction;
      const newTail = [...origTail].reverse();
      const newHead = newTail[newTail.length - 1];
      const newDir = stepDirection(newTail[newTail.length - 2], newHead);
      arr.tail = newTail;
      arr.head = newHead;
      arr.direction = newDir;
      if (isLevelSolvable(rows, cols, arrows)) return;
      arr.tail = origTail;
      arr.head = origHead;
      arr.direction = origDir;
    }
    if (!changed) break;
  }
}

function bendTails(
  arrows: MultiCellArrow[],
  grid: (MultiCellArrow | null)[][],
  rows: number,
  cols: number,
  rand: () => number,
  budgetMs: number = 120
) {
  const deadline = Date.now() + budgetMs;
  const MAX_PASSES = 10;
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (Date.now() > deadline) return;
    const order = arrows.map((_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    let changed = false;
    for (const idx of order) {
      if (Date.now() > deadline) return;
      const arr = arrows[idx];
      let extended = false;
      if (tryExtendTailStart(arr, arrows, grid, rows, cols, rand)) {
        changed = true;
        extended = true;
        tryExtendTailStart(arr, arrows, grid, rows, cols, rand);
      }
      if (!extended && tryReverseAndExtend(arr, arrows, grid, rows, cols, rand)) {
        changed = true;
      }
    }
    if (!changed) break;
  }
}

function tryReverseAndExtend(
  arrow: MultiCellArrow,
  allArrows: MultiCellArrow[],
  grid: (MultiCellArrow | null)[][],
  rows: number,
  cols: number,
  rand: () => number
): boolean {
  if (arrow.tail.length < 2) return false;
  const origTail = arrow.tail;
  const origHead = arrow.head;
  const origDir = arrow.direction;

  const newTail = [...origTail].reverse();
  const newHead = newTail[newTail.length - 1];
  const newDir = stepDirection(newTail[newTail.length - 2], newHead);

  arrow.tail = newTail;
  arrow.head = newHead;
  arrow.direction = newDir;

  if (!isLevelSolvable(rows, cols, allArrows)) {
    arrow.tail = origTail;
    arrow.head = origHead;
    arrow.direction = origDir;
    return false;
  }
  const extended = tryExtendTailStart(arrow, allArrows, grid, rows, cols, rand);
  if (!extended) {
    arrow.tail = origTail;
    arrow.head = origHead;
    arrow.direction = origDir;
    return false;
  }
  return true;
}

function tryExtendTailStart(
  arrow: MultiCellArrow,
  allArrows: MultiCellArrow[],
  grid: (MultiCellArrow | null)[][],
  rows: number,
  cols: number,
  rand: () => number
): boolean {
  if (arrow.tail.length < 2) return false;
  const a0 = arrow.tail[0];
  const a1 = arrow.tail[1];
  const currDir = stepDirection(a0, a1);

  const perps: Direction[] =
    currDir === 'up' || currDir === 'down' ? ['left', 'right'] : ['up', 'down'];
  // Perpendicular directions prioritized for zigzag kinks
  const candidates: Direction[] = [...perps, oppositeDir(currDir)];
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }

  for (const dir of candidates) {
    const off = DIR_OFFSETS[dir];
    const nr = a0.row + off.dr;
    const nc = a0.col + off.dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
    const donor = grid[nr][nc];
    if (!donor || donor === arrow) continue;
    if (donor.tail[0].row !== nr || donor.tail[0].col !== nc) continue;
    // Donor needs > 5 cells so it maintains >= 5 after donation
    if (donor.tail.length <= 5) continue;

    // Tentative swap
    arrow.tail.unshift({ row: nr, col: nc });
    donor.tail.shift();
    grid[nr][nc] = arrow;

    if (isLevelSolvable(rows, cols, allArrows)) {
      return true;
    }
    // Revert
    arrow.tail.shift();
    donor.tail.unshift({ row: nr, col: nc });
    grid[nr][nc] = donor;
  }
  return false;
}

function getTurn(prevDir: Direction, newDir: Direction): 'left' | 'right' | 'straight' | 'reverse' {
  if (prevDir === newDir) return 'straight';
  if (prevDir === oppositeDir(newDir)) return 'reverse';
  if (
    (prevDir === 'up' && newDir === 'left') ||
    (prevDir === 'left' && newDir === 'down') ||
    (prevDir === 'down' && newDir === 'right') ||
    (prevDir === 'right' && newDir === 'up')
  ) {
    return 'left';
  }
  return 'right';
}

/** Exact rendered geometry key: oriented runs and their lengths. */
export function arrowPatternSignature(points: Point[]): string {
  if (points.length < 2) return `single:${points.length}`;
  const directions: Direction[] = [];
  for (let index = 1; index < points.length; index++) {
    directions.push(stepDirection(points[index - 1], points[index]));
  }
  const runs: { direction: Direction; length: number }[] = [];
  for (const direction of directions) {
    const last = runs[runs.length - 1];
    if (last?.direction === direction) last.length++;
    else runs.push({ direction, length: 1 });
  }
  return runs.map((run) => `${run.direction[0].toUpperCase()}${run.length}`).join(',');
}

/**
 * Randomized peeling maze. At every step the head is selected from a cell with
 * a completely clear ray through cells already peeled away. Its body then
 * wanders through the still-unclaimed matrix. The construction order is also
 * a guaranteed solve order, but unlike ring filling it has no row/column bands.
 */
export function peelingMazeFill(
  levelId: number,
  rows: number,
  cols: number,
  isInside: (r: number, c: number) => boolean,
  validCells: Point[],
  rand: () => number
): MultiCellArrow[] | null {
  const remaining = Array.from({ length: rows }, (_, row) =>
    Array.from({ length: cols }, (_, col) => isInside(row, col))
  );
  const arrows: MultiCellArrow[] = [];
  const directionCounts: Record<Direction, number> = { up: 0, down: 0, left: 0, right: 0 };
  let cellsLeft = validCells.length;
  let arrowId = 0;

  while (cellsLeft > 0) {
    const exposed: { point: Point; direction: Direction }[] = [];
    for (let row = 0; row < rows; row++) {
      let first = -1;
      let last = -1;
      for (let col = 0; col < cols; col++) {
        if (!remaining[row][col]) continue;
        if (first < 0) first = col;
        last = col;
      }
      if (first >= 0) {
        exposed.push({ point: { row, col: first }, direction: 'left' });
        if (last !== first) exposed.push({ point: { row, col: last }, direction: 'right' });
      }
    }
    for (let col = 0; col < cols; col++) {
      let first = -1;
      let last = -1;
      for (let row = 0; row < rows; row++) {
        if (!remaining[row][col]) continue;
        if (first < 0) first = row;
        last = row;
      }
      if (first >= 0) {
        exposed.push({ point: { row: first, col }, direction: 'up' });
        if (last !== first) exposed.push({ point: { row: last, col }, direction: 'down' });
      }
    }
    if (exposed.length === 0) break;

    const growable = exposed.filter(({ point, direction }) => {
      const inward = DIR_OFFSETS[oppositeDir(direction)];
      const row = point.row + inward.dr;
      const col = point.col + inward.dc;
      return row >= 0 && col >= 0 && row < rows && col < cols && remaining[row][col];
    });
    if (growable.length === 0) {
      const loneCell = exposed[Math.floor(rand() * exposed.length)].point;
      remaining[loneCell.row][loneCell.col] = false;
      cellsLeft--;
      continue;
    }

    const minimumDirectionCount = Math.min(...growable.map((item) => directionCounts[item.direction]));
    const balanced = growable.filter(
      (item) => directionCounts[item.direction] <= minimumDirectionCount + 1
    );
    const chosenHead = balanced[Math.floor(rand() * balanced.length)];
    const targetLength = Math.min(cellsLeft, 7 + Math.floor(rand() * 13));
    const path: Point[] = [chosenHead.point];
    const visited = new Set([`${chosenHead.point.row},${chosenHead.point.col}`]);
    let current = chosenHead.point;
    let previousDirection: Direction | null = null;
    let straightRun = 0;
    const style = Math.floor(rand() * 4);

    while (path.length < targetLength) {
      const candidates: { point: Point; direction: Direction; weight: number }[] = [];
      for (const offset of DIR_OFFSETS_LIST) {
        if (path.length === 1 && offset.dir !== oppositeDir(chosenHead.direction)) continue;
        const row = current.row + offset.dr;
        const col = current.col + offset.dc;
        const key = `${row},${col}`;
        if (row < 0 || col < 0 || row >= rows || col >= cols) continue;
        if (!remaining[row][col] || visited.has(key)) continue;
        if (previousDirection && offset.dir === oppositeDir(previousDirection)) continue;

        let createsOrphan = false;
        for (const adjacent of DIR_OFFSETS_LIST) {
          const adjacentRow = row + adjacent.dr;
          const adjacentCol = col + adjacent.dc;
          const adjacentKey = `${adjacentRow},${adjacentCol}`;
          if (
            adjacentRow < 0 || adjacentCol < 0 || adjacentRow >= rows || adjacentCol >= cols ||
            !remaining[adjacentRow][adjacentCol] || visited.has(adjacentKey)
          ) continue;
          let futureDegree = 0;
          for (const future of DIR_OFFSETS_LIST) {
            const futureRow = adjacentRow + future.dr;
            const futureCol = adjacentCol + future.dc;
            if (
              futureRow < 0 || futureCol < 0 || futureRow >= rows || futureCol >= cols ||
              (futureRow === row && futureCol === col) ||
              !remaining[futureRow][futureCol] || visited.has(`${futureRow},${futureCol}`)
            ) continue;
            futureDegree++;
          }
          if (futureDegree === 0) { createsOrphan = true; break; }
        }
        if (createsOrphan) continue;

        let freeNeighbours = 0;
        for (const neighbour of DIR_OFFSETS_LIST) {
          const nextRow = row + neighbour.dr;
          const nextCol = col + neighbour.dc;
          if (
            nextRow >= 0 && nextCol >= 0 && nextRow < rows && nextCol < cols &&
            remaining[nextRow][nextCol] && !visited.has(`${nextRow},${nextCol}`)
          ) freeNeighbours++;
        }
        let weight = 4 + rand() * 12 + freeNeighbours * 1.5;
        if (previousDirection) {
          const turn = getTurn(previousDirection, offset.dir);
          if (style === 0) weight += turn === 'straight' && straightRun < 5 ? 12 : 2;
          else if (style === 1) weight += turn !== 'straight' ? 14 : 3;
          else if (style === 2) weight += turn === 'left' ? 13 : 5;
          else weight += turn === 'right' ? 13 : 5;
        }
        candidates.push({ point: { row, col }, direction: offset.dir, weight });
      }
      if (candidates.length === 0) break;
      const total = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
      let roll = rand() * total;
      let chosen = candidates[candidates.length - 1];
      for (const candidate of candidates) {
        roll -= candidate.weight;
        if (roll <= 0) { chosen = candidate; break; }
      }
      path.push(chosen.point);
      visited.add(`${chosen.point.row},${chosen.point.col}`);
      if (chosen.direction === previousDirection) straightRun++;
      else straightRun = 1;
      previousDirection = chosen.direction;
      current = chosen.point;
    }

    path.reverse();
    if (path.length === 1) {
      const loneCell = path[0];
      remaining[loneCell.row][loneCell.col] = false;
      cellsLeft--;
      continue;
    }
    const arrow: MultiCellArrow = {
      id: `arrow_${levelId}_${arrowId++}`,
      head: chosenHead.point,
      tail: path,
      direction: chosenHead.direction,
    };
    for (const point of path) {
      if (remaining[point.row][point.col]) {
        remaining[point.row][point.col] = false;
        cellsLeft--;
      }
    }
    arrows.push(arrow);
    directionCounts[chosenHead.direction]++;
  }

  return cellsLeft === 0 ? arrows : null;
}

/**
 * Ring-order snake fill: guarantees solvability by construction.
 * - Outermost-first (by BFS distance from mask edge)
 * - Each arrow's HEAD points outward toward lower rings
 * - Each arrow's TAIL winds inward with intense alternating 90-degree zigzags
 * - Target arrow tail length is 8..15 cells (extra long zigzag snakes)
 */
function ringOrderSnakeFill(
  levelId: number,
  rows: number,
  cols: number,
  isInside: (r: number, c: number) => boolean,
  validCells: Point[],
  distFromOutside: number[][],
  rand: () => number
): MultiCellArrow[] | null {
  const grid: (MultiCellArrow | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );
  const arrows: MultiCellArrow[] = [];
  const patternCounts = new Map<string, number>();
  const createdDirectionCounts: Record<Direction, number> = { up: 0, down: 0, left: 0, right: 0 };
  let arrowId = 0;

  // Group cells by ring (distance from outside)
  const rings = new Map<number, Point[]>();
  let maxRing = 0;
  for (const pt of validCells) {
    const d = distFromOutside[pt.row][pt.col];
    if (!Number.isFinite(d)) continue;
    if (!rings.has(d)) rings.set(d, []);
    rings.get(d)!.push(pt);
    if (d > maxRing) maxRing = d;
  }

  for (let ring = 1; ring <= maxRing; ring++) {
    const cells = rings.get(ring);
    if (!cells) continue;
    const shuffled = [...cells];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    for (const seed of shuffled) {
      if (grid[seed.row][seed.col] !== null) continue;

      // Pick an outward direction
      const outwardOptions: Direction[] = [];
      for (const off of DIR_OFFSETS_LIST) {
        const nr = seed.row + off.dr;
        const nc = seed.col + off.dc;
        if (!isInside(nr, nc)) {
          if (ring === 1) outwardOptions.push(off.dir);
        } else if (distFromOutside[nr][nc] === ring - 1) {
          outwardOptions.push(off.dir);
        }
      }
      if (outwardOptions.length === 0) continue;

      const roomyOptions: Direction[] = [];
      for (const cand of outwardOptions) {
        const opp = oppositeDir(cand);
        const off = DIR_OFFSETS[opp];
        const nr = seed.row + off.dr;
        const nc = seed.col + off.dc;
        if (
          isInside(nr, nc) &&
          grid[nr][nc] === null &&
          distFromOutside[nr][nc] >= ring
        ) {
          roomyOptions.push(cand);
        }
      }
      const viableOptions = roomyOptions.length > 0 ? roomyOptions : outwardOptions;
      const leastUsed = Math.min(...viableOptions.map((option) => createdDirectionCounts[option]));
      const balancedOptions = viableOptions.filter(
        (option) => createdDirectionCounts[option] === leastUsed
      );
      const direction = balancedOptions[Math.floor(rand() * balancedOptions.length)];

      // Grow a purposeful path inward. Longer paths reduce visual noise and make
      // each tap feel like a meaningful piece of the silhouette is removed.
      let path: Point[] = [];
      let signature = '';

      // Try several uncommitted walks. Once a normalized shape has appeared
      // four times, later arrows must find a different run/turn sequence.
      for (let shapeAttempt = 0; shapeAttempt < 18; shapeAttempt++) {
        const candidatePath: Point[] = [seed];
        const visited = new Set<string>([`${seed.row},${seed.col}`]);
        const targetLen = 7 + Math.floor(rand() * 12); // 7..18 cells per arrow
        const straightLimit = 1 + Math.floor(rand() * 7);
        const movementStyle = Math.floor(rand() * 4); // corridor, coil, stairs, mixed
        let cur = seed;
        let lastStepDir: Direction | null = null;
        let lastTurnSide: 'left' | 'right' | null = null;
        let straightCount = 0;

      // First step: opposite of head direction
      const oppFirst = DIR_OFFSETS[oppositeDir(direction)];
      const firstR = cur.row + oppFirst.dr;
      const firstC = cur.col + oppFirst.dc;
      if (
        isInside(firstR, firstC) &&
        grid[firstR][firstC] === null &&
        distFromOutside[firstR][firstC] >= ring &&
        !visited.has(`${firstR},${firstC}`)
      ) {
        const pt = { row: firstR, col: firstC };
        candidatePath.push(pt);
        visited.add(`${firstR},${firstC}`);
        cur = pt;
        lastStepDir = oppositeDir(direction);
        straightCount = 1;
      }

      // Continue growing inward with intense alternating zigzags (staircase / serpentine)
      while (candidatePath.length < targetLen) {
        const candidates: { pt: Point; dir: Direction; weight: number }[] = [];
        for (const off of DIR_OFFSETS_LIST) {
          const nr = cur.row + off.dr;
          const nc = cur.col + off.dc;
          const key = `${nr},${nc}`;
          if (!isInside(nr, nc)) continue;
          if (grid[nr][nc] !== null) continue;
          if (visited.has(key)) continue;
          if (distFromOutside[nr][nc] < ring) continue;

          let w = 1.0;
          if (lastStepDir) {
            const turn = getTurn(lastStepDir, off.dir);
            if (turn === 'reverse') continue;
            if (turn === 'straight') {
              const corridorBoost = movementStyle === 0 ? 11 : 6;
              w = straightCount >= straightLimit ? 1 : corridorBoost;
            } else if (lastTurnSide === null) {
              w = movementStyle === 0 ? 5 : 12;
            } else if (movementStyle === 1) {
              // Same-side turns create hooks and compact coils.
              w = turn === lastTurnSide ? 18 : 4;
            } else if (movementStyle === 2) {
              // Alternating turns create staircase snakes.
              w = turn !== lastTurnSide ? 18 : 4;
            } else if (movementStyle === 3) {
              // Mixed arrows avoid a predictable turn rhythm.
              w = 8 + rand() * 12;
            } else {
              w = turn !== lastTurnSide ? 10 : 7;
            }
          }
          // Randomness dominates: turns are encouraged but no single motif is
          // repeated across the matrix. A light inward pull preserves coverage.
          w += (distFromOutside[nr][nc] - ring) * 0.25;
          w += rand() * 18;

          candidates.push({ pt: { row: nr, col: nc }, dir: off.dir, weight: w });
        }
        if (candidates.length === 0) break;
        const totalWeight = candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
        let roll = rand() * totalWeight;
        let chosen = candidates[candidates.length - 1];
        for (const candidate of candidates) {
          roll -= candidate.weight;
          if (roll <= 0) {
            chosen = candidate;
            break;
          }
        }
        candidatePath.push(chosen.pt);
        visited.add(`${chosen.pt.row},${chosen.pt.col}`);
        if (lastStepDir) {
          const turn = getTurn(lastStepDir, chosen.dir);
          if (turn === 'left' || turn === 'right') {
            lastTurnSide = turn;
            straightCount = 1;
          } else if (turn === 'straight') {
            straightCount++;
          }
        }
        cur = chosen.pt;
        lastStepDir = chosen.dir;
        }

        if (candidatePath.length < 2) continue;
        // Store and compare the orientation that will actually be rendered
        // after the path is reversed into tail-start -> arrowhead order.
        const candidateSignature = arrowPatternSignature([...candidatePath].reverse());
        if ((patternCounts.get(candidateSignature) ?? 0) < 4) {
          path = candidatePath;
          signature = candidateSignature;
          break;
        }
      }

      if (path.length < 2) {
        continue;
      }

      patternCounts.set(signature, (patternCounts.get(signature) ?? 0) + 1);

      // Reverse so tail[0] is deepest and tail[end] = head = seed
      path.reverse();

      const arrow: MultiCellArrow = {
        id: `arrow_${levelId}_${arrowId++}`,
        head: seed,
        tail: path,
        direction,
      };
      for (const pt of path) grid[pt.row][pt.col] = arrow;
      arrows.push(arrow);
      createdDirectionCounts[direction]++;
    }
  }

  // Absorb stragglers into adjacent arrows
  for (const pt of validCells) {
    if (grid[pt.row][pt.col] === null) absorbSingleCell(pt, grid);
  }

  // Coverage check: every valid cell must belong to an arrow
  for (const pt of validCells) {
    if (grid[pt.row][pt.col] === null) return null;
  }
  return arrows;
}

function oppositeDir(d: Direction): Direction {
  switch (d) {
    case 'up':
      return 'down';
    case 'down':
      return 'up';
    case 'left':
      return 'right';
    case 'right':
      return 'left';
  }
}

function absorbSingleCell(cell: Point, grid: (MultiCellArrow | null)[][]) {
  const rows = grid.length;
  const cols = grid[0].length;
  for (const off of DIR_OFFSETS_LIST) {
    const nr = cell.row + off.dr;
    const nc = cell.col + off.dc;
    if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
    const neighbor = grid[nr][nc];
    if (!neighbor) continue;
    if (neighbor.tail[0].row === nr && neighbor.tail[0].col === nc) {
      neighbor.tail.unshift(cell);
      grid[cell.row][cell.col] = neighbor;
      return;
    }
  }
}
