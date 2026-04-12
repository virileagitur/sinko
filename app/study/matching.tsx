import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Card = { _id: string; front: string; back: string };
type TileState = 'idle' | 'selected' | 'matched' | 'wrong';

interface Tile {
  id: string;
  cardId: string;
  text: string;
  side: 'front' | 'back';
  state: TileState;
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export default function MatchingScreen() {
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const cards = useQuery(api.cards.listByDeck, { deckId: deckId as any });
  const startSession = useMutation(api.study.startSession);
  const endSession = useMutation(api.study.endSession);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [moves, setMoves] = useState(0);
  const [done, setDone] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (cards && cards.length > 0 && !initialized) {
      initGame(cards.slice(0, 6));
      setInitialized(true);
      if (deckId) {
        startSession({ deckId: deckId as any, mode: 'matching' }).then(setSessionId);
      }
    }
  }, [cards]);

  const initGame = (subset: Card[]) => {
    const frontTiles: Tile[] = subset.map((c) => ({
      id: `front-${c._id}`,
      cardId: c._id,
      text: c.front,
      side: 'front',
      state: 'idle',
    }));
    const backTiles: Tile[] = subset.map((c) => ({
      id: `back-${c._id}`,
      cardId: c._id,
      text: c.back,
      side: 'back',
      state: 'idle',
    }));
    setTiles(shuffle([...frontTiles, ...backTiles]));
    setSelected(null);
    setMatchedCount(0);
    setMoves(0);
    setDone(false);
  };

  const shakeTiles = (ids: string[]) => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
    ]).start(() => {
      setTiles((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, state: 'idle' } : t))
      );
      setSelected(null);
    });
  };

  const handleTilePress = (tileId: string) => {
    const tile = tiles.find((t) => t.id === tileId);
    if (!tile || tile.state === 'matched' || tile.state === 'selected') return;

    if (!selected) {
      setSelected(tileId);
      setTiles((prev) =>
        prev.map((t) => (t.id === tileId ? { ...t, state: 'selected' } : t))
      );
      return;
    }

    const firstTile = tiles.find((t) => t.id === selected)!;
    setMoves((m) => m + 1);

    if (firstTile.cardId === tile.cardId && firstTile.side !== tile.side) {
      // Match!
      const newTiles = tiles.map((t) =>
        t.id === selected || t.id === tileId ? { ...t, state: 'matched' as TileState } : t
      );
      setTiles(newTiles);
      setSelected(null);
      const newMatched = matchedCount + 1;
      setMatchedCount(newMatched);
      if (newMatched === tiles.length / 2) {
        setDone(true);
        if (sessionId) endSession({ sessionId: sessionId as any, cardsReviewed: newMatched });
      }
    } else {
      // Wrong
      setTiles((prev) =>
        prev.map((t) =>
          t.id === selected || t.id === tileId ? { ...t, state: 'wrong' as TileState } : t
        )
      );
      setTimeout(() => shakeTiles([selected, tileId]), 100);
      setSelected(null);
    }
  };

  const tileColor = (state: TileState) => {
    switch (state) {
      case 'selected': return { bg: Colors.azureLight, border: Colors.azure };
      case 'matched': return { bg: '#F0FDF4', border: Colors.success };
      case 'wrong': return { bg: '#FEF2F2', border: Colors.error };
      default: return { bg: Colors.white, border: Colors.border };
    }
  };

  if (!cards || cards.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48 }}>📭</Text>
          <Text style={[Typography.h4, { textAlign: 'center', marginTop: Spacing.md }]}>
            No cards in this deck
          </Text>
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
        <View style={styles.center}>
          <Text style={{ fontSize: 64 }}>🏆</Text>
          <Text style={[Typography.h2, { textAlign: 'center', marginTop: Spacing.lg }]}>
            All matched!
          </Text>
          <Text style={[Typography.body, { color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm }]}>
            Completed in {moves} moves
          </Text>
          <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xl }}>
            <TouchableOpacity
              style={styles.outlineBtn}
              onPress={() => cards && initGame(cards.slice(0, 6))}
            >
              <Text style={{ color: Colors.azure, fontWeight: '600' }}>Play Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.solidBtn} onPress={() => router.back()}>
              <Text style={{ color: Colors.white, fontWeight: '600' }}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Matching</Text>
        <View style={styles.movesChip}>
          <Text style={styles.movesText}>{moves} moves</Text>
        </View>
      </View>

      <Text style={styles.subtitle}>
        Match each term with its definition — {matchedCount}/{tiles.length / 2} matched
      </Text>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${(matchedCount / (tiles.length / 2)) * 100}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
        {tiles.map((tile) => {
          const colors = tileColor(tile.state);
          const isWrong = tile.state === 'wrong';
          return (
            <Animated.View
              key={tile.id}
              style={[
                styles.tileWrapper,
                isWrong && { transform: [{ translateX: shakeAnim }] },
              ]}
            >
              <TouchableOpacity
                style={[styles.tile, { backgroundColor: colors.bg, borderColor: colors.border }]}
                onPress={() => handleTilePress(tile.id)}
                activeOpacity={tile.state === 'matched' ? 1 : 0.8}
                disabled={tile.state === 'matched'}
              >
                <Text style={styles.tileSide}>
                  {tile.side === 'front' ? 'TERM' : 'DEF'}
                </Text>
                <Text style={styles.tileText} numberOfLines={4}>
                  {tile.text}
                </Text>
                {tile.state === 'matched' && (
                  <Ionicons name="checkmark-circle" size={18} color={Colors.success} style={styles.tileCheck} />
                )}
              </TouchableOpacity>
            </Animated.View>
          );
        })}
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
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: Colors.text },
  movesChip: {
    backgroundColor: Colors.azureLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  movesText: { fontSize: 13, fontWeight: '600', color: Colors.azure },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.md,
    borderRadius: Radius.full,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: Radius.full,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.md,
    gap: Spacing.sm,
    paddingBottom: 100,
  },
  tileWrapper: { width: '47%' },
  tile: {
    borderWidth: 1.5,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tileSide: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textLight,
    marginBottom: 6,
  },
  tileText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
    lineHeight: 18,
  },
  tileCheck: { position: 'absolute', top: 6, right: 6 },
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
