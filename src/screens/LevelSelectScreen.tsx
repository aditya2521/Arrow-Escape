import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { RootStackParamList, LevelProgress, LevelMetadata } from '../types/game';
import { ALL_LEVEL_METADATA, TOTAL_LEVELS } from '../engine/handcraftedMazes';
import { GameStorage } from '../storage/gameStorage';

type LevelSelectScreenProps = NativeStackScreenProps<RootStackParamList, 'LevelSelect'>;

const CREAM = '#FFFFFF';
const INK = '#1E293B';
const NUM_COLUMNS = 3;

const MAZE_GLYPHS = [
  'M5 8h22v8H12v8h18 M27 5l4 3-4 3',
  'M7 5v18h9V11h12v16 M25 24l3 3 3-3',
  'M5 25h8V8h9v9h8 M27 14l3 3-3 3',
  'M6 7h10v8H9v12h18 M24 24l3 3 3-3',
];

const LevelMazeIcon = ({ levelId, color }: { levelId: number; color: string }) => (
  <Svg width={42} height={42} viewBox="0 0 36 34" fill="none">
    <Path
      d={MAZE_GLYPHS[(levelId - 1) % MAZE_GLYPHS.length]}
      stroke={color}
      strokeWidth={2.7}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Pad the level list so the final row always has NUM_COLUMNS slots.
// Without this, a single-item last row lets `flex: 1` stretch that tile to the
// full grid width, and `aspectRatio` blows the height up massively.
const paddedLevels: (LevelMetadata | null)[] = (() => {
  const remainder = ALL_LEVEL_METADATA.length % NUM_COLUMNS;
  if (remainder === 0) return ALL_LEVEL_METADATA;
  const fillers = Array(NUM_COLUMNS - remainder).fill(null);
  return [...ALL_LEVEL_METADATA, ...fillers];
})();

export const LevelSelectScreen: React.FC<LevelSelectScreenProps> = ({ navigation }) => {
  const { width: windowWidth } = useWindowDimensions();
  const [progressMap, setProgressMap] = useState<Record<number, LevelProgress>>({});
  const [unlockedLevel, setUnlockedLevel] = useState<number>(TOTAL_LEVELS);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      (async () => {
        const [allProgress, unlocked] = await Promise.all([
          GameStorage.getAllProgress(),
          GameStorage.getUnlockedLevel(),
        ]);
        setProgressMap(allProgress);
        setUnlockedLevel(unlocked || TOTAL_LEVELS);
      })();
    });
    return unsubscribe;
  }, [navigation]);

  const horizontalPadding = 24;
  const totalColumnGaps = 20;
  const cardWidth = (windowWidth - horizontalPadding - totalColumnGaps) / NUM_COLUMNS;
  const rowSnapInterval = cardWidth / 1.02 + 10;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.5}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.title}>Choose a Level</Text>
        </View>
        <View style={styles.backSpacer} />
      </View>

      <FlatList
        data={paddedLevels}
        keyExtractor={(lvl, idx) => (lvl ? String(lvl.id) : `filler_${idx}`)}
        numColumns={NUM_COLUMNS}
        columnWrapperStyle={styles.rowWrap}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={rowSnapInterval}
        snapToAlignment="start"
        disableIntervalMomentum
        contentInsetAdjustmentBehavior="never"
        renderItem={({ item: lvl }) => {
          if (!lvl) {
            // Invisible filler so the last row keeps 3 equal-width slots
            return <View style={styles.levelCardFiller} />;
          }
          const completed = !!progressMap[lvl.id]?.completed;
          const locked = false; // All 250 levels unlocked!
          const stageName = lvl.name.replace(/\s+\d+$/, '');
          const tint = lvl.themeColor ?? INK;
          const bg = lvl.bgColor ?? '#F5F5F4';
          if (locked) {
            return (
              <View style={[styles.levelCard, styles.levelCardLocked]}>
                <View style={styles.levelIdChip}>
                  <Text style={[styles.levelIdText, { color: '#94A3B8' }]}>{lvl.id}</Text>
                </View>
                {/* Small lock badge in the corner (like a sticker) */}
                <View style={styles.lockBadgeCorner}>
                  <Text style={styles.lockBadgeCornerIcon}>🔒</Text>
                </View>
                {/* Faded emoji preview — kids can see what's coming */}
                <View style={styles.levelGlyphFaded}>
                  <LevelMazeIcon levelId={lvl.id} color="#94A3B8" />
                </View>
                <Text style={styles.levelNameLocked} numberOfLines={1}>
                  {stageName}
                </Text>
              </View>
            );
          }
          return (
            <Pressable
              onPress={() => navigation.navigate('Game', { levelId: lvl.id })}
              style={({ pressed }) => [
                styles.levelCard,
                { backgroundColor: bg },
                pressed && styles.levelCardPressed,
              ]}
            >
              {completed && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkBadgeText}>✓</Text>
                </View>
              )}
              <View style={styles.levelIdChip}>
                <Text style={[styles.levelIdText, { color: tint }]}>{lvl.id}</Text>
              </View>
              <View style={[styles.mazeDisc, { backgroundColor: `${tint}14` }]}>
                <LevelMazeIcon levelId={lvl.id} color={tint} />
              </View>
              <Text style={styles.levelNumber}>Level {lvl.id}</Text>
              <Text style={styles.levelName} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                {stageName}
              </Text>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    minHeight: 64,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
    zIndex: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  backButton: { padding: 8, width: 40 },
  backSpacer: { width: 40 },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  title: { color: INK, fontSize: 18, fontWeight: '900' },

  listContent: { paddingHorizontal: 12, paddingTop: 14, paddingBottom: 48 },
  rowWrap: { gap: 10, marginBottom: 10 },

  levelCard: {
    flex: 1,
    aspectRatio: 1.02,
    borderRadius: 18,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  levelCardFiller: {
    flex: 1,
    aspectRatio: 1.02,
  },
  levelCardPressed: {
    transform: [{ scale: 0.96 }],
    opacity: 0.85,
  },
  checkBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#22C55E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
    lineHeight: 15,
  },
  levelIdChip: {
    position: 'absolute',
    top: 6,
    left: 8,
    minWidth: 22,
    paddingHorizontal: 6,
    height: 22,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelIdText: { fontSize: 11, fontWeight: '900' },
  mazeDisc: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
    marginBottom: 7,
  },
  levelNumber: {
    color: INK,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '900',
  },
  levelName: {
    width: '100%',
    fontSize: 10,
    lineHeight: 13,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  levelCardLocked: {
    backgroundColor: '#F5F5F4',
  },
  levelGlyphFaded: {
    marginTop: 8,
    opacity: 0.35,
  },
  lockBadgeCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  lockBadgeCornerIcon: { fontSize: 12 },
  levelNameLocked: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
  },
});
