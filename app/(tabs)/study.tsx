import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

// Modes that require Starter+ plan
const PAID_MODES = new Set(['spaced', 'write']);

const MODES = [
  {
    id: 'flashcard',
    icon: 'albums',
    label: 'Flashcards',
    desc: 'Classic flip-card study. Tap to reveal the answer.',
    color: '#2563EB',
    bg: '#EFF6FF',
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
    id: 'quiz',
    icon: 'help-circle',
    label: 'Quiz',
    desc: 'Multiple choice questions. AI generates 3 wrong answers.',
    color: '#16A34A',
    bg: '#F0FDF4',
  },
  {
    id: 'matching',
    icon: 'git-compare',
    label: 'Matching',
    desc: 'Drag and match card pairs. Great for testing recall.',
    color: '#D97706',
    bg: '#FFFBEB',
  },
  {
    id: 'spaced',
    icon: 'timer',
    label: 'Spaced Repetition',
    desc: 'SM-2 algorithm schedules cards by difficulty. Scientifically proven.',
    color: '#5B21B6',
    bg: '#F5F3FF',
    paidOnly: true,
  },
  {
    id: 'write',
    icon: 'create',
    label: 'Write',
    desc: 'Type the answer from memory. Builds deeper recall.',
    color: '#0891B2',
    bg: '#ECFEFF',
    paidOnly: true,
  },
];

export default function StudyHubScreen() {
  const { colors } = useTheme();
  const myDecks = useQuery(api.decks.listMine, {});
  const gates = useQuery(api.users.getPlanGates);

  const startMode = (modeId: string, locked: boolean) => {
    if (locked) {
      router.push('/settings/subscription');
      return;
    }
    if (!myDecks || myDecks.length === 0) {
      router.push('/discover');
      return;
    }
    requestAnimationFrame(() => {
      router.push(`/study/${modeId}?deckId=${myDecks[0]._id}` as any);
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Study Modes</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Choose how you want to study today</Text>
        </View>

        <View style={styles.modesList}>
          {MODES.map((mode) => {
            const isLocked: boolean = !!(mode.paidOnly && gates !== undefined && !gates.canUseAllModes);
            return (
              <Pressable
                key={mode.id}
                style={({ pressed }) => [
                  styles.modeRow,
                  { backgroundColor: colors.white, borderColor: colors.border },
                  isLocked && styles.modeRowLocked,
                  pressed && { opacity: 0.75 },
                ]}
                onPress={() => startMode(mode.id, isLocked)}
              >
                <View style={[styles.modeIconWrap, { backgroundColor: isLocked ? colors.borderLight : mode.bg }]}>
                  <Ionicons name={mode.icon as any} size={26} color={isLocked ? colors.textLight : mode.color} />
                </View>
                <View style={styles.modeText}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.modeName, { color: isLocked ? colors.textMuted : colors.text }]}>{mode.label}</Text>
                    {isLocked && (
                      <View style={styles.lockBadge}>
                        <Ionicons name="lock-closed" size={9} color="#fff" />
                        <Text style={styles.lockBadgeText}>Starter+</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.modeDesc, { color: colors.textMuted }]}>{mode.desc}</Text>
                  {isLocked && (
                    <Text style={styles.upgradeHint}>Tap to upgrade →</Text>
                  )}
                </View>
                <Ionicons
                  name={isLocked ? 'lock-closed-outline' : 'chevron-forward'}
                  size={18}
                  color={colors.textLight}
                />
              </Pressable>
            );
          })}
        </View>

        {/* No decks nudge */}
        {myDecks && myDecks.length === 0 && (
          <View style={[styles.nudge, { backgroundColor: colors.azureLight }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.azure} />
            <Text style={[styles.nudgeText, { color: colors.azure }]}>
              You need at least one deck to start studying.{' '}
              <Text style={{ color: colors.azure, fontWeight: '600' }}
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
  modeRowLocked: {
    opacity: 0.8,
    borderStyle: 'dashed',
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
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.lilyDark,
    borderRadius: Radius.full,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  lockBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700', letterSpacing: 0.5 },
  upgradeHint: { fontSize: 11, color: Colors.lilyDark, fontWeight: '600', marginTop: 3 },
  nudge: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    margin: Spacing.md,
    backgroundColor: Colors.azureLight,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  nudgeText: { flex: 1, ...Typography.bodySmall, color: Colors.azure, lineHeight: 20 },
});
