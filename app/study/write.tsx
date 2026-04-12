import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WriteScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const cards = useQuery(api.cards.listByDeck, { deckId: deckId as any });
  const startSession = useMutation(api.study.startSession);
  const endSession = useMutation(api.study.endSession);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [input, setInput] = useState('');
  const [checked, setChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hints, setHints] = useState(0);

  React.useEffect(() => {
    if (deckId) {
      startSession({ deckId: deckId as any, mode: 'write' }).then(setSessionId);
    }
  }, []);

  if (!cards || cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={[Typography.h4, { textAlign: 'center', marginTop: Spacing.md }]}>No cards in this deck</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.lg }}>
            <Text style={{ color: Colors.azure, fontWeight: '600' }}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    const pct = Math.round((score / cards.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>
            {pct >= 80 ? '🎉' : pct >= 50 ? '📝' : '💪'}
          </Text>
          <Text style={[Typography.h2, { textAlign: 'center', marginTop: Spacing.lg }]}>
            Write Test Complete!
          </Text>
          <Text style={[Typography.h3, { color: Colors.azure, textAlign: 'center', marginTop: Spacing.sm }]}>
            {score} / {cards.length} correct
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.textMuted, textAlign: 'center' }]}>
            {pct}% accuracy
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl }}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => { setCurrentIdx(0); setInput(''); setChecked(false); setScore(0); setDone(false); setHints(0); }}
            >
              <Text style={{ color: Colors.azure, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.solidBtn} onPress={() => router.back()}>
              <Text style={{ color: Colors.white, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const card = cards[currentIdx];

  const normalize = (s: string) =>
    s.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

  const checkAnswer = () => {
    if (!input.trim()) return;
    const correct = normalize(card.back).split(' ');
    const given = normalize(input).split(' ');
    const overlap = given.filter((w) => correct.includes(w)).length;
    const pct = overlap / correct.length;
    const ok = pct >= 0.6; // 60% word overlap = correct
    setIsCorrect(ok);
    setChecked(true);
    if (ok) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setInput('');
    setChecked(false);
    setIsCorrect(false);
    setHints(0);
    if (currentIdx + 1 >= cards.length) {
      setDone(true);
      if (sessionId) endSession({ sessionId: sessionId as any, cardsReviewed: cards.length });
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const revealHint = () => {
    const words = card.back.split(' ');
    setInput(words.slice(0, hints + 1).join(' '));
    setHints((h) => h + 1);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentIdx / cards.length) * 100}%` }]} />
        </View>
        <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>
          {score}/{currentIdx} ✓
        </Text>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: Spacing.md, paddingBottom: 100 }}>
        <Text style={styles.questionNum}>Question {currentIdx + 1} of {cards.length}</Text>

        {/* Question card */}
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>TYPE THE ANSWER</Text>
          <Text style={styles.questionText}>{card.front}</Text>
        </View>

        {/* Answer input */}
        <View style={[
          styles.inputCard,
          checked && { borderColor: isCorrect ? Colors.success : Colors.error },
        ]}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer here..."
            placeholderTextColor={Colors.textLight}
            multiline
            editable={!checked}
            autoFocus
          />
        </View>

        {/* Hint button */}
        {!checked && (
          <TouchableOpacity style={styles.hintBtn} onPress={revealHint}>
            <Ionicons name="bulb-outline" size={16} color={Colors.warning} />
            <Text style={styles.hintText}>Show hint ({hints} used)</Text>
          </TouchableOpacity>
        )}

        {/* Feedback */}
        {checked && (
          <View style={[styles.feedbackCard, { backgroundColor: isCorrect ? '#F0FDF4' : '#FEF2F2', borderColor: isCorrect ? Colors.success : Colors.error }]}>
            <View style={styles.feedbackRow}>
              <Ionicons
                name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                size={22}
                color={isCorrect ? Colors.success : Colors.error}
              />
              <Text style={[styles.feedbackTitle, { color: isCorrect ? Colors.success : Colors.error }]}>
                {isCorrect ? 'Correct!' : 'Not quite'}
              </Text>
            </View>
            {!isCorrect && (
              <>
                <Text style={styles.correctLabel}>Correct answer:</Text>
                <Text style={styles.correctAnswer}>{card.back}</Text>
              </>
            )}
          </View>
        )}

        {/* Actions */}
        {!checked ? (
          <TouchableOpacity
            style={[styles.checkBtn, !input.trim() && { opacity: 0.4 }]}
            onPress={checkAnswer}
            disabled={!input.trim()}
          >
            <Text style={styles.checkBtnText}>Check Answer</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextBtnText}>
              {currentIdx + 1 === cards.length ? 'See Results' : 'Next Question'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.azure,
    borderRadius: Radius.full,
  },
  scroll: { flex: 1 },
  questionNum: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
  },
  questionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 28,
  },
  inputCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 2,
    borderColor: Colors.azure,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    minHeight: 100,
  },
  textInput: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  hintText: { fontSize: 13, color: Colors.warning, fontWeight: '500' },
  feedbackCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  feedbackRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  feedbackTitle: { fontSize: 16, fontWeight: '700' },
  correctLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: 4 },
  correctAnswer: { fontSize: 15, fontWeight: '500', color: Colors.text, lineHeight: 22 },
  checkBtn: {
    backgroundColor: Colors.azure,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    alignItems: 'center',
  },
  checkBtnText: { color: Colors.white, fontWeight: '700', fontSize: 16 },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.azure,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  nextBtnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  outlineBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 13,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.azure,
  },
  solidBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: 13,
    borderRadius: Radius.full,
    backgroundColor: Colors.azure,
  },
});
