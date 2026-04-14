import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SpacedRepScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();

  // "all" is a placeholder from the home screen due-count tap — not a real deck ID
  const isValidDeckId = deckId && deckId !== 'all';

  const dueCards = useQuery(
    api.cards.getDueCards,
    isValidDeckId ? { deckId: deckId as any } : 'skip'
  );
  const reviewCard = useMutation(api.cards.reviewCard);
  const startSession = useMutation(api.study.startSession);
  const endSession = useMutation(api.study.endSession);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewed, setReviewed] = useState(0);
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  React.useEffect(() => {
    if (isValidDeckId) {
      startSession({ deckId: deckId as any, mode: 'spaced' }).then(setSessionId);
    }
  }, []);

  const handleRate = async (quality: number) => {
    if (!dueCards || currentIdx >= dueCards.length) return;
    const card = dueCards[currentIdx];
    await reviewCard({ cardId: card._id, quality });
    setReviewed((r) => r + 1);
    setRevealed(false);
    if (currentIdx + 1 >= dueCards.length) {
      setDone(true);
      if (sessionId) endSession({ sessionId: sessionId as any, cardsReviewed: reviewed + 1 });
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const QUALITY_BTNS = [
    { label: 'Again', quality: 0, color: Colors.again, icon: '😵' },
    { label: 'Hard', quality: 1, color: Colors.hard, icon: '😰' },
    { label: 'Good', quality: 2, color: Colors.good, icon: '🙂' },
    { label: 'Easy', quality: 3, color: Colors.easy, icon: '😄' },
  ];

  if (!isValidDeckId) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ fontSize: 64 }}>📚</Text>
          <Text style={[Typography.h3, { textAlign: 'center', marginTop: Spacing.lg }]}>
            Pick a Deck
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
            Open a specific deck and tap "Spaced Rep" to review your due cards.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={{ color: Colors.white, fontWeight: '600' }}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!dueCards || dueCards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.center}>
          <Text style={{ fontSize: 64 }}>✅</Text>
          <Text style={[Typography.h3, { textAlign: 'center', marginTop: Spacing.lg }]}>
            All caught up!
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
            No cards are due for review right now. Come back later or study from the full deck.
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={{ color: Colors.white, fontWeight: '600' }}>Back to Deck</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 64 }}>🎯</Text>
          <Text style={[Typography.h2, { textAlign: 'center', marginTop: Spacing.lg }]}>Review done!</Text>
          <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
            {reviewed} cards reviewed. Great job!
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={{ color: Colors.white, fontWeight: '600' }}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const card = dueCards[currentIdx];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Spaced Repetition</Text>
          <Text style={styles.headerSub}>{currentIdx + 1} of {dueCards.length} due</Text>
        </View>
        <View style={[styles.diffBadge, { backgroundColor: Colors.lilyLight }]}>
          <Text style={{ color: Colors.lilyDark, fontSize: 12, fontWeight: '700' }}>
            ×{card.easeFactor.toFixed(1)}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Question */}
        <View style={styles.questionCard}>
          <Text style={styles.cardSide}>QUESTION</Text>
          <Text style={styles.questionText}>{card.front}</Text>
        </View>

        {/* Answer */}
        {revealed ? (
          <View style={styles.answerCard}>
            <Text style={[styles.cardSide, { color: Colors.azure }]}>ANSWER</Text>
            <Text style={styles.answerText}>{card.back}</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.revealBtn} onPress={() => setRevealed(true)}>
            <Text style={styles.revealBtnText}>Show Answer</Text>
          </TouchableOpacity>
        )}

        {/* Rating buttons */}
        {revealed && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingHint}>How well did you remember?</Text>
            <View style={styles.ratingRow}>
              {QUALITY_BTNS.map(({ label, quality, color, icon }) => (
                <TouchableOpacity
                  key={quality}
                  style={[styles.ratingBtn, { borderColor: color }]}
                  onPress={() => handleRate(quality)}
                  activeOpacity={0.8}
                >
                  <Text style={{ fontSize: 20 }}>{icon}</Text>
                  <Text style={[styles.ratingLabel, { color }]}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  backBtn: { padding: Spacing.md },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '600', color: Colors.text, textAlign: 'center' },
  headerSub: { ...Typography.caption, color: Colors.textMuted, textAlign: 'center' },
  diffBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  scroll: { flex: 1 },
  questionCard: {
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardSide: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  questionText: { fontSize: 20, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 28 },
  revealBtn: {
    margin: Spacing.md,
    backgroundColor: Colors.azure,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  revealBtnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  answerCard: {
    margin: Spacing.md,
    backgroundColor: Colors.azureLight,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.azureMid,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  answerText: { fontSize: 18, fontWeight: '500', color: Colors.text, textAlign: 'center', lineHeight: 26 },
  ratingSection: { padding: Spacing.md },
  ratingHint: { ...Typography.bodySmall, color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.sm },
  ratingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    backgroundColor: Colors.white,
  },
  ratingLabel: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  doneBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.azure,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
});
