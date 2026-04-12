import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert
} from 'react-native';
import { useLocalSearchParams, router, useNavigation } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Avatar, Button, Divider } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

type Tab = 'decks' | 'forum' | 'groups';

export default function CourseDetailScreen() {
  const { courseId, tab: initialTab } = useLocalSearchParams<{ courseId: string; tab?: string }>();
  const course = useQuery(api.courses.getById, { courseId: courseId as any });
  const decks = useQuery(api.decks.listByCourse, { courseId: courseId as any });
  const forumPosts = useQuery(api.forum.listByCourse, { courseId: courseId as any });
  const groups = useQuery(api.groups.listByCourse, { courseId: courseId as any });
  const createGroup = useMutation(api.groups.create);
  const joinGroup = useMutation(api.groups.join);
  const createDeck = useMutation(api.decks.create);

  const [activeTab, setActiveTab] = useState<Tab>((initialTab as Tab) ?? 'decks');

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
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() => Alert.alert('Post', 'Forum post creation — tap to write')}
            >
              <Ionicons name="create-outline" size={20} color={Colors.azure} />
              <Text style={styles.createBtnText}>Start a discussion</Text>
            </TouchableOpacity>

            {forumPosts && forumPosts.length > 0 ? (
              forumPosts.map((post) => (
                <TouchableOpacity
                  key={post._id}
                  style={styles.postCard}
                  onPress={() => router.push(`/forum/${post._id}`)}
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
            <TouchableOpacity
              style={styles.createBtn}
              onPress={() =>
                Alert.alert('Create Group', 'Enter group name', [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Create', onPress: async () => {
                      await createGroup({ courseId: courseId as any, name: 'New Study Group', isPrivate: false });
                    }
                  }
                ])
              }
            >
              <Ionicons name="add" size={20} color={Colors.azure} />
              <Text style={styles.createBtnText}>Create a Study Group</Text>
            </TouchableOpacity>

            {groups && groups.length > 0 ? (
              groups.map((group) => (
                <TouchableOpacity
                  key={group._id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/group/${group._id}`)}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  courseHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  courseIconWrap: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  courseDept: { ...Typography.caption, color: Colors.azure, marginTop: 2 },
  courseDesc: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.azure,
  },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.azure },
  content: { flex: 1 },
  section: { padding: Spacing.md, gap: Spacing.sm },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.azure,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    backgroundColor: Colors.azureLight,
  },
  createBtnText: { color: Colors.azure, fontWeight: '600', fontSize: 14 },
  deckCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  deckCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1 },
  deckTitle: { fontSize: 14, fontWeight: '600', color: Colors.text },
  deckMeta: { ...Typography.caption, color: Colors.textMuted },
  studyBtn: {
    backgroundColor: Colors.azureLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  studyBtnText: { color: Colors.azure, fontSize: 13, fontWeight: '600' },
  postCard: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  pinnedText: { fontSize: 11, color: Colors.azure, fontWeight: '600' },
  postTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  postContent: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 18 },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  reactionRow: { flexDirection: 'row', gap: Spacing.sm },
  reactionItem: { fontSize: 12, color: Colors.textMuted },
  attachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing.sm,
  },
  attachText: { ...Typography.caption, color: Colors.textMuted },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  groupMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  joinBtn: {
    backgroundColor: Colors.azure,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  joinBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  empty: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
});
