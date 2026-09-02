import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import {
  View,
  StyleSheet,
  LayoutChangeEvent,
  Pressable,
  GestureResponderEvent,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Svg from 'react-native-svg';
import { MultiCellArrow as MultiCellArrowType } from '../../types/game';
import { AnimatedArrow } from '../arrow/AnimatedArrow';
import { MultiCellArrow } from '../arrow/MultiCellArrow';

export interface MazeBoardRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
}

export interface MazeBoardProps {
  rows: number;
  cols: number;
  arrows: MultiCellArrowType[];
  removingArrowIds: Set<string>;
  bumpingArrowIds: Set<string>;
  hintedArrowId: string | null;
  onArrowPress: (arrow: MultiCellArrowType) => void;
  onFlightComplete: (arrowId: string) => void;
  onBumpComplete: (arrowId: string) => void;
  onZoomChange?: (scale: number) => void;
}

export const MazeBoard = forwardRef<MazeBoardRef, MazeBoardProps>(
  (
    {
      rows,
      cols,
      arrows,
      removingArrowIds,
      bumpingArrowIds,
      hintedArrowId,
      onArrowPress,
      onFlightComplete,
      onBumpComplete,
      onZoomChange,
    },
    ref
  ) => {
    const window = useWindowDimensions();
    const estimatedInitialSize = {
      width: window.width,
      height: Math.max(200, window.height * 0.62),
    };
    const [containerSize, setContainerSize] = useState<{ width: number; height: number }>(
      estimatedInitialSize
    );

    // Zoom & Pan shared values
    const scale = useSharedValue(1.0);
    const savedScale = useSharedValue(1.0);
    const translateX = useSharedValue(0);
    const savedTranslateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const savedTranslateY = useSharedValue(0);

    const onLayout = (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      if (width !== containerSize.width || height !== containerSize.height) {
        setContainerSize({ width, height });
      }
    };

    // Compute responsive cell size to fill board nicely while strictly fitting inside screen bounds
    const availableWidth = Math.max(0, containerSize.width - 12);
    const availableHeight = Math.max(0, containerSize.height - 12);

    const maxCellWidth = availableWidth / Math.max(1, cols);
    const maxCellHeight = availableHeight / Math.max(1, rows);
    const cellSize = Math.min(Math.floor(Math.min(maxCellWidth, maxCellHeight)), 72);

    const boardWidth = cellSize * cols;
    const boardHeight = cellSize * rows;

    const notifyZoomChange = (val: number) => {
      onZoomChange?.(Math.round(val * 10) / 10);
    };

    // Reset zoom on level change
    useEffect(() => {
      scale.value = withTiming(1.0, { duration: 200 });
      savedScale.value = 1.0;
      translateX.value = withTiming(0, { duration: 200 });
      savedTranslateX.value = 0;
      translateY.value = withTiming(0, { duration: 200 });
      savedTranslateY.value = 0;
      notifyZoomChange(1.0);
    }, [rows, cols, scale, savedScale, translateX, savedTranslateX, translateY, savedTranslateY]);

    // Button Zoom Helpers
    const setBoardZoom = (targetScale: number) => {
      const clamped = Math.min(Math.max(targetScale, 1.0), 3.5);
      scale.value = withSpring(clamped, { damping: 18, stiffness: 220 });
      savedScale.value = clamped;
      if (clamped <= 1.05) {
        translateX.value = withTiming(0, { duration: 200 });
        translateY.value = withTiming(0, { duration: 200 });
        savedTranslateX.value = 0;
        savedTranslateY.value = 0;
      }
      notifyZoomChange(clamped);
    };

    const handleZoomIn = () => {
      setBoardZoom(Math.round((scale.value + 0.5) * 10) / 10);
    };

    const handleZoomOut = () => {
      setBoardZoom(Math.round((scale.value - 0.5) * 10) / 10);
    };

    const handleResetZoom = () => {
      setBoardZoom(1.0);
    };

    // Expose ref methods for Header controls
    useImperativeHandle(
      ref,
      () => ({
        zoomIn: handleZoomIn,
        zoomOut: handleZoomOut,
        resetZoom: handleResetZoom,
      }),
      [scale]
    );

    // 1. Pinch Gesture
    const pinchGesture = Gesture.Pinch()
      .onUpdate((e) => {
        'worklet';
        const nextScale = Math.min(Math.max(savedScale.value * e.scale, 1.0), 3.5);
        scale.value = nextScale;
      })
      .onEnd(() => {
        'worklet';
        savedScale.value = scale.value;
        if (scale.value <= 1.05) {
          scale.value = withTiming(1.0);
          savedScale.value = 1.0;
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
          runOnJS(notifyZoomChange)(1.0);
        } else {
          runOnJS(notifyZoomChange)(scale.value);
        }
      });

    // 2. Pan Gesture (when zoomed)
    const panGesture = Gesture.Pan()
      .minDistance(8)
      .onUpdate((e) => {
        'worklet';
        if (scale.value > 1.05) {
          const maxPanX = Math.max(0, (boardWidth * (scale.value - 1)) / 2 + 40);
          const maxPanY = Math.max(0, (boardHeight * (scale.value - 1)) / 2 + 40);
          const targetX = savedTranslateX.value + e.translationX;
          const targetY = savedTranslateY.value + e.translationY;
          translateX.value = Math.min(Math.max(targetX, -maxPanX), maxPanX);
          translateY.value = Math.min(Math.max(targetY, -maxPanY), maxPanY);
        }
      })
      .onEnd(() => {
        'worklet';
        savedTranslateX.value = translateX.value;
        savedTranslateY.value = translateY.value;
      });

    // 3. Double-Tap Gesture (quick 1.0x <-> 2.2x toggle)
    const doubleTapGesture = Gesture.Tap()
      .numberOfTaps(2)
      .maxDuration(250)
      .onEnd(() => {
        'worklet';
        if (scale.value > 1.25) {
          scale.value = withTiming(1.0);
          savedScale.value = 1.0;
          translateX.value = withTiming(0);
          translateY.value = withTiming(0);
          savedTranslateX.value = 0;
          savedTranslateY.value = 0;
          runOnJS(notifyZoomChange)(1.0);
        } else {
          scale.value = withTiming(2.2);
          savedScale.value = 2.2;
          runOnJS(notifyZoomChange)(2.2);
        }
      });

    const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture, doubleTapGesture);

    const boardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    // Direct board coordinate touch handler with near-cell fallback for instant, responsive tapping
    const handleBoardTouch = (event: GestureResponderEvent) => {
      if (cellSize <= 0) return;
      const { locationX, locationY } = event.nativeEvent;
      const col = Math.floor(locationX / cellSize);
      const row = Math.floor(locationY / cellSize);

      // 1. Direct cell hit check
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        const target = arrows.find((a) => {
          if (removingArrowIds.has(a.id)) return false;
          const pts = [...a.tail];
          if (!pts.some((p) => p.row === a.head.row && p.col === a.head.col)) {
            pts.push(a.head);
          }
          return pts.some((p) => p.row === row && p.col === col);
        });

        if (target) {
          onArrowPress(target);
          return;
        }
      }

      // 2. Fallback: nearest arrow-cell center in pixel space
      const maxDistPx = Math.max(cellSize * 1.3, 24);
      const maxDistSq = maxDistPx * maxDistPx;
      let bestArrow: MultiCellArrowType | null = null;
      let bestDistSq = maxDistSq;

      for (const a of arrows) {
        if (removingArrowIds.has(a.id)) continue;
        const pts = [...a.tail];
        if (!pts.some((p) => p.row === a.head.row && p.col === a.head.col)) {
          pts.push(a.head);
        }

        for (const p of pts) {
          const cx = (p.col + 0.5) * cellSize;
          const cy = (p.row + 0.5) * cellSize;
          const dx = cx - locationX;
          const dy = cy - locationY;
          const distSq = dx * dx + dy * dy;
          if (distSq < bestDistSq) {
            bestDistSq = distSq;
            bestArrow = a;
          }
        }
      }

      if (bestArrow) {
        onArrowPress(bestArrow);
      }
    };

    return (
      <View style={styles.container} onLayout={onLayout}>
        {containerSize.width > 0 && cellSize > 0 && (
          <GestureDetector gesture={composedGesture}>
            <View style={styles.boardClipArea}>
              <Animated.View
                style={[
                  styles.boardWrapper,
                  {
                    width: boardWidth,
                    height: boardHeight,
                  },
                  boardAnimatedStyle,
                ]}
              >
                <Pressable
                  onPress={handleBoardTouch}
                  pointerEvents="box-only"
                  style={{ width: boardWidth, height: boardHeight }}
                >
                  {/* Idle arrows — one shared SVG */}
                  <Svg
                    width={boardWidth}
                    height={boardHeight}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  >
                    {arrows.map((arrow) => {
                      const isRemoving = removingArrowIds.has(arrow.id);
                      const isBumping = bumpingArrowIds.has(arrow.id);
                      const isHinted = hintedArrowId === arrow.id;
                      if (isRemoving || isBumping || isHinted) return null;
                      return (
                        <MultiCellArrow
                          key={arrow.id}
                          arrow={arrow}
                          cellSize={cellSize}
                        />
                      );
                    })}
                  </Svg>

                  {/* Animating arrows */}
                  {arrows.map((arrow) => {
                    const isRemoving = removingArrowIds.has(arrow.id);
                    const isBumping = bumpingArrowIds.has(arrow.id);
                    const isHinted = hintedArrowId === arrow.id;
                    if (!isRemoving && !isBumping && !isHinted) return null;

                    return (
                      <AnimatedArrow
                        key={arrow.id}
                        arrow={arrow}
                        cellSize={cellSize}
                        boardWidth={boardWidth}
                        boardHeight={boardHeight}
                        isRemoving={isRemoving}
                        isBumping={isBumping}
                        isHinted={isHinted}
                        onPress={onArrowPress}
                        onFlightComplete={onFlightComplete}
                        onBumpComplete={onBumpComplete}
                      />
                    );
                  })}
                </Pressable>
              </Animated.View>
            </View>
          </GestureDetector>
        )}
      </View>
    );
  }
);

MazeBoard.displayName = 'MazeBoard';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  boardClipArea: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  boardWrapper: {
    position: 'relative',
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
});
