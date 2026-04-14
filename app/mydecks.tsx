import React from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Pressable, Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Spacing, Radius, Typography } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

const DECK_COLORS = [
  '#2563EB', '#7C3AED', '#DC2626', '#16A34A',
  '#D97706', '#0891B2', '#BE185D', '#64748B',
];

const DECK_ICONS = [
  '📚', '🧪', '🎯', '🧠', '🔬', '📐', '💡', '🎨',
  '🌍', '🏛️', '⚗️', '📊', '🎵', '💻', '🔭', '🩺',
  '📝', '🌿', '⚙️', '🎓',
];

type TabId = 'active' | 'archived';

export default function MyDecksScreen() {
  const { colors } = useTheme();
  const activeDecks   = useQuery(api.decks.listMine, {});
  const archivedDecks = useQuery(api.decks.listMine, { includeArchived: true });
  const updateMeta    = useMutation(api.decks.updateMeta);
  const unarchiveDeck = useMutation(api.decks.unarchiveDeck);
  const gates         = useQuery(api.users.getPlanGates);

  const [tab, setTab]                 = React.useState<TabId>('active');
  const [editingDeckId, setEditingDeckId] = React.useState<string | null>(null);
  const [pickerMode, setPickerMode]   = React.useState<'color' | 'icon' | null>(null);

  // Compute archived-only list
  const archivedOnly = archivedDecks?.filter((d: any) => d.isArchived) ?? [];

  const openPicker = (deckId: string, mode: 'color' | 'icon') => {
    if (mode === 'icon' && !gates?.canPickIcon) {
      router.push('/settings/subscription');
      return;
    }
    setEditingDeckId(deckId);
    setPickerMode(mode);
  };

  const applyColor = async (color: string) => {
    if (!editingDeckId) return;
    await updateMeta({ deckId: editingDeckId as any, colorTag: color });
    setPickerMode(null);
  };

  const applyIcon = async (icon: string) => {
    if (!editingDeckId) return;
    await updateMeta({ deckId: editingDeckId as any, iconEmoji: icon });
    setPickerMode(null);
  };

  const handleUnarchive = (deck: any) => {
    Alert.alert('Restore Deck', `Restore "${deck.title}" to your active decks?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          await unarchiveDeck({ deckId: deck._id });
        },
      },
    ]);
  };

  const renderActiveDeck = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [styles.deckCard, { backgroundColor: colors.white, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/deck/${item._id}`)}
    >
      {/* Colored left bar */}
      <View style={[styles.colorBar, { backgroundColor: item.colorTag ?? colors.azure }]} />

      {/* Icon */}
      <TouchableOpacity
        style={[styles.deckIcon, { backgroundColor: (item.colorTag ?? colors.azure) + '22' }]}
        onPress={() => openPicker(item._id, 'icon')}
      >
        <Text style={{ fontSize: 22 }}>{item.iconEmoji ?? '📚'}</Text>
        {!gates?.canPickIcon && (
          <View style={[styles.lockBadge, { backgroundColor: colors.textMuted }]}>
            <Ionicons name="lock-closed" size={9} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      <View style={styles.deckInfo}>
        <Text style={[styles.deckTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.deckMeta, { color: colors.textMuted }]}>{item.cardCount} cards</Text>
      </View>

      {/* Color picker dot */}
      <TouchableOpacity
        style={[styles.colorDot, { backgroundColor: item.colorTag ?? colors.azure }]}
        onPress={() => openPicker(item._id, 'color')}
      />

      <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
    </Pressable>
  );

  const renderArchivedDeck = ({ item }: { item: any }) => (
    <View style={[styles.deckCard, { backgroundColor: colors.white, borderColor: colors.border, opacity: 0.8 }]}>
      <View style={[styles.colorBar, { backgroundColor: item.colorTag ?? colors.textMuted }]} />
      <View style={[styles.deckIcon, { backgroundColor: (item.colorTag ?? colors.textMuted) + '22' }]}>
        <Text style={{ fontSize: 22 }}>{item.iconEmoji ?? '📚'}</Text>
      </View>
      <View style={styles.deckInfo}>
        <Text style={[styles.deckTitle, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.deckMeta, { color: colors.textMuted }]}>{item.cardCount} cards · Archived</Text>
      </View>
      <TouchableOpacity
        style={[styles.restoreBtn, { backgroundColor: colors.azure + '18', borderColor: colors.azure + '40' }]}
        onPress={() => handleUnarchive(item)}
      >
        <Ionicons name="arrow-undo-outline" size={14} color={colors.azure} />
        <Text style={[styles.restoreBtnText, { color: colors.azure }]}>Restore</Text>
      </TouchableOpacity>
    </View>
  );

  const displayList = tab === 'active' ? (activeDecks ?? []) : archivedOnly;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>My Decks</Text>
        <TouchableOpacity onPress={() => router.push('/deck/create' as any)} style={styles.addBtn}>
          <Ionicons name="add" size={22} color={colors.azure} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabRow, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        {([
          { id: 'active', label: 'Active', icon: 'albums-outline' },
          { id: 'archived', label: `Archived${archivedOnly.length > 0 ? ` (${archivedOnly.length})` : ''}`, icon: 'archive-outline' },
        ] as { id: TabId; label: string; icon: string }[]).map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && { borderBottomColor: colors.azure, borderBottomWidth: 2.5 }]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons name={t.icon as any} size={15} color={tab === t.id ? colors.azure : colors.textMuted} />
            <Text style={[styles.tabText, { color: tab === t.id ? colors.azure : colors.textMuted }]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={displayList}
        keyExtractor={(item) => item._id}
        renderItem={tab === 'active' ? renderActiveDeck : renderArchivedDeck}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Ionicons
              name={tab === 'active' ? 'albums-outline' : 'archive-outline'}
              size={56}
              color={colors.textLight}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {tab === 'active' ? 'No decks yet' : 'No archived decks'}
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              {tab === 'active'
                ? 'Create your first deck to start studying'
                : 'Archive a deck from its detail page to see it here'}
            </Text>
            {tab === 'active' && (
              <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.azure }]} onPress={() => router.push('/deck/create' as any)}>
                <Text style={styles.createBtnText}>+ Create Deck</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      />

      {/* Color Picker Modal */}
      {pickerMode === 'color' && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.white }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose Folder Color</Text>
            <View style={styles.colorGrid}>
              {DECK_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }]}
                  onPress={() => applyColor(c)}
                />
              ))}
            </View>
            <TouchableOpacity onPress={() => setPickerMode(null)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Icon Picker Modal */}
      {pickerMode === 'icon' && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.white }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose Deck Icon</Text>
            <View style={styles.iconGrid}>
              {DECK_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={styles.iconBtn}
                  onPress={() => applyIcon(icon)}
                >
                  <Text style={{ fontSize: 28 }}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setPickerMode(null)} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  addBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 12, gap: 6,
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  list: { padding: Spacing.md, paddingBottom: 100 },
  deckCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1, overflow: 'hidden',
  },
  colorBar: { width: 5, alignSelf: 'stretch' },
  deckIcon: {
    width: 48, height: 48, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center', margin: 10, marginLeft: 6, position: 'relative',
  },
  lockBadge: {
    position: 'absolute', bottom: 0, right: 0,
    borderRadius: 8, width: 14, height: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  deckInfo: { flex: 1 },
  deckTitle: { fontSize: 15, fontWeight: '600' },
  deckMeta: { ...Typography.caption, marginTop: 2 },
  colorDot: { width: 18, height: 18, borderRadius: 9 },
  restoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full,
    borderWidth: 1, marginRight: Spacing.sm,
  },
  restoreBtnText: { fontSize: 12, fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyTitle: { fontSize: 20, fontWeight: '700' },
  emptySub: { ...Typography.bodySmall, textAlign: 'center', paddingHorizontal: Spacing.xl },
  createBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  pickerOverlay: {
    position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: Spacing.lg, paddingBottom: 40,
  },
  pickerTitle: { fontSize: 17, fontWeight: '700', marginBottom: Spacing.md, textAlign: 'center' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: Spacing.md },
  colorSwatch: { width: 48, height: 48, borderRadius: 24 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: Spacing.md },
  iconBtn: { width: 56, height: 56, alignItems: 'center', justifyContent: 'center' },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
});
