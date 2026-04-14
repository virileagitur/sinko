import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable,
  Alert, Image, ImageBackground,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, Radius, Typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const DECK_COLORS = [
  '#2563EB', '#7C3AED', '#DC2626', '#16A34A',
  '#D97706', '#0891B2', '#BE185D', '#64748B',
];
const DECK_ICONS = ['📚', '🧪', '🎯', '🧠', '🔬', '📐', '💡', '🎨', '🌍', '🏛️', '⚗️', '📊', '🎵', '💻', '🔭', '🩺', '📝', '🌿', '⚙️', '🎓'];

const STUDY_MODES = [
  { id: 'flashcard', label: 'Flashcards', icon: 'albums-outline' },
  { id: 'spaced',    label: 'Spaced Rep', icon: 'timer-outline' },
  { id: 'quiz',      label: 'Quiz',       icon: 'help-circle-outline' },
  { id: 'matching',  label: 'Matching',   icon: 'git-compare-outline' },
  { id: 'pomodoro',  label: 'Pomodoro',   icon: 'time-outline' },
];

export default function DeckDetailScreen() {
  const { colors } = useTheme();
  const { deckId } = useLocalSearchParams<{ deckId: string }>();
  const deck   = useQuery(api.decks.getById, { deckId: deckId as any });
  const cards  = useQuery(api.cards.listByDeck, { deckId: deckId as any });
  const gates  = useQuery(api.users.getPlanGates);
  const deleteDeck  = useMutation(api.decks.remove);
  const updateMeta  = useMutation(api.decks.updateMeta);
  const deleteCard  = useMutation(api.cards.remove);
  const archiveDeck = useMutation(api.decks.archiveDeck);
  const generateUrl = useMutation(api.storage.generateUploadUrl);

  const [pickerMode, setPickerMode] = useState<'color' | 'icon' | null>(null);

  const handleAddCard = () => router.push(`/card/new/edit?deckId=${deckId}` as any);

  const handleDelete = () => {
    Alert.alert('Delete Deck', `Are you sure you want to delete "${deck?.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteDeck({ deckId: deckId as any }); router.back(); } },
    ]);
  };

  const handleArchive = () => {
    Alert.alert('Archive Deck', `Archive "${deck?.title}"? It will be hidden from home but not deleted.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: async () => { await archiveDeck({ deckId: deckId as any }); router.back(); } },
    ]);
  };

  const handleDeleteCard = (cardId: string, front: string) => {
    Alert.alert('Delete Card', `Delete "${front.slice(0, 40)}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteCard({ cardId: cardId as any }); } },
    ]);
  };

  const openColorPicker = () => setPickerMode('color');

  const openIconPicker = () => {
    if (!gates?.canPickIcon) {
      Alert.alert('Starter Plan Required', 'Custom deck icons require a Starter or Premium plan.', [
        { text: 'Not Now', style: 'cancel' },
        { text: 'View Plans', onPress: () => router.push('/settings/subscription') },
      ]);
      return;
    }
    setPickerMode('icon');
  };

  const pickBackground = async () => {
    if (!gates?.canSetBackground) {
      Alert.alert('Premium Required', 'Custom deck backgrounds are a Premium feature.', [
        { text: 'Not Now', style: 'cancel' },
        { text: 'View Plans', onPress: () => router.push('/settings/subscription') },
      ]);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;
    try {
      const uploadUrl = await generateUrl();
      const blob = await (await fetch(result.assets[0].uri)).blob();
      const res = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': result.assets[0].mimeType ?? 'image/jpeg' }, body: blob });
      if (!res.ok) throw new Error('Upload failed');
      const { storageId } = await res.json();
      await updateMeta({ deckId: deckId as any, backgroundImageUrl: result.assets[0].uri, backgroundStorageId: storageId });
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not upload background.');
    }
  };

  const removeBackground = () => updateMeta({ deckId: deckId as any, backgroundImageUrl: undefined, backgroundStorageId: undefined });

  if (!deck) {
    return (<View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}><Text>Loading...</Text></View>);
  }

  const accentColor = deck.colorTag ?? Colors.azure;
  const deckIcon    = deck.iconEmoji ?? '📚';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── Deck Header (with optional background) ── */}
        <View style={[styles.deckHeader, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
          {deck.backgroundImageUrl ? (
            <ImageBackground source={{ uri: deck.backgroundImageUrl }} style={styles.bgImage} resizeMode="cover">
              <View style={styles.bgOverlay} />
              <DeckHeaderContent
                deck={deck}
                accentColor={accentColor}
                deckIcon={deckIcon}
                gates={gates}
                onDelete={handleDelete}
                onArchive={handleArchive}
                onColorPick={openColorPicker}
                onIconPick={openIconPicker}
                onBgPick={pickBackground}
                onBgRemove={removeBackground}
                darkText
              />
            </ImageBackground>
          ) : (
            <DeckHeaderContent
              deck={deck}
              accentColor={accentColor}
              deckIcon={deckIcon}
              gates={gates}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onColorPick={openColorPicker}
              onIconPick={openIconPicker}
              onBgPick={pickBackground}
              onBgRemove={removeBackground}
              textColor={colors.text}
              subColor={colors.textMuted}
            />
          )}
        </View>

        {/* ── Study Modes ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Study this Deck</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.modeScroll}>
            {STUDY_MODES.map((mode) => (
              <Pressable
                key={mode.id}
                style={({ pressed }) => [styles.modeChip, { backgroundColor: colors.white, borderColor: colors.border }, pressed && { opacity: 0.7 }]}
                onPress={() => requestAnimationFrame(() => router.push(`/study/${mode.id}?deckId=${deckId}` as any))}
              >
                <Ionicons name={mode.icon as any} size={18} color={accentColor} />
                <Text style={[styles.modeChipText, { color: accentColor }]}>{mode.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── AI Import ── */}
        <TouchableOpacity style={styles.aiImportBanner} onPress={() => router.push(`/ai/import?deckId=${deckId}` as any)}>
          <Ionicons name="sparkles" size={20} color="#7C3AED" />
          <View style={{ flex: 1 }}>
            <Text style={styles.aiImportTitle}>Import with AI</Text>
            <Text style={styles.aiImportSub}>Upload a document and auto-generate cards</Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#7C3AED" />
        </TouchableOpacity>

        {/* ── Cards ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Cards ({cards?.length ?? 0})</Text>
            <TouchableOpacity style={[styles.addCardBtn, { backgroundColor: accentColor }]} onPress={handleAddCard}>
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.addCardBtnText}>Add Card</Text>
            </TouchableOpacity>
          </View>

          {cards && cards.length > 0 ? (
            cards.map((card, idx) => (
              <View key={card._id} style={[styles.cardRow, { backgroundColor: colors.white, borderColor: colors.border }]}>
                <Text style={[styles.cardIdx, { color: colors.textLight }]}>{idx + 1}</Text>
                <View style={styles.cardContent}>
                  <Text style={[styles.cardFront, { color: colors.text }]}>{card.front}</Text>
                  <Text style={[styles.cardBack, { color: colors.textMuted }]}>{card.back}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push(`/card/${card._id}/edit`)} style={[styles.editCardBtn, { backgroundColor: accentColor + '20' }]}>
                  <Ionicons name="create-outline" size={16} color={accentColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteCard(card._id, card.front)} style={[styles.editCardBtn, { backgroundColor: '#FEE2E2' }]}>
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <View style={[styles.emptyCards, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <Ionicons name="add-circle-outline" size={40} color={colors.textLight} />
              <Text style={[Typography.bodySmall, { color: colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
                No cards yet. Add manually or import with AI.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ── Color Picker Modal ── */}
      {pickerMode === 'color' && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.white }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose Folder Color</Text>
            <View style={styles.colorGrid}>
              {DECK_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.colorSwatch, { backgroundColor: c }, deck.colorTag === c && styles.colorSwatchActive]}
                  onPress={async () => { await updateMeta({ deckId: deckId as any, colorTag: c }); setPickerMode(null); }}
                />
              ))}
            </View>
            <TouchableOpacity onPress={() => setPickerMode(null)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── Icon Picker Modal ── */}
      {pickerMode === 'icon' && (
        <View style={styles.pickerOverlay}>
          <View style={[styles.pickerSheet, { backgroundColor: colors.white }]}>
            <Text style={[styles.pickerTitle, { color: colors.text }]}>Choose Deck Icon</Text>
            <View style={styles.iconGrid}>
              {DECK_ICONS.map((icon) => (
                <TouchableOpacity
                  key={icon}
                  style={[styles.iconBtn, deck.iconEmoji === icon && { backgroundColor: accentColor + '22' }]}
                  onPress={async () => { await updateMeta({ deckId: deckId as any, iconEmoji: icon }); setPickerMode(null); }}
                >
                  <Text style={{ fontSize: 28 }}>{icon}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setPickerMode(null)} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

// ─── Deck Header sub-component ─────────────────────────────────────────────
function DeckHeaderContent({ deck, accentColor, deckIcon, gates, onDelete, onArchive, onColorPick, onIconPick, onBgPick, onBgRemove, darkText, textColor: tc, subColor: sc }: any) {
  const textColor = darkText ? '#fff' : (tc ?? '#111827');
  const subColor  = darkText ? 'rgba(255,255,255,0.8)' : (sc ?? '#6B7280');

  return (
    <View style={{ padding: Spacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        {/* Left: icon + info */}
        <View style={{ flexDirection: 'row', gap: Spacing.md, flex: 1 }}>
          {/* Icon (tappable to change) */}
          <TouchableOpacity
            onPress={onIconPick}
            style={[styles.deckIconBtn, { backgroundColor: accentColor + (darkText ? '44' : '22') }]}
          >
            <Text style={{ fontSize: 26 }}>{deckIcon}</Text>
            {!gates?.canPickIcon && (
              <View style={styles.iconLockBadge}>
                <Ionicons name="lock-closed" size={9} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.deckTitle, { color: textColor }]}>{deck.title}</Text>
            {deck.description && <Text style={[styles.deckDesc, { color: subColor }]}>{deck.description}</Text>}
            <Text style={[styles.deckMeta, { color: darkText ? 'rgba(255,255,255,0.7)' : accentColor }]}>
              {deck.cardCount} cards · {deck.isPublic ? '🌍 Public' : '🔒 Private'}
            </Text>
          </View>
        </View>

        {/* Right: actions */}
        <View style={{ gap: 6 }}>
          {/* Color */}
          <TouchableOpacity style={[styles.headerAction, { backgroundColor: accentColor }]} onPress={onColorPick}>
            <Ionicons name="color-palette-outline" size={15} color="#fff" />
          </TouchableOpacity>
          {/* Background (premium) */}
          <TouchableOpacity
            style={[styles.headerAction, { backgroundColor: deck.backgroundImageUrl ? '#DC2626' : (darkText ? 'rgba(255,255,255,0.2)' : '#F3F4F6') }]}
            onPress={deck.backgroundImageUrl ? onBgRemove : onBgPick}
          >
            <Ionicons
              name="image-outline"
              size={15}
              color={deck.backgroundImageUrl ? '#fff' : (darkText ? '#fff' : '#6B7280')}
            />
          </TouchableOpacity>
          {/* Archive */}
          <TouchableOpacity style={[styles.headerAction, { backgroundColor: '#FFF9C4' }]} onPress={onArchive}>
            <Ionicons name="archive-outline" size={15} color="#D97706" />
          </TouchableOpacity>
          {/* Delete */}
          <TouchableOpacity style={[styles.headerAction, { backgroundColor: '#FEF2F2' }]} onPress={onDelete}>
            <Ionicons name="trash-outline" size={15} color="#DC2626" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1 },
  deckHeader: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    overflow: 'hidden',
  },
  bgImage: { width: '100%' },
  bgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  deckIconBtn: {
    width: 58, height: 58, borderRadius: Radius.lg,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  iconLockBadge: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: Colors.textMuted, borderRadius: 8, width: 14, height: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAction: {
    width: 32, height: 32, borderRadius: Radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  deckTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  deckDesc: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2, maxWidth: 200 },
  deckMeta: { ...Typography.caption, color: Colors.azure, marginTop: 4 },
  // Sections
  section: { padding: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  sectionTitle: { ...Typography.h4 },
  modeScroll: { marginHorizontal: -Spacing.md, paddingHorizontal: Spacing.md },
  modeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, marginRight: Spacing.sm,
  },
  modeChipText: { fontSize: 13, fontWeight: '600', color: Colors.azure },
  aiImportBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    margin: Spacing.md, marginTop: 0, backgroundColor: Colors.lilyLight,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.lily, padding: Spacing.md,
  },
  aiImportTitle: { fontSize: 14, fontWeight: '600', color: Colors.lilyDark },
  aiImportSub: { ...Typography.caption, color: Colors.lilyDark + 'AA', marginTop: 2 },
  addCardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full,
  },
  addCardBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  cardRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  cardIdx: { width: 24, textAlign: 'center', fontSize: 12, fontWeight: '700', color: Colors.textLight },
  cardContent: { flex: 1 },
  cardFront: { fontSize: 13, fontWeight: '600', color: Colors.text },
  cardBack: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  editCardBtn: { width: 32, height: 32, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.azureLight },
  emptyCards: {
    padding: Spacing.xl, alignItems: 'center', backgroundColor: Colors.white,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
  },
  // Picker
  pickerOverlay: { position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  pickerSheet: { backgroundColor: Colors.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: Spacing.lg, paddingBottom: 40 },
  pickerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: Spacing.md, textAlign: 'center' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'center', marginBottom: Spacing.md },
  colorSwatch: { width: 48, height: 48, borderRadius: 24 },
  colorSwatchActive: { borderWidth: 3, borderColor: Colors.text },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginBottom: Spacing.md },
  iconBtn: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center', borderRadius: Radius.md },
  cancelBtn: { alignItems: 'center', paddingVertical: 12 },
  cancelText: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
});
