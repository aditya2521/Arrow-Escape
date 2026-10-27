import { checkRaycast, buildOccupancyGrid } from '../engine/raycast';
import { findFreeArrows, isLevelSolvable, getBestHint } from '../engine/solver';
import {
  ALL_EASYBRAIN_LEVELS,
  getEasybrainLevelById,
  ALL_LEVEL_METADATA,
  TOTAL_LEVELS,
} from '../engine/handcraftedMazes';
import { MultiCellArrow } from '../types/game';
import { hasSelfBlockingTail, repairSelfBlockingArrows } from '../engine/arrowGeometry';
import { generateSnakeMazeLevel } from '../engine/mazeGenerator';

describe('Easybrain MultiCellArrow Engine Tests', () => {
  it('instantly provides 500 unique level metadata records with 0 repeats', () => {
    expect(TOTAL_LEVELS).toBe(500);
    expect(ALL_LEVEL_METADATA.length).toBe(500);
    expect(ALL_EASYBRAIN_LEVELS.length).toBe(500);

    // Verify all 500 levels have unique names
    const names = new Set(ALL_LEVEL_METADATA.map((l) => l.name));
    expect(names.size).toBe(500);

    expect(ALL_LEVEL_METADATA[0].name).toBe('Foundations 001');
    expect(ALL_LEVEL_METADATA[20].name).toBe('Crossroads 021');
    expect(ALL_LEVEL_METADATA[249].name).toBe('Master Grid 250');
    expect(ALL_LEVEL_METADATA[250].name).toBe('Precision 251');
    expect(ALL_LEVEL_METADATA[499].name).toBe('Grandmaster 500');
  });

  it('correctly handles multi-cell occupancy and collision detection', () => {
    const arrows: MultiCellArrow[] = [
      {
        id: 'A',
        head: { row: 1, col: 1 },
        tail: [{ row: 1, col: 0 }, { row: 1, col: 1 }],
        direction: 'right',
      },
      {
        id: 'B',
        head: { row: 0, col: 2 },
        tail: [{ row: 2, col: 2 }, { row: 1, col: 2 }, { row: 0, col: 2 }],
        direction: 'up',
      },
      {
        id: 'C',
        head: { row: 0, col: 0 },
        tail: [{ row: 0, col: 1 }, { row: 0, col: 0 }],
        direction: 'left',
      },
    ];

    const grid = buildOccupancyGrid(4, 4, arrows);

    const rayA = checkRaycast(grid, 4, 4, arrows[0]);
    expect(rayA.canFly).toBe(false);
    expect(rayA.blocker?.id).toBe('B');

    const rayB = checkRaycast(grid, 4, 4, arrows[1]);
    expect(rayB.canFly).toBe(true);

    const rayC = checkRaycast(grid, 4, 4, arrows[2]);
    expect(rayC.canFly).toBe(true);
  });

  it('validates hint generation for multi-point mazes', () => {
    const arrows: MultiCellArrow[] = [
      {
        id: '1',
        head: { row: 1, col: 1 },
        tail: [{ row: 1, col: 0 }, { row: 1, col: 1 }],
        direction: 'right',
      },
      {
        id: '2',
        head: { row: 0, col: 2 },
        tail: [{ row: 2, col: 2 }, { row: 1, col: 2 }, { row: 0, col: 2 }],
        direction: 'up',
      },
    ];

    const free = findFreeArrows(4, 4, arrows);
    expect(free.length).toBe(1);
    expect(free[0].id).toBe('2');

    const hint = getBestHint(4, 4, arrows);
    expect(hint?.id).toBe('2');
  });

  it('repairs looping tails in all directions without removing cells or mutating the source', () => {
    let path = [
      { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 },
      { row: 1, col: 4 }, { row: 0, col: 4 }, { row: 0, col: 3 },
      { row: 0, col: 2 }, { row: 0, col: 1 }, { row: 0, col: 0 },
      { row: 1, col: 0 }, { row: 2, col: 0 }, { row: 3, col: 0 },
      { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 2 },
      { row: 3, col: 2 },
    ];
    const cells = (points: typeof path) => points.map(({ row, col }) => `${row},${col}`).sort();
    for (const direction of ['up', 'right', 'down', 'left'] as const) {
      const arrow: MultiCellArrow = {
        id: 'loop', head: path[path.length - 1], tail: path, direction,
      };
      expect(hasSelfBlockingTail(arrow)).toBe(true);
      const fixed = repairSelfBlockingArrows(5, 5, [arrow]);
      expect(fixed.length).toBeGreaterThan(1);
      expect(cells(fixed.flatMap((piece) => piece.tail))).toEqual(cells(path));
      expect(new Set(fixed.map((piece) => piece.id)).size).toBe(fixed.length);
      expect(fixed.every((piece) => piece.tail.length >= 2)).toBe(true);
      expect(arrow.tail).toBe(path);
      expect(arrow.head).toBe(path[path.length - 1]);
      expect(fixed.some(hasSelfBlockingTail)).toBe(false);
      expect(isLevelSolvable(5, 5, fixed)).toBe(true);
      expect(repairSelfBlockingArrows(5, 5, fixed)).toBe(fixed);
      path = path.map(({ row, col }) => ({ row: col, col: 4 - row }));
    }
  });

  it('keeps every arrow in all 500 shipped levels clear of its own exit ray and every board solvable', () => {
    const invalidLevels: number[] = [];
    for (const level of ALL_EASYBRAIN_LEVELS) {
      const arrows = level.arrows.map((arrow, index) => ({
        ...arrow, id: arrow.id ?? `a_${index}`,
      }));
      if (arrows.some(hasSelfBlockingTail) || !isLevelSolvable(level.rows, level.cols, arrows)) {
        invalidLevels.push(level.id);
      }
    }
    expect(invalidLevels).toEqual([]);
  });

  it('also prevents self-blocking tails in newly generated levels', () => {
    const level = generateSnakeMazeLevel(
      2026, 'Exit clarity', Array.from({ length: 16 }, () => '#'.repeat(16)),
      'Hard', undefined, undefined, undefined, 0
    );
    expect(level.arrows.some(hasSelfBlockingTail)).toBe(false);
    expect(isLevelSolvable(level.rows, level.cols, level.arrows.map((arrow, index) => ({
      ...arrow, id: arrow.id ?? `a_${index}`,
    })))).toBe(true);
  });

  it('ensures sample matrix levels have 0 cell overlaps, no jumps, and are 100% solvable', () => {
    const sampleIds = [1, 2, 3, 4, 5, 10, 20, 50, 100, 150, 200, 250, 275, 300, 325, 350, 375, 400, 425, 450, 475, 500];

    for (const id of sampleIds) {
      const level = getEasybrainLevelById(id);
      expect(level.arrows.length).toBeGreaterThanOrEqual(8);

      // Verify no overlaps and every long arrow is continuous with no jumps.
      const seenCells = new Set<string>();
      for (const arrow of level.arrows) {
        // Reference-style irregular boards may retain a compact two-cell arrow
        // where carving creates intentional negative space.
        expect(arrow.tail.length).toBeGreaterThanOrEqual(2);

        // Check strictly adjacent points (0 diagonals/jumps)
        for (let i = 1; i < arrow.tail.length; i++) {
          const d =
            Math.abs(arrow.tail[i].row - arrow.tail[i - 1].row) +
            Math.abs(arrow.tail[i].col - arrow.tail[i - 1].col);
          expect(d).toBe(1);
        }

        const points = [...arrow.tail];
        if (!points.some((p) => p.row === arrow.head.row && p.col === arrow.head.col)) {
          points.push(arrow.head);
        }

        for (const pt of points) {
          const key = `${pt.row},${pt.col}`;
          expect(seenCells.has(key)).toBe(false);
          seenCells.add(key);
        }
      }

      // Verify 100% Solvability
      const solvable = isLevelSolvable(
        level.rows,
        level.cols,
        level.arrows.map((a, idx) => ({
          id: a.id || `a_${idx}`,
          head: a.head,
          tail: a.tail,
          direction: a.direction,
        }))
      );
      expect(solvable).toBe(true);
    }
  });
});
