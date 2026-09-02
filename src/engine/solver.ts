import { MultiCellArrow } from '../types/game';
import { buildOccupancyGrid, checkRaycast } from './raycast';

/**
 * Finds all MultiCellArrows that currently have a completely clear exit path.
 */
export function findFreeArrows(
  rows: number,
  cols: number,
  arrows: MultiCellArrow[]
): MultiCellArrow[] {
  const activeArrows = arrows.filter((a) => !a.isRemoving);
  const grid = buildOccupancyGrid(rows, cols, activeArrows);
  const free: MultiCellArrow[] = [];

  for (const arrow of activeArrows) {
    const result = checkRaycast(grid, rows, cols, arrow);
    if (result.canFly) {
      free.push(arrow);
    }
  }

  return free;
}

/**
 * Validates that all arrows can be cleared step-by-step with zero deadlocks.
 */
export function isLevelSolvable(
  rows: number,
  cols: number,
  initialArrows: MultiCellArrow[]
): boolean {
  const grid = buildOccupancyGrid(rows, cols, initialArrows);
  const blockers = new Map<string, Set<string>>();

  for (const arrow of initialArrows) {
    const vector = arrow.direction === 'up'
      ? { dr: -1, dc: 0 }
      : arrow.direction === 'down'
        ? { dr: 1, dc: 0 }
        : arrow.direction === 'left'
          ? { dr: 0, dc: -1 }
          : { dr: 0, dc: 1 };
    const blockedBy = new Set<string>();
    let row = arrow.head.row + vector.dr;
    let col = arrow.head.col + vector.dc;
    while (row >= 0 && row < rows && col >= 0 && col < cols) {
      const obstacle = grid[row][col];
      if (obstacle && obstacle.id !== arrow.id) blockedBy.add(obstacle.id);
      row += vector.dr;
      col += vector.dc;
    }
    blockers.set(arrow.id, blockedBy);
  }

  const remaining = new Set(initialArrows.map((arrow) => arrow.id));
  while (remaining.size > 0) {
    const freeId = initialArrows.find(
      (arrow) => remaining.has(arrow.id) && blockers.get(arrow.id)?.size === 0
    )?.id;
    if (!freeId) return false;
    remaining.delete(freeId);
    for (const dependencies of blockers.values()) dependencies.delete(freeId);
  }
  return true;
}

/**
 * Returns the best hint arrow (the free arrow that unlocks the most other arrows).
 */
export function getBestHint(
  rows: number,
  cols: number,
  arrows: MultiCellArrow[]
): MultiCellArrow | null {
  const freeArrows = findFreeArrows(rows, cols, arrows);
  if (freeArrows.length === 0) return null;

  let bestArrow = freeArrows[0];
  let maxUnlocks = -1;

  for (const candidate of freeArrows) {
    const remaining = arrows.filter((a) => a.id !== candidate.id);
    const newFreeCount = findFreeArrows(rows, cols, remaining).length;
    if (newFreeCount > maxUnlocks) {
      maxUnlocks = newFreeCount;
      bestArrow = candidate;
    }
  }

  return bestArrow;
}
