import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  Modal, KeyboardAvoidingView, Platform, Alert, Pressable,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'decks' | 'forum' | 'groups';

export default function CourseDetailScreen() {
  const { courseId, tab: initialTab } = useLocalSearchParams<{ courseId: string; tab?: string }>();
  const course = useQuery(api.courses.getById, { courseId: courseId as any });
  const decks = useQuery(api.decks.listByCourse, { courseId: courseId as any });
  const forumPosts = useQuery(api.forum.listByCourse, { courseId: courseId as any });
  const groups = useQuery(api.groups.listByCourse, { courseId: courseId as any });
  const createPost = useMutation(api.forum.createPost);
  const createGroup = useMutation(api.groups.create);
  const joinGroup = useMutation(api.groups.join);
  const gates = useQuery(api.users.getPlanGates);

  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) ?? 'decks');

  // Forum compose modal state
  const [showPostModal, setShowPostModal] = useState(false);
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postLoading, setPostLoading] = useState(false);

  // Group create modal state
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [groupPrivate, setGroupPrivate] = useState(false);
  const [groupLoading, setGroupLoading] = useState(false);

  const handleCreatePost = async () => {
    if (!postTitle.trim() || !postContent.trim()) {
      Alert.alert('Required', 'Please add a title and content.');
      return;
    }
    setPostLoading(true);
    try {
      await createPost({
        courseId: courseId as any,
        title: postTitle.trim(),
        content: postContent.trim(),
      });
      setPostTitle('');
      setPostContent('');
      setShowPostModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create post.');
    } finally {
      setPostLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!gates?.canCreateGroups) {
      Alert.alert(
        'Starter Plan Required',
        'Creating and joining study groups requires a Starter or Premium subscription.',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'View Plans', onPress: () => router.push('/settings/subscription') },
        ]
      );
      return;
    }
    if (!groupName.trim()) {
      Alert.alert('Required', 'Please enter a group name.');
      return;
    }
    setGroupLoading(true);
    try {
      await createGroup({
        courseId: courseId as any,
        name: groupName.trim(),
        description: groupDesc.trim() || undefined,
        isPrivate: groupPrivate,
      });
      setGroupName('');
      setGroupDesc('');
      setGroupPrivate(false);
      setShowGroupModal(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'Could not create group.');
    } finally {
      setGroupLoading(false);
    }
  };

  if (!course) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      {/* Course Header */}
      <View style={styles.courseHeader}>
        <View style={[styles.courseIconWrap, { backgroundColor: course.color + '20' }]}>
          <Text style={{ fontSize: 36 }}>{course.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.courseName}>{course.name}</Text>
          <Text style={styles.courseDept}>{course.department}</Text>
          <Text style={styles.courseDesc}>{course.description}</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['decks', 'forum', 'groups'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ─── DECKS ─── */}
        {activeTab === 'decks' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => router.push(`/deck/create?courseId=${courseId}`)}
            >
              <Ionicons name="add" size={20} color={Colors.azure} />
              <Text style={styles.createBtnText}>Create Deck for {course.name}</Text>
            </TouchableOpacity>

            {decks && decks.length > 0 ? (
              decks.map((deck) => (
                <TouchableOpacity
                  key={deck._id}
                  style={styles.deckCard}
                  onPress={() => router.push(`/deck/${deck._id}`)}
                  activeOpacity={0.85}
                >
                  <View style={styles.deckCardLeft}>
                    <Ionicons name="albums" size={24} color={Colors.azure} />
                    <View>
                      <Text style={styles.deckTitle}>{deck.title}</Text>
                      <Text style={styles.deckMeta}>{deck.cardCount} cards · {deck.isPublic ? 'Public' : 'Private'}</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.studyBtn}
                    onPress={() => router.push(`/study/flashcard?deckId=${deck._id}`)}
                  >
                    <Text style={styles.studyBtnText}>Study →</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.empty}>
                <Text style={{ fontSize: 40, textAlign: 'center' }}>📚</Text>
                <Text style={[Typography.body, { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }]}>
                  No decks yet. Be the first to create one!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── FORUM ─── */}
        {activeTab === 'forum' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowPostModal(true)}>
              <Ionicons name="create-outline" size={20} color={Colors.azure} />
              <Text style={styles.createBtnText}>Start a discussion</Text>
            </TouchableOpacity>

            {forumPosts && forumPosts.length > 0 ? (
              forumPosts.map((post) => (
                <TouchableOpacity
                  key={post._id}
                  style={styles.postCard}
                  onPress={() => router.push(`/forum/${post._id}` as any)}
                  activeOpacity={0.85}
                >
                  {post.isPinned && (
                    <View style={styles.pinnedBadge}>
                      <Ionicons name="pin" size={12} color={Colors.azure} />
                      <Text style={styles.pinnedText}>Pinned</Text>
                    </View>
                  )}
                  <Text style={styles.postTitle}>{post.title}</Text>
                  <Text style={styles.postContent} numberOfLines={2}>{post.content}</Text>
                  <View style={styles.postMeta}>
                    <View style={styles.reactionRow}>
                      <Text style={styles.reactionItem}>👍 {post.reactions.like}</Text>
                      <Text style={styles.reactionItem}>💡 {post.reactions.helpful}</Text>
                      <Text style={styles.reactionItem}>🔥 {post.reactions.fire}</Text>
                    </View>
                    <Text style={Typography.caption}>{post.commentCount} comments</Text>
                  </View>
                  {post.fileUrls.length > 0 && (
                    <View style={styles.attachBadge}>
                      <Ionicons name="attach" size={13} color={Colors.textMuted} />
                      <Text style={styles.attachText}>{post.fileUrls.length} document{post.fileUrls.length > 1 ? 's' : ''}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.empty}>
                <Text style={{ fontSize: 40, textAlign: 'center' }}>💬</Text>
                <Text style={[Typography.body, { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }]}>
                  No discussions yet. Start the conversation!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ─── GROUPS ─── */}
        {activeTab === 'groups' && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowGroupModal(true)}>
              <Ionicons name="add" size={20} color={Colors.azure} />
              <Text style={styles.createBtnText}>Create a Study Group</Text>
            </TouchableOpacity>

            {groups && groups.length > 0 ? (
              groups.map((group) => (
                <TouchableOpacity
                  key={group._id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/group/${group._id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.groupAvatar, { backgroundColor: group.avatarColor + '25' }]}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: group.avatarColor }}>
                      {group.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMeta}>
                      {group.memberCount} members · {group.isPrivate ? '🔒 Private' : '🌍 Public'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.joinBtn}
                    onPress={() => joinGroup({ groupId: group._id }).catch(() => {})}
                  >
                    <Text style={styles.joinBtnText}>Join</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.empty}>
                <Text style={{ fontSize: 40, textAlign: 'center' }}>👥</Text>
                <Text style={[Typography.body, { textAlign: 'center', color: Colors.textMuted, marginTop: Spacing.sm }]}>
                  No groups yet. Create one to study together!
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ─── FORUM POST MODAL ─── */}
      <Modal visible={showPostModal} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPostModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Discussion</Text>
            <TouchableOpacity onPress={handleCreatePost} disabled={postLoading}>
              <Text style={[styles.modalPost, postLoading && { opacity: 0.5 }]}>Post</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.modalTitleInput}
              placeholder="Title"
              placeholderTextColor={Colors.textLight}
              value={postTitle}
              onChangeText={setPostTitle}
              maxLength={120}
            />
            <View style={styles.modalDivider} />
            <TextInput
              style={styles.modalBodyInput}
              placeholder="What do you want to discuss?"
              placeholderTextColor={Colors.textLight}
              value={postContent}
              onChangeText={setPostContent}
              multiline
              textAlignVertical="top"
              autoFocus
            />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── GROUP CREATE MODAL ─── */}
      <Modal visible={showGroupModal} animationType="slide" presentationStyle="formSheet">
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.white }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowGroupModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Study Group</Text>
            <TouchableOpacity onPress={handleCreateGroup} disabled={groupLoading}>
              <Text style={[styles.modalPost, groupLoading && { opacity: 0.5 }]}>Create</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, padding: Spacing.md }} keyboardShouldPersistTaps="handled">
            <Text style={styles.fieldLabel}>Group Name *</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="e.g. Midterm Study Crew"
              placeholderTextColor={Colors.textLight}
              value={groupName}
              onChangeText={setGroupName}
              maxLength={60}
              autoFocus
            />
            <Text style={styles.fieldLabel}>Description (optional)</Text>
            <TextInput
              style={[styles.fieldInput, { minHeight: 80 }]}
              placeholder="What will this group study?"
              placeholderTextColor={Colors.textLight}
              value={groupDesc}
              onChangeText={setGroupDesc}
              multiline
              textAlignVertical="top"
            />
            <Pressable
              style={styles.privacyRow}
              onPress={() => setGroupPrivate((p) => !p)}
            >
              <View style={[styles.checkbox, groupPrivate && styles.checkboxActive]}>
                {groupPrivate && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
              <View>
                <Text style={styles.privacyLabel}>Private Group</Text>
                <Text style={styles.privacyHint}>Only members you invite can join</Text>
              </View>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  courseHeader: {
    flexDirection: 'row', gap: Spacing.md, padding: Spacing.md,
    backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, alignItems: 'center',
  },
  courseIconWrap: { width: 64, height: 64, borderRadius: Radius.lg, alignItems: 'center', justifyContent: 'center' },
  courseName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  courseDept: { ...Typography.caption, color: Colors.azure, marginTop: 2 },
  courseDesc: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  tabRow: { flexDirection: 'row', backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.azure },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.azure },
  content: { flex: 1 },
  section: { padding: Spacing.md, gap: Spacing.sm },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: Colors.azure,
    borderRadius: Radius.lg, padding: Spacing.md, backgroundColor: Colors.azureLight,
  },
  createBtnText: { color: Colors.azure, fontWeight: '600', fontSize: 14 },
  deckCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  deckCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  deckTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  deckMeta: { ...Typography.caption, color: Colors.textMuted },
  studyBtn: { backgroundColor: Colors.azureLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full },
  studyBtnText: { color: Colors.azure, fontSize: 13, fontWeight: '600' },
  postCard: { backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md },
  pinnedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  pinnedText: { fontSize: 11, color: Colors.azure, fontWeight: '600' },
  postTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  postContent: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 18 },
  postMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.sm },
  reactionRow: { flexDirection: 'row', gap: Spacing.sm },
  reactionItem: { fontSize: 12, color: Colors.textMuted },
  attachBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.sm },
  attachText: { ...Typography.caption, color: Colors.textMuted },
  groupCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.white, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border, padding: Spacing.md,
  },
  groupAvatar: { width: 44, height: 44, borderRadius: Radius.md, alignItems: 'center', justifyContent: 'center' },
  groupName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  groupMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  joinBtn: { backgroundColor: Colors.azure, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full },
  joinBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  empty: { padding: Spacing.xl, alignItems: 'center' },
  // Modal styles
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalCancel: { fontSize: 15, color: Colors.textMuted },
  modalPost: { fontSize: 15, fontWeight: '700', color: Colors.azure },
  modalTitleInput: {
    fontSize: 20, fontWeight: '700', color: Colors.text,
    padding: Spacing.md, paddingBottom: Spacing.sm,
  },
  modalDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  modalBodyInput: {
    fontSize: 16, color: Colors.text, padding: Spacing.md,
    minHeight: 200, lineHeight: 24,
  },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginBottom: 6, marginTop: Spacing.md },
  fieldInput: {
    backgroundColor: Colors.borderLight, borderRadius: Radius.md,
    padding: Spacing.md, fontSize: 15, color: Colors.text,
    borderWidth: 1, borderColor: Colors.border,
  },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginTop: Spacing.lg },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  checkboxActive: { backgroundColor: Colors.azure, borderColor: Colors.azure },
  privacyLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  privacyHint: { fontSize: 12, color: Colors.textMuted, marginTop: 1 },
});
