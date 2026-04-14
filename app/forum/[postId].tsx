import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Avatar } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Id } from '../../convex/_generated/dataModel';

const REACTIONS = [
  { key: 'like', emoji: '👍' },
  { key: 'helpful', emoji: '💡' },
  { key: 'fire', emoji: '🔥' },
];

export default function ForumThreadScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const post = useQuery(api.forum.getPost, { postId: postId as Id<'forumPosts'> });
  const comments = useQuery(api.forum.listComments, { postId: postId as Id<'forumPosts'> });
  const addComment = useMutation(api.forum.addComment);
  const addReaction = useMutation(api.forum.addReaction);
  const profile = useQuery(api.users.getMyProfile);

  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);

  const handleComment = async () => {
    if (!comment.trim()) return;
    setPosting(true);
    try {
      await addComment({ postId: postId as Id<'forumPosts'>, content: comment.trim() });
      setComment('');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Could not post comment.');
    } finally {
      setPosting(false);
    }
  };

  const handleReact = async (reaction: string) => {
    try {
      await addReaction({ postId: postId as Id<'forumPosts'>, reaction: reaction as any });
    } catch {}
  };

  if (!post) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.azure} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Original Post */}
          <View style={styles.postCard}>
            {post.isPinned && (
              <View style={styles.pinnedRow}>
                <Ionicons name="pin" size={13} color={Colors.azure} />
                <Text style={styles.pinnedText}>Pinned</Text>
              </View>
            )}
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postContent}>{post.content}</Text>

            {/* Attachments */}
            {post.fileUrls.length > 0 && (
              <View style={styles.attachments}>
                {post.fileUrls.map((url, i) => (
                  <View key={i} style={styles.attachmentChip}>
                    <Ionicons name="document-outline" size={14} color={Colors.azure} />
                    <Text style={styles.attachmentText}>Document {i + 1}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Reactions */}
            <View style={styles.reactRow}>
              {REACTIONS.map(({ key, emoji }) => (
                <TouchableOpacity
                  key={key}
                  style={styles.reactBtn}
                  onPress={() => handleReact(key)}
                >
                  <Text style={styles.reactEmoji}>{emoji}</Text>
                  <Text style={styles.reactCount}>
                    {post.reactions[key as keyof typeof post.reactions] ?? 0}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Comments Header */}
          <Text style={styles.commentsHeader}>
            {comments?.length ?? 0} comment{(comments?.length ?? 0) !== 1 ? 's' : ''}
          </Text>

          {/* Comments List */}
          {comments && comments.length > 0 ? (
            comments.map((c) => (
              <View key={c._id} style={styles.commentCard}>
                <Avatar name={c.authorName ?? 'Student'} imageUrl={c.authorAvatar} size={34} />
                <View style={styles.commentBody}>
                  <View style={styles.commentMeta}>
                    <Text style={styles.commentAuthor}>{c.authorName ?? 'Student'}</Text>
                    <Text style={styles.commentTime}>
                      {new Date(c._creationTime).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{c.content}</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyComments}>
              <Ionicons name="chatbubble-outline" size={32} color={Colors.textLight} />
              <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: Spacing.sm }]}>
                Be the first to comment!
              </Text>
            </View>
          )}
        </ScrollView>

        {/* Comment Input */}
        <View style={styles.inputBar}>
          <Avatar name={profile?.name ?? 'You'} imageUrl={profile?.avatarUrl} size={34} />
          <TextInput
            style={styles.commentInput}
            value={comment}
            onChangeText={setComment}
            placeholder="Write a comment..."
            placeholderTextColor={Colors.textLight}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!comment.trim() || posting) && { opacity: 0.4 }]}
            onPress={handleComment}
            disabled={!comment.trim() || posting}
          >
            {posting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  postCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pinnedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: Spacing.sm },
  pinnedText: { fontSize: 12, color: Colors.azure, fontWeight: '600' },
  postTitle: { fontSize: 20, fontWeight: '700', color: Colors.text, marginBottom: Spacing.sm, lineHeight: 26 },
  postContent: { fontSize: 15, color: Colors.textMuted, lineHeight: 22, marginBottom: Spacing.md },
  attachments: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.md },
  attachmentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.azureLight,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  attachmentText: { fontSize: 12, color: Colors.azure, fontWeight: '500' },
  reactRow: { flexDirection: 'row', gap: Spacing.sm },
  reactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  reactEmoji: { fontSize: 14 },
  reactCount: { fontSize: 13, fontWeight: '600', color: Colors.text },
  commentsHeader: {
    ...Typography.label,
    padding: Spacing.md,
    paddingBottom: Spacing.sm,
    color: Colors.textMuted,
  },
  commentCard: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  commentBody: { flex: 1 },
  commentMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '600', color: Colors.text },
  commentTime: { ...Typography.caption, color: Colors.textLight },
  commentContent: { fontSize: 14, color: Colors.text, lineHeight: 20 },
  emptyComments: {
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 9,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.azure,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
