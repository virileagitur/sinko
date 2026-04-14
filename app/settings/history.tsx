import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const MODE_ICONS: Record<string, string> = {
  flashcard: 'albums-outline',
  pomodoro: 'timer-outline',
  quiz: 'help-circle-outline',
  matching: 'git-compare-outline',
  spaced: 'time-outline',
  write: 'create-outline',
};

const MODE_COLORS: Record<string, string> = {
  flashcard: Colors.azure,
  pomodoro: '#DC2626',
  quiz: Colors.lilyDark,
  matching: '#0891B2',
  spaced: '#16A34A',
  write: '#D97706',
};

function formatDuration(start: number, end?: number) {
  if (!end) return '—';
  const secs = Math.floor((end - start) / 1000);
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

function formatDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function groupByDate(sessions: any[]) {
  const map: Record<string, any[]> = {};
  for (const s of sessions) {
    const key = formatDate(s.startedAt);
    if (!map[key]) map[key] = [];
    map[key].push(s);
  }
  return Object.entries(map).map(([date, items]) => ({ date, items }));
}

export default function StudyHistoryScreen() {
  const sessions = useQuery(api.study.listMySessions);
  const grouped = sessions ? groupByDate(sessions) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study History</Text>
        <View style={{ width: 30 }} />
      </View>

      {sessions === undefined ? (
        <View style={styles.center}><Text style={{ color: Colors.textMuted }}>Loading...</Text></View>
      ) : sessions.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="time-outline" size={56} color={Colors.textLight} />
          <Text style={styles.emptyTitle}>No sessions yet</Text>
          <Text style={styles.emptySub}>Start studying to build your history</Text>
        </View>
      ) : (
        <FlatList
          data={grouped}
          keyExtractor={(item) => item.date}
          contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}
          renderItem={({ item }) => (
            <View style={{ marginBottom: Spacing.lg }}>
              <Text style={styles.dateLabel}>{item.date}</Text>
              {item.items.map((s: any) => (
                <View key={s._id} style={styles.sessionCard}>
                  <View style={[styles.modeIcon, { backgroundColor: (MODE_COLORS[s.mode] ?? Colors.azure) + '20' }]}>
                    <Ionicons name={MODE_ICONS[s.mode] as any ?? 'book-outline'} size={20} color={MODE_COLORS[s.mode] ?? Colors.azure} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deckName} numberOfLines={1}>{s.deckIcon} {s.deckTitle}</Text>
                    <Text style={styles.sessionMeta}>
                      {s.mode.charAt(0).toUpperCase() + s.mode.slice(1)} · {s.cardsReviewed} cards · {formatDuration(s.startedAt, s.endedAt)}
                    </Text>
                  </View>
                  {s.score !== undefined && (
                    <View style={styles.scoreBadge}>
                      <Text style={styles.scoreText}>{Math.round(s.score)}%</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          )}
        />
      )}
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  emptySub: { ...Typography.bodySmall, color: Colors.textMuted },
  dateLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm, marginLeft: 4 },
  sessionCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  modeIcon: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  deckName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  sessionMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  scoreBadge: { backgroundColor: Colors.azureLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  scoreText: { fontSize: 13, fontWeight: '700', color: Colors.azure },
});
