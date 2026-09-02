import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, GameSettings } from '../types/game';
import { getEasybrainLevelById, TOTAL_LEVELS } from '../engine/handcraftedMazes';
import { useEasybrainGame } from '../hooks/useEasybrainGame';
import { EasybrainHeader } from '../components/ui/EasybrainHeader';
import { MazeBoard, MazeBoardRef } from '../components/board/MazeBoard';
import { CircularBoosters } from '../components/ui/CircularBoosters';
import { TrainBrainModal } from '../components/ui/TrainBrainModal';
import { DEFAULT_GAME_SETTINGS, GameStorage } from '../storage/gameStorage';

type GameScreenProps = NativeStackScreenProps<RootStackParamList, 'Game'>;

export const GameScreen: React.FC<GameScreenProps> = ({ route, navigation }) => {
  const [currentLevelId, setCurrentLevelId] = useState<number>(route.params?.levelId || 1);
  const [zoomScale, setZoomScale] = useState<number>(1.0);
  const mazeBoardRef = useRef<MazeBoardRef>(null);

  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  useEffect(() => {
    let mounted = true;
    GameStorage.getSettings().then((saved) => mounted && setSettings(saved));
    return () => { mounted = false; };
  }, []);

  const updateSettings = (update: Partial<GameSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...update };
      void GameStorage.saveSettings(next);
      return next;
    });
  };

  useEffect(() => {
    if (route.params?.levelId) {
      setCurrentLevelId(route.params.levelId);
    }
  }, [route.params?.levelId]);

  const level = getEasybrainLevelById(currentLevelId);
  const hasNextLevel = currentLevelId < TOTAL_LEVELS;

  const {
    activeArrows,
    remainingCount,
    removingArrowIds,
    bumpingArrowIds,
    hintedArrowId,
    lives,
    isVictory,
    isGameOver,
    boosters,
    winStreak,
    streakBonusJustAwarded,
    acknowledgeStreakBonus,
    streakInterval,
    handleArrowPress,
    handleFlightComplete,
    handleBumpComplete,
    handleHint,
    playTap,
    restartLevel,
  } = useEasybrainGame({ level, settings });

  const bonusOpacity = React.useRef(new Animated.Value(0)).current;
  const bonusTranslate = React.useRef(new Animated.Value(20)).current;
  useEffect(() => {
    if (!streakBonusJustAwarded) return;
    Animated.parallel([
      Animated.timing(bonusOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(bonusTranslate, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(bonusOpacity, { toValue: 0, duration: 260, useNativeDriver: true }),
        Animated.timing(bonusTranslate, { toValue: 20, duration: 260, useNativeDriver: true }),
      ]).start(() => acknowledgeStreakBonus());
    }, 2200);
    return () => clearTimeout(t);
  }, [streakBonusJustAwarded, bonusOpacity, bonusTranslate, acknowledgeStreakBonus]);

  const handleNextLevel = () => {
    if (hasNextLevel) {
      setCurrentLevelId((prev) => prev + 1);
    }
  };

  const handleHome = () => {
    navigation.navigate('Home');
  };

  const handleBack = () => {
    playTap();
    // Let the short UI click start before this screen unloads its audio assets.
    setTimeout(() => navigation.goBack(), 70);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <EasybrainHeader
          levelId={level.id}
          levelName={level.name}
          remainingArrows={remainingCount}
          lives={lives}
          soundEnabled={settings.soundEnabled}
          hapticsEnabled={settings.hapticsEnabled}
          zoomScale={zoomScale}
          onZoomIn={() => mazeBoardRef.current?.zoomIn()}
          onZoomOut={() => mazeBoardRef.current?.zoomOut()}
          onResetZoom={() => mazeBoardRef.current?.resetZoom()}
          onBack={handleBack}
          onToggleSound={() => updateSettings({ soundEnabled: !settings.soundEnabled })}
          onToggleHaptics={() => updateSettings({ hapticsEnabled: !settings.hapticsEnabled })}
        />

        {/* Maze Grid Board */}
        <View style={styles.boardContainer}>
          <MazeBoard
            ref={mazeBoardRef}
            rows={level.rows}
            cols={level.cols}
            arrows={activeArrows}
            removingArrowIds={removingArrowIds}
            bumpingArrowIds={bumpingArrowIds}
            hintedArrowId={hintedArrowId}
            onArrowPress={handleArrowPress}
            onFlightComplete={handleFlightComplete}
            onBumpComplete={handleBumpComplete}
            onZoomChange={setZoomScale}
          />
        </View>

        {/* Hint button + streak indicator */}
        <CircularBoosters
          hintsCount={boosters.hints}
          onHint={handleHint}
          winStreak={winStreak}
          streakInterval={streakInterval}
        />

        {/* Streak bonus toast */}
        {streakBonusJustAwarded && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.bonusToast,
              { opacity: bonusOpacity, transform: [{ translateY: bonusTranslate }] },
            ]}
          >
            <Text style={styles.bonusEmoji}>🔥</Text>
            <View>
              <Text style={styles.bonusTitle}>Streak bonus!</Text>
              <Text style={styles.bonusSubtitle}>+1 Hint for {streakInterval} wins in a row</Text>
            </View>
          </Animated.View>
        )}

        {/* Train Your Brain Victory & Game Over Modal */}
        <TrainBrainModal
          visible={isVictory || isGameOver}
          isVictory={isVictory}
          isGameOver={isGameOver}
          levelId={level.id}
          levelName={level.name}
          onNextLevel={handleNextLevel}
          onRetry={restartLevel}
          onHome={handleHome}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  boardContainer: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  bonusToast: {
    position: 'absolute',
    bottom: 130,
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  bonusEmoji: { fontSize: 24 },
  bonusTitle: {
    color: '#B45309',
    fontSize: 14,
    fontWeight: '900',
  },
  bonusSubtitle: {
    color: '#92400E',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
});
