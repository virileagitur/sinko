import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ImageBackground
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Spacing, Radius, Typography } from '../../constants/theme';
import { PlanBadge } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const STUDY_MODES = [
  { id: 'flashcard', icon: 'albums-outline', label: 'Flashcards', color: '#2563EB', desc: 'Classic flip cards' },
  { id: 'spaced', icon: 'timer-outline', label: 'Spaced Rep', color: '#7C3AED', desc: 'SM-2 algorithm' },
  { id: 'quiz', icon: 'help-circle-outline', label: 'Quiz', color: '#16A34A', desc: 'Multiple choice' },
  { id: 'matching', icon: 'git-compare-outline', label: 'Matching', color: '#D97706', desc: 'Match pairs' },
  { id: 'pomodoro', icon: 'time-outline', label: 'Pomodoro', color: '#DC2626', desc: '25 min sessions' },
  { id: 'write', icon: 'create-outline', label: 'Write', color: '#0891B2', desc: 'Type the answer' },
];

export default function HomeScreen() {
  const { colors, isDark } = useTheme();
  const profile = useQuery(api.users.getMyProfile);
  const myDecks = useQuery(api.decks.listMine, {});
  const recentSessions = useQuery(api.study.getRecentSessions);
  const dueCount = useQuery(api.cards.getDueCardsForUser) ?? 0;

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const styles = makeStyles(colors);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{greeting()},</Text>
            <Text style={styles.userName}>{profile?.name?.split(' ')[0] ?? 'Student'} 👋</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/ai/import')} style={styles.importBtn}>
            <Ionicons name="sparkles" size={18} color="#fff" />
            <Text style={styles.importBtnText}>AI Import</Text>
          </TouchableOpacity>
        </View>

        {/* Streak Banner */}
        <View style={styles.streakBanner}>
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>🔥 {profile?.streakDays ?? 0}</Text>
            <Text style={styles.streakLabel}>Day Streak</Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakNumber}>📚 {myDecks?.length ?? 0}</Text>
            <Text style={styles.streakLabel}>Decks</Text>
          </View>
          <View style={styles.streakDivider} />
          <TouchableOpacity
            style={styles.streakItem}
            onPress={() => dueCount > 0 && router.push('/mydecks' as any)}
          >
            <Text style={[styles.streakNumber, dueCount > 0 && { color: colors.error }]}>
              ⚡ {dueCount}
            </Text>
            <Text style={[styles.streakLabel, dueCount > 0 && { color: colors.error }]}>Due Today</Text>
          </TouchableOpacity>
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
                    router.push(`/study/${mode.id}?deckId=${myDecks[0]._id}` as any);
                  } else {
                    router.push('/discover');
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.modeIcon, { backgroundColor: mode.color + '20' }]}>
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
                  {deck.backgroundImageUrl ? (
                    <ImageBackground
                      source={{ uri: deck.backgroundImageUrl }}
                      style={styles.deckCardTop}
                      imageStyle={{ borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg }}
                    >
                      <View style={{ backgroundColor: 'rgba(0,0,0,0.35)', ...StyleSheet.absoluteFillObject, borderTopLeftRadius: Radius.lg, borderTopRightRadius: Radius.lg }} />
                      <Text style={{ fontSize: 28 }}>{deck.iconEmoji ?? '📚'}</Text>
                    </ImageBackground>
                  ) : (
                    <View style={[styles.deckCardTop, { backgroundColor: (deck.colorTag ?? colors.azure) + '25' }]}>
                      <Text style={{ fontSize: 28 }}>{deck.iconEmoji ?? '📚'}</Text>
                    </View>
                  )}
                  <View style={styles.deckCardBody}>
                    <Text style={styles.deckCardTitle} numberOfLines={1}>{deck.title}</Text>
                    <Text style={styles.deckCardMeta}>{deck.cardCount} cards</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <TouchableOpacity style={styles.emptyDecks} onPress={() => router.push('/discover')}>
              <Ionicons name="add-circle-outline" size={32} color={colors.azure} />
              <Text style={[Typography.body, { color: colors.azure, marginTop: Spacing.sm }]}>
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
              <Ionicons name="cloud-upload-outline" size={22} color={colors.azure} />
              <Text style={styles.quickActionText}>Import Document</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/discover')}>
              <Ionicons name="compass-outline" size={22} color={colors.azure} />
              <Text style={styles.quickActionText}>Find Courses</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/community')}>
              <Ionicons name="people-outline" size={22} color={colors.azure} />
              <Text style={styles.quickActionText}>Community</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/settings/subscription')}>
              <Ionicons name="diamond-outline" size={22} color={colors.lilyDark} />
              <Text style={styles.quickActionText}>Upgrade Plan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1 },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: Spacing.md,
      paddingTop: Spacing.sm,
    },
    greeting: { fontSize: 13, color: colors.textMuted },
    userName: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 2 },
    importBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.azure,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: Radius.full,
    },
    importBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
    streakBanner: {
      flexDirection: 'row',
      margin: Spacing.md,
      marginTop: 0,
      backgroundColor: colors.white,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.md,
    },
    streakItem: { flex: 1, alignItems: 'center' },
    streakNumber: { fontSize: 18, fontWeight: '700', color: colors.text },
    streakLabel: { fontSize: 11, marginTop: 2, color: colors.textMuted },
    streakDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: Spacing.sm },
    section: { padding: Spacing.md, paddingTop: 0 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
    sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: Spacing.sm },
    sectionAction: { color: colors.azure, fontSize: 14, fontWeight: '600' },
    modesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    modeCard: {
      width: '30.5%',
      backgroundColor: colors.white,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.sm,
      alignItems: 'center',
      paddingVertical: 14,
    },
    modeIcon: {
      width: 44, height: 44, borderRadius: Radius.md,
      alignItems: 'center', justifyContent: 'center', marginBottom: 6,
    },
    modeLabel: { fontSize: 12, fontWeight: '600', color: colors.text, textAlign: 'center' },
    modeDesc: { fontSize: 10, color: colors.textMuted, textAlign: 'center', marginTop: 1 },
    deckScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
    deckCard: {
      width: 140,
      marginRight: Spacing.sm,
      backgroundColor: colors.white,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    deckCardTop: {
      height: 72,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deckCardBody: { padding: Spacing.sm },
    deckCardTitle: { fontSize: 13, fontWeight: '600', color: colors.text },
    deckCardMeta: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
    emptyDecks: {
      backgroundColor: colors.white,
      borderRadius: Radius.lg,
      borderWidth: 1.5,
      borderColor: colors.azure + '60',
      borderStyle: 'dashed',
      padding: Spacing.xl,
      alignItems: 'center',
    },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
    quickAction: {
      flex: 1,
      minWidth: '45%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.white,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: Spacing.sm,
      paddingVertical: 12,
    },
    quickActionText: { fontSize: 13, fontWeight: '500', color: colors.text },
  });
}
