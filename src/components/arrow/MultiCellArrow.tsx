import React from 'react';
import { G, Path, Circle, Polygon } from 'react-native-svg';
import { MultiCellArrow as MultiCellArrowType } from '../../types/game';
import { DIRECTION_VECTORS } from '../../engine/raycast';
import { Colors } from '../../theme/colors';

interface MultiCellArrowProps {
  arrow: MultiCellArrowType;
  cellSize: number;
  isHinted?: boolean;
  isFlying?: boolean;
  isBumping?: boolean;
  strokeColor?: string;
}

export const MultiCellArrow: React.FC<MultiCellArrowProps> = ({
  arrow,
  cellSize,
  isHinted = false,
  isFlying = false,
  isBumping = false,
  strokeColor,
}) => {
  // Red on collision bump, electric blue when flying or hinted, dark navy at rest
  const color = isBumping
    ? '#EF4444'
    : isFlying
      ? '#2563EB'
      : isHinted
        ? Colors.arrowHinted
        : strokeColor || arrow.color || Colors.arrowDefault;

  // Keep the arrows legible on dense phone-sized boards without making bends
  // feel heavy. The previous 12% stroke made heads almost disappear at 30x30.
  const strokeWidth = Math.max(2.35, Math.min(5.2, +(cellSize * 0.22).toFixed(1)));

  // Convert grid coordinates to SVG pixel coordinates with subpixel precision
  const getPx = (row: number, col: number) => ({
    x: +(col * cellSize + cellSize / 2).toFixed(1),
    y: +(row * cellSize + cellSize / 2).toFixed(1),
  });

  const points = [...arrow.tail];
  if (
    points.length === 0 ||
    points[points.length - 1].row !== arrow.head.row ||
    points[points.length - 1].col !== arrow.head.col
  ) {
    points.push(arrow.head);
  }

  const pxPoints = points.map((pt) => getPx(pt.row, pt.col));
  const vector = DIRECTION_VECTORS[arrow.direction];

  // Let the head lead into the free half of its cell. This makes direction
  // readable at a glance and keeps the head visually separate from its neck.
  const headPx = getPx(arrow.head.row, arrow.head.col);
  const tipAdvance = +(cellSize * 0.27).toFixed(1);
  const tipX = +(headPx.x + vector.dc * Number(tipAdvance)).toFixed(1);
  const tipY = +(headPx.y + vector.dr * Number(tipAdvance)).toFixed(1);

  // Inset starting tail generously for distinct separation between consecutive arrows
  let startX = pxPoints[0].x;
  let startY = pxPoints[0].y;
  if (pxPoints.length > 1) {
    const nextPt = pxPoints[1];
    const dx = nextPt.x - pxPoints[0].x;
    const dy = nextPt.y - pxPoints[0].y;
    const len = Math.max(0.001, Math.sqrt(dx * dx + dy * dy));
    const tailInset = Math.min(cellSize * 0.28, len * 0.42);
    startX = +(pxPoints[0].x + (dx / len) * tailInset).toFixed(1);
    startY = +(pxPoints[0].y + (dy / len) * tailInset).toFixed(1);
  }

  // Build a continuous path with rounded quadratic corners. Grid-perfect right
  // angles looked mechanical and produced a noisy staircase at small cell sizes.
  let pathD = '';
  if (pxPoints.length > 0) {
    pathD = `M ${startX} ${startY}`;
    const cornerRadius = cellSize * 0.24;
    for (let i = 1; i < pxPoints.length - 1; i++) {
      const prev = pxPoints[i - 1];
      const current = pxPoints[i];
      const next = pxPoints[i + 1];
      const inLen = Math.hypot(current.x - prev.x, current.y - prev.y);
      const outLen = Math.hypot(next.x - current.x, next.y - current.y);
      const radius = Math.min(cornerRadius, inLen * 0.35, outLen * 0.35);
      const beforeX = current.x - ((current.x - prev.x) / Math.max(inLen, 0.001)) * radius;
      const beforeY = current.y - ((current.y - prev.y) / Math.max(inLen, 0.001)) * radius;
      const afterX = current.x + ((next.x - current.x) / Math.max(outLen, 0.001)) * radius;
      const afterY = current.y + ((next.y - current.y) / Math.max(outLen, 0.001)) * radius;
      pathD += ` L ${beforeX.toFixed(1)} ${beforeY.toFixed(1)}`;
      pathD += ` Q ${current.x} ${current.y} ${afterX.toFixed(1)} ${afterY.toFixed(1)}`;
    }
    if (pxPoints.length > 1) {
      pathD += ` L ${pxPoints[pxPoints.length - 1].x} ${pxPoints[pxPoints.length - 1].y}`;
    }
    pathD += ` L ${tipX} ${tipY}`;
  }

  // Exact Arrowhead Wing Coordinates with generous spacing from neighboring arrows
  const barbLen = Math.max(3.8, +(cellSize * 0.4).toFixed(1));
  const barbWidth = Math.max(3, +(cellSize * 0.32).toFixed(1));

  const perpX = -vector.dr;
  const perpY = vector.dc;

  const wing1X = +(tipX - vector.dc * barbLen + perpX * barbWidth).toFixed(1);
  const wing1Y = +(tipY - vector.dr * barbLen + perpY * barbWidth).toFixed(1);
  const wing2X = +(tipX - vector.dc * barbLen - perpX * barbWidth).toFixed(1);
  const wing2Y = +(tipY - vector.dr * barbLen - perpY * barbWidth).toFixed(1);

  return (
    <G>
      {/* 1. Tail Start Rounded Cap */}
      {pxPoints.length > 0 && (
        <Circle
          cx={startX}
          cy={startY}
          r={strokeWidth * 0.5}
          fill={color}
        />
      )}

      {/* 2. Main Continuous Line Shaft (Ends seamlessly inside arrowhead tip) */}
      {pathD.length > 0 && (
        <Path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}

      {/* 3. Filled directional head stays visually distinct from nearby tails. */}
      <Polygon
        points={`${tipX},${tipY} ${wing1X},${wing1Y} ${wing2X},${wing2Y}`}
        fill={color}
        stroke={color}
        strokeWidth={Math.max(0.8, strokeWidth * 0.35)}
        strokeLinejoin="round"
      />
    </G>
  );
};
