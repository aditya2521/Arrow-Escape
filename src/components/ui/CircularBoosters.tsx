import React from 'react';
import { View, StyleSheet, Pressable, Text } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface CircularBoostersProps {
  hintsCount: number;
  onHint: () => void;
  winStreak: number;
  streakInterval: number;
}

export const CircularBoosters: React.FC<CircularBoostersProps> = ({
  hintsCount,
  onHint,
  winStreak,
  streakInterval,
}) => {
  const progress = winStreak % streakInterval;
  const showStreak = winStreak > 0;
  const disabled = hintsCount <= 0;

  return (
    <View style={styles.container}>
      {/* Streak progress bar — dots showing progress toward next free hint */}
      {showStreak && (
        <View style={styles.streakBadge}>
          <Text style={styles.streakEmoji}>🔥</Text>
          <View style={styles.streakDots}>
            {Array.from({ length: streakInterval }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.streakDot,
                  i < progress && styles.streakDotFilled,
                ]}
              />
            ))}
          </View>
          <Text style={styles.streakText}>
            {progress}/{streakInterval}
          </Text>
        </View>
      )}

      {/* Hint booster — single centered button */}
      <Pressable
        style={({ pressed }) => [
          styles.hintButton,
          disabled && styles.hintButtonDisabled,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={onHint}
        disabled={disabled}
      >
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2}>
          <Path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </Svg>
        <Text style={styles.hintLabel}>Hint</Text>
        <View style={[styles.countBadge, disabled && styles.countBadgeDisabled]}>
          {hintsCount > 0 ? (
            <Text style={styles.countBadgeText}>{hintsCount}</Text>
          ) : (
            <Svg width={10} height={10} viewBox="0 0 24 24" fill="#FFFFFF">
              <Circle cx="12" cy="12" r="10" fill="#FFFFFF" />
              <Path d="M12 8v4M12 16h.01" stroke="#94A3B8" strokeWidth={2.5} strokeLinecap="round" />
            </Svg>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 20,
    gap: 10,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  streakEmoji: { fontSize: 12 },
  streakDots: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
  },
  streakDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FDE68A',
  },
  streakDotFilled: {
    backgroundColor: '#F59E0B',
  },
  streakText: {
    color: '#B45309',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  hintButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 999,
    gap: 10,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    minWidth: 160,
  },
  hintButtonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0.1,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.92,
  },
  hintLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countBadgeDisabled: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
});
