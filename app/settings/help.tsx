import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, LayoutAnimation } from 'react-native';
import { router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';

const FAQ = [
  { q: 'How do AI flashcard imports work?', a: 'Upload any PDF, image, or text file. Our AI (powered by Google Gemini) reads the document and generates relevant flashcards in the format you choose — Q&A, definitions, cloze, or visual.' },
  { q: 'What study modes are available?', a: 'Sinko offers 6 study modes: Classic Flashcards, Spaced Repetition (SM-2), Quiz, Matching Game, Pomodoro Timer, and Write Mode. All modes except Spaced Repetition and Write are available on the free plan.' },
  { q: 'How does the streak system work?', a: 'Your streak increases by 1 each day you complete at least one study session. Miss a day and the streak resets to 1. Streaks reset at midnight your local time.' },
  { q: 'Can I share my decks with others?', a: 'Yes! When creating or editing a deck, toggle it to "Public". Public decks appear in course pages for others to discover and study.' },
  { q: 'How do group study rooms work?', a: 'Groups are linked to specific courses. Create or join a group, then use the real-time chat to coordinate study sessions, share resources, and discuss topics.' },
  { q: 'How do I cancel my subscription?', a: 'Subscriptions are managed through PayPal. Log in to your PayPal account, go to Settings → Payments → Manage Automatic Payments, and cancel Sinko.' },
  { q: 'My flashcards were not generated correctly. What should I do?', a: 'Try a cleaner document with clear text. Scanned images or handwritten notes may reduce accuracy. You can always edit or delete individual cards after generation.' },
  { q: 'Is my data secure?', a: 'All data is stored on Convex (SOC 2 compliant infrastructure). We never sell your data. See our Privacy Policy for full details.' },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.faqItem}>
      <TouchableOpacity
        style={styles.faqQuestion}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((o) => !o);
        }}
      >
        <Text style={styles.faqQ}>{q}</Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textMuted} />
      </TouchableOpacity>
      {open && <Text style={styles.faqA}>{a}</Text>}
    </View>
  );
}

export default function HelpScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: Spacing.md, paddingBottom: 80 }}>
        {/* Contact */}
        <View style={styles.contactCard}>
          <Ionicons name="mail-outline" size={28} color={Colors.azure} />
          <View style={{ flex: 1 }}>
            <Text style={styles.contactTitle}>Contact Support</Text>
            <Text style={styles.contactSub}>We reply within 24 hours</Text>
          </View>
          <TouchableOpacity
            style={styles.contactBtn}
            onPress={() => Linking.openURL('mailto:support@sinko.app?subject=Sinko Support')}
          >
            <Text style={styles.contactBtnText}>Email</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <View style={styles.faqCard}>
          {FAQ.map((item, i) => (
            <React.Fragment key={i}>
              <FAQItem q={item.q} a={item.a} />
              {i < FAQ.length - 1 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </View>

        <Text style={styles.version}>Sinko v1.0.0 · Made with ❤️ for students</Text>
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
  contactCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.white, borderRadius: Radius.xl, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  contactTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  contactSub: { ...Typography.caption, color: Colors.textMuted },
  contactBtn: { backgroundColor: Colors.azure, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full },
  contactBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  faqCard: {
    backgroundColor: Colors.white, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  faqItem: { padding: Spacing.md },
  faqQuestion: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.sm },
  faqQ: { fontSize: 14, fontWeight: '600', color: Colors.text, flex: 1 },
  faqA: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: Spacing.sm, lineHeight: 20 },
  divider: { height: 1, backgroundColor: Colors.border },
  version: { ...Typography.caption, color: Colors.textLight, textAlign: 'center', marginTop: Spacing.xl },
});
