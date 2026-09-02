import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { GameSettings, RootStackParamList } from '../types/game';
import { DEFAULT_GAME_SETTINGS, GameStorage } from '../storage/gameStorage';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const INK = '#0F172A';
const MUTED = '#64748B';
const PLAY = '#2563EB';

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  const loadSettings = useCallback(async () => {
    setSettings(await GameStorage.getSettings());
  }, []);

  useEffect(() => navigation.addListener('focus', loadSettings), [loadSettings, navigation]);

  const update = (values: Partial<GameSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...values };
      void GameStorage.saveSettings(next);
      return next;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Back"
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.eyebrow}>GAME EXPERIENCE</Text>
        <Text style={styles.heading}>Play your way</Text>
        <Text style={styles.intro}>Choose which feedback you want while solving each maze.</Text>

        <View style={styles.card}>
          <SettingRow
            icon="♪"
            title="Game sounds"
            subtitle="Clicks, wins, mistakes, and rewards"
            value={settings.soundEnabled}
            onValueChange={(value) => update({ soundEnabled: value })}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="≋"
            title="Vibration"
            subtitle="Touch feedback when you tap arrows"
            value={settings.hapticsEnabled}
            onValueChange={(value) => update({ hapticsEnabled: value })}
          />
        </View>

        <View style={styles.note}>
          <Text style={styles.noteIcon}>✓</Text>
          <Text style={styles.noteText}>Your choices are saved automatically on this device.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const SettingRow = ({ icon, title, subtitle, value, onValueChange }: {
  icon: string;
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) => (
  <View style={styles.row}>
    <View style={[styles.rowIcon, value && styles.rowIconOn]}>
      <Text style={[styles.rowIconText, value && styles.rowIconTextOn]}>{icon}</Text>
    </View>
    <View style={styles.rowCopy}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Text style={styles.rowSubtitle}>{subtitle}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#CBD5E1', true: '#93C5FD' }}
      thumbColor={value ? PLAY : '#FFFFFF'}
      ios_backgroundColor="#CBD5E1"
      accessibilityLabel={`${title} ${value ? 'on' : 'off'}`}
    />
  </View>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    height: 82,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  backIcon: { color: INK, fontSize: 38, lineHeight: 40, marginTop: -3 },
  title: { color: INK, fontSize: 22, fontWeight: '900' },
  headerSpacer: { width: 46 },
  content: { paddingHorizontal: 22, paddingTop: 42 },
  eyebrow: { color: PLAY, fontSize: 11, fontWeight: '900', letterSpacing: 1.8 },
  heading: { color: INK, fontSize: 36, fontWeight: '900', letterSpacing: -1, marginTop: 8 },
  intro: { color: MUTED, fontSize: 16, lineHeight: 24, marginTop: 8, maxWidth: 330 },
  card: {
    marginTop: 30,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 4,
  },
  row: { minHeight: 94, flexDirection: 'row', alignItems: 'center' },
  rowIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },
  rowIconOn: { backgroundColor: '#EFF6FF' },
  rowIconText: { color: MUTED, fontSize: 23, fontWeight: '900' },
  rowIconTextOn: { color: PLAY },
  rowCopy: { flex: 1, marginHorizontal: 13 },
  rowTitle: { color: INK, fontSize: 16, fontWeight: '900' },
  rowSubtitle: { color: MUTED, fontSize: 12, lineHeight: 17, marginTop: 3 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#E2E8F0', marginLeft: 59 },
  note: {
    marginTop: 20,
    padding: 16,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
  },
  noteIcon: { color: PLAY, fontSize: 17, fontWeight: '900', marginRight: 10 },
  noteText: { flex: 1, color: '#475569', fontSize: 13, fontWeight: '700', lineHeight: 19 },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
});
