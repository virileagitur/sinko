import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Avatar, Button, Input } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];

export default function EditProfileScreen() {
  const profile = useQuery(api.users.getMyProfile);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [school, setSchool] = useState('');
  const [yearLevel, setYearLevel] = useState('');
  const [courseEnrolled, setCourseEnrolled] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);

  React.useEffect(() => {
    if (profile) {
      setName(profile.name ?? '');
      setBio(profile.bio ?? '');
      setSchool(profile.school ?? '');
      setYearLevel(profile.yearLevel ?? '');
      setCourseEnrolled(profile.courseEnrolled ?? '');
      setAvatarUrl(profile.avatarUrl);
    }
  }, [profile]);

  const pickAvatar = async () => {
    const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission needed', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaType.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarLoading(true);
      try {
        const asset = result.assets[0];
        const uploadUrl = await generateUploadUrl();

        const res = await fetch(asset.uri);
        const blob = await res.blob();

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'image/jpeg' },
          body: blob,
        });

        if (uploadRes.ok) {
          setAvatarUrl(asset.uri); // Use local URI optimistically
        }
      } catch {
        Alert.alert('Upload failed', 'Could not upload image. Try again.');
      } finally {
        setAvatarLoading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setLoading(true);
    try {
      await updateProfile({ name, bio, school, yearLevel, courseEnrolled, avatarUrl });
      Alert.alert('Saved!', 'Your profile has been updated.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch {
      Alert.alert('Error', 'Could not save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickAvatar} style={styles.avatarWrapper}>
            {avatarLoading ? (
              <View style={[styles.avatarPlaceholder, { backgroundColor: Colors.azureLight }]}>
                <ActivityIndicator color={Colors.azure} />
              </View>
            ) : (
              <Avatar name={name || 'User'} imageUrl={avatarUrl} size={84} />
            )}
            <View style={styles.avatarEditBadge}>
              <Ionicons name="camera" size={14} color={Colors.white} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Full Name *"
            value={name}
            onChangeText={setName}
            placeholder="Your full name"
            icon={<Ionicons name="person-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others about yourself..."
            multiline
            numberOfLines={3}
            icon={<Ionicons name="chatbubble-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="School / University"
            value={school}
            onChangeText={setSchool}
            placeholder="e.g. University of the Philippines"
            icon={<Ionicons name="school-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="Course Enrolled"
            value={courseEnrolled}
            onChangeText={setCourseEnrolled}
            placeholder="e.g. Computer Science"
            icon={<Ionicons name="book-outline" size={18} color={Colors.textLight} />}
          />

          {/* Year Level */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>YEAR LEVEL</Text>
            <View style={styles.chipRow}>
              {YEAR_LEVELS.map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.chip, yearLevel === yr && styles.chipActive]}
                  onPress={() => setYearLevel(yr)}
                >
                  <Text style={[styles.chipText, yearLevel === yr && styles.chipTextActive]}>{yr}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <Button
            title="Save Changes"
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
  avatarSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarWrapper: { position: 'relative' },
  avatarPlaceholder: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.azure,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarHint: { ...Typography.caption, color: Colors.textMuted, marginTop: Spacing.sm },
  form: { padding: Spacing.md, gap: Spacing.xs },
  fieldGroup: { marginBottom: Spacing.md },
  fieldLabel: {
    ...Typography.label,
    letterSpacing: 0.5,
    marginBottom: Spacing.sm,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.azure, borderColor: Colors.azure },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  chipTextActive: { color: Colors.white },
});
