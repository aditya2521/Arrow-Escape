import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Path, G } from 'react-native-svg';
import { RootStackParamList } from '../types/game';
import { TOTAL_LEVELS } from '../engine/handcraftedMazes';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const WHITE = '#FFFFFF';
const INK = '#0F172A';
const MUTED = '#64748B';
const SOFT = '#F1F5F9';
const PLAY = '#2563EB';
const PLAY_DARK = '#1D4ED8';

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.topBar}>
          <View style={styles.brandPill}>
            <View style={styles.brandMark}>
              <Text style={styles.brandArrow}>↗</Text>
            </View>
            <Text style={styles.brandText}>ARROW ESCAPE</Text>
          </View>
          <View style={styles.topActions}>
            <View style={styles.levelCountPill}>
              <Text style={styles.levelCount}>{TOTAL_LEVELS}</Text>
              <Text style={styles.levelLabel}> LEVELS</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={({ pressed }) => [styles.settingsButton, pressed && styles.pressed]}
            >
              <Text style={styles.settingsIcon}>⚙</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.heroWrap}>
          <View style={styles.heroGraphicCard}>
            <View style={styles.heroGraphicInner}>
              <Image
                source={require('../../assets/images/icon.png')}
                style={styles.heroLogo}
                resizeMode="cover"
                accessibilityLabel="Arrow Escape maze logo"
              />
            </View>
          </View>

          <View style={styles.copyBlock}>
            <Text style={styles.eyebrow}>A SATISFYING LOGIC PUZZLE</Text>
            <Text style={styles.title}>Arrow Escape</Text>
            <Text style={styles.subtitle}>Find the right order. Free every arrow.</Text>
          </View>

          <View style={styles.featureRow}>
            <View style={styles.featureChip}>
              <Text style={styles.featureIcon}>◇</Text>
              <Text style={styles.featureText}>Quick to learn</Text>
            </View>
            <View style={styles.featureChip}>
              <Text style={styles.featureIcon}>⚡</Text>
              <Text style={styles.featureText}>Brain training</Text>
            </View>
          </View>

          <Pressable
            onPress={() => navigation.navigate('Awards')}
            style={({ pressed }) => [styles.awardsCard, pressed && styles.pressed]}
          >
            <View style={styles.awardsIconWrap}>
              <Text style={styles.awardsIcon}>🏆</Text>
            </View>
            <View style={styles.awardsCopy}>
              <Text style={styles.awardsTitle}>Milestone Awards</Text>
              <Text style={styles.awardsSubtitle}>Reach special milestones for rewards</Text>
            </View>
            <Text style={styles.awardsChevron}>›</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <Pressable
            style={({ pressed }) => [styles.playButton, pressed && styles.pressed]}
            onPress={() => navigation.navigate('Game', { levelId: 1 })}
          >
            <Svg width={26} height={26} viewBox="0 0 24 24" fill="#FFFFFF">
              <Path d="M8 5v14l11-7z" />
            </Svg>
            <View>
              <Text style={styles.playButtonText}>Start playing</Text>
              <Text style={styles.playButtonSubtext}>Begin at Level 1</Text>
            </View>
          </Pressable>

          <View style={styles.legalRow}>
            <Pressable
              onPress={() => navigation.navigate('Privacy')}
              hitSlop={10}
              style={({ pressed }) => pressed && styles.pressedSubtle}
            >
              <Text style={styles.legalLink}>Privacy</Text>
            </Pressable>
            <Text style={styles.legalDot}>·</Text>
            <Pressable
              onPress={() => navigation.navigate('Terms')}
              hitSlop={10}
              style={({ pressed }) => pressed && styles.pressedSubtle}
            >
              <Text style={styles.legalLink}>Terms</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

/**
 * Hero graphic — a compact cluster of in-game-style bent-tail arrows, no
 * container/border. One arrow highlighted blue like it's about to fire.
 * Matches the game's actual arrow rendering (line + arrowhead wings + bent tails).
 */
const ArrowHeroGraphic: React.FC = () => {
  const size = 220;
  const cell = 26;
  const ink = INK;
  const blue = PLAY;
  const soft = '#CBD5E1';
  const stroke = 5.5;
  const barb = 6.5;

  // Each arrow: sequence of grid points forming the tail; last point is the head.
  // Direction is inferred from second-to-last -> last point.
  type A = { pts: [number, number][]; color: string };
  const arrows: A[] = [
    // Central blue arrow — L-shape going right then up
    { pts: [[3, 5], [4, 5], [4, 4], [4, 3]], color: blue },
    // Top-left: bent arrow pointing down
    { pts: [[0, 0], [1, 0], [1, 1], [1, 2]], color: ink },
    // Top-right: straight arrow pointing left
    { pts: [[7, 1], [6, 1], [5, 1]], color: ink },
    // Right side: L-shape pointing down
    { pts: [[7, 3], [7, 4], [6, 4], [6, 5]], color: ink },
    // Bottom: bent arrow pointing left
    { pts: [[6, 7], [5, 7], [5, 6], [4, 6]], color: ink },
    // Left side: soft/muted arrow pointing right
    { pts: [[0, 4], [0, 5], [1, 5], [2, 5]], color: soft },
    // Top-center soft arrow pointing right
    { pts: [[2, 2], [3, 2]], color: soft },
    // Top-center bent arrow pointing down
    { pts: [[3, 0], [4, 0], [4, 1]], color: soft },
    // Left-edge short arrow pointing down
    { pts: [[0, 2], [0, 3]], color: ink },
    // Bottom-left bent arrow pointing up
    { pts: [[0, 7], [1, 7], [1, 6]], color: ink },
    // Bottom-center short arrow pointing up
    { pts: [[3, 7], [3, 6]], color: soft },
    // Right-mid short arrow pointing down
    { pts: [[6, 2], [6, 3]], color: soft },
    // Secondary blue accent — short arrow pointing up beside the central one
    { pts: [[5, 4], [5, 3]], color: blue },
  ];

  const gridToPx = (c: number, r: number) => ({
    x: c * cell + cell / 2 + 8,
    y: r * cell + cell / 2 + 8,
  });

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {arrows.map((a, idx) => {
        const pxPts = a.pts.map(([c, r]) => gridToPx(c, r));
        // Tail path (all points connected)
        const tailD = 'M ' + pxPts.map((p) => `${p.x} ${p.y}`).join(' L ');
        // Head tip: extend beyond last point in the direction of last step
        const last = pxPts[pxPts.length - 1];
        const prev = pxPts[pxPts.length - 2];
        const dx = last.x - prev.x;
        const dy = last.y - prev.y;
        const mag = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / mag;
        const uy = dy / mag;
        const tipAdvance = cell * 0.28;
        const tipX = last.x + ux * tipAdvance;
        const tipY = last.y + uy * tipAdvance;
        // Barbs
        const px = -uy;
        const py = ux;
        const wing1X = tipX - ux * barb + px * barb;
        const wing1Y = tipY - uy * barb + py * barb;
        const wing2X = tipX - ux * barb - px * barb;
        const wing2Y = tipY - uy * barb - py * barb;
        const shaftPath = tailD + ` L ${tipX} ${tipY}`;
        const headPath = `M ${wing1X} ${wing1Y} L ${tipX} ${tipY} L ${wing2X} ${wing2Y}`;
        return (
          <G key={idx}>
            {/* tail-start rounded cap */}
            <Path
              d={`M ${pxPts[0].x} ${pxPts[0].y} L ${pxPts[0].x} ${pxPts[0].y}`}
              stroke={a.color}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
            {/* shaft */}
            <Path
              d={shaftPath}
              stroke={a.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
            {/* arrowhead wings */}
            <Path
              d={headPath}
              stroke={a.color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>
        );
      })}
    </Svg>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: WHITE },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 10,
    paddingBottom: 14,
    backgroundColor: WHITE,
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#EFF6FF',
    top: -150,
    right: -100,
  },
  glowBottom: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: '#EEF2FF',
    bottom: -150,
    left: -100,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingLeft: 6,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 8,
  },
  brandMark: {
    width: 27,
    height: 27,
    borderRadius: 9,
    backgroundColor: PLAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandArrow: { color: WHITE, fontSize: 17, fontWeight: '900', marginTop: -1 },
  brandText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.35,
    color: INK,
  },
  levelCountPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },
  levelCount: { color: PLAY_DARK, fontSize: 12, fontWeight: '900' },
  levelLabel: { color: '#64748B', fontSize: 9, fontWeight: '800', letterSpacing: 0.7 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  settingsButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  settingsIcon: { color: INK, fontSize: 19, fontWeight: '800' },

  heroWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  heroGraphicCard: {
    width: 244,
    height: 244,
    borderRadius: 42,
    backgroundColor: '#000000',
    borderWidth: 2,
    borderColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 5,
    overflow: 'hidden',
  },
  heroGraphicInner: {
    width: '100%',
    height: '100%',
  },
  heroLogo: {
    width: '100%',
    height: '100%',
  },
  copyBlock: {
    alignItems: 'center',
    gap: 6,
  },
  eyebrow: {
    color: PLAY,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.65,
  },
  title: {
    fontSize: 41,
    fontWeight: '900',
    color: INK,
    letterSpacing: -1.5,
  },
  subtitle: {
    fontSize: 14.5,
    color: MUTED,
    fontWeight: '600',
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8EDF4',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 999,
  },
  featureIcon: { color: PLAY, fontSize: 12, fontWeight: '900' },
  featureText: { color: '#475569', fontSize: 10, fontWeight: '800' },
  awardsCard: {
    width: '100%',
    maxWidth: 330,
    minHeight: 54,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 18,
    paddingHorizontal: 11,
    paddingVertical: 8,
  },
  awardsIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  awardsIcon: { fontSize: 20 },
  awardsCopy: { flex: 1, marginLeft: 10 },
  awardsTitle: { color: '#92400E', fontSize: 12, fontWeight: '900' },
  awardsSubtitle: { color: '#A16207', fontSize: 9.5, fontWeight: '700', marginTop: 2 },
  awardsChevron: { color: '#D97706', fontSize: 26, fontWeight: '700', marginRight: 2 },

  actions: {
    gap: 12,
  },
  playButton: {
    flexDirection: 'row',
    backgroundColor: PLAY,
    borderRadius: 24,
    minHeight: 70,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    shadowColor: PLAY,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.26,
    shadowRadius: 14,
    elevation: 7,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.1,
    textAlign: 'left',
  },
  playButtonSubtext: {
    color: '#DBEAFE',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.95,
  },
  pressedSubtle: {
    transform: [{ scale: 0.98 }],
    opacity: 0.7,
  },
  legalRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  legalLink: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  legalDot: {
    color: MUTED,
    fontSize: 12,
    fontWeight: '900',
  },
});
