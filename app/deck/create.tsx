import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button, Input, EmptyState } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CreateDeckScreen() {
  const { courseId } = useLocalSearchParams<{ courseId?: string }>();
  const courses = useQuery(api.courses.listAll, {});
  const createDeck = useMutation(api.decks.create);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseId ?? '');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Title required', 'Please enter a deck title.');
      return;
    }
    if (!selectedCourseId) {
      Alert.alert('Course required', 'Please select a course for this deck.');
      return;
    }
    setLoading(true);
    try {
      const deckId = await createDeck({
        courseId: selectedCourseId as any,
        title: title.trim(),
        description: description || undefined,
        isPublic,
        tags: [],
      });
      router.replace(`/deck/${deckId}`);
    } catch {
      Alert.alert('Error', 'Could not create deck. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Input
            label="Deck Title *"
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Biochemistry Midterm"
            icon={<Ionicons name="albums-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What is this deck about?"
            multiline
            numberOfLines={3}
          />

          {/* Visibility */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>VISIBILITY</Text>
            <View style={styles.visRow}>
              <TouchableOpacity
                style={[styles.visChip, isPublic && styles.visChipActive]}
                onPress={() => setIsPublic(true)}
              >
                <Ionicons name="globe-outline" size={16} color={isPublic ? Colors.white : Colors.textMuted} />
                <Text style={[styles.visText, isPublic && styles.visTextActive]}>Public</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.visChip, !isPublic && styles.visChipActive]}
                onPress={() => setIsPublic(false)}
              >
                <Ionicons name="lock-closed-outline" size={16} color={!isPublic ? Colors.white : Colors.textMuted} />
                <Text style={[styles.visText, !isPublic && styles.visTextActive]}>Private</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Course selection */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>COURSE *</Text>
            <ScrollView style={styles.courseScroll} showsVerticalScrollIndicator={false} nestedScrollEnabled>
              {courses?.slice(0, 20).map((course) => (
                <TouchableOpacity
                  key={course._id}
                  style={[styles.courseOption, selectedCourseId === course._id && styles.courseOptionActive]}
                  onPress={() => setSelectedCourseId(course._id)}
                >
                  <Text style={{ fontSize: 20 }}>{course.icon}</Text>
                  <Text style={[styles.courseOptionText, selectedCourseId === course._id && { color: Colors.azure }]}>
                    {course.name}
                  </Text>
                  {selectedCourseId === course._id && (
                    <Ionicons name="checkmark" size={18} color={Colors.azure} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Button
            title="Create Deck"
            onPress={handleCreate}
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
  form: { padding: Spacing.md, gap: Spacing.xs },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: { ...Typography.label, letterSpacing: 0.5, marginBottom: Spacing.sm },
  visRow: { flexDirection: 'row', gap: Spacing.sm },
  visChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Colors.borderLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  visChipActive: { backgroundColor: Colors.azure, borderColor: Colors.azure },
  visText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  visTextActive: { color: Colors.white },
  courseScroll: {
    maxHeight: 200,
    backgroundColor: Colors.white,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  courseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  courseOptionActive: { backgroundColor: Colors.azureLight },
  courseOptionText: { flex: 1, fontSize: 14, color: Colors.text },
});
