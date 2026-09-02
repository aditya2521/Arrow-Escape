import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface EasybrainHeaderProps {
  levelId: number;
  levelName?: string;
  remainingArrows: number;
  lives: number;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  zoomScale?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onBack: () => void;
  onToggleSound: () => void;
  onToggleHaptics: () => void;
}

export const EasybrainHeader: React.FC<EasybrainHeaderProps> = ({
  levelId,
  levelName,
  remainingArrows,
  lives,
  soundEnabled,
  hapticsEnabled,
  zoomScale = 1.0,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onBack,
  onToggleSound,
  onToggleHaptics,
}) => {
  const isZoomed = zoomScale > 1.05;

  return (
    <View style={styles.container}>
      {/* Row 1 — back button, level title (single line, no truncation), sound toggle */}
      <View style={styles.topRow}>
        <Pressable onPress={onBack} style={styles.iconChip} hitSlop={10}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.8}>
            <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </Svg>
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.levelBadge}>LEVEL {levelId}</Text>
          {levelName ? (
            <Text style={styles.levelName} numberOfLines={1} ellipsizeMode="tail">
              {levelName}
            </Text>
          ) : null}
        </View>

        <View style={styles.rightButtons}>
          <Pressable
            onPress={onToggleHaptics}
            style={styles.iconChip}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={hapticsEnabled ? 'Turn off vibration' : 'Turn on vibration'}
            accessibilityState={{ selected: hapticsEnabled }}
          >
            <VibrationIcon on={hapticsEnabled} />
          </Pressable>

          <Pressable
            onPress={onToggleSound}
            style={styles.iconChip}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            accessibilityState={{ selected: soundEnabled }}
          >
            <SoundIcon on={soundEnabled} />
          </Pressable>
        </View>
      </View>

      {/* Row 2 — hearts on the left, arrows-remaining & zoom controls on the right */}
      <View style={styles.metaRow}>
        <View style={styles.heartsRow}>
          {[1, 2, 3].map((heartIndex) => {
            const hasHeart = lives >= heartIndex;
            return (
              <Svg
                key={`heart_${heartIndex}`}
                width={22}
                height={22}
                viewBox="0 0 24 24"
                fill={hasHeart ? '#EF4444' : '#F1F5F9'}
                stroke={hasHeart ? '#EF4444' : '#CBD5E1'}
                strokeWidth={1.5}
              >
                <Path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </Svg>
            );
          })}
        </View>

        <View style={styles.rightMetaColumn}>
          {/* Arrow Count Pill */}
          <View style={styles.arrowsPill}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth={2.6}>
              <Path strokeLinecap="round" strokeLinejoin="round" d="M7 17l9.2-9.2M17 17V7H7" />
            </Svg>
            <Text style={styles.arrowsCount}>{remainingArrows}</Text>
            <Text style={styles.arrowsLabel}>left</Text>
          </View>

          {/* Zoom In / Zoom Out Controls just below Arrow Count */}
          {onZoomIn && onZoomOut && (
            <View style={styles.zoomControlPill}>
              {/* Zoom Out Button (−) */}
              <Pressable
                onPress={onZoomOut}
                disabled={zoomScale <= 1.0}
                style={({ pressed }) => [
                  styles.zoomHeaderBtn,
                  zoomScale <= 1.0 && styles.zoomHeaderBtnDisabled,
                  pressed && styles.zoomHeaderBtnPressed,
                ]}
                hitSlop={8}
                accessibilityLabel="Zoom out"
              >
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.8}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14" />
                </Svg>
              </Pressable>

              {/* Zoom Level Indicator / Reset Button */}
              <Pressable
                onPress={onResetZoom}
                style={({ pressed }) => [
                  styles.zoomHeaderBadge,
                  isZoomed && styles.zoomHeaderBadgeActive,
                  pressed && styles.zoomHeaderBtnPressed,
                ]}
                hitSlop={6}
                accessibilityLabel="Reset zoom"
              >
                <Text style={[styles.zoomHeaderText, isZoomed && styles.zoomHeaderTextActive]}>
                  {isZoomed ? `${zoomScale.toFixed(1)}x` : '1.0x'}
                </Text>
              </Pressable>

              {/* Zoom In Button (+) */}
              <Pressable
                onPress={onZoomIn}
                disabled={zoomScale >= 3.5}
                style={({ pressed }) => [
                  styles.zoomHeaderBtn,
                  zoomScale >= 3.5 && styles.zoomHeaderBtnDisabled,
                  pressed && styles.zoomHeaderBtnPressed,
                ]}
                hitSlop={8}
                accessibilityLabel="Zoom in"
              >
                <Svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#1E293B" strokeWidth={2.8}>
                  <Path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                </Svg>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const VibrationIcon: React.FC<{ on: boolean }> = ({ on }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    {/* Phone body */}
    <Rect
      x="8.5"
      y="4"
      width="7"
      height="16"
      rx="1.6"
      fill="none"
      stroke="#2563EB"
      strokeWidth={2}
    />
    {on ? (
      <>
        {/* Vibration waves on both sides */}
        <Path
          d="M5.5 9c-1 1.2-1 4.8 0 6"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M3 7c-1.6 2.2-1.6 7.8 0 10"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M18.5 9c1 1.2 1 4.8 0 6"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M21 7c1.6 2.2 1.6 7.8 0 10"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </>
    ) : (
      <>
        {/* Muted indicator: red slash + dot */}
        <Circle cx="18" cy="12" r="5" fill="#FEE2E2" />
        <Path
          d="M15 9l6 6M21 9l-6 6"
          stroke="#DC2626"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </>
    )}
  </Svg>
);

const SoundIcon: React.FC<{ on: boolean }> = ({ on }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    {/* Filled speaker cone */}
    <Path fill="#2563EB" d="M4 9v6h3l5 4V5L7 9H4z" />
    {on ? (
      <>
        {/* Two curved sound waves */}
        <Path
          d="M15.5 8.5c1.6 1.6 1.6 5.4 0 7"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d="M18.5 6c2.7 2.7 2.7 9.3 0 12"
          stroke="#2563EB"
          strokeWidth={2}
          strokeLinecap="round"
          fill="none"
        />
      </>
    ) : (
      <>
        {/* Muted indicator: red slash + dot */}
        <Circle cx="18" cy="12" r="5" fill="#FEE2E2" />
        <Path
          d="M15 9l6 6M21 9l-6 6"
          stroke="#DC2626"
          strokeWidth={2}
          strokeLinecap="round"
        />
      </>
    )}
  </Svg>
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  rightButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconChip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  levelBadge: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  levelName: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  heartsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  rightMetaColumn: {
    alignItems: 'flex-end',
    gap: 4,
  },
  arrowsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    gap: 5,
  },
  arrowsCount: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
  },
  arrowsLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  zoomControlPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 3,
    paddingVertical: 2,
    gap: 3,
  },
  zoomHeaderBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  zoomHeaderBtnDisabled: {
    opacity: 0.35,
  },
  zoomHeaderBtnPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.92 }],
  },
  zoomHeaderBadge: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zoomHeaderBadgeActive: {
    backgroundColor: '#EFF6FF',
  },
  zoomHeaderText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
  },
  zoomHeaderTextActive: {
    color: '#2563EB',
  },
});
