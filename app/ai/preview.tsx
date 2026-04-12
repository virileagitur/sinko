import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useMutation, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Id } from '../../convex/_generated/dataModel';

interface PreviewCard {
  front: string;
  back: string;
  selected: boolean;
}

export default function AIPreviewScreen() {
  const { deckId, storageId, fileName, cardType } = useLocalSearchParams<{
    deckId: string;
    storageId: string;
    fileName: string;
    cardType: string;
  }>();

  const importDocument = useAction(api.ai.importDocument);
  const getUrl = useMutation(api.storage.getUrl);

  const [cards, setCards] = useState<PreviewCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generated, setGenerated] = useState(false);
  const createBulk = useMutation(api.cards.bulkCreate);

  React.useEffect(() => {
    if (storageId && deckId) {
      generateCards();
    }
  }, []);

  const generateCards = async () => {
    setLoading(true);
    try {
      const fileUrl = await getUrl({ storageId: storageId as Id<'_storage'> });
      if (!fileUrl) throw new Error('Could not get file URL');

      const result = await importDocument({
        fileUrl,
        fileName: fileName ?? 'document',
        cardType: (cardType ?? 'basic') as any,
        deckId: deckId as Id<'decks'>,
      });

      setCards(result.cards.map((c) => ({ ...c, selected: true })));
      setGenerated(true);
    } catch (err: any) {
      Alert.alert('AI Import Failed', err?.message ?? 'Something went wrong. Please try again.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const toggleCard = (i: number) => {
    setCards((prev) => prev.map((c, idx) => idx === i ? { ...c, selected: !c.selected } : c));
  };

  const handleSave = async () => {
    const selected = cards.filter((c) => c.selected);
    if (selected.length === 0) {
      Alert.alert('Select cards', 'Please select at least one card to save.');
      return;
    }
    setSaving(true);
    try {
      await createBulk({
        deckId: deckId as Id<'decks'>,
        cards: selected.map(({ front, back }) => ({
          front,
          back,
          type: (cardType ?? 'basic') as any,
          tags: ['ai-generated'],
        })),
      });
      Alert.alert('Saved! 🎉', `${selected.length} cards added to your deck.`, [
        { text: 'Study Now', onPress: () => router.replace(`/study/flashcard?deckId=${deckId}` as any) },
        { text: 'Go to Deck', onPress: () => router.replace(`/deck/${deckId}` as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not save cards.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={Colors.azure} />
          <Text style={[Typography.h4, { marginTop: Spacing.lg, textAlign: 'center' }]}>
            AI is reading your document...
          </Text>
          <Text style={[Typography.bodySmall, { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
            Powered by Gemini 2.0 Flash
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedCount = cards.filter((c) => c.selected).length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>✦ AI Generated Cards</Text>
          <Text style={styles.headerSub}>
            {selectedCount} of {cards.length} selected
          </Text>
        </View>
        <TouchableOpacity
          style={styles.selectAllBtn}
          onPress={() => setCards((prev) => prev.map((c) => ({ ...c, selected: !cards.every((x) => x.selected) })))}
        >
          <Text style={{ color: Colors.azure, fontSize: 13, fontWeight: '600' }}>
            {cards.every((c) => c.selected) ? 'Deselect All' : 'Select All'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.hint}>
          Review the AI-generated cards and deselect any you don't want to keep.
        </Text>
        {cards.map((card, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.cardRow, !card.selected && styles.cardRowDeselected]}
            onPress={() => toggleCard(i)}
            activeOpacity={0.85}
          >
            <View style={[styles.checkbox, card.selected && styles.checkboxChecked]}>
              {card.selected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardFront}>{card.front}</Text>
              <View style={styles.cardDivider} />
              <Text style={styles.cardBack}>{card.back}</Text>
            </View>
          </TouchableOpacity>
        ))}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Bar */}
      <View style={styles.saveBar}>
        <Button
          title={`Add ${selectedCount} Card${selectedCount !== 1 ? 's' : ''} to Deck`}
          onPress={handleSave}
          loading={saving}
          fullWidth
          size="lg"
          disabled={selectedCount === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loadingState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.lilyDark },
  headerSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  selectAllBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.azureLight,
  },
  scroll: { flex: 1 },
  hint: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  cardRowDeselected: { opacity: 0.4 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxChecked: { backgroundColor: Colors.azure, borderColor: Colors.azure },
  cardContent: { flex: 1 },
  cardFront: { fontSize: 14, fontWeight: '600', color: Colors.text, lineHeight: 20 },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.sm },
  cardBack: { fontSize: 13, color: Colors.textMuted, lineHeight: 18 },
  saveBar: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
});
