import { MultiCellArrow, Direction, RaycastResult, Point } from '../types/game';

export const DIRECTION_VECTORS: Record<Direction, { dr: number; dc: number; angleDeg: number }> = {
  right: { dr: 0, dc: 1, angleDeg: 0 },
  down: { dr: 1, dc: 0, angleDeg: 90 },
  left: { dr: 0, dc: -1, angleDeg: 180 },
  up: { dr: -1, dc: 0, angleDeg: 270 },
};

export type MultiCellGrid = (MultiCellArrow | null)[][];

/**
 * Builds a fast 2D occupancy grid where each cell points to the MultiCellArrow occupying it.
 * Arrows currently in flight (removingArrowIds) are instantly omitted so they never block subsequent arrows.
 */
export function buildOccupancyGrid(
  rows: number,
  cols: number,
  arrows: MultiCellArrow[],
  removingArrowIds?: Set<string>
): MultiCellGrid {
  const grid: MultiCellGrid = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  for (const arrow of arrows) {
    if (arrow.isRemoving || (removingArrowIds && removingArrowIds.has(arrow.id))) {
      continue; // In-flight arrow never blocks other arrows!
    }

    // Register all points of the arrow's tail/body and head
    const pointsToRegister = [...arrow.tail];
    if (!pointsToRegister.some((p) => p.row === arrow.head.row && p.col === arrow.head.col)) {
      pointsToRegister.push(arrow.head);
    }

    for (const pt of pointsToRegister) {
      if (pt.row >= 0 && pt.row < rows && pt.col >= 0 && pt.col < cols) {
        grid[pt.row][pt.col] = arrow;
      }
    }
  }

  return grid;
}

/**
 * Raycasts from the arrow's head outwards along its pointing direction.
 */
export function checkRaycast(
  grid: MultiCellGrid,
  rows: number,
  cols: number,
  arrow: MultiCellArrow
): RaycastResult {
  const vector = DIRECTION_VECTORS[arrow.direction];
  let currRow = arrow.head.row + vector.dr;
  let currCol = arrow.head.col + vector.dc;
  let distance = 0;

  while (currRow >= 0 && currRow < rows && currCol >= 0 && currCol < cols) {
    distance++;
    const obstacle = grid[currRow][currCol];
    if (obstacle !== null && obstacle.id !== arrow.id && !obstacle.isRemoving) {
      return {
        canFly: false,
        blocker: obstacle,
        distance,
      };
    }
    currRow += vector.dr;
    currCol += vector.dc;
  }

  return {
    canFly: true,
    blocker: undefined,
    distance: distance + 1,
  };
}
