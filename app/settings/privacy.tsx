import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: 'We collect information you provide directly to us, including your name, email address, school, and any content you create (flashcards, posts, messages). We also collect usage data such as study sessions, streak counts, and feature interactions to improve the app.',
  },
  {
    title: '2. How We Use Your Information',
    body: 'We use your information to provide, maintain, and improve Sinko. This includes personalizing your study experience, tracking your progress, sending study reminders (if enabled), and processing payments via PayPal. We do not sell your personal data to third parties.',
  },
  {
    title: '3. Data Storage',
    body: 'All data is securely stored on Convex (a SOC 2 compliant cloud infrastructure). Files you upload (documents, images) are stored in encrypted Convex storage. We retain your data as long as your account is active.',
  },
  {
    title: '4. Community Content',
    body: 'Content you post in forums, groups, or public decks is visible to other Sinko users. You are responsible for content you share. We reserve the right to remove content that violates our community guidelines.',
  },
  {
    title: '5. Third-Party Services',
    body: 'We integrate with: Google OAuth (sign-in), PayPal (payments), and Google Gemini (AI card generation). These services have their own privacy policies which apply to their portion of data processing.',
  },
  {
    title: '6. Your Rights',
    body: 'You may request deletion of your account and all associated data by contacting support@sinko.app. You can update your profile information at any time in Settings → Edit Profile.',
  },
  {
    title: '7. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify you of significant changes via the app. Continued use of Sinko after changes constitutes acceptance of the updated policy.',
  },
  {
    title: '8. Contact',
    body: 'For any privacy-related questions or requests, contact us at: privacy@sinko.app',
  },
];

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Privacy Policy</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}>
        <View style={styles.effectiveBadge}>
          <Ionicons name="calendar-outline" size={14} color={Colors.azure} />
          <Text style={styles.effectiveText}>Effective: April 13, 2026</Text>
        </View>

        <Text style={styles.intro}>
          Sinko ("we", "us", "our") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights.
        </Text>

        {SECTIONS.map((section, i) => (
          <View key={i} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.sectionBody}>{section.body}</Text>
          </View>
        ))}

        <Text style={styles.footer}>
          Sinko © 2026 · All rights reserved
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  effectiveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.azureLight, borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: Spacing.md,
  },
  effectiveText: { fontSize: 12, color: Colors.azure, fontWeight: '600' },
  intro: { ...Typography.body, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 6 },
  sectionBody: { ...Typography.body, color: Colors.textMuted, lineHeight: 22 },
  footer: { ...Typography.caption, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.lg },
});
