import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, Defs, G, LinearGradient, Path, Polygon, Rect, Stop } from 'react-native-svg';
import { RootStackParamList } from '../types/game';
import { TOTAL_LEVELS } from '../engine/handcraftedMazes';
import {
  AWARD_HINT_REWARD,
  AWARD_LEVEL_INTERVAL,
  GameStorage,
} from '../storage/gameStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Awards'>;

const INK = '#0F172A';
const MUTED = '#64748B';
const PLAY = '#2563EB';
const AWARDS_PREVIEW_MODE = false;

const TROPHY_TIERS = [
  ['Stone', '#78716C', '#D6D3D1'],
  ['Bronze', '#B45309', '#FDBA74'],
  ['Iron', '#475569', '#CBD5E1'],
  ['Silver', '#94A3B8', '#F8FAFC'],
  ['Gold', '#D97706', '#FDE047'],
  ['Rose Gold', '#BE6B72', '#FECDD3'],
  ['Platinum', '#64748B', '#E2E8F0'],
  ['Emerald', '#047857', '#6EE7B7'],
  ['Sapphire', '#1D4ED8', '#93C5FD'],
  ['Ruby', '#BE123C', '#FDA4AF'],
  ['Amethyst', '#7E22CE', '#D8B4FE'],
  ['Topaz', '#C2410C', '#FDBA74'],
  ['Aquamarine', '#0891B2', '#67E8F9'],
  ['Jade', '#15803D', '#86EFAC'],
  ['Onyx', '#18181B', '#71717A'],
  ['Pearl', '#A78BFA', '#FAF5FF'],
  ['Opal', '#0D9488', '#C4B5FD'],
  ['Obsidian', '#312E81', '#6366F1'],
  ['Diamond', '#0284C7', '#E0F2FE'],
  ['Meteorite', '#334155', '#F97316'],
  ['Celestial', '#4338CA', '#A5B4FC'],
  ['Solar', '#EA580C', '#FDE047'],
  ['Cosmic', '#6D28D9', '#F0ABFC'],
  ['Royal', '#7C2D12', '#FBBF24'],
  ['Legend', '#0F172A', '#FACC15'],
] as const;

const AwardTrophy = ({ index }: { index: number }) => {
  const [, dark, light] = TROPHY_TIERS[index];
  const shape = index % 5;
  return (
    <Svg width={58} height={58} viewBox="0 0 64 64">
      <Defs>
        <LinearGradient id="trophyBody" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity="0.92" />
          <Stop offset="0.22" stopColor={light} />
          <Stop offset="0.68" stopColor={light} />
          <Stop offset="1" stopColor={dark} />
        </LinearGradient>
        <LinearGradient id="trophyEdge" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={light} />
          <Stop offset="1" stopColor={dark} />
        </LinearGradient>
        <LinearGradient id="baseShine" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={dark} />
          <Stop offset="0.48" stopColor={light} />
          <Stop offset="1" stopColor={dark} />
        </LinearGradient>
      </Defs>
      <Path d="M17 56c0-3 7-5 15-5s15 2 15 5-7 4-15 4-15-1-15-4z" fill={dark} opacity="0.2" />
      <G>
        {shape === 0 && (
          <>
            <Path d="M19 12h26v12c0 11-5 18-13 18s-13-7-13-18V12z" fill="url(#trophyBody)" stroke={dark} strokeWidth="3" />
            <Path d="M19 17H10v5c0 8 5 13 12 13M45 17h9v5c0 8-5 13-12 13" fill="none" stroke={dark} strokeWidth="3" strokeLinecap="round" />
          </>
        )}
        {shape === 1 && (
          <>
            <Path d="M16 13h32l-4 18c-2 8-6 12-12 12s-10-4-12-12l-4-18z" fill="url(#trophyBody)" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
            <Path d="M17 18H9l3 14 10 5M47 18h8l-3 14-10 5" fill="none" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
          </>
        )}
        {shape === 2 && (
          <>
            <Path d="M23 10h18l5 13-7 20H25l-7-20 5-13z" fill="url(#trophyBody)" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
            <Circle cx="32" cy="25" r="8" fill={dark} />
            <Polygon points="32,18 34,23 40,23 35.5,27 37,33 32,29.5 27,33 28.5,27 24,23 30,23" fill={light} />
          </>
        )}
        {shape === 3 && (
          <>
            <Path d="M15 16l9 8 8-13 8 13 9-8-4 25H19l-4-25z" fill="url(#trophyBody)" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
            <Path d="M20 34h24" stroke={dark} strokeWidth="3" strokeLinecap="round" />
            <Circle cx="32" cy="27" r="4" fill={dark} />
          </>
        )}
        {shape === 4 && (
          <>
            <Polygon points="32,8 48,19 43,40 32,46 21,40 16,19" fill="url(#trophyBody)" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
            <Path d="M32 9v37M17 20l15 9 15-9M21 40l11-11 11 11" fill="none" stroke={dark} strokeWidth="2" opacity="0.75" />
          </>
        )}
        <Path d="M23 15c2-2 5-3 8-3" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
        <Path d="M22 20c1 8 3 13 7 16" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.42" />
        <Rect x="29" y="40" width="6" height="11" rx="2" fill="url(#trophyEdge)" stroke={dark} strokeWidth="1.5" />
        <Path d="M22 51h20l4 6H18l4-6z" fill="url(#baseShine)" stroke={dark} strokeWidth="3" strokeLinejoin="round" />
        <Path d="M23 57h18" stroke={dark} strokeWidth="2" strokeLinecap="round" opacity="0.45" />
      </G>
    </Svg>
  );
};

export const AwardsScreen: React.FC<Props> = ({ navigation }) => {
  const [completedCount, setCompletedCount] = useState(0);
  const [claimed, setClaimed] = useState<number[]>([]);
  const [hints, setHints] = useState(0);
  const milestones = useMemo(
    () => Array.from({ length: Math.floor(TOTAL_LEVELS / AWARD_LEVEL_INTERVAL) }, (_, i) => (i + 1) * AWARD_LEVEL_INTERVAL),
    []
  );

  const load = useCallback(async () => {
    const [progress, claimedAwards, boosters] = await Promise.all([
      GameStorage.getAllProgress(),
      GameStorage.getClaimedAwards(),
      GameStorage.getBoosters(),
    ]);
    const realCompletedCount = Object.values(progress).filter((item) => item.completed).length;
    setCompletedCount(AWARDS_PREVIEW_MODE ? TOTAL_LEVELS : realCompletedCount);
    setClaimed(claimedAwards);
    setHints(boosters.hints);
  }, []);

  useEffect(() => navigation.addListener('focus', load), [load, navigation]);

  const nextMilestone = milestones.find((milestone) => milestone > completedCount) ?? TOTAL_LEVELS;
  const previousMilestone = Math.floor(completedCount / AWARD_LEVEL_INTERVAL) * AWARD_LEVEL_INTERVAL;
  const segmentProgress = nextMilestone === previousMilestone
    ? 1
    : (completedCount - previousMilestone) / (nextMilestone - previousMilestone);

  const claim = async (milestone: number) => {
    if (AWARDS_PREVIEW_MODE) {
      if (claimed.includes(milestone)) return;
      setHints((current) => current + AWARD_HINT_REWARD);
      setClaimed((current) => [...current, milestone]);
      return;
    }
    const boosters = await GameStorage.claimAward(milestone);
    if (!boosters) return;
    setHints(boosters.hints);
    setClaimed((current) => [...current, milestone]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton} hitSlop={12}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth={2.5}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>Awards</Text>
        <View style={styles.hintPill}><Text style={styles.hintText}>💡 {hints}</Text></View>
      </View>

      <FlatList
        data={milestones}
        keyExtractor={String}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {AWARDS_PREVIEW_MODE && (
              <View style={styles.previewBanner}>
                <Text style={styles.previewBannerText}>✦ PREVIEW MODE · ALL AWARDS UNLOCKED</Text>
              </View>
            )}
            <View style={styles.heroCard}>
              <View style={styles.trophyCircle}><Text style={styles.heroTrophy}>🏆</Text></View>
              <Text style={styles.heroTitle}>{completedCount} levels completed</Text>
              <Text style={styles.heroSubtitle}>Keep clearing boards to unlock trophies and free hints.</Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${Math.max(3, segmentProgress * 100)}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                {completedCount >= TOTAL_LEVELS ? 'All milestones completed!' : `${nextMilestone - completedCount} levels until the next award`}
              </Text>
            </View>
          </>
        }
        renderItem={({ item: milestone }) => {
          const trophyIndex = milestone / AWARD_LEVEL_INTERVAL - 1;
          const [tierName, tierDark, tierLight] = TROPHY_TIERS[trophyIndex];
          const isClaimed = claimed.includes(milestone);
          const unlocked = completedCount >= milestone;
          return (
            <View style={[styles.awardCard, unlocked && styles.awardCardUnlocked]}>
              <View style={[styles.medal, unlocked && { backgroundColor: `${tierLight}55`, borderColor: `${tierDark}55`, shadowColor: tierDark }]}>
                <View style={!unlocked && styles.lockedTrophyPreview}>
                  <AwardTrophy index={trophyIndex} />
                </View>
                {!unlocked && (
                  <View style={styles.lockBadge}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.tierName, unlocked && { color: tierDark }]}>{tierName} Trophy</Text>
              <Text style={styles.milestoneTitle}>{milestone} Levels</Text>
              <Text style={styles.rewardText}>+{AWARD_HINT_REWARD} hints</Text>
              {isClaimed ? (
                <View style={styles.claimedPill}><Text style={styles.claimedText}>✓ Claimed</Text></View>
              ) : unlocked ? (
                <Pressable onPress={() => claim(milestone)} style={({ pressed }) => [styles.claimButton, pressed && styles.pressed]}>
                  <Text style={styles.claimButtonText}>Claim reward</Text>
                </Pressable>
              ) : (
                <Text style={styles.lockedText}>{Math.max(0, milestone - completedCount)} to go</Text>
              )}
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { minHeight: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  backButton: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 21, backgroundColor: '#F1F5F9' },
  headerTitle: { flex: 1, textAlign: 'center', color: INK, fontSize: 19, fontWeight: '900' },
  hintPill: { minWidth: 42, paddingHorizontal: 8, paddingVertical: 7, backgroundColor: '#EFF6FF', borderRadius: 999, alignItems: 'center' },
  hintText: { color: PLAY, fontSize: 12, fontWeight: '900' },
  content: { padding: 16, paddingBottom: 40 },
  previewBanner: { backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center', marginBottom: 12 },
  previewBannerText: { color: '#A16207', fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  heroCard: { backgroundColor: PLAY, borderRadius: 28, padding: 22, alignItems: 'center', marginBottom: 16, shadowColor: PLAY, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 7 },
  trophyCircle: { width: 70, height: 70, borderRadius: 35, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 10 },
  heroTrophy: { fontSize: 38 },
  heroTitle: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  heroSubtitle: { color: '#DBEAFE', fontSize: 12, lineHeight: 17, fontWeight: '600', textAlign: 'center', marginTop: 5 },
  progressTrack: { width: '100%', height: 9, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden', marginTop: 18 },
  progressFill: { height: '100%', backgroundColor: '#FACC15', borderRadius: 99 },
  progressLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', marginTop: 8 },
  row: { gap: 12, marginBottom: 12 },
  awardCard: { flex: 1, minHeight: 224, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 22, padding: 14, alignItems: 'center', justifyContent: 'center' },
  awardCardUnlocked: { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  medal: { width: 82, height: 82, borderRadius: 25, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 10, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
  lockedTrophyPreview: { opacity: 0.42 },
  lockBadge: { position: 'absolute', right: -5, bottom: -5, width: 29, height: 29, borderRadius: 15, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.14, shadowRadius: 4, elevation: 3 },
  lockEmoji: { fontSize: 14 },
  tierName: { color: MUTED, fontSize: 10, fontWeight: '900', letterSpacing: 0.65, textTransform: 'uppercase', marginBottom: 3 },
  milestoneTitle: { color: INK, fontSize: 15, fontWeight: '900' },
  rewardText: { color: '#D97706', fontSize: 12, fontWeight: '800', marginTop: 3 },
  claimButton: { marginTop: 12, backgroundColor: PLAY, borderRadius: 999, paddingVertical: 9, paddingHorizontal: 14 },
  claimButtonText: { color: '#FFFFFF', fontSize: 11, fontWeight: '900' },
  claimedPill: { marginTop: 12, backgroundColor: '#DCFCE7', borderRadius: 999, paddingVertical: 8, paddingHorizontal: 12 },
  claimedText: { color: '#15803D', fontSize: 11, fontWeight: '900' },
  lockedText: { color: MUTED, fontSize: 11, fontWeight: '700', marginTop: 14 },
  pressed: { transform: [{ scale: 0.96 }], opacity: 0.85 },
});
