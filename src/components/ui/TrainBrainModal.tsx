import React, { useEffect } from 'react';
import { BackHandler, Modal, Platform, View, Text, StyleSheet, Pressable } from 'react-native';
import { ConfettiView } from './ConfettiView';
import { splitEmojiName } from '../../theme/chapters';

interface TrainBrainModalProps {
  visible: boolean;
  isVictory: boolean;
  isGameOver: boolean;
  levelId: number;
  levelName: string;
  onNextLevel: () => void;
  onRetry: () => void;
  onHome: () => void;
}

const CREAM = '#FFFFFF';
const INK = '#1E293B';
const MUTED = '#78716C';

export const TrainBrainModal: React.FC<TrainBrainModalProps> = ({
  visible,
  isVictory,
  isGameOver,
  levelId,
  levelName,
  onNextLevel,
  onRetry,
  onHome,
}) => {
  const { emoji, name } = splitEmojiName(levelName);

  // Keep this overlay in the existing React view hierarchy. On Android/Fabric,
  // presenting a native Modal while the last bump animation is committing can
  // occasionally leave the native dialog window unattached even though
  // `visible` is true. The board is then correctly locked by game-over state,
  // but the player sees no dialog and appears stuck.
  useEffect(() => {
    if (!visible || Platform.OS !== 'android') return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isGameOver) onRetry();
      else onHome();
      return true;
    });

    return () => subscription.remove();
  }, [visible, isGameOver, onRetry, onHome]);

  // Theme differs for victory vs game-over
  const theme = isVictory
    ? {
        headerBg: '#FEF3C7',       // warm amber
        heroEmoji: '🎉',
        title: 'Woohoo!',
        subtitle: 'Level Cleared',
        titleColor: '#B45309',
        message: 'Amazing! You cleared the whole board. Ready for the next one?',
        primaryLabel: 'Next Level →',
        primaryBg: '#22C55E',
        primaryShadow: '#16A34A',
      }
    : {
        headerBg: '#FEE2E2',       // soft coral
        heroEmoji: '💔',
        title: 'Oh no!',
        subtitle: 'Out of Hearts',
        titleColor: '#B91C1C',
        message: "Tapping blocked arrows costs a heart. Don't worry — give it another try!",
        primaryLabel: 'Try Again',
        primaryBg: '#F97316',
        primaryShadow: '#EA580C',
      };

  if (!visible) return null;

  const content = (
    <>
      {isVictory && <ConfettiView />}

      <View style={styles.card}>
        {/* Playful header with big emoji */}
        <View style={[styles.header, { backgroundColor: theme.headerBg }]}>
          <View style={styles.heroEmojiBubble}>
            <Text style={styles.heroEmoji}>{theme.heroEmoji}</Text>
          </View>
          <Text style={[styles.title, { color: theme.titleColor }]}>{theme.title}</Text>
          <Text style={[styles.subtitle, { color: theme.titleColor }]}>{theme.subtitle}</Text>
        </View>

        {/* Level chip + message */}
        <View style={styles.body}>
          <View style={styles.levelChip}>
            <Text style={styles.levelChipEmoji}>{emoji}</Text>
            <View>
              <Text style={styles.levelChipKicker}>LEVEL {levelId}</Text>
              <Text style={styles.levelChipName} numberOfLines={1}>
                {name}
              </Text>
            </View>
          </View>

          <Text style={styles.message}>{theme.message}</Text>

          {/* Actions */}
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              { backgroundColor: theme.primaryBg, shadowColor: theme.primaryShadow },
              pressed && styles.pressed,
            ]}
            onPress={isVictory ? onNextLevel : onRetry}
          >
            <Text style={styles.primaryButtonText}>{theme.primaryLabel}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressedSubtle]}
            onPress={onHome}
          >
            <Text style={styles.secondaryButtonIcon}>🏠</Text>
            <Text style={styles.secondaryButtonText}>Home</Text>
          </Pressable>
        </View>
      </View>
    </>
  );

  if (Platform.OS === 'ios') {
    return (
      <Modal visible transparent animationType="fade">
        <View style={styles.overlay}>{content}</View>
      </Modal>
    );
  }

  return (
    <View
      style={[styles.overlay, styles.androidOverlay]}
      accessibilityViewIsModal
      accessibilityLiveRegion="assertive"
    >
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  androidOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: CREAM,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.28,
    shadowRadius: 24,
    elevation: 16,
  },
  header: {
    paddingTop: 28,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  heroEmojiBubble: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  heroEmoji: { fontSize: 50 },
  title: {
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    opacity: 0.85,
  },
  body: {
    padding: 20,
    paddingTop: 18,
  },
  levelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 12,
  },
  levelChipEmoji: { fontSize: 36 },
  levelChipKicker: {
    fontSize: 10,
    fontWeight: '900',
    color: MUTED,
    letterSpacing: 1.2,
  },
  levelChipName: {
    fontSize: 16,
    fontWeight: '900',
    color: INK,
    marginTop: 1,
  },
  message: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 16,
    marginBottom: 18,
    fontWeight: '600',
  },
  primaryButton: {
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryButton: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'transparent',
    borderRadius: 999,
    paddingVertical: 14,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonIcon: { fontSize: 16 },
  secondaryButtonText: {
    color: INK,
    fontSize: 15,
    fontWeight: '800',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.9,
  },
  pressedSubtle: {
    opacity: 0.55,
  },
});
