import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function FlashcardScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const deck = useQuery(api.decks.getById, { deckId: deckId as any });
  const cards = useQuery(api.cards.listByDeck, { deckId: deckId as any });

  const [currentIdx, setCurrentIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [done, setDone] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const startSession = useMutation(api.study.startSession);
  const endSession = useMutation(api.study.endSession);
  const [sessionId, setSessionId] = useState<string | null>(null);

  React.useEffect(() => {
    if (deckId) {
      startSession({ deckId: deckId as any, mode: 'flashcard' }).then(setSessionId);
    }
  }, [deckId]);

  const flip = () => {
    Animated.spring(flipAnim, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 40,
    }).start();
    setFlipped(!flipped);
  };

  const next = () => {
    if (!cards) return;
    setFlipped(false);
    flipAnim.setValue(0);
    setReviewedCount((c) => c + 1);
    if (currentIdx + 1 >= cards.length) {
      setDone(true);
      if (sessionId) {
        endSession({ sessionId: sessionId as any, cardsReviewed: cards.length });
      }
    } else {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const prev = () => {
    if (currentIdx === 0) return;
    setFlipped(false);
    flipAnim.setValue(0);
    setCurrentIdx(currentIdx - 1);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  if (!cards || cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>📭</Text>
          <Text style={[Typography.h3, { textAlign: 'center', marginTop: Spacing.md }]}>No cards in this deck</Text>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: Spacing.lg }}>
            <Text style={{ color: Colors.azure, fontWeight: '600' }}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (done) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.doneState}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>🎉</Text>
          <Text style={[Typography.h2, { textAlign: 'center', marginTop: Spacing.lg }]}>
            Session complete!
          </Text>
          <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
            You reviewed {reviewedCount} cards from {deck?.title}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 16 }}>Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const card = cards[currentIdx];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.progress}>
          <View style={[styles.progressBar, { width: `${((currentIdx) / cards.length) * 100}%` }]} />
        </View>
        <Text style={[Typography.bodySmall, { color: Colors.textMuted }]}>
          {currentIdx + 1}/{cards.length}
        </Text>
      </View>

      <Text style={styles.deckName}>{deck?.title}</Text>
      <Text style={[Typography.bodySmall, { color: Colors.textMuted, textAlign: 'center', marginBottom: Spacing.md }]}>
        Tap card to flip
      </Text>

      {/* Flip Card */}
      <TouchableOpacity onPress={flip} activeOpacity={0.95} style={styles.cardTouchable}>
        {/* Front */}
        <Animated.View
          style={[
            styles.card,
            { transform: [{ rotateY: frontInterpolate }] },
            { backfaceVisibility: 'hidden' },
          ]}
        >
          <Text style={styles.cardSide}>QUESTION</Text>
          <Text style={styles.cardText}>{card.front}</Text>
          {card.frontImageUrl && (
            <View style={styles.cardImage}>
              <Text style={Typography.bodySmall}>📎 Image attached</Text>
            </View>
          )}
        </Animated.View>

        {/* Back */}
        <Animated.View
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ rotateY: backInterpolate }] },
            { backfaceVisibility: 'hidden' },
          ]}
        >
          <Text style={[styles.cardSide, { color: Colors.azure }]}>ANSWER</Text>
          <Text style={styles.cardText}>{card.back}</Text>
        </Animated.View>
      </TouchableOpacity>

      {/* Navigation */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={[styles.navBtn, currentIdx === 0 && { opacity: 0.3 }]}
          onPress={prev}
          disabled={currentIdx === 0}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          <Text style={styles.nextBtnText}>
            {currentIdx + 1 === cards.length ? 'Finish' : 'Next'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
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
    backgroundColor: Colors.azure,
    borderRadius: Radius.full,
  },
  deckName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardTouchable: {
    flex: 1,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardBack: {
    backgroundColor: Colors.azureLight,
    borderColor: Colors.azureMid,
  },
  cardSide: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textLight,
    marginBottom: Spacing.md,
  },
  cardText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 30,
  },
  cardImage: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.md,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
  },
  navBtn: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.azure,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  nextBtnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  doneState: {
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
