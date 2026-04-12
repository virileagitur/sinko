import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Card, Avatar, PlanBadge } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const STUDY_MODES = [
  { id: 'flashcard', icon: 'albums-outline', label: 'Flashcards', color: Colors.azure, desc: 'Classic flip cards' },
  { id: 'spaced', icon: 'timer-outline', label: 'Spaced Rep', color: Colors.lilyDark, desc: 'SM-2 algorithm' },
  { id: 'quiz', icon: 'help-circle-outline', label: 'Quiz', color: Colors.success, desc: 'Multiple choice' },
  { id: 'matching', icon: 'git-compare-outline', label: 'Matching', color: Colors.warning, desc: 'Match pairs' },
  { id: 'pomodoro', icon: 'time-outline', label: 'Pomodoro', color: Colors.error, desc: '25 min sessions' },
  { id: 'write', icon: 'create-outline', label: 'Write', color: Colors.info, desc: 'Type the answer' },
];

export default function HomeScreen() {
  const profile = useQuery(api.users.getMyProfile);
  const myDecks = useQuery(api.decks.listMine);
  const recentSessions = useQuery(api.study.getRecentSessions);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const dueCount = 0; // Would calculate from cards query

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{profile?.name?.split(' ')[0] ?? 'Student'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/ai/import')} style={styles.importBtn}>
            <Ionicons name="sparkles" size={18} color={Colors.white} />
            <Text style={styles.importBtnText}>AI Import</Text>
          </TouchableOpacity>
        </View>

        {/* Streak Banner */}
        <View style={styles.streakBanner}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>🔥 {profile?.streakDays ?? 0}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={[styles.streakDivider]} />
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>📚 {myDecks?.length ?? 0}</Text>
            <Text style={styles.streakLabel}>Decks</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>⚡ {dueCount}</Text>
            <Text style={styles.streakLabel}>Due Today</Text>
          </View>
        </View>

        {/* Study Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study Modes</Text>
          <View style={styles.modesGrid}>
            {STUDY_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={styles.modeCard}
                onPress={() => {
                  if (myDecks && myDecks.length > 0) {
                    router.push(`/study/${mode.id}?deckId=${myDecks[0]._id}`);
                  } else {
                    router.push('/discover');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.modeIcon, { backgroundColor: mode.color + '15' }]}>
                  <Ionicons name={mode.icon as any} size={22} color={mode.color} />
                </View>
                <Text style={styles.modeLabel}>{mode.label}</Text>
                <Text style={styles.modeDesc}>{mode.desc}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Decks */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Decks</Text>
            <TouchableOpacity onPress={() => router.push('/deck/create')}>
              <Text style={styles.sectionAction}>+ New Deck</Text>
            </TouchableOpacity>
          </View>

          {myDecks && myDecks.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.deckScroll}>
              {myDecks.slice(0, 10).map((deck) => (
                <TouchableOpacity
                  key={deck._id}
                  style={styles.deckCard}
                  onPress={() => router.push(`/deck/${deck._id}`)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.deckCardTop, { backgroundColor: deck.colorTag ?? Colors.azureLight }]}>
                    <Ionicons name="albums" size={28} color={Colors.azure} />
                  </View>
                  <View style={styles.deckCardBody}>
                    <Text style={styles.deckCardTitle} numberOfLines={1}>{deck.title}</Text>
                    <Text style={styles.deckCardMeta}>{deck.cardCount} cards</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity style={styles.emptyDecks} onPress={() => router.push('/discover')}>
              <Ionicons name="add-circle-outline" size={32} color={Colors.azure} />
              <Text style={[Typography.body, { color: Colors.azure, marginTop: Spacing.sm }]}>
                Browse courses to get started
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick Actions */}
        <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/ai/import')}>
              <Ionicons name="cloud-upload-outline" size={22} color={Colors.azure} />
              <Text style={styles.quickActionText}>Import Document</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/discover')}>
              <Ionicons name="compass-outline" size={22} color={Colors.azure} />
              <Text style={styles.quickActionText}>Find Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/community')}>
              <Ionicons name="people-outline" size={22} color={Colors.azure} />
              <Text style={styles.quickActionText}>Community</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/settings/subscription')}>
              <Ionicons name="diamond-outline" size={22} color={Colors.lilyDark} />
              <Text style={styles.quickActionText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingTop: Spacing.sm,
  },
  greeting: { ...Typography.bodySmall, color: Colors.textMuted },
  userName: { fontSize: 22, fontWeight: '700', color: Colors.text, marginTop: 2 },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.azure,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  importBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  streakBanner: {
    flexDirection: 'row',
    margin: Spacing.md,
    marginTop: 0,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  streakItem: { flex: 1, alignItems: 'center' },
  streakNumber: { fontSize: 18, fontWeight: '700', color: Colors.text },
  streakLabel: { ...Typography.caption, marginTop: 2, color: Colors.textMuted },
  streakDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  section: { padding: Spacing.md, paddingTop: 0 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h4, marginBottom: Spacing.sm },
  sectionAction: { color: Colors.azure, fontSize: 14, fontWeight: '600' },
  modesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  modeCard: {
    width: '30.5%',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    alignItems: 'center',
    paddingVertical: 14,
  },
  modeIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  modeLabel: { fontSize: 12, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  modeDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 1 },
  deckScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  deckCard: {
    width: 140,
    marginRight: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  deckCardTop: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckCardBody: { padding: Spacing.sm },
  deckCardTitle: { ...Typography.label, color: Colors.text, fontWeight: '600', fontSize: 13 },
  deckCardMeta: { ...Typography.caption, marginTop: 2 },
  emptyDecks: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.azureMid,
    borderStyle: 'dashed',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  quickAction: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    paddingVertical: 12,
  },
  quickActionText: { fontSize: 13, fontWeight: '500', color: Colors.text },
});
