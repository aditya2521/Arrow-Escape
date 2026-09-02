import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import Svg, { G, Path, Circle } from 'react-native-svg';
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { MultiCellArrow as MultiCellArrowType, Point } from '../../types/game';
import { DIRECTION_VECTORS } from '../../engine/raycast';

interface SnakeFlightArrowProps {
  arrow: MultiCellArrowType;
  cellSize: number;
  boardWidth?: number;
  boardHeight?: number;
  duration?: number;
  onComplete: (arrowId: string) => void;
}

export const SnakeFlightArrow: React.FC<SnakeFlightArrowProps> = ({
  arrow,
  cellSize,
  boardWidth,
  boardHeight,
  duration = 850,
  onComplete,
}) => {
  const progress = useSharedValue(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const completeFlight = () => onCompleteRef.current(arrow.id);

  // 1. Build the extended track (original snake body + exit path past board boundary)
  const vector = DIRECTION_VECTORS[arrow.direction];

  const originalPoints = [...arrow.tail];
  if (
    originalPoints.length === 0 ||
    originalPoints[originalPoints.length - 1].row !== arrow.head.row ||
    originalPoints[originalPoints.length - 1].col !== arrow.head.col
  ) {
    originalPoints.push(arrow.head);
  }

  // Calculate distance needed for the arrow to comfortably exit the board
  const boardCols = boardWidth ? Math.ceil(boardWidth / cellSize) : 10;
  const boardRows = boardHeight ? Math.ceil(boardHeight / cellSize) : 10;

  let distToBoardEdge = 6;
  if (vector.dr === -1) {
    // UP
    distToBoardEdge = arrow.head.row + 1;
  } else if (vector.dr === 1) {
    // DOWN
    distToBoardEdge = Math.max(1, boardRows - arrow.head.row);
  } else if (vector.dc === -1) {
    // LEFT
    distToBoardEdge = arrow.head.col + 1;
  } else if (vector.dc === 1) {
    // RIGHT
    distToBoardEdge = Math.max(1, boardCols - arrow.head.col);
  }

  // Steps needed: head to board edge + full arrow length + buffer margin
  const exitSteps = Math.max(6, distToBoardEdge + arrow.tail.length + 3);

  // Extend track forward out of the board
  const extendedTrack: Point[] = [...originalPoints];
  const lastHead = originalPoints[originalPoints.length - 1];
  for (let step = 1; step <= exitSteps; step++) {
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
  const maxTravelDist = totalTrackLength - snakeLength;

  useEffect(() => {
    progress.value = 0;
    progress.value = withTiming(
      1,
      { duration, easing: Easing.bezier(0.2, 0.68, 0.28, 1) },
      (finished) => {
        if (finished) runOnJS(completeFlight)();
      }
    );

    return () => cancelAnimation(progress);
  }, [arrow.id, duration, progress]);

  // Helper to interpolate a point at exact track distance
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

  const strokeWidth = Math.max(2.35, Math.min(5.2, +(cellSize * 0.22).toFixed(1)));
  const barbLen = Math.max(3.8, +(cellSize * 0.4).toFixed(1));
  const barbWidth = Math.max(3, +(cellSize * 0.32).toFixed(1));

  const geometryAt = (value: number) => {
    'worklet';
    const pointAt = (target: number) => {
      'worklet';
      const clamped = Math.max(0, Math.min(totalTrackLength, target));
      let index = 0;
      while (index < cumDist.length - 2 && cumDist[index + 1] < clamped) index++;
      const first = trackPx[index];
      const second = trackPx[Math.min(index + 1, trackPx.length - 1)];
      const segment = Math.max(0.001, cumDist[index + 1] - cumDist[index]);
      const amount = (clamped - cumDist[index]) / segment;
      const dx = second.x - first.x;
      const dy = second.y - first.y;
      const length = Math.max(0.001, Math.hypot(dx, dy));
      return {
        x: first.x + amount * dx,
        y: first.y + amount * dy,
        dirX: dx / length,
        dirY: dy / length,
      };
    };

    const travel = value * maxTravelDist;
    const tail = pointAt(travel);
    const head = pointAt(travel + snakeLength);
    let body = `M ${tail.x.toFixed(1)} ${tail.y.toFixed(1)}`;
    for (let i = 0; i < trackPx.length; i++) {
      if (cumDist[i] > travel && cumDist[i] < travel + snakeLength) {
        body += ` L ${trackPx[i].x.toFixed(1)} ${trackPx[i].y.toFixed(1)}`;
      }
    }
    body += ` L ${head.x.toFixed(1)} ${head.y.toFixed(1)}`;
    return { tail, head, body };
  };

  const bodyProps = useAnimatedProps(() => {
    const geometry = geometryAt(progress.value);
    const opacity = progress.value > 0.86 ? 1 - (progress.value - 0.86) / 0.14 : 1;
    return { d: geometry.body, opacity };
  });
  const tailProps = useAnimatedProps(() => {
    const geometry = geometryAt(progress.value);
    const opacity = progress.value > 0.86 ? 1 - (progress.value - 0.86) / 0.14 : 1;
    return { cx: geometry.tail.x, cy: geometry.tail.y, opacity };
  });
  const headProps = useAnimatedProps(() => {
    const { head } = geometryAt(progress.value);
    const perpX = -head.dirY;
    const perpY = head.dirX;
    const wing1X = head.x - head.dirX * barbLen + perpX * barbWidth;
    const wing1Y = head.y - head.dirY * barbLen + perpY * barbWidth;
    const wing2X = head.x - head.dirX * barbLen - perpX * barbWidth;
    const wing2Y = head.y - head.dirY * barbLen - perpY * barbWidth;
    const opacity = progress.value > 0.86 ? 1 - (progress.value - 0.86) / 0.14 : 1;
    return {
      d: `M ${head.x.toFixed(1)} ${head.y.toFixed(1)} L ${wing1X.toFixed(1)} ${wing1Y.toFixed(1)} L ${wing2X.toFixed(1)} ${wing2Y.toFixed(1)} Z`,
      opacity,
    };
  });

  const AnimatedPath = Animated.createAnimatedComponent(Path);
  const AnimatedCircle = Animated.createAnimatedComponent(Circle);

  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <G>
        {/* 1. Tail Rounded Cap (Follows the snake body around bends) */}
        <AnimatedCircle animatedProps={tailProps} r={strokeWidth * 0.55} fill="#2563EB" />

        {/* 2. Slithering Body Path */}
        <AnimatedPath
            animatedProps={bodyProps}
            fill="none"
            stroke="#2563EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

        {/* 3. Leading Arrowhead (Pulls the snake forward) */}
        <AnimatedPath
          animatedProps={headProps}
          fill="#2563EB"
          stroke="#2563EB"
          strokeWidth={Math.max(0.8, strokeWidth * 0.35)}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </G>
    </Svg>
  );
};
