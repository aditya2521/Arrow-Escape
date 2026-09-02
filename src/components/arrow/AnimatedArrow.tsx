import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import Svg from 'react-native-svg';
import { MultiCellArrow as MultiCellArrowType } from '../../types/game';
import { DIRECTION_VECTORS } from '../../engine/raycast';
import { MultiCellArrow } from './MultiCellArrow';
import { SnakeFlightArrow } from './SnakeFlightArrow';
import { SnakeBumpArrow } from './SnakeBumpArrow';

interface AnimatedArrowProps {
  arrow: MultiCellArrowType;
  cellSize: number;
  boardWidth: number;
  boardHeight: number;
  isRemoving: boolean;
  isBumping: boolean;
  isHinted: boolean;
  onPress?: (arrow: MultiCellArrowType) => void;
  onFlightComplete: (arrowId: string) => void;
  onBumpComplete: (arrowId: string) => void;
}

export const AnimatedArrow: React.FC<AnimatedArrowProps> = ({
  arrow,
  cellSize,
  boardWidth,
  boardHeight,
  isRemoving,
  isBumping,
  isHinted,
  onFlightComplete,
  onBumpComplete,
}) => {
  const scale = useSharedValue(1);
  const hintPulse = useSharedValue(1);

  // Hint Pulsing
  useEffect(() => {
    if (isHinted) {
      hintPulse.value = withRepeat(
        withSequence(
          withTiming(1.16, { duration: 300, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 300, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      cancelAnimation(hintPulse);
      hintPulse.value = withTiming(1.0, { duration: 150 });
    }
  }, [isHinted, hintPulse]);


  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value * hintPulse.value },
    ],
    zIndex: isRemoving || isBumping ? 99 : isHinted ? 50 : 1,
  }));

  // The head leads and every tail segment follows its route like a snake.
  if (isRemoving) {
    return (
      <SnakeFlightArrow
        arrow={arrow}
        cellSize={cellSize}
        boardWidth={boardWidth}
        boardHeight={boardHeight}
        duration={760}
        onComplete={onFlightComplete}
      />
    );
  }

  // If bumping (wrong arrow), render SnakeBumpArrow (tail follows head along bends & springs back)
  if (isBumping) {
    return (
      <SnakeBumpArrow
        arrow={arrow}
        cellSize={cellSize}
        onComplete={onBumpComplete}
      />
    );
  }

  // Idle / Hinted state
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        animatedStyle,
      ]}
      pointerEvents="none"
    >
      <Svg width={boardWidth} height={boardHeight} style={StyleSheet.absoluteFill}>
        <MultiCellArrow
          arrow={arrow}
          cellSize={cellSize}
          isHinted={isHinted}
          isBumping={isBumping}
        />
      </Svg>
    </Animated.View>
  );
};
