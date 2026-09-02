import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const NUM_PIECES = 35;

const CONFETTI_COLORS = [
  '#38BDF8',
  '#34D399',
  '#FBBF24',
  '#F472B6',
  '#A78BFA',
  '#22D3EE',
  '#FB923C',
  '#2563EB',
];

interface ConfettiPieceProps {
  index: number;
}

const ConfettiPiece: React.FC<ConfettiPieceProps> = ({ index }) => {
  const startX = Math.random() * SCREEN_WIDTH;
  const targetX = startX + (Math.random() * 120 - 60);
  const color = CONFETTI_COLORS[index % CONFETTI_COLORS.length];
  const size = 8 + Math.random() * 6;
  const delay = Math.random() * 300;
  const duration = 1400 + Math.random() * 800;

  const translateY = useSharedValue(-20);
  const translateX = useSharedValue(startX);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withTiming(SCREEN_HEIGHT + 20, { duration, easing: Easing.bezier(0.25, 1, 0.5, 1) })
    );

    translateX.value = withDelay(
      delay,
      withTiming(targetX, { duration, easing: Easing.linear })
    );

    rotate.value = withDelay(
      delay,
      withTiming(720 + Math.random() * 720, { duration, easing: Easing.linear })
    );

    opacity.value = withDelay(
      delay + duration * 0.7,
      withTiming(0, { duration: duration * 0.3 })
    );
  }, [delay, duration, targetX, opacity, rotate, translateX, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: size,
          height: size * (index % 2 === 0 ? 1 : 1.6),
          backgroundColor: color,
          borderRadius: index % 3 === 0 ? size / 2 : 2,
        },
        animatedStyle,
      ]}
    />
  );
};

export const ConfettiView: React.FC = () => {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: NUM_PIECES }).map((_, i) => (
        <ConfettiPiece key={i} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  piece: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
