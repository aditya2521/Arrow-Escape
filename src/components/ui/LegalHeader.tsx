import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface LegalHeaderProps {
  title: string;
  onBack: () => void;
}

/**
 * Shared header for legal screens — mirrors the in-game EasybrainHeader style:
 * soft-gray back chip with blue chevron, centered LEVEL-style eyebrow + title.
 */
export const LegalHeader: React.FC<LegalHeaderProps> = ({ title, onBack }) => {
  return (
    <View style={styles.container}>
      <Pressable
        onPress={onBack}
        hitSlop={10}
        style={({ pressed }) => [styles.iconChip, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Back"
      >
        <Svg
          width={20}
          height={20}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563EB"
          strokeWidth={2.8}
        >
          <Path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </Svg>
      </Pressable>

      <View style={styles.titleWrap}>
        <Text style={styles.eyebrow}>LEGAL</Text>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {title}
        </Text>
      </View>

      {/* right-side spacer to keep title centered */}
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
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
  eyebrow: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  title: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  spacer: { width: 40, height: 40 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
