import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import { MultiCellArrow as MultiCellArrowType, Point } from '../../types/game';
import { DIRECTION_VECTORS } from '../../engine/raycast';
import { Colors } from '../../theme/colors';

interface SnakeBumpArrowProps {
  arrow: MultiCellArrowType;
  cellSize: number;
  duration?: number;
  onComplete: (arrowId: string) => void;
}

/**
 * SnakeBumpArrow animates blocked/collision arrows:
 * The head lunges forward along the direction vector, with the entire tail
 * organically slithering and following along all bends/corners, hitting the obstacle
 * and smoothly rebounding back into resting position.
 */
export const SnakeBumpArrow: React.FC<SnakeBumpArrowProps> = ({
  arrow,
  cellSize,
  duration = 260,
  onComplete,
}) => {
  const [currentTravel, setCurrentTravel] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const frameRef = useRef<number | null>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const vector = DIRECTION_VECTORS[arrow.direction];

  // 1. Build original snake points
  const originalPoints = [...arrow.tail];
  if (
    originalPoints.length === 0 ||
    originalPoints[originalPoints.length - 1].row !== arrow.head.row ||
    originalPoints[originalPoints.length - 1].col !== arrow.head.col
  ) {
    originalPoints.push(arrow.head);
  }

  // Extend track forward by 2 grid units for forward bump corridor
  const extendedTrack: Point[] = [...originalPoints];
  const lastHead = originalPoints[originalPoints.length - 1];
  for (let step = 1; step <= 2; step++) {
    extendedTrack.push({
      row: lastHead.row + vector.dr * step,
      col: lastHead.col + vector.dc * step,
    });
  }

  // Convert to pixel coordinates
  const trackPx = extendedTrack.map((pt) => ({
    x: pt.col * cellSize + cellSize / 2,
    y: pt.row * cellSize + cellSize / 2,
  }));

  // Compute cumulative distances along the track
  const cumDist: number[] = [0];
  for (let i = 1; i < trackPx.length; i++) {
    const dx = trackPx[i].x - trackPx[i - 1].x;
    const dy = trackPx[i].y - trackPx[i - 1].y;
    cumDist.push(cumDist[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }

  const snakeLength = cumDist[originalPoints.length - 1];
  const totalTrackLength = cumDist[cumDist.length - 1];
  const maxBumpTravel = Math.max(6, Math.round(cellSize * 0.42));

  // Run 60fps slither bump & rebound animation
  useEffect(() => {
    startTimeRef.current = Date.now();

    const tick = () => {
      if (!startTimeRef.current) return;
      const elapsed = Date.now() - startTimeRef.current;
      const t = Math.min(1, elapsed / duration);

      // Phase 1 (0..0.32): Head pushes forward into obstacle, tail follows along bends
      // Phase 2 (0.32..1.0): Elastic damped rebound back into resting slot
      let dist = 0;
      if (t < 0.32) {
        const p = t / 0.32;
        dist = Math.sin((p * Math.PI) / 2) * maxBumpTravel;
      } else {
        const p = (t - 0.32) / 0.68;
        dist = Math.max(0, Math.cos((p * Math.PI) / 2) * (1 - p * 0.25) * maxBumpTravel);
      }

      setCurrentTravel(dist);

      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        onCompleteRef.current(arrow.id);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [arrow.id, duration, maxBumpTravel]);

  // Helper to interpolate point and tangent at exact track distance
  const getPointAtDistance = (targetDist: number): { x: number; y: number; dirX: number; dirY: number } => {
    const clampedDist = Math.max(0, Math.min(totalTrackLength, targetDist));

    let idx = 0;
    while (idx < cumDist.length - 1 && cumDist[idx + 1] < clampedDist) {
      idx++;
    }

    const p1 = trackPx[idx];
    const p2 = trackPx[Math.min(idx + 1, trackPx.length - 1)];
    const segLen = cumDist[idx + 1] - cumDist[idx];

    let t = 0;
    if (segLen > 0) {
      t = (clampedDist - cumDist[idx]) / segLen;
    }

    const x = p1.x + t * (p2.x - p1.x);
    const y = p1.y + t * (p2.y - p1.y);

    const len = Math.max(0.001, Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2));
    const dirX = (p2.x - p1.x) / len;
    const dirY = (p2.y - p1.y) / len;

    return { x, y, dirX, dirY };
  };

  const tailDist = currentTravel;
  const headDist = currentTravel + snakeLength;

  const tailPt = getPointAtDistance(tailDist);
  const headPt = getPointAtDistance(headDist);

  // Collect intermediate vertices between tail and head
  const activeVertices: { x: number; y: number }[] = [tailPt];
  for (let i = 0; i < trackPx.length; i++) {
    if (cumDist[i] > tailDist && cumDist[i] < headDist) {
      activeVertices.push(trackPx[i]);
    }
  }
  activeVertices.push(headPt);

  // Build active SVG path
  let pathD = '';
  if (activeVertices.length > 0) {
    pathD = `M ${activeVertices[0].x} ${activeVertices[0].y}`;
    for (let i = 1; i < activeVertices.length; i++) {
      pathD += ` L ${activeVertices[i].x} ${activeVertices[i].y}`;
    }
  }

  const strokeWidth = Math.max(2.35, Math.min(5.2, +(cellSize * 0.22).toFixed(1)));
  const barbLen = Math.max(3.8, +(cellSize * 0.4).toFixed(1));
  const barbWidth = Math.max(3, +(cellSize * 0.32).toFixed(1));
  const color = Colors.arrowBlocked; // Vibrant collision red

  // Compute arrowhead wings oriented along head segment
  const perpX = -headPt.dirY;
  const perpY = headPt.dirX;

  const wing1X = +(headPt.x - headPt.dirX * barbLen + perpX * barbWidth).toFixed(1);
  const wing1Y = +(headPt.y - headPt.dirY * barbLen + perpY * barbWidth).toFixed(1);
  const wing2X = +(headPt.x - headPt.dirX * barbLen - perpX * barbWidth).toFixed(1);
  const wing2Y = +(headPt.y - headPt.dirY * barbLen - perpY * barbWidth).toFixed(1);

  const headPathD = `M ${headPt.x.toFixed(1)} ${headPt.y.toFixed(1)} L ${wing1X} ${wing1Y} L ${wing2X} ${wing2Y} Z`;

  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <G>
        {/* 1. Tail Rounded Cap (Follows the snake body around bends) */}
        <Circle cx={tailPt.x} cy={tailPt.y} r={strokeWidth * 0.55} fill={color} />

        {/* 2. Slithering Body Path (Bends along corners during bump) */}
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

        {/* 3. Leading Arrowhead */}
        <Path
          d={headPathD}
          fill={color}
          stroke={color}
          strokeWidth={Math.max(0.8, strokeWidth * 0.35)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};
