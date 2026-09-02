import { checkRaycast, buildOccupancyGrid } from '../engine/raycast';
import { findFreeArrows, isLevelSolvable, getBestHint } from '../engine/solver';
import {
  ALL_EASYBRAIN_LEVELS,
  getEasybrainLevelById,
  ALL_LEVEL_METADATA,
  TOTAL_LEVELS,
} from '../engine/handcraftedMazes';
import { MultiCellArrow } from '../types/game';

describe('Easybrain MultiCellArrow Engine Tests', () => {
  it('instantly provides 250 unique level metadata records with 0 repeats', () => {
    expect(TOTAL_LEVELS).toBe(250);
    expect(ALL_LEVEL_METADATA.length).toBe(250);
    expect(ALL_EASYBRAIN_LEVELS.length).toBe(250);

    // Verify all 250 levels have unique names
    const names = new Set(ALL_LEVEL_METADATA.map((l) => l.name));
    expect(names.size).toBe(250);

    expect(ALL_LEVEL_METADATA[0].name).toBe('Foundations 001');
    expect(ALL_LEVEL_METADATA[20].name).toBe('Crossroads 021');
    expect(ALL_LEVEL_METADATA[249].name).toBe('Master Grid 250');
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

  it('ensures sample matrix levels have 0 cell overlaps, no jumps, and are 100% solvable', () => {
    const sampleIds = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 75, 100, 125, 150, 175, 200, 225, 250];

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
