import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const STUDY_MODES = [
  { id: 'flashcard', label: 'Flashcards', icon: 'albums-outline' },
  { id: 'spaced', label: 'Spaced Rep', icon: 'timer-outline' },
  { id: 'quiz', label: 'Quiz', icon: 'help-circle-outline' },
  { id: 'matching', label: 'Matching', icon: 'git-compare-outline' },
  { id: 'pomodoro', label: 'Pomodoro', icon: 'time-outline' },
];

export default function DeckDetailScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const deck = useQuery(api.decks.getById, { deckId: deckId as any });
  const cards = useQuery(api.cards.listByDeck, { deckId: deckId as any });
  const deleteDeck = useMutation(api.decks.remove);
  const createCard = useMutation(api.cards.create);

  const handleAddCard = () => {
    Alert.alert('Add Card', 'Enter question and answer', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Open Editor', onPress: () => {
          router.push(`/card/new/edit?deckId=${deckId}`);
        }
      }
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Deck', `Are you sure you want to delete "${deck?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          await deleteDeck({ deckId: deckId as any });
          router.back();
        }
      }
    ]);
  };

  if (!deck) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Deck Info */}
        <View style={styles.deckHeader}>
          <View style={styles.deckHeaderLeft}>
            <View style={[styles.deckIcon, { backgroundColor: deck.colorTag ?? Colors.azureLight }]}>
              <Ionicons name="albums" size={28} color={Colors.azure} />
            </View>
            <View>
              <Text style={styles.deckTitle}>{deck.title}</Text>
              {deck.description && (
                <Text style={styles.deckDesc}>{deck.description}</Text>
              )}
              <Text style={styles.deckMeta}>
                {deck.cardCount} cards · {deck.isPublic ? '🌍 Public' : '🔒 Private'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
          </TouchableOpacity>
        </View>

        {/* Study Modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Study this Deck</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
            {STUDY_MODES.map((mode) => (
              <TouchableOpacity
                key={mode.id}
                style={styles.modeChip}
                onPress={() => router.push(`/study/${mode.id}?deckId=${deckId}`)}
              >
                <Ionicons name={mode.icon as any} size={18} color={Colors.azure} />
                <Text style={styles.modeChipText}>{mode.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* AI Import */}
        <TouchableOpacity
          style={styles.aiImportBanner}
          onPress={() => router.push(`/ai/import?deckId=${deckId}`)}
        >
          <Ionicons name="sparkles" size={20} color={Colors.lilyDark} />
          <View style={{ flex: 1 }}>
            <Text style={styles.aiImportTitle}>Import with AI</Text>
            <Text style={styles.aiImportSub}>Upload a document and auto-generate cards</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.lilyDark} />
        </TouchableOpacity>

        {/* Cards */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Cards ({cards?.length ?? 0})</Text>
            <TouchableOpacity style={styles.addCardBtn} onPress={handleAddCard}>
              <Ionicons name="add" size={16} color={Colors.white} />
              <Text style={styles.addCardBtnText}>Add Card</Text>
            </TouchableOpacity>
          </View>

          {cards && cards.length > 0 ? (
            cards.map((card, idx) => (
              <View key={card._id} style={styles.cardRow}>
                <Text style={styles.cardIdx}>{idx + 1}</Text>
                <View style={styles.cardContent}>
                  <Text style={styles.cardFront}>{card.front}</Text>
                  <Text style={styles.cardBack}>{card.back}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => router.push(`/card/${card._id}/edit`)}
                  style={styles.editCardBtn}
                >
                  <Ionicons name="create-outline" size={16} color={Colors.azure} />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={styles.emptyCards}>
              <Ionicons name="add-circle-outline" size={40} color={Colors.textLight} />
              <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
                No cards yet. Add manually or import with AI.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  deckHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  deckHeaderLeft: { flexDirection: 'row', gap: Spacing.md, flex: 1 },
  deckIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deckTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  deckDesc: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2, maxWidth: 200 },
  deckMeta: { ...Typography.caption, color: Colors.azure, marginTop: 4 },
  deleteBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
  },
  section: { padding: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h4 },
  modeScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  modeChipText: { fontSize: 13, fontWeight: '600', color: Colors.azure },
  aiImportBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.md,
    marginTop: 0,
    backgroundColor: Colors.lilyLight,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.lily,
    padding: Spacing.md,
  },
  aiImportTitle: { fontSize: 14, fontWeight: '600', color: Colors.lilyDark },
  aiImportSub: { ...Typography.caption, color: Colors.lilyDark + 'AA', marginTop: 2 },
  addCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.azure,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  addCardBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardIdx: {
    width: 24,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textLight,
  },
  cardContent: { flex: 1 },
  cardFront: { fontSize: 13, fontWeight: '600', color: Colors.text },
  cardBack: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  editCardBtn: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.azureLight,
  },
  emptyCards: {
    padding: Spacing.xl,
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
});
