import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
  Image, Dimensions, Modal, Platform, Pressable, PanResponder, GestureResponderEvent,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../../constants/theme';
import { Button } from '../../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CARD_TYPES = ['basic', 'definition', 'cloze', 'visual'] as const;
type CardType = typeof CARD_TYPES[number];
type Tool = 'pen' | 'text' | 'erase';

interface DrawPath { d: string; color: string; width: number; }
interface TextAnnotation { x: number; y: number; text: string; color: string; }

// ─── Annotation Canvas ────────────────────────────────────────────────────────
function AnnotationCanvas({
  imageUri,
  onSave,
  onClose,
}: {
  imageUri: string;
  onSave: (paths: DrawPath[], texts: TextAnnotation[]) => void;
  onClose: () => void;
}) {
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#2563EB');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [paths, setPaths] = useState<DrawPath[]>([]);
  const [texts, setTexts] = useState<TextAnnotation[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  const COLORS = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#000000', '#FFFFFF'];
  const WIDTHS = [2, 4, 8];

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;
        setIsDrawing(true);
        setCurrentPath(`M${locationX.toFixed(1)},${locationY.toFixed(1)}`);
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;
        setCurrentPath((prev) => `${prev} L${locationX.toFixed(1)},${locationY.toFixed(1)}`);
      },
      onPanResponderRelease: () => {
        setIsDrawing(false);
        setCurrentPath((path) => {
          if (path) {
            setPaths((prev) => [...prev, { d: path, color, width: strokeWidth }]);
          }
          return '';
        });
      },
    })
  ).current;

  const eraserResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;
        setPaths((prev) =>
          prev.filter((p) => {
            // Simple proximity erase — remove paths that started near the touch
            const firstMove = p.d.match(/M([\d.]+),([\d.]+)/);
            if (!firstMove) return true;
            const dx = parseFloat(firstMove[1]) - locationX;
            const dy = parseFloat(firstMove[2]) - locationY;
            return Math.sqrt(dx * dx + dy * dy) > 30;
          })
        );
      },
      onPanResponderMove: (e: GestureResponderEvent) => {
        const { locationX, locationY } = e.nativeEvent;
        setPaths((prev) =>
          prev.filter((p) => {
            const firstMove = p.d.match(/M([\d.]+),([\d.]+)/);
            if (!firstMove) return true;
            const dx = parseFloat(firstMove[1]) - locationX;
            const dy = parseFloat(firstMove[2]) - locationY;
            return Math.sqrt(dx * dx + dy * dy) > 30;
          })
        );
      },
    })
  ).current;

  const addTextAt = (e: GestureResponderEvent) => {
    if (tool !== 'text') return;
    const { locationX, locationY } = e.nativeEvent;
    Alert.prompt(
      'Add Text',
      'Enter label for this spot:',
      (text) => {
        if (text) setTexts((prev) => [...prev, { x: locationX, y: locationY, text, color }]);
      },
      'plain-text'
    );
  };

  const activeResponder = tool === 'erase' ? eraserResponder : tool === 'pen' ? panResponder : undefined;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'bottom']}>
        {/* Top Bar */}
        <View style={ann.topBar}>
          <TouchableOpacity onPress={onClose} style={ann.topBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={ann.topTitle}>Annotate Image</Text>
          <TouchableOpacity onPress={() => onSave(paths, texts)} style={ann.topSaveBtn}>
            <Text style={ann.topSaveText}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Canvas */}
        <View
          style={ann.canvas}
          {...activeResponder?.panHandlers}
          onStartShouldSetResponder={() => tool === 'text'}
          onResponderGrant={addTextAt}
        >
          <Image source={{ uri: imageUri }} style={ann.canvasImage} resizeMode="contain" />
          <Svg style={StyleSheet.absoluteFill}>
            {/* Saved paths */}
            {paths.map((p, i) => (
              <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ))}
            {/* Current drawing path */}
            {currentPath ? (
              <Path d={currentPath} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            ) : null}
            {/* Text annotations */}
            {texts.map((t, i) => (
              <SvgText key={i} x={t.x} y={t.y} fill={t.color} fontSize="16" fontWeight="bold"
                stroke="#000" strokeWidth="0.5">{t.text}</SvgText>
            ))}
          </Svg>
          {/* Text tool crosshair */}
          {tool === 'text' && (
            <View pointerEvents="none" style={ann.crosshairHint}>
              <Text style={ann.crosshairText}>Tap on image to add text</Text>
            </View>
          )}
          {/* Eraser cursor hint */}
          {tool === 'erase' && (
            <View pointerEvents="none" style={ann.crosshairHint}>
              <Text style={ann.crosshairText}>Tap/drag to erase nearby strokes</Text>
            </View>
          )}
        </View>

        {/* Toolbar */}
        <View style={ann.toolbar}>
          {/* Tool Row */}
          <View style={ann.toolRow}>
            {([
              { id: 'pen', icon: 'pencil', label: 'Draw' },
              { id: 'text', icon: 'text', label: 'Text' },
              { id: 'erase', icon: 'remove-circle-outline', label: 'Erase' },
            ] as { id: Tool; icon: string; label: string }[]).map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[ann.toolBtn, tool === t.id && ann.toolBtnActive]}
                onPress={() => setTool(t.id)}
              >
                <Ionicons name={t.icon as any} size={20} color={tool === t.id ? Colors.azure : '#aaa'} />
                <Text style={[ann.toolLabel, tool === t.id && { color: Colors.azure }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
            <View style={ann.dividerV} />
            <TouchableOpacity style={ann.toolBtn} onPress={() => setPaths([])} >
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
              <Text style={[ann.toolLabel, { color: '#ef4444' }]}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={ann.toolBtn}
              onPress={() => setPaths((prev) => prev.slice(0, -1))}
            >
              <Ionicons name="arrow-undo-outline" size={20} color="#aaa" />
              <Text style={ann.toolLabel}>Undo</Text>
            </TouchableOpacity>
          </View>

          {/* Color Picker */}
          <View style={ann.colorRow}>
            {COLORS.map((c) => (
              <TouchableOpacity
                key={c}
                style={[ann.colorDot, { backgroundColor: c }, color === c && ann.colorDotActive]}
                onPress={() => setColor(c)}
              />
            ))}
            <View style={ann.dividerV} />
            {WIDTHS.map((w) => (
              <TouchableOpacity
                key={w}
                style={[ann.widthBtn, strokeWidth === w && ann.widthBtnActive]}
                onPress={() => setStrokeWidth(w)}
              >
                <View style={{ width: w * 3, height: w * 3, borderRadius: w * 3, backgroundColor: color }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Card Editor ─────────────────────────────────────────────────────────
export default function CardEditorScreen() {
  const { cardId, deckId } = useLocalSearchParams<{ cardId?: string; deckId?: string }>();
  const createCard = useMutation(api.cards.create);

  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [frontImageUri, setFrontImageUri] = useState<string | undefined>();
  const [backImageUri, setBackImageUri] = useState<string | undefined>();
  const [frontPaths, setFrontPaths] = useState<DrawPath[]>([]);
  const [frontTexts, setFrontTexts] = useState<TextAnnotation[]>([]);
  const [backPaths, setBackPaths] = useState<DrawPath[]>([]);
  const [backTexts, setBackTexts] = useState<TextAnnotation[]>([]);
  const [cardType, setCardType] = useState<CardType>('basic');
  const [activePanel, setActivePanel] = useState<'front' | 'back'>('front');
  const [loading, setLoading] = useState(false);
  const [showAnnotator, setShowAnnotator] = useState(false);

  const currentImage = activePanel === 'front' ? frontImageUri : backImageUri;
  const currentText = activePanel === 'front' ? front : back;
  const setCurrentText = activePanel === 'front' ? setFront : setBack;

  const pickImage = async (side: 'front' | 'back') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed', 'Allow photo library access.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      if (side === 'front') setFrontImageUri(result.assets[0].uri);
      else setBackImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!front.trim() && !frontImageUri) {
      Alert.alert('Required', 'Please add content to the front panel.');
      return;
    }
    if (!back.trim() && !backImageUri) {
      Alert.alert('Required', 'Please add content to the back panel.');
      return;
    }
    if (!deckId) { Alert.alert('Error', 'No deck selected.'); return; }

    setLoading(true);
    try {
      await createCard({
        deckId: deckId as any,
        front: front.trim() || '(image)',
        back: back.trim() || '(image)',
        type: cardType,
        frontImageUrl: frontImageUri,
        backImageUrl: backImageUri,
        tags: [],
      });
      router.back();
    } catch {
      Alert.alert('Error', 'Could not save card.');
    } finally {
      setLoading(false);
    }
  };

  // ─── Type configs ─────────────────────────────────────────────────────────
  const typeConfig: Record<CardType, { frontLabel: string; backLabel: string; frontBg: string; backBg: string; accentColor: string }> = {
    basic: {
      frontLabel: 'QUESTION',
      backLabel: 'ANSWER',
      frontBg: Colors.white,
      backBg: Colors.white,
      accentColor: Colors.azure,
    },
    definition: {
      frontLabel: 'TERM',
      backLabel: 'DEFINITION',
      frontBg: Colors.azureLight,
      backBg: Colors.white,
      accentColor: Colors.azure,
    },
    cloze: {
      frontLabel: 'SENTENCE WITH BLANKS  •  use {{c1::word}}',
      backLabel: 'FULL ANSWER',
      frontBg: '#FFFBEB',
      backBg: Colors.white,
      accentColor: '#D97706',
    },
    visual: {
      frontLabel: 'IMAGE + ANNOTATION',
      backLabel: 'DESCRIPTION / LABEL',
      frontBg: '#F0F9FF',
      backBg: Colors.white,
      accentColor: '#0891B2',
    },
  };

  const cfg = typeConfig[cardType];
  const panelBg = activePanel === 'front' ? cfg.frontBg : cfg.backBg;
  const panelLabel = activePanel === 'front' ? cfg.frontLabel : cfg.backLabel;

  // Cloze highlight: render text with {{c1::word}} highlighted
  const renderClozePreview = (text: string) => {
    const parts = text.split(/({{c\d+::.*?}})/g);
    return (
      <Text style={styles.clozePreviewText}>
        {parts.map((part, i) => {
          const match = part.match(/{{c\d+::(.*?)}}/);
          if (match) {
            return (
              <Text key={i} style={styles.clozeBlank}>[{match[1]}]</Text>
            );
          }
          return <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      {/* Card Type Selector */}
      <View style={styles.typeRow}>
        {CARD_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeChip, cardType === type && { ...styles.typeChipActive, borderColor: typeConfig[type].accentColor, backgroundColor: typeConfig[type].accentColor + '20' }]}
            onPress={() => setCardType(type)}
          >
            <Text style={[styles.typeChipText, cardType === type && { color: typeConfig[type].accentColor }]}>
              {type === 'basic' ? '📝' : type === 'definition' ? '📖' : type === 'cloze' ? '✏️' : '🖼️'} {type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Panel Tabs */}
      <View style={styles.panelTabs}>
        {(['front', 'back'] as const).map((panel) => (
          <TouchableOpacity
            key={panel}
            style={[styles.panelTab, activePanel === panel && { ...styles.panelTabActive, borderBottomColor: cfg.accentColor }]}
            onPress={() => setActivePanel(panel)}
          >
            <Text style={[styles.panelTabText, activePanel === panel && { color: cfg.accentColor }]}>
              {panel === 'front' ? (cardType === 'definition' ? 'Term' : cardType === 'visual' ? 'Image' : 'Front') : (cardType === 'definition' ? 'Definition' : 'Back')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* ─── VISUAL TYPE: Image-first layout ─── */}
        {cardType === 'visual' && activePanel === 'front' ? (
          <View style={[styles.visualPanel, { backgroundColor: panelBg }]}>
            <Text style={[styles.panelLabel, { color: '#0891B2' }]}>{panelLabel}</Text>

            {currentImage ? (
              <View style={styles.imageCanvas}>
                <Image source={{ uri: currentImage }} style={styles.annotatedImage} resizeMode="contain" />
                {/* Saved annotation overlay */}
                <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                  {(activePanel === 'front' ? frontPaths : backPaths).map((p, i) => (
                    <Path key={i} d={p.d} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  ))}
                  {(activePanel === 'front' ? frontTexts : backTexts).map((t, i) => (
                    <SvgText key={i} x={t.x} y={t.y} fill={t.color} fontSize="16" fontWeight="bold" stroke="#000" strokeWidth="0.5">{t.text}</SvgText>
                  ))}
                </Svg>
                <View style={styles.imageActions}>
                  <TouchableOpacity style={styles.imageActionBtn} onPress={() => setShowAnnotator(true)}>
                    <Ionicons name="pencil" size={16} color="#fff" />
                    <Text style={styles.imageActionText}>Annotate</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imageActionBtn} onPress={() => { if (activePanel === 'front') { setFrontImageUri(undefined); setFrontPaths([]); setFrontTexts([]); } else { setBackImageUri(undefined); setBackPaths([]); setBackTexts([]); } }}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.imageActionText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage(activePanel)}>
                <Ionicons name="image-outline" size={56} color="#0891B2" />
                <Text style={styles.imagePlaceholderTitle}>Add Image</Text>
                <Text style={styles.imagePlaceholderSub}>Tap to select from photo library</Text>
              </TouchableOpacity>
            )}

            {/* Caption below image */}
            <Text style={[styles.panelLabel, { color: '#0891B2', marginTop: Spacing.md }]}>CAPTION (optional)</Text>
            <TextInput
              style={[styles.cardInput, { borderColor: '#0891B2' + '40', borderWidth: 1, borderRadius: Radius.md, padding: Spacing.sm }]}
              value={front}
              onChangeText={setFront}
              placeholder="Add a caption or question about this image..."
              placeholderTextColor={Colors.textLight}
              multiline
              textAlignVertical="top"
            />
          </View>
        ) : (
          /* ─── All other types + visual back ─── */
          <View style={[styles.cardPanel, { backgroundColor: panelBg, borderColor: cfg.accentColor + '40' }]}>
            <Text style={[styles.panelLabel, { color: cfg.accentColor }]}>{panelLabel}</Text>

            {/* Definition front: highlighted term box */}
            {cardType === 'definition' && activePanel === 'front' ? (
              <TextInput
                style={[styles.termInput, { borderColor: cfg.accentColor, color: cfg.accentColor }]}
                value={currentText}
                onChangeText={setCurrentText}
                placeholder="Enter the term..."
                placeholderTextColor={cfg.accentColor + '60'}
                multiline
              />
            ) : cardType === 'cloze' && activePanel === 'front' ? (
              /* Cloze: text input + live preview */
              <>
                <TextInput
                  style={styles.cardInput}
                  value={currentText}
                  onChangeText={setCurrentText}
                  placeholder="The {{c1::mitochondria}} is the powerhouse of the cell."
                  placeholderTextColor={Colors.textLight}
                  multiline
                  textAlignVertical="top"
                />
                {currentText.includes('{{') && (
                  <View style={styles.clozePreview}>
                    <Text style={styles.clozePreviewLabel}>PREVIEW</Text>
                    {renderClozePreview(currentText)}
                  </View>
                )}
              </>
            ) : (
              /* Basic / definition back / visual back / cloze back */
              <TextInput
                style={styles.cardInput}
                value={currentText}
                onChangeText={setCurrentText}
                placeholder={activePanel === 'front' ? 'Front of card...' : 'Back of card...'}
                placeholderTextColor={Colors.textLight}
                multiline
                textAlignVertical="top"
              />
            )}

            {/* Image attachment (for non-visual types) */}
            {cardType !== 'visual' && (
              currentImage ? (
                <View style={styles.imageAttached}>
                  <Image source={{ uri: currentImage }} style={styles.attachedThumb} resizeMode="cover" />
                  <TouchableOpacity onPress={() => {
                    if (activePanel === 'front') setFrontImageUri(undefined);
                    else setBackImageUri(undefined);
                  }} style={styles.removeImageBtn}>
                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              ) : null
            )}
          </View>
        )}

        {/* ─── Toolbar (for non-visual, or visual back) ─── */}
        {(cardType !== 'visual' || activePanel === 'back') && (
          <View style={styles.toolsRow}>
            <TouchableOpacity style={styles.tool} onPress={() => pickImage(activePanel)}>
              <Ionicons name="image-outline" size={22} color={Colors.text} />
              <Text style={styles.toolLabel}>Image</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.tool} onPress={async () => {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (!perm.granted) return;
              const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
              if (!result.canceled && result.assets[0]) {
                if (activePanel === 'front') setFrontImageUri(result.assets[0].uri);
                else setBackImageUri(result.assets[0].uri);
              }
            }}>
              <Ionicons name="camera-outline" size={22} color={Colors.text} />
              <Text style={styles.toolLabel}>Camera</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Cloze tip */}
        {cardType === 'cloze' && (
          <View style={styles.clozeHintBox}>
            <Text style={styles.clozeHintText}>
              ✏️ Wrap words with {'{{c1::answer}}'} to create fill-in-the-blank gaps. Use c1, c2, c3 for multiple blanks.
            </Text>
          </View>
        )}

        <View style={styles.saveArea}>
          <Button title="Save Card" onPress={handleSave} loading={loading} fullWidth size="lg" />
        </View>
      </ScrollView>

      {/* Annotation Modal */}
      {showAnnotator && currentImage && (
        <AnnotationCanvas
          imageUri={currentImage}
          onSave={(savedPaths, savedTexts) => {
            if (activePanel === 'front') { setFrontPaths(savedPaths); setFrontTexts(savedTexts); }
            else { setBackPaths(savedPaths); setBackTexts(savedTexts); }
            setShowAnnotator(false);
          }}
          onClose={() => setShowAnnotator(false)}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Annotation Canvas Styles ─────────────────────────────────────────────────
const ann = StyleSheet.create({
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#111',
  },
  topBtn: { padding: 8 },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topSaveBtn: { backgroundColor: Colors.azure, paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full },
  topSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  canvas: { flex: 1, backgroundColor: '#000', position: 'relative' },
  canvasImage: { width: '100%', height: '100%' },
  crosshairHint: {
    position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center',
  },
  crosshairText: { color: 'rgba(255,255,255,0.7)', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 8 },
  toolbar: { backgroundColor: '#111', paddingBottom: Platform.OS === 'ios' ? 16 : 8 },
  toolRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 10 },
  toolBtn: { alignItems: 'center', marginRight: 20 },
  toolBtnActive: {},
  toolLabel: { color: '#aaa', fontSize: 10, marginTop: 3 },
  colorRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md,
    paddingVertical: 10, gap: 8,
  },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.2 }] },
  widthBtn: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#333',
  },
  widthBtnActive: { backgroundColor: '#555' },
  dividerV: { width: 1, height: 28, backgroundColor: '#333', marginHorizontal: 8 },
});

// ─── Card Editor Styles ───────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  typeRow: {
    flexDirection: 'row', padding: Spacing.sm, gap: Spacing.xs,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  typeChip: {
    flex: 1, paddingVertical: 8, borderRadius: Radius.md,
    backgroundColor: Colors.borderLight, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  typeChipActive: {},
  typeChipText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  panelTabs: { flexDirection: 'row', backgroundColor: Colors.white },
  panelTab: {
    flex: 1, paddingVertical: 13, alignItems: 'center',
    borderBottomWidth: 2.5, borderBottomColor: 'transparent',
  },
  panelTabActive: {},
  panelTabText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  // Standard card panel
  cardPanel: {
    margin: Spacing.md, borderRadius: Radius.xl, borderWidth: 1.5,
    padding: Spacing.md, minHeight: 180, backgroundColor: Colors.white,
  },
  panelLabel: {
    fontSize: 10, fontWeight: '800', letterSpacing: 1.5,
    color: Colors.textLight, marginBottom: Spacing.sm,
  },
  cardInput: { fontSize: 18, color: Colors.text, minHeight: 100, lineHeight: 26 },
  // Definition term box
  termInput: {
    fontSize: 24, fontWeight: '800', color: Colors.azure,
    borderBottomWidth: 2, paddingBottom: Spacing.sm, minHeight: 60, lineHeight: 32,
  },
  // Cloze styles
  clozePreview: {
    marginTop: Spacing.md, padding: Spacing.sm,
    backgroundColor: '#FFFBEB', borderRadius: Radius.md,
    borderWidth: 1, borderColor: '#F59E0B40',
  },
  clozePreviewLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#D97706', marginBottom: 4 },
  clozePreviewText: { fontSize: 16, color: Colors.text, lineHeight: 24 },
  clozeBlank: {
    backgroundColor: '#FDE68A', color: '#92400E',
    fontWeight: '700', borderRadius: 4, paddingHorizontal: 4,
  },
  clozeHintBox: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.sm,
    backgroundColor: '#FFFBEB', borderRadius: Radius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: '#F59E0B30',
  },
  clozeHintText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
  // Visual type styles
  visualPanel: {
    margin: Spacing.md, borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1.5, borderColor: '#0891B240',
  },
  imagePlaceholder: {
    height: 240, borderRadius: Radius.xl,
    borderWidth: 2, borderStyle: 'dashed', borderColor: '#0891B2',
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: '#F0F9FF',
  },
  imagePlaceholderTitle: { fontSize: 18, fontWeight: '700', color: '#0891B2' },
  imagePlaceholderSub: { fontSize: 13, color: '#0891B2AA' },
  imageCanvas: {
    height: SCREEN_W * 0.75, borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: '#000', position: 'relative',
  },
  annotatedImage: { width: '100%', height: '100%' },
  imageActions: {
    position: 'absolute', bottom: 10, right: 10,
    flexDirection: 'row', gap: Spacing.sm,
  },
  imageActionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: Radius.full,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  imageActionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  // Image attached (non-visual)
  imageAttached: { marginTop: Spacing.sm, position: 'relative', alignSelf: 'flex-start' },
  attachedThumb: { width: 120, height: 90, borderRadius: Radius.md },
  removeImageBtn: { position: 'absolute', top: -8, right: -8 },
  // Tool bar
  toolsRow: {
    flexDirection: 'row', backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  tool: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  toolLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  saveArea: { padding: Spacing.md, paddingBottom: Spacing.xl },
});
