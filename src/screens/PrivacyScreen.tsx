import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/game';
import { LegalHeader } from '../components/ui/LegalHeader';
import {
  MetaPill,
  PageTitle,
  Lede,
  Section,
  Callout,
  P,
  B,
  LI,
  ContactCard,
} from '../components/ui/LegalBlocks';

type Props = NativeStackScreenProps<RootStackParamList, 'Privacy'>;

export const PrivacyScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LegalHeader title="Privacy Policy" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MetaPill label="UPDATED · AUG 25, 2026" />
        <PageTitle>Privacy, in plain words.</PageTitle>
        <Lede>
          Arrow Escape is a puzzle game. We collect almost nothing, we don&rsquo;t
          sell anything, and the whole thing works offline.
        </Lede>

        <Callout icon="🔒" title="THE SHORT VERSION">
          No accounts. No emails. No location. No selling of data. Your
          progress lives on your device — uninstall the app and it&rsquo;s
          gone.
        </Callout>

        <Section number={1} heading="What we collect">
          <P>We collect as little as we possibly can:</P>
          <LI>
            <B>Game progress</B> — unlocked level, hint count, and settings.
            Stored locally on your device, never sent to us.
          </LI>
          <LI>
            <B>Device information</B> — OS version, device model, and app
            version, used only for crash reporting.
          </LI>
          <LI>
            <B>Anonymous usage stats</B> — aggregated counts like &ldquo;how
            many players finished Level 47&rdquo;. Cannot identify you.
          </LI>
        </Section>

        <Section number={2} heading="What we don't collect">
          <LI>Your name, email, or phone number.</LI>
          <LI>Your contacts, photos, or location.</LI>
          <LI>An account — the game has no login.</LI>
          <LI>Anything we could sell or rent to third parties.</LI>
        </Section>

        <Section number={3} heading="How we use it">
          <P>Anything we do collect is used only to:</P>
          <LI>Keep Arrow Escape running smoothly.</LI>
          <LI>Diagnose crashes and fix bugs.</LI>
          <LI>Understand which of the 250 levels players enjoy.</LI>
        </Section>

        <Section number={4} heading="Advertising">
          <P>
            Arrow Escape may show occasional non-intrusive ads to keep the game
            free. Ad providers may use a standard mobile advertising ID. You
            can reset or limit that ID any time in your device settings
            (iOS: Settings › Privacy › Tracking. Android: Settings › Google ›
            Ads).
          </P>
        </Section>

        <Section number={5} heading="Kids">
          <P>
            Arrow Escape is family-friendly and safe for all ages. There is no
            chat, no social feed, no personal data collection. If you believe
            a child has provided personal information, contact us and we will
            delete it.
          </P>
        </Section>

        <Section number={6} heading="Your rights">
          <P>
            Depending on where you live (e.g. GDPR in the EU/UK, CCPA in
            California), you may have the right to access, correct, or delete
            personal information about you. Because we hold so little, most
            requests take us minutes.
          </P>
        </Section>

        <Section number={7} heading="Changes">
          <P>
            We may update this policy from time to time. Meaningful changes
            will update the &ldquo;updated&rdquo; date at the top.
          </P>
        </Section>

        <ContactCard email="support@arrowescape.app" />

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
});
