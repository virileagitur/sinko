import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList,
  Image, Alert, KeyboardAvoidingView, Platform, ActivityIndicator,
  Pressable, ScrollView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';


type Tab = 'chat' | 'members' | 'settings';

export default function GroupScreen() {
  const { colors } = useTheme();
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useQuery(api.groups.getById, { groupId: groupId as any });
  const messages = useQuery(api.groups.listMessages, { groupId: groupId as any });
  const members = useQuery(api.groups.getMembers, { groupId: groupId as any });
  const myRole = useQuery(api.groups.getMyRole, { groupId: groupId as any });
  const gates = useQuery(api.users.getPlanGates);
  const sendMessage = useMutation(api.groups.sendMessage);
  const updateGroup = useMutation(api.groups.updateGroup);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  const [tab, setTab] = useState<Tab>('chat');
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);

  // Settings edit state
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPrivate, setEditPrivate] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setEditName(group.name);
      setEditDesc(group.description ?? '');
      setEditPrivate(group.isPrivate);
    }
  }, [group?._id]);

  // Auto-scroll chat to bottom on new message
  useEffect(() => {
    if (messages && messages.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages?.length]);

  const handleSend = async () => {
    if (!input.trim()) return;
    setSending(true);
    try {
      await sendMessage({ groupId: groupId as any, content: input.trim() });
      setInput('');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not send message');
    } finally {
      setSending(false);
    }
  };

  const handleAttachFile = async () => {
    const limitMb = gates?.fileSizeLimitMb ?? 0;
    if (limitMb === 0) {
      Alert.alert('Paid Feature', 'File sharing requires a Starter or Premium plan.', [
        { text: 'Not Now', style: 'cancel' },
        { text: 'See Plans', onPress: () => router.push('/settings/subscription') },
      ]);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const sizeBytes = (asset as any).fileSize ?? 0;
    const limitBytes = limitMb * 1024 * 1024;
    if (sizeBytes > limitBytes) {
      Alert.alert('File Too Large', `Your plan allows up to ${limitMb} MB. This file is ${(sizeBytes / 1024 / 1024).toFixed(1)} MB.`);
      return;
    }

    setSending(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const blob = await (await fetch(asset.uri)).blob();
      const uploadRes = await fetch(uploadUrl, { method: 'POST', headers: { 'Content-Type': asset.mimeType ?? 'image/jpeg' }, body: blob });
      if (!uploadRes.ok) throw new Error('Upload failed');
      await sendMessage({ groupId: groupId as any, content: `📎 Shared a file`, fileUrls: [asset.uri] } as any);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message);
    } finally {
      setSending(false);
    }
  };

  const uploadImage = async (side: 'avatar' | 'banner') => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    try {
      const uploadUrl = await generateUploadUrl();
      const blob = await (await fetch(result.assets[0].uri)).blob();
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': result.assets[0].mimeType ?? 'image/jpeg' },
        body: blob,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const { storageId } = await uploadRes.json();
      const imageUrl = result.assets[0].uri; // Optimistic local URI

      if (side === 'avatar') {
        await updateGroup({ groupId: groupId as any, avatarUrl: imageUrl, avatarStorageId: storageId });
      } else {
        await updateGroup({ groupId: groupId as any, bannerUrl: imageUrl, bannerStorageId: storageId });
      }
    } catch (e: any) {
      Alert.alert('Upload failed', e?.message);
    }
  };

  const handleSaveSettings = async () => {
    if (!editName.trim()) { Alert.alert('Required', 'Group name cannot be empty'); return; }
    setSaving(true);
    try {
      await updateGroup({
        groupId: groupId as any,
        name: editName.trim(),
        description: editDesc.trim() || undefined,
        isPrivate: editPrivate,
      });
      Alert.alert('Saved!', 'Group settings updated.');
    } catch (e: any) {
      Alert.alert('Error', e?.message);
    } finally {
      setSaving(false);
    }
  };

  if (!group) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.azure} />
      </View>
    );
  }

  const isAdmin = myRole === 'admin';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['bottom']}>
      {/* ── Group Header (Banner + Avatar) ── */}
      <View>
        {/* Banner */}
        <TouchableOpacity
          disabled={!isAdmin}
          onPress={() => isAdmin && uploadImage('banner')}
          activeOpacity={isAdmin ? 0.8 : 1}
        >
          <View style={[styles.banner, group.bannerUrl ? undefined : { backgroundColor: group.avatarColor + '44' }]}>
            {group.bannerUrl ? (
              <Image source={{ uri: group.bannerUrl }} style={styles.bannerImage} resizeMode="cover" />
            ) : (
              <View style={styles.bannerPlaceholder}>
                {isAdmin && <Ionicons name="camera-outline" size={22} color={group.avatarColor} />}
              </View>
            )}
            {isAdmin && (
              <View style={styles.bannerEditBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>

        {/* Back button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>

        {/* Avatar */}
        <View style={[styles.avatarArea, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => isAdmin && uploadImage('avatar')} disabled={!isAdmin}>
            <View style={[styles.groupAvatar, { backgroundColor: group.avatarColor + '30', borderColor: colors.white }]}>
              {group.avatarUrl ? (
                <Image source={{ uri: group.avatarUrl }} style={{ width: '100%', height: '100%', borderRadius: Radius.full }} />
              ) : (
                <Text style={[styles.avatarText, { color: group.avatarColor }]}>
                  {group.name.slice(0, 2).toUpperCase()}
                </Text>
              )}
              {isAdmin && (
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={10} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
          <View>
            <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
            <Text style={[styles.groupMeta, { color: colors.textMuted }]}>
              {group.memberCount} members · {group.isPrivate ? '🔒 Private' : '🌍 Public'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={[styles.tabRow, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        {([
          { id: 'chat', label: 'Chat', icon: 'chatbubbles-outline' },
          { id: 'members', label: 'Members', icon: 'people-outline' },
          ...(isAdmin ? [{ id: 'settings', label: 'Settings', icon: 'settings-outline' }] : []),
        ] as { id: Tab; label: string; icon: string }[]).map((t) => (
          <TouchableOpacity
            key={t.id}
            style={[styles.tab, tab === t.id && { borderBottomWidth: 2.5, borderBottomColor: colors.azure }]}
            onPress={() => setTab(t.id)}
          >
            <Ionicons name={t.icon as any} size={16} color={tab === t.id ? colors.azure : colors.textMuted} />
            <Text style={[styles.tabText, { color: tab === t.id ? colors.azure : colors.textMuted }]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Chat Tab ── */}
      {tab === 'chat' && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatRef}
            data={messages}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.chatList}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.chatEmpty}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textLight} />
                <Text style={[styles.chatEmptyText, { color: colors.textMuted }]}>No messages yet. Say hi! 👋</Text>
              </View>
            )}
            renderItem={({ item }) => (
              <View style={styles.messageRow}>
                <View style={[styles.msgAvatar, { backgroundColor: colors.azure + '22' }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: colors.azure }}>
                    {(item.authorName ?? 'S').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.messageBubble, { backgroundColor: colors.white, borderColor: colors.border }]}>
                  <Text style={[styles.msgAuthor, { color: colors.azure }]}>{item.authorName ?? 'Student'}</Text>
                  <Text style={[styles.msgContent, { color: colors.text }]}>{item.content}</Text>
                </View>
              </View>
            )}
          />

          {/* Input bar */}
          <View style={[styles.inputBar, { borderTopColor: colors.border, backgroundColor: colors.white }]}>
            <TouchableOpacity onPress={handleAttachFile} style={{ padding: 4 }}>
              <Ionicons name="attach" size={22} color={gates?.canShareFiles ? colors.azure : colors.textLight} />
            </TouchableOpacity>
            <TextInput
              style={[styles.chatInput, { backgroundColor: colors.borderLight, color: colors.text }]}
              value={input}
              onChangeText={setInput}
              placeholder="Write a message..."
              placeholderTextColor={colors.textLight}
              multiline
              maxLength={500}
              returnKeyType="send"
              blurOnSubmit={false}
            />
            <Pressable
              style={({ pressed }) => [styles.sendBtn, { opacity: pressed || !input.trim() ? 0.5 : 1, backgroundColor: colors.azure }]}
              onPress={handleSend}
              disabled={!input.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* ── Members Tab ── */}
      {tab === 'members' && (
        <FlatList
          data={members}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.sm }}
          renderItem={({ item }) => (
            <View style={[styles.memberRow, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <View style={[styles.memberAvatar, { backgroundColor: colors.azure + '22' }]}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.azure }}>
                  {(item.name ?? 'S').charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.memberName, { color: colors.text }]}>{item.name}</Text>
                {item.school && <Text style={[styles.memberSchool, { color: colors.textMuted }]}>🎓 {item.school}</Text>}
              </View>
              {item.role === 'admin' && (
                <View style={[styles.adminBadge, { backgroundColor: colors.azureLight }]}>
                  <Text style={[styles.adminBadgeText, { color: colors.azure }]}>Admin</Text>
                </View>
              )}
            </View>
          )}
        />
      )}

      {/* ── Settings Tab (admin only) ── */}
      {tab === 'settings' && isAdmin && (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.md, gap: Spacing.md }}>
          <Text style={[styles.settingsSection, { color: colors.textMuted }]}>GROUP PHOTOS</Text>
          <View style={styles.photoRow}>
            <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.white, borderColor: colors.azure }]} onPress={() => uploadImage('avatar')}>
              {group.avatarUrl ? (
                <Image source={{ uri: group.avatarUrl }} style={styles.photoThumb} />
              ) : (
                <Ionicons name="person-circle-outline" size={32} color={colors.azure} />
              )}
              <Text style={[styles.photoBtnText, { color: colors.azure }]}>Group Avatar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.photoBtn, { backgroundColor: colors.white, borderColor: colors.azure }]} onPress={() => uploadImage('banner')}>
              {group.bannerUrl ? (
                <Image source={{ uri: group.bannerUrl }} style={styles.photoThumb} />
              ) : (
                <Ionicons name="image-outline" size={32} color={colors.azure} />
              )}
              <Text style={[styles.photoBtnText, { color: colors.azure }]}>Banner Photo</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.settingsSection, { color: colors.textMuted }]}>GROUP INFO</Text>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Name *</Text>
          <TextInput
            style={[styles.fieldInput, { backgroundColor: colors.borderLight, borderColor: colors.border, color: colors.text }]}
            value={editName}
            onChangeText={setEditName}
            placeholder="Group name"
            placeholderTextColor={colors.textLight}
            maxLength={60}
          />
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Description</Text>
          <TextInput
            style={[styles.fieldInput, { minHeight: 80, backgroundColor: colors.borderLight, borderColor: colors.border, color: colors.text }]}
            value={editDesc}
            onChangeText={setEditDesc}
            placeholder="What does this group study?"
            placeholderTextColor={colors.textLight}
            multiline
            textAlignVertical="top"
          />

          <Pressable style={styles.privacyRow} onPress={() => setEditPrivate((p) => !p)}>
            <View style={[styles.checkbox, { borderColor: colors.border }, editPrivate && { backgroundColor: colors.azure, borderColor: colors.azure }]}>
              {editPrivate && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <View>
              <Text style={[styles.privacyLabel, { color: colors.text }]}>Private Group</Text>
              <Text style={[styles.privacyHint, { color: colors.textMuted }]}>Only invited members can join</Text>
            </View>
          </Pressable>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.azure }, saving && { opacity: 0.5 }]}
            onPress={handleSaveSettings}
            disabled={saving}
          >
            {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  banner: { height: 130, width: '100%' },
  bannerImage: { width: '100%', height: '100%' },
  bannerPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  bannerEditBadge: {
    position: 'absolute', bottom: 8, right: 10,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 12, padding: 5,
  },
  backBtn: {
    position: 'absolute', top: 12, left: 12,
    backgroundColor: 'rgba(0,0,0,0.45)', borderRadius: 20, padding: 6,
  },
  avatarArea: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    marginTop: -24,
  },
  groupAvatar: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 3, alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', position: 'relative',
  },
  avatarText: { fontSize: 20, fontWeight: '800' },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    borderRadius: 10, padding: 3,
  },
  groupName: { fontSize: 16, fontWeight: '700' },
  groupMeta: { ...Typography.caption },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 4 },
  tabText: { fontSize: 13, fontWeight: '600' },
  // Chat
  chatList: { padding: Spacing.md, paddingBottom: 12 },
  chatEmpty: { paddingTop: 60, alignItems: 'center', gap: Spacing.sm },
  chatEmptyText: { ...Typography.bodySmall },
  messageRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 12 },
  msgAvatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  messageBubble: {
    flex: 1, borderRadius: Radius.lg,
    borderWidth: 1, padding: Spacing.sm,
  },
  msgAuthor: { fontSize: 12, fontWeight: '700', marginBottom: 2 },
  msgContent: { fontSize: 14, lineHeight: 20 },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.sm, paddingHorizontal: Spacing.md,
    borderTopWidth: 1,
  },
  chatInput: {
    flex: 1, borderRadius: Radius.xl,
    paddingHorizontal: 14, paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15, maxHeight: 120,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  // Members
  memberRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md,
  },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  memberName: { fontSize: 14, fontWeight: '600' },
  memberSchool: { ...Typography.caption },
  adminBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full },
  adminBadgeText: { fontSize: 11, fontWeight: '700' },
  // Settings
  settingsSection: { ...Typography.label, marginTop: Spacing.sm },
  photoRow: { flexDirection: 'row', gap: Spacing.md },
  photoBtn: {
    flex: 1, borderRadius: Radius.lg, borderWidth: 1.5,
    borderStyle: 'dashed', padding: Spacing.md,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.xs, minHeight: 80,
  },
  photoThumb: { width: 48, height: 48, borderRadius: Radius.md },
  photoBtnText: { fontSize: 12, fontWeight: '600' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  fieldInput: {
    borderRadius: Radius.md, padding: Spacing.md,
    fontSize: 15, borderWidth: 1,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  privacyLabel: { fontSize: 15, fontWeight: '600' },
  privacyHint: { fontSize: 12 },
  saveBtn: {
    borderRadius: Radius.lg, padding: 14,
    alignItems: 'center', marginTop: Spacing.sm,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
