import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../../constants/theme';
import { Button } from '../../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const CARD_TYPES = ['basic', 'definition', 'cloze', 'visual'] as const;

export default function CardEditorScreen() {
  const { cardId, deckId } = useLocalSearchParams<{ cardId?: string; deckId?: string }>();
  const existingCard = useQuery(api.cards.listByDeck,
    deckId ? { deckId: deckId as any } : 'skip'
  );

  const createCard = useMutation(api.cards.create);
  const updateCard = useMutation(api.cards.update);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [frontImageUri, setFrontImageUri] = useState<string | undefined>(undefined);
  const [backImageUri, setBackImageUri] = useState<string | undefined>(undefined);
  const [cardType, setCardType] = useState<typeof CARD_TYPES[number]>('basic');
  const [activePanel, setActivePanel] = useState<'front' | 'back'>('front');
  const [loading, setLoading] = useState(false);

  const pickImage = async (side: 'front' | 'back') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow photo library access to add images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      if (side === 'front') setFrontImageUri(result.assets[0].uri);
      else setBackImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) {
      Alert.alert('Required', 'Please fill in both front and back.');
      return;
    }
    if (!deckId) {
      Alert.alert('Error', 'No deck selected.');
      return;
    }
    setLoading(true);
    try {
      await createCard({
        deckId: deckId as any,
        front: front.trim(),
        back: back.trim(),
        type: cardType,
        frontImageUrl: frontImageUri,
        backImageUrl: backImageUri,
        tags: [],
      });
      Alert.alert('Card saved!', '', [{ text: 'OK', onPress: () => router.back() }]);
    } catch {
      Alert.alert('Error', 'Could not save card.');
    } finally {
      setLoading(false);
    }
  };

  const TOOLS = [
    { icon: 'image-outline', label: 'Image', action: () => pickImage(activePanel) },
    { icon: 'camera-outline', label: 'Camera', action: async () => {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const result = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
      if (!result.canceled && result.assets[0]) {
        if (activePanel === 'front') setFrontImageUri(result.assets[0].uri);
        else setBackImageUri(result.assets[0].uri);
      }
    }},
    { icon: 'text-outline', label: 'Text', action: () => {} },
    { icon: 'crop-outline', label: 'Crop', action: () => {} },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Card Type */}
        <View style={styles.typeRow}>
          {CARD_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, cardType === type && styles.typeChipActive]}
              onPress={() => setCardType(type)}
            >
              <Text style={[styles.typeChipText, cardType === type && styles.typeChipTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Panel switcher */}
        <View style={styles.panelTabs}>
          <TouchableOpacity
            style={[styles.panelTab, activePanel === 'front' && styles.panelTabActive]}
            onPress={() => setActivePanel('front')}
          >
            <Text style={[styles.panelTabText, activePanel === 'front' && styles.panelTabTextActive]}>
              Front
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.panelTab, activePanel === 'back' && styles.panelTabActive]}
            onPress={() => setActivePanel('back')}
          >
            <Text style={[styles.panelTabText, activePanel === 'back' && styles.panelTabTextActive]}>
              Back
            </Text>
          </TouchableOpacity>
        </View>

        {/* Card Preview */}
        <View style={styles.cardPreview}>
          <Text style={styles.cardPreviewLabel}>{activePanel === 'front' ? 'QUESTION / TERM' : 'ANSWER / DEFINITION'}</Text>
          <TextInput
            style={styles.cardInput}
            value={activePanel === 'front' ? front : back}
            onChangeText={activePanel === 'front' ? setFront : setBack}
            placeholder={activePanel === 'front' ? 'Enter question or term...' : 'Enter answer or definition...'}
            placeholderTextColor={Colors.textLight}
            multiline
            textAlignVertical="top"
          />
          {(activePanel === 'front' ? frontImageUri : backImageUri) && (
            <View style={styles.imagePreviewed}>
              <Ionicons name="image" size={20} color={Colors.azure} />
              <Text style={{ flex: 1, color: Colors.azure, fontSize: 13 }}>Image attached</Text>
              <TouchableOpacity onPress={() => {
                if (activePanel === 'front') setFrontImageUri(undefined);
                else setBackImageUri(undefined);
              }}>
                <Ionicons name="close-circle" size={18} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Editing Tools */}
        <View style={styles.toolsRow}>
          {TOOLS.map((tool) => (
            <TouchableOpacity key={tool.label} style={styles.tool} onPress={tool.action}>
              <Ionicons name={tool.icon as any} size={22} color={Colors.text} />
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.clozeHint}>
          {cardType === 'cloze' && (
            <Text style={styles.clozeTip}>
              💡 Tip: Wrap words with {'{{c1::word}}'} to create fill-in-the-blank gaps.
            </Text>
          )}
        </View>

        <View style={styles.saveArea}>
          <Button
            title="Save Card"
            onPress={handleSave}
            loading={loading}
            fullWidth
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  typeRow: {
    flexDirection: 'row',
    padding: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeChipActive: { backgroundColor: Colors.azure, borderColor: Colors.azure },
  typeChipText: { fontSize: 12, fontWeight: '600', color: Colors.textMuted },
  typeChipTextActive: { color: Colors.white },
  panelTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
  },
  panelTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  panelTabActive: { borderBottomColor: Colors.azure },
  panelTabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  panelTabTextActive: { color: Colors.azure },
  cardPreview: {
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    minHeight: 160,
  },
  cardPreviewLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    color: Colors.textLight,
    marginBottom: Spacing.sm,
  },
  cardInput: {
    fontSize: 18,
    color: Colors.text,
    minHeight: 80,
    lineHeight: 26,
  },
  imagePreviewed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    backgroundColor: Colors.azureLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  tool: { alignItems: 'center', padding: Spacing.sm },
  toolLabel: { fontSize: 10, color: Colors.textMuted, marginTop: 3 },
  clozeHint: { padding: Spacing.md },
  clozeTip: {
    ...Typography.bodySmall,
    color: Colors.azure,
    backgroundColor: Colors.azureLight,
    borderRadius: Radius.md,
    padding: Spacing.sm,
  },
  saveArea: { padding: Spacing.md, paddingBottom: Spacing.xl },
});
