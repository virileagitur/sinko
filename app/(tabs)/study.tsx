import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const MODES = [
  {
    id: 'flashcard',
    icon: 'albums',
    label: 'Flashcards',
    desc: 'Classic flip-card study. Tap to reveal the answer.',
    color: Colors.azure,
    bg: Colors.azureLight,
  },
  {
    id: 'pomodoro',
    icon: 'time',
    label: 'Pomodoro',
    desc: '25 min focus sessions with 5 min breaks. Traditional analog timer.',
    color: '#C0392B',
    bg: '#FEF2F2',
  },
  {
    id: 'spaced',
    icon: 'timer',
    label: 'Spaced Repetition',
    desc: 'SM-2 algorithm schedules cards by difficulty. Scientifically proven.',
    color: Colors.lilyDark,
    bg: Colors.lilyLight,
  },
  {
    id: 'quiz',
    icon: 'help-circle',
    label: 'Quiz',
    desc: 'Multiple choice questions. AI generates 3 wrong answers.',
    color: Colors.success,
    bg: '#F0FDF4',
  },
  {
    id: 'matching',
    icon: 'git-compare',
    label: 'Matching',
    desc: 'Drag and match card pairs. Great for testing recall.',
    color: Colors.warning,
    bg: '#FFFBEB',
  },
  {
    id: 'write',
    icon: 'create',
    label: 'Write',
    desc: 'Type the answer from memory. Builds deeper recall.',
    color: Colors.info,
    bg: '#ECFEFF',
  },
];

export default function StudyHubScreen() {
  const myDecks = useQuery(api.decks.listMine);

  const startMode = (modeId: string) => {
    if (!myDecks || myDecks.length === 0) {
      router.push('/discover');
      return;
    }
    router.push(`/study/${modeId}?deckId=${myDecks[0]._id}` as any);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Study Modes</Text>
          <Text style={styles.subtitle}>Choose how you want to study today</Text>
        </View>

        <View style={styles.modesList}>
          {MODES.map((mode) => (
            <TouchableOpacity
              key={mode.id}
              style={styles.modeRow}
              onPress={() => startMode(mode.id)}
              activeOpacity={0.85}
            >
              <View style={[styles.modeIconWrap, { backgroundColor: mode.bg }]}>
                <Ionicons name={mode.icon as any} size={26} color={mode.color} />
              </View>
              <View style={styles.modeText}>
                <Text style={styles.modeName}>{mode.label}</Text>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
            </TouchableOpacity>
          ))}
        </View>

        {/* No decks nudge */}
        {myDecks && myDecks.length === 0 && (
          <View style={styles.nudge}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.azure} />
            <Text style={styles.nudgeText}>
              You need at least one deck to start studying.{' '}
              <Text style={{ color: Colors.azure, fontWeight: '600' }}
                onPress={() => router.push('/discover')}>
                Browse courses →
              </Text>
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: Spacing.md, paddingBottom: 0 },
  title: { ...Typography.h2, marginBottom: 4 },
  subtitle: { ...Typography.bodySmall, color: Colors.textMuted, marginBottom: Spacing.md },
  modesList: { padding: Spacing.md, gap: Spacing.sm },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  modeIconWrap: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: { flex: 1 },
  modeName: { fontSize: 16, fontWeight: '600', color: Colors.text },
  modeDesc: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2, lineHeight: 18 },
  nudge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    margin: Spacing.md,
    backgroundColor: Colors.azureLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  nudgeText: { flex: 1, ...Typography.bodySmall, color: Colors.azureDark, lineHeight: 20 },
});
