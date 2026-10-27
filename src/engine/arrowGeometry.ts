import { Direction, MultiCellArrowDefinition, Point } from '../types/game';
import { DIRECTION_VECTORS } from './raycast';

export function hasSelfBlockingTail(arrow: MultiCellArrowDefinition): boolean {
  const { dr, dc } = DIRECTION_VECTORS[arrow.direction];
  return arrow.tail.some((point) => {
    const row = point.row - arrow.head.row;
    const col = point.col - arrow.head.col;
    return row * dc === col * dr && row * dr + col * dc > 0;
  });
}

function directionAtHead(path: Point[]): Direction {
  const head = path[path.length - 1];
  const neck = path[path.length - 2];
  if (head.row !== neck.row) return head.row < neck.row ? 'up' : 'down';
  return head.col < neck.col ? 'left' : 'right';
}

/**
 * Keep the exact occupied cells and path segments. Simulate clearing the board,
 * reversing paths or splitting at bends only when ordinary exits run out.
 * A piece is committed only if its exit ray is empty, including its own body,
 * so the removal sequence proves the repaired board is solvable.
 */
export function repairSelfBlockingArrows<T extends MultiCellArrowDefinition>(
  rows: number,
  cols: number,
  arrows: T[]
): T[] {
  if (!arrows.some(hasSelfBlockingTail)) return arrows;
  const active = arrows.map((arrow, source) => ({ arrow, source }));
  const repaired: T[][] = arrows.map(() => []);
  const usedIds = new Set(arrows.map((arrow) => arrow.id));
  const occupied = Array.from({ length: rows }, () => Array<boolean>(cols).fill(false));
  for (const arrow of arrows) {
    for (const point of arrow.tail) occupied[point.row][point.col] = true;
  }
  const piece = (arrow: T, tail: Point[]): T => ({
    ...arrow, tail, head: tail[tail.length - 1], direction: directionAtHead(tail),
  });
  const canExit = (arrow: T): boolean => {
    const { dr, dc } = DIRECTION_VECTORS[arrow.direction];
    for (let row = arrow.head.row + dr, col = arrow.head.col + dc;
      row >= 0 && row < rows && col >= 0 && col < cols; row += dr, col += dc) {
      if (occupied[row][col]) return false;
    }
    return true;
  };
  const take = (index: number, arrow: T, remainder?: Point[]) => {
    const { source } = active[index];
    let id = arrow.id;
    if (remainder) {
      id = `${arrow.id ?? `arrow_${source}`}_part_${repaired[source].length + 1}`;
      while (usedIds.has(id)) id += '_';
      usedIds.add(id);
    }
    repaired[source].push({ ...arrow, id });
    for (const point of arrow.tail) occupied[point.row][point.col] = false;
    if (remainder) active[index].arrow = piece(active[index].arrow, remainder);
    else active.splice(index, 1);
  };

  while (active.length > 0) {
    const free = active.findIndex(({ arrow }) => canExit(arrow));
    if (free !== -1) { take(free, active[free].arrow); continue; }

    let progressed = false;
    for (let index = 0; index < active.length; index++) {
      const reversed = piece(active[index].arrow, [...active[index].arrow.tail].reverse());
      if (canExit(reversed)) { take(index, reversed); progressed = true; break; }
    }
    if (progressed) continue;

    // Prefer substantial, balanced pieces; never leave a single-cell fragment.
    for (const minimum of [4, 3, 2]) {
      for (let index = 0; index < active.length && !progressed; index++) {
        const { arrow } = active[index];
        const length = arrow.tail.length;
        const cuts = Array.from({ length: Math.max(0, length - minimum * 2 + 1) },
          (_, offset) => minimum + offset);
        cuts.sort((a, b) => Math.abs(a - length / 2) - Math.abs(b - length / 2));
        for (const cut of cuts) {
          const prefix = arrow.tail.slice(0, cut);
          const suffix = arrow.tail.slice(cut);
          const front = piece(arrow, prefix);
          if (canExit(front)) {
            take(index, front, suffix); progressed = true; break;
          }
          const back = piece(arrow, [...suffix].reverse());
          if (canExit(back)) {
            take(index, back, prefix); progressed = true; break;
          }
        }
      }
      if (progressed) break;
    }
    if (!progressed) throw new Error('Cannot repair arrow exits without gaps or single-cell fragments');
  }
  return repaired.flat();
}
