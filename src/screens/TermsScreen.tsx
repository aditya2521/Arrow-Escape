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

type Props = NativeStackScreenProps<RootStackParamList, 'Terms'>;

export const TermsScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <LegalHeader
        title="Terms of Service"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <MetaPill label="UPDATED · AUG 25, 2026" />
        <PageTitle>The rules of the game.</PageTitle>
        <Lede>
          These Terms cover how you use Arrow Escape. By playing you agree to
          them. Don&rsquo;t worry — they&rsquo;re short.
        </Lede>

        <Callout icon="🎯" title="THE SHORT VERSION">
          Arrow Escape is free to play. No shop, no purchases, no coins. Play
          fair, don&rsquo;t abuse the app, and the game is provided
          &ldquo;as is&rdquo;.
        </Callout>

        <Section number={1} heading="How to use Arrow Escape">
          <P>You agree to use the app only for lawful purposes. Please don&rsquo;t:</P>
          <LI>
            Reverse-engineer or extract source code, except where the law
            allows.
          </LI>
          <LI>Use bots or automated tools to play or interact with the game.</LI>
          <LI>Disrupt, overload, or attempt to compromise the app.</LI>
          <LI>
            Copy, redistribute, or sell any part of the game without written
            permission.
          </LI>
        </Section>

        <Section number={2} heading="What we own, what you own">
          <P>
            Arrow Escape — including its name, logo, artwork, all 250 levels,
            code, sound, and design — is owned by us and protected by
            copyright.
          </P>
          <P>
            You get a personal, limited, non-transferable, non-exclusive
            license to install and play Arrow Escape on devices you own, for
            your own non-commercial enjoyment. Your saved progress is yours
            and stays on your device.
          </P>
        </Section>

        <Section number={3} heading="No in-app purchases">
          <P>
            Arrow Escape does <B>not</B> sell coins, hints, lives, or any other
            virtual item. There is no shop, no paywall, and no way to spend
            money inside the game.
          </P>
          <P>
            You start with three hints and earn a bonus hint every three-level
            win streak. That&rsquo;s the entire economy — and it&rsquo;s
            free.
          </P>
        </Section>

        <Section number={4} heading="Advertising">
          <P>
            Arrow Escape may include occasional advertising to keep the game
            free. See our Privacy Policy for details on advertising
            identifiers and how to reset yours.
          </P>
        </Section>

        <Section number={5} heading="Updates & availability">
          <P>
            We may update, change, or discontinue any part of the app — for
            example, to fix bugs, add levels, or comply with legal
            requirements. We do our best to keep the game running, but
            don&rsquo;t guarantee it will be available at all times.
          </P>
        </Section>

        <Section number={6} heading="Disclaimer of warranties">
          <P>
            The app is provided <B>&ldquo;as is&rdquo;</B> and{' '}
            <B>&ldquo;as available&rdquo;</B>, without warranties of any kind,
            whether express or implied.
          </P>
        </Section>

        <Section number={7} heading="Limitation of liability">
          <P>
            To the maximum extent permitted by law, Arrow Escape and its team
            will not be liable for indirect, incidental, special,
            consequential, or punitive damages arising from your use of the
            app. Our total liability will not exceed US$10.
          </P>
        </Section>

        <Section number={8} heading="Termination">
          <P>
            You can stop using Arrow Escape any time by uninstalling it. We may
            suspend or terminate access if you violate these Terms.
          </P>
        </Section>

        <Section number={9} heading="Changes to these Terms">
          <P>
            We may update these Terms from time to time. Continued use of the
            app after changes take effect means you accept the updated Terms.
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
