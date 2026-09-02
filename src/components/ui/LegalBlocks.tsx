import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const INK = '#0F172A';
const MUTED = '#64748B';
const BODY = '#334155';
const SOFT = '#F1F5F9';
const PLAY = '#2563EB';
const PLAY_SOFT = '#EFF6FF';
const PLAY_BORDER = '#DBEAFE';

/** Small pill shown at the top of the page — e.g. "UPDATED · AUG 25". */
export const MetaPill: React.FC<{ label: string }> = ({ label }) => (
  <View style={styles.metaPill}>
    <View style={styles.metaDot} />
    <Text style={styles.metaText}>{label}</Text>
  </View>
);

/** Screen title (large bold, matches the in-game level-name style). */
export const PageTitle: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => <Text style={styles.pageTitle}>{children}</Text>;

/** Introductory subtitle shown right below the title. */
export const Lede: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.lede}>{children}</Text>
);

/** Numbered section — pill number + heading + card body. */
export const Section: React.FC<{
  number: number;
  heading: string;
  children: React.ReactNode;
}> = ({ number, heading, children }) => (
  <View style={styles.section}>
    <View style={styles.sectionHeader}>
      <View style={styles.sectionNumber}>
        <Text style={styles.sectionNumberText}>{number}</Text>
      </View>
      <Text style={styles.sectionHeading}>{heading}</Text>
    </View>
    <View style={styles.sectionBody}>{children}</View>
  </View>
);

/** Highlighted callout — e.g. the "short version" summary at the top. */
export const Callout: React.FC<{
  icon: string;
  title: string;
  children: React.ReactNode;
}> = ({ icon, title, children }) => (
  <View style={styles.callout}>
    <View style={styles.calloutIconWrap}>
      <Text style={styles.calloutIcon}>{icon}</Text>
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.calloutTitle}>{title}</Text>
      <Text style={styles.calloutBody}>{children}</Text>
    </View>
  </View>
);

export const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.p}>{children}</Text>
);

export const B: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.b}>{children}</Text>
);

export const Link: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Text style={styles.link}>{children}</Text>
);

export const LI: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <View style={styles.liRow}>
    <View style={styles.liBullet} />
    <Text style={styles.liText}>{children}</Text>
  </View>
);

/** Footer contact block at the bottom of the page. */
export const ContactCard: React.FC<{ email: string }> = ({ email }) => (
  <View style={styles.contact}>
    <Text style={styles.contactEmoji}>✉️</Text>
    <View style={{ flex: 1 }}>
      <Text style={styles.contactTitle}>Questions?</Text>
      <Text style={styles.contactBody}>
        Email us at <Text style={styles.link}>{email}</Text>
      </Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  metaPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PLAY_SOFT,
    borderWidth: 1,
    borderColor: PLAY_BORDER,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    gap: 6,
  },
  metaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PLAY,
  },
  metaText: {
    color: '#1D4ED8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
  },

  pageTitle: {
    marginTop: 14,
    fontSize: 34,
    fontWeight: '900',
    color: INK,
    letterSpacing: -0.8,
    lineHeight: 38,
  },
  lede: {
    marginTop: 10,
    fontSize: 15,
    lineHeight: 22,
    color: MUTED,
    fontWeight: '500',
  },

  section: { marginTop: 22 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  sectionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: PLAY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeading: {
    flex: 1,
    fontSize: 17,
    fontWeight: '900',
    color: INK,
    letterSpacing: -0.2,
  },
  sectionBody: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: SOFT,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },

  callout: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: PLAY_SOFT,
    borderWidth: 1,
    borderColor: PLAY_BORDER,
    borderRadius: 20,
    padding: 14,
  },
  calloutIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calloutIcon: { fontSize: 20 },
  calloutTitle: {
    color: '#1D4ED8',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  calloutBody: {
    color: '#1E3A8A',
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },

  p: {
    fontSize: 14.5,
    lineHeight: 22,
    color: BODY,
    marginBottom: 8,
  },
  b: {
    color: INK,
    fontWeight: '800',
  },
  link: {
    color: PLAY,
    fontWeight: '700',
  },

  liRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 6,
  },
  liBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: PLAY,
    marginTop: 8,
  },
  liText: {
    flex: 1,
    fontSize: 14.5,
    lineHeight: 22,
    color: BODY,
  },

  contact: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: SOFT,
    borderRadius: 20,
    padding: 14,
  },
  contactEmoji: { fontSize: 22 },
  contactTitle: {
    color: INK,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 2,
  },
  contactBody: {
    color: BODY,
    fontSize: 13,
    lineHeight: 20,
  },
});
