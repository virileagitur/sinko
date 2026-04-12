import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuizScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const cards = useQuery(api.cards.listByDeck, { deckId: deckId as any });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (!cards || cards.length < 2) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={[Typography.h4, { textAlign: 'center', padding: Spacing.xl }]}>
          Need at least 2 cards for quiz mode.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ alignItems: 'center' }}>
          <Text style={{ color: Colors.azure }}>← Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const generateOptions = (correctIdx: number) => {
    const correct = cards[correctIdx];
    const others = cards.filter((_, i) => i !== correctIdx);
    const shuffled = others.sort(() => Math.random() - 0.5).slice(0, 3);
    const all = [...shuffled, correct].sort(() => Math.random() - 0.5);
    return { options: all.map((c) => c.back), correctAnswer: correct.back };
  };

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneState}>
          <Text style={{ fontSize: 64 }}>🏆</Text>
          <Text style={[Typography.h2, { textAlign: 'center', marginTop: Spacing.lg }]}>
            Quiz Complete!
          </Text>
          <Text style={[Typography.h3, { color: Colors.azure, textAlign: 'center', marginTop: Spacing.sm }]}>
            {score} / {cards.length}
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.textMuted, textAlign: 'center' }]}>
            {Math.round((score / cards.length) * 100)}% accuracy
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { options, correctAnswer } = generateOptions(currentIdx);
  const card = cards[currentIdx];

  const handleSelect = (optIdx: number) => {
    if (selected !== null) return;
    setSelected(optIdx);
    if (options[optIdx] === correctAnswer) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setSelected(null);
    if (currentIdx + 1 >= cards.length) {
      setDone(true);
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: `${(currentIdx / cards.length) * 100}%` }]} />
        </View>
        <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>
          {score}/{currentIdx} ✓
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.questionNum}>Question {currentIdx + 1} of {cards.length}</Text>
        <View style={styles.questionCard}>
          <Text style={styles.questionText}>{card.front}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {options.map((opt, i) => {
            const isCorrect = opt === correctAnswer;
            const isSelected = selected === i;
            let bgColor = Colors.white;
            let borderColor = Colors.border;

            if (selected !== null) {
              if (isCorrect) { bgColor = '#F0FDF4'; borderColor = Colors.success; }
              else if (isSelected) { bgColor = '#FEF2F2'; borderColor = Colors.error; }
            }

            return (
              <TouchableOpacity
                key={i}
                style={[styles.option, { backgroundColor: bgColor, borderColor }]}
                onPress={() => handleSelect(i)}
                activeOpacity={0.85}
                disabled={selected !== null}
              >
                <View style={[styles.optionLetter, { borderColor }]}>
                  <Text style={[styles.optionLetterText, { color: borderColor }]}>
                    {['A', 'B', 'C', 'D'][i]}
                  </Text>
                </View>
                <Text style={styles.optionText}>{opt}</Text>
                {selected !== null && isCorrect && (
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                )}
                {selected !== null && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={20} color={Colors.error} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {selected !== null && (
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progress: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: Radius.full,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, paddingBottom: 100 },
  questionNum: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm },
  questionCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    minHeight: 120,
    justifyContent: 'center',
  },
  questionText: { fontSize: 18, fontWeight: '600', color: Colors.text, textAlign: 'center', lineHeight: 26 },
  optionsContainer: { gap: Spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  optionLetter: {
    width: 30,
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLetterText: { fontSize: 13, fontWeight: '700' },
  optionText: { flex: 1, fontSize: 15, color: Colors.text },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.azure,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  nextBtnText: { color: Colors.white, fontWeight: '600', fontSize: 16 },
  doneState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  doneBtn: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.azure,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
});
