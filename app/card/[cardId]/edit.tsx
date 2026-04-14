import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
  Image, Dimensions, Modal, Platform, Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Colors, Spacing, Radius, Typography } from '../../../constants/theme';
import { Button } from '../../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GestureHandlerRootView,
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Svg, { Path, Text as SvgText, Circle } from 'react-native-svg';

const { width: SW, height: SH } = Dimensions.get('window');
const CANVAS_H = SW * 0.75;

const CARD_TYPES = ['basic', 'definition', 'cloze', 'visual'] as const;
type CardType = typeof CARD_TYPES[number];
type Tool = 'pen' | 'text' | 'erase' | 'crop';

interface DrawPath { id: string; d: string; color: string; width: number; }
interface TextAnnotation { id: string; x: number; y: number; text: string; color: string; }
type Action = { type: 'path'; path: DrawPath } | { type: 'text'; ann: TextAnnotation };

const PALETTE = ['#2563EB', '#DC2626', '#16A34A', '#F59E0B', '#7C3AED', '#EC4899', '#000000', '#FFFFFF'];
const WIDTHS = [2, 4, 8, 14];

// ─── Annotation Canvas ────────────────────────────────────────────────────────
function AnnotationCanvas({
  imageUri,
  onSave,
  onClose,
}: {
  imageUri: string;
  onSave: (paths: DrawPath[], texts: TextAnnotation[], finalUri: string) => void;
  onClose: () => void;
}) {
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState('#2563EB');
  const [strokeWidth, setStrokeWidth] = useState(4);
  const [actions, setActions] = useState<Action[]>([]);
  const [currentPath, setCurrentPath] = useState('');
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const [imageSize, setImageSize] = useState({ w: SW, h: CANVAS_H });
  // Crop state
  const [cropMode, setCropMode] = useState(false);
  const [cropBox, setCropBox] = useState({ x: 20, y: 20, w: SW - 40, h: CANVAS_H - 40 });
  const [cropStartX, setCropStartX] = useState(0);
  const [cropStartY, setCropStartY] = useState(0);
  const [cropping, setCropping] = useState(false);
  const [previewUri, setPreviewUri] = useState(imageUri);

  // Paths accumulated from actions
  const paths = actions.filter((a): a is { type: 'path'; path: DrawPath } => a.type === 'path').map((a) => a.path);
  const texts = actions.filter((a): a is { type: 'text'; ann: TextAnnotation } => a.type === 'text').map((a) => a.ann);

  // ── Pen gesture (using GestureHandlerRootView) ──
  const penGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      if (tool !== 'pen') return;
      setCurrentPath(`M${e.x.toFixed(1)},${e.y.toFixed(1)}`);
    })
    .onUpdate((e) => {
      if (tool !== 'pen') return;
      setCurrentPath((prev) => prev + ` L${e.x.toFixed(1)},${e.y.toFixed(1)}`);
    })
    .onEnd(() => {
      if (tool !== 'pen') return;
      setCurrentPath((prev) => {
        if (prev) {
          const newPath: DrawPath = { id: Date.now().toString(), d: prev, color, width: strokeWidth };
          setActions((a) => [...a, { type: 'path', path: newPath }]);
        }
        return '';
      });
    });

  // ── Erase gesture ──
  const eraseGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      if (tool !== 'erase') return;
      erasePaths(e.x, e.y);
    })
    .onUpdate((e) => {
      if (tool !== 'erase') return;
      erasePaths(e.x, e.y);
    });

  const erasePaths = (px: number, py: number) => {
    setActions((prev) =>
      prev.filter((a) => {
        if (a.type !== 'path') return true;
        // Parse all coordinates from path and check proximity
        const coords = a.path.d.match(/[ML]([\d.]+),([\d.]+)/g) ?? [];
        return !coords.some((seg) => {
          const [x, y] = seg.slice(1).split(',').map(Number);
          return Math.abs(x - px) < 24 && Math.abs(y - py) < 24;
        });
      })
    );
  };

  // ── Tap for text tool ──
  const tapGesture = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => {
      if (tool !== 'text') return;
      setTextPos({ x: e.x, y: e.y });
    });

  // ── Crop drag ──
  const cropGesture = Gesture.Pan()
    .runOnJS(true)
    .onStart((e) => {
      if (tool !== 'crop') return;
      setCropStartX(e.x);
      setCropStartY(e.y);
    })
    .onUpdate((e) => {
      if (tool !== 'crop') return;
      const x = Math.min(cropStartX, e.x);
      const y = Math.min(cropStartY, e.y);
      const w = Math.abs(e.x - cropStartX);
      const h = Math.abs(e.y - cropStartY);
      setCropBox({ x, y, w: Math.max(w, 40), h: Math.max(h, 40) });
    });

  const applyCrop = async () => {
    try {
      setCropping(true);
      // Scale crop box from canvas coords to actual image coords
      const scaleX = imageSize.w / SW;
      const scaleY = imageSize.h / CANVAS_H;
      const result = await ImageManipulator.manipulateAsync(
        previewUri,
        [{
          crop: {
            originX: Math.round(cropBox.x * scaleX),
            originY: Math.round(cropBox.y * scaleY),
            width: Math.round(cropBox.w * scaleX),
            height: Math.round(cropBox.h * scaleY),
          },
        }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG }
      );
      setPreviewUri(result.uri);
      setActions([]); // Clear annotations on crop (they'd be offset)
      setTool('pen');
    } catch {
      Alert.alert('Crop failed', 'Could not crop the image. Try again.');
    } finally {
      setCropping(false);
    }
  };

  const addTextAnnotation = () => {
    if (!textPos || !textInput.trim()) { setTextPos(null); setTextInput(''); return; }
    const ann: TextAnnotation = { id: Date.now().toString(), x: textPos.x, y: textPos.y, text: textInput.trim(), color };
    setActions((a) => [...a, { type: 'text', ann }]);
    setTextPos(null);
    setTextInput('');
  };

  const activeGesture =
    tool === 'pen' ? penGesture :
    tool === 'erase' ? eraseGesture :
    tool === 'text' ? tapGesture :
    tool === 'crop' ? cropGesture :
    penGesture;

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen">
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000' }}>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }} edges={['top', 'bottom']}>
          {/* Top Bar */}
          <View style={ann.topBar}>
            <TouchableOpacity onPress={onClose} style={ann.topBtn}>
              <Ionicons name="close" size={22} color="#fff" />
            </TouchableOpacity>
            <Text style={ann.topTitle}>Annotate Image</Text>
            <TouchableOpacity
              onPress={() => onSave(paths, texts, previewUri)}
              style={ann.topSaveBtn}
            >
              <Text style={ann.topSaveText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Canvas */}
          <GestureDetector gesture={activeGesture}>
            <View style={ann.canvas} collapsable={false}>
              <Image source={{ uri: previewUri }} style={ann.canvasImage} resizeMode="contain"
                onLoad={(e) => setImageSize({ w: e.nativeEvent.source.width, h: e.nativeEvent.source.height })}
              />
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                {paths.map((p) => (
                  <Path key={p.id} d={p.d} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ))}
                {currentPath ? (
                  <Path d={currentPath} stroke={color} strokeWidth={strokeWidth} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                ) : null}
                {texts.map((t) => (
                  <SvgText key={t.id} x={t.x} y={t.y} fill={t.color} fontSize="16" fontWeight="bold" stroke="#000" strokeWidth="0.4">{t.text}</SvgText>
                ))}
                {/* Crop box */}
                {tool === 'crop' && cropBox.w > 0 && (
                  <>
                    <Path
                      d={`M${cropBox.x},${cropBox.y} h${cropBox.w} v${cropBox.h} h-${cropBox.w} Z`}
                      stroke="#FBBF24" strokeWidth={2} fill="rgba(251,191,36,0.15)"
                      strokeDasharray="6 4"
                    />
                    {/* Handles */}
                    {[
                      [cropBox.x, cropBox.y],
                      [cropBox.x + cropBox.w, cropBox.y],
                      [cropBox.x, cropBox.y + cropBox.h],
                      [cropBox.x + cropBox.w, cropBox.y + cropBox.h],
                    ].map(([cx, cy], i) => (
                      <Circle key={i} cx={cx} cy={cy} r={7} fill="#FBBF24" />
                    ))}
                  </>
                )}
              </Svg>
              {/* Tool hints */}
              {tool === 'text' && !textPos && (
                <View pointerEvents="none" style={ann.hint}>
                  <Text style={ann.hintText}>Tap anywhere to place text</Text>
                </View>
              )}
              {tool === 'erase' && (
                <View pointerEvents="none" style={ann.hint}>
                  <Text style={ann.hintText}>Drag to erase strokes</Text>
                </View>
              )}
              {tool === 'crop' && (
                <View pointerEvents="none" style={ann.hint}>
                  <Text style={ann.hintText}>Drag to select crop area</Text>
                </View>
              )}
            </View>
          </GestureDetector>

          {/* Crop apply button */}
          {tool === 'crop' && cropBox.w > 40 && (
            <TouchableOpacity
              style={ann.cropBtn}
              onPress={applyCrop}
              disabled={cropping}
            >
              <Ionicons name="crop" size={18} color="#fff" />
              <Text style={ann.cropBtnText}>{cropping ? 'Cropping...' : 'Apply Crop'}</Text>
            </TouchableOpacity>
          )}

          {/* Text Input Overlay */}
          {textPos && (
            <View style={ann.textInputOverlay} pointerEvents="box-none">
              <View style={ann.textInputCard}>
                <TextInput
                  style={[ann.textInputField, { color }]}
                  value={textInput}
                  onChangeText={setTextInput}
                  placeholder="Type label..."
                  placeholderTextColor="#999"
                  autoFocus
                  maxLength={60}
                />
                <View style={ann.textInputActions}>
                  <TouchableOpacity onPress={() => { setTextPos(null); setTextInput(''); }} style={ann.textCancelBtn}>
                    <Text style={{ color: '#999', fontWeight: '600' }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={addTextAnnotation} style={ann.textAddBtn}>
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Toolbar */}
          <View style={ann.toolbar}>
            {/* Tool Row */}
            <View style={ann.toolRow}>
              {([
                { id: 'pen', icon: 'pencil', label: 'Draw' },
                { id: 'text', icon: 'text', label: 'Text' },
                { id: 'erase', icon: 'remove-circle-outline', label: 'Erase' },
                { id: 'crop', icon: 'crop', label: 'Crop' },
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
              <View style={ann.divV} />
              <TouchableOpacity style={ann.toolBtn} onPress={() => setActions((a) => a.slice(0, -1))}>
                <Ionicons name="arrow-undo-outline" size={20} color="#aaa" />
                <Text style={ann.toolLabel}>Undo</Text>
              </TouchableOpacity>
              <TouchableOpacity style={ann.toolBtn} onPress={() => setActions([])}>
                <Ionicons name="trash-outline" size={20} color="#ef4444" />
                <Text style={[ann.toolLabel, { color: '#ef4444' }]}>Clear</Text>
              </TouchableOpacity>
            </View>

            {/* Color + Width Row */}
            <View style={ann.colorRow}>
              {PALETTE.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[ann.colorDot, { backgroundColor: c }, color === c && ann.colorDotActive]}
                  onPress={() => setColor(c)}
                />
              ))}
              <View style={ann.divV} />
              {WIDTHS.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[ann.widthBtn, strokeWidth === w && ann.widthBtnActive]}
                  onPress={() => setStrokeWidth(w)}
                >
                  <View style={{ width: Math.max(w, 4), height: Math.max(w, 4), borderRadius: w * 2, backgroundColor: color }} />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </GestureHandlerRootView>
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

  const pickImage = async (side: 'front' | 'back', fromCamera = false) => {
    const perm = fromCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission needed'); return; }
    const result = fromCamera
      ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
    if (!result.canceled && result.assets[0]) {
      if (side === 'front') { setFrontImageUri(result.assets[0].uri); setFrontPaths([]); setFrontTexts([]); }
      else { setBackImageUri(result.assets[0].uri); setBackPaths([]); setBackTexts([]); }
    }
  };

  const handleSave = async () => {
    if (!front.trim() && !frontImageUri) { Alert.alert('Required', 'Add content to the front side.'); return; }
    if (!back.trim() && !backImageUri) { Alert.alert('Required', 'Add content to the back side.'); return; }
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

  const typeConfig = {
    basic: { frontLabel: 'QUESTION', backLabel: 'ANSWER', frontBg: Colors.white, backBg: Colors.white, accentColor: Colors.azure },
    definition: { frontLabel: 'TERM', backLabel: 'DEFINITION', frontBg: Colors.azureLight, backBg: Colors.white, accentColor: Colors.azure },
    cloze: { frontLabel: 'SENTENCE WITH BLANKS  ·  use {{c1::word}}', backLabel: 'FULL ANSWER', frontBg: '#FFFBEB', backBg: Colors.white, accentColor: '#D97706' },
    visual: { frontLabel: 'IMAGE + ANNOTATION', backLabel: 'DESCRIPTION / LABEL', frontBg: '#F0F9FF', backBg: Colors.white, accentColor: '#0891B2' },
  };

  const cfg = typeConfig[cardType];

  const renderClozePreview = (text: string) => {
    const parts = text.split(/({{c\d+::.*?}})/g);
    return (
      <Text style={styles.clozePreviewText}>
        {parts.map((part, i) => {
          const match = part.match(/{{c\d+::(.*?)}}/);
          return match ? <Text key={i} style={styles.clozeBlank}>[{match[1]}]</Text> : <Text key={i}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
        {/* Type Selector */}
        <View style={styles.typeRow}>
          {CARD_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeChip, cardType === type && { borderColor: typeConfig[type].accentColor, backgroundColor: typeConfig[type].accentColor + '18' }]}
              onPress={() => setCardType(type)}
            >
              <Text style={[styles.typeChipText, cardType === type && { color: typeConfig[type].accentColor }]}>
                {{ basic: '📝', definition: '📖', cloze: '✏️', visual: '🖼️' }[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Panel Tabs */}
        <View style={styles.panelTabs}>
          {(['front', 'back'] as const).map((panel) => (
            <TouchableOpacity
              key={panel}
              style={[styles.panelTab, activePanel === panel && { borderBottomColor: cfg.accentColor }]}
              onPress={() => setActivePanel(panel)}
            >
              <Text style={[styles.panelTabText, activePanel === panel && { color: cfg.accentColor }]}>
                {panel === 'front' ? (cardType === 'definition' ? 'Term' : cardType === 'visual' ? 'Image' : 'Front') : (cardType === 'definition' ? 'Definition' : 'Back')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Visual front panel */}
          {cardType === 'visual' && activePanel === 'front' ? (
            <View style={[styles.visualPanel, { borderColor: '#0891B240' }]}>
              <Text style={[styles.panelLabel, { color: '#0891B2' }]}>{cfg.frontLabel}</Text>
              {currentImage ? (
                <View style={styles.imageCanvas}>
                  <Image source={{ uri: currentImage }} style={styles.annotatedImage} resizeMode="contain" />
                  <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                    {frontPaths.map((p) => (
                      <Path key={p.id} d={p.d} stroke={p.color} strokeWidth={p.width} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                    {frontTexts.map((t) => (
                      <SvgText key={t.id} x={t.x} y={t.y} fill={t.color} fontSize="16" fontWeight="bold" stroke="#000" strokeWidth="0.4">{t.text}</SvgText>
                    ))}
                  </Svg>
                  <View style={styles.imageActionBar}>
                    <TouchableOpacity style={styles.imageActionBtn} onPress={() => setShowAnnotator(true)}>
                      <Ionicons name="pencil" size={15} color="#fff" /><Text style={styles.imageActionText}>Annotate</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.imageActionBtn} onPress={() => { setFrontImageUri(undefined); setFrontPaths([]); setFrontTexts([]); }}>
                      <Ionicons name="trash-outline" size={15} color="#fff" /><Text style={styles.imageActionText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={() => pickImage('front')}>
                  <Ionicons name="image-outline" size={52} color="#0891B2" />
                  <Text style={styles.imagePlaceholderTitle}>Add Image</Text>
                  <Text style={styles.imagePlaceholderSub}>Tap to select from photo library</Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.panelLabel, { color: '#0891B2', marginTop: Spacing.md }]}>CAPTION (optional)</Text>
              <TextInput style={styles.cardInput} value={front} onChangeText={setFront} placeholder="Caption or question..." placeholderTextColor={Colors.textLight} multiline textAlignVertical="top" />
            </View>
          ) : (
            <View style={[styles.cardPanel, { backgroundColor: activePanel === 'front' ? cfg.frontBg : cfg.backBg, borderColor: cfg.accentColor + '40' }]}>
              <Text style={[styles.panelLabel, { color: cfg.accentColor }]}>{activePanel === 'front' ? cfg.frontLabel : cfg.backLabel}</Text>

              {cardType === 'definition' && activePanel === 'front' ? (
                <TextInput style={[styles.termInput, { borderColor: cfg.accentColor, color: cfg.accentColor }]} value={currentText} onChangeText={setCurrentText} placeholder="Enter the term..." placeholderTextColor={cfg.accentColor + '60'} multiline />
              ) : (
                <TextInput style={styles.cardInput} value={currentText} onChangeText={setCurrentText} placeholder={activePanel === 'front' ? 'Front of card...' : 'Back of card...'} placeholderTextColor={Colors.textLight} multiline textAlignVertical="top" />
              )}

              {cardType === 'cloze' && activePanel === 'front' && currentText.includes('{{') && (
                <View style={styles.clozePreview}>
                  <Text style={styles.clozePreviewLabel}>PREVIEW</Text>
                  {renderClozePreview(currentText)}
                </View>
              )}

              {currentImage && (
                <View style={styles.imageAttached}>
                  <Image source={{ uri: currentImage }} style={styles.attachedThumb} resizeMode="cover" />
                  <TouchableOpacity onPress={() => { if (activePanel === 'front') setFrontImageUri(undefined); else setBackImageUri(undefined); }} style={styles.removeImageBtn}>
                    <Ionicons name="close-circle" size={22} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Tool bar for non-visual or visual back */}
          {(cardType !== 'visual' || activePanel === 'back') && (
            <View style={styles.toolsRow}>
              <TouchableOpacity style={styles.tool} onPress={() => pickImage(activePanel)}>
                <Ionicons name="image-outline" size={22} color={Colors.text} /><Text style={styles.toolLabel}>Image</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.tool} onPress={() => pickImage(activePanel, true)}>
                <Ionicons name="camera-outline" size={22} color={Colors.text} /><Text style={styles.toolLabel}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          {cardType === 'cloze' && (
            <View style={styles.clozeHintBox}>
              <Text style={styles.clozeHintText}>✏️ Wrap words with {'{{c1::answer}}'} to create blanks. Use c1, c2, c3 for multiple.</Text>
            </View>
          )}

          <View style={styles.saveArea}>
            <Button title="Save Card" onPress={handleSave} loading={loading} fullWidth size="lg" />
          </View>
        </ScrollView>

        {showAnnotator && currentImage && (
          <AnnotationCanvas
            imageUri={currentImage}
            onSave={(savedPaths, savedTexts, finalUri) => {
              if (activePanel === 'front') { setFrontPaths(savedPaths); setFrontTexts(savedTexts); setFrontImageUri(finalUri); }
              else { setBackPaths(savedPaths); setBackTexts(savedTexts); setBackImageUri(finalUri); }
              setShowAnnotator(false);
            }}
            onClose={() => setShowAnnotator(false)}
          />
        )}
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

// ─── Annotation Styles ────────────────────────────────────────────────────────
const ann = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, paddingVertical: 12, backgroundColor: '#111' },
  topBtn: { padding: 8 },
  topTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  topSaveBtn: { backgroundColor: Colors.azure, paddingHorizontal: 16, paddingVertical: 7, borderRadius: Radius.full },
  topSaveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  canvas: { flex: 1, backgroundColor: '#000', position: 'relative' },
  canvasImage: { width: '100%', height: '100%' },
  hint: { position: 'absolute', bottom: 16, left: 0, right: 0, alignItems: 'center' },
  hintText: { color: 'rgba(255,255,255,0.75)', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.5)', padding: 6, borderRadius: 8 },
  cropBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#D97706', padding: 12 },
  cropBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  textInputOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  textInputCard: { backgroundColor: '#1a1a1a', borderRadius: Radius.xl, padding: Spacing.md, width: SW * 0.85 },
  textInputField: { fontSize: 18, fontWeight: '600', padding: Spacing.sm, borderBottomWidth: 1, borderBottomColor: '#444', marginBottom: Spacing.md },
  textInputActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md },
  textCancelBtn: { padding: 8 },
  textAddBtn: { backgroundColor: Colors.azure, paddingHorizontal: 20, paddingVertical: 8, borderRadius: Radius.full },
  toolbar: { backgroundColor: '#111', paddingBottom: Platform.OS === 'ios' ? 20 : 8 },
  toolRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingTop: 10, gap: 4 },
  toolBtn: { alignItems: 'center', marginRight: 14 },
  toolBtnActive: {},
  toolLabel: { color: '#aaa', fontSize: 10, marginTop: 3 },
  colorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 8 },
  colorDot: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: 'transparent' },
  colorDotActive: { borderColor: '#fff', transform: [{ scale: 1.2 }] },
  widthBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#333' },
  widthBtnActive: { backgroundColor: '#555' },
  divV: { width: 1, height: 28, backgroundColor: '#333', marginHorizontal: 4 },
});

// ─── Editor Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  typeRow: { flexDirection: 'row', padding: Spacing.sm, gap: 4, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  typeChip: { flex: 1, paddingVertical: 8, borderRadius: Radius.md, backgroundColor: Colors.borderLight, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: Colors.textMuted },
  panelTabs: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  panelTab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  panelTabText: { fontSize: 14, fontWeight: '700', color: Colors.textMuted },
  cardPanel: { margin: Spacing.md, borderRadius: Radius.xl, borderWidth: 1.5, padding: Spacing.md, minHeight: 180 },
  panelLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.5, color: Colors.textLight, marginBottom: Spacing.sm },
  cardInput: { fontSize: 18, color: Colors.text, minHeight: 100, lineHeight: 26 },
  termInput: { fontSize: 24, fontWeight: '800', borderBottomWidth: 2, paddingBottom: Spacing.sm, minHeight: 60, lineHeight: 32 },
  clozePreview: { marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: '#FFFBEB', borderRadius: Radius.md, borderWidth: 1, borderColor: '#F59E0B40' },
  clozePreviewLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.5, color: '#D97706', marginBottom: 4 },
  clozePreviewText: { fontSize: 16, color: Colors.text, lineHeight: 24 },
  clozeBlank: { backgroundColor: '#FDE68A', color: '#92400E', fontWeight: '700', borderRadius: 4, paddingHorizontal: 4 },
  clozeHintBox: { marginHorizontal: Spacing.md, marginBottom: Spacing.sm, backgroundColor: '#FFFBEB', borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: '#F59E0B30' },
  clozeHintText: { fontSize: 13, color: '#92400E', lineHeight: 20 },
  visualPanel: { margin: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md, borderWidth: 1.5, borderColor: '#0891B240', backgroundColor: '#F0F9FF' },
  imagePlaceholder: { height: 220, borderRadius: Radius.xl, borderWidth: 2, borderStyle: 'dashed', borderColor: '#0891B2', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, backgroundColor: '#F0F9FF' },
  imagePlaceholderTitle: { fontSize: 18, fontWeight: '700', color: '#0891B2' },
  imagePlaceholderSub: { fontSize: 13, color: '#0891B2AA' },
  imageCanvas: { height: SW * 0.72, borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: '#000', position: 'relative' },
  annotatedImage: { width: '100%', height: '100%' },
  imageActionBar: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', gap: Spacing.sm },
  imageActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0,0,0,0.65)', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  imageActionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  imageAttached: { marginTop: Spacing.sm, position: 'relative', alignSelf: 'flex-start' },
  attachedThumb: { width: 120, height: 90, borderRadius: Radius.md },
  removeImageBtn: { position: 'absolute', top: -8, right: -8 },
  toolsRow: { flexDirection: 'row', backgroundColor: Colors.white, borderTopWidth: 1, borderTopColor: Colors.border, borderBottomWidth: 1, borderBottomColor: Colors.border, paddingVertical: Spacing.sm },
  tool: { flex: 1, alignItems: 'center', paddingVertical: 6 },
  toolLabel: { fontSize: 11, color: Colors.textMuted, marginTop: 3 },
  saveArea: { padding: Spacing.md, paddingBottom: Spacing.xl },
});
