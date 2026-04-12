import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Avatar, Button } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Id } from '../../convex/_generated/dataModel';

export default function GroupRoomScreen() {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const group = useQuery(api.groups.getById, { groupId: groupId as Id<'groups'> });
  const members = useQuery(api.groups.getMembers, { groupId: groupId as Id<'groups'> });
  const forumPosts = useQuery(api.forum.listByGroup, { groupId: groupId as Id<'groups'> });
  const myProfile = useQuery(api.users.getMyProfile);
  const leaveGroup = useMutation(api.groups.leave);
  const joinGroup = useMutation(api.groups.join);

  const [tab, setTab] = useState<'feed' | 'members'>('feed');
  const [leaving, setLeaving] = useState(false);

  const isMember = members?.some((m: any) => m.userId === myProfile?._id);

  const handleLeave = () => {
    Alert.alert('Leave Group', `Leave "${group?.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Leave', style: 'destructive', onPress: async () => {
          setLeaving(true);
          try {
            await leaveGroup({ groupId: groupId as Id<'groups'> });
            router.back();
          } catch (err: any) {
            Alert.alert('Error', err?.message ?? 'Could not leave group.');
          } finally {
            setLeaving(false);
          }
        }
      }
    ]);
  };

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}><ActivityIndicator color={Colors.azure} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Group Header */}
      <View style={styles.groupHeader}>
        <View style={[styles.groupAvatar, { backgroundColor: (group.avatarColor ?? Colors.azure) + '25' }]}>
          <Text style={{ fontWeight: '800', fontSize: 22, color: group.avatarColor ?? Colors.azure }}>
            {group.name.slice(0, 2).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupMeta}>
            {group.memberCount} members · {group.isPrivate ? '🔒 Private' : '🌍 Public'}
          </Text>
          {group.description && (
            <Text style={styles.groupDesc} numberOfLines={2}>{group.description}</Text>
          )}
        </View>
        {isMember ? (
          <TouchableOpacity style={styles.leaveBtn} onPress={handleLeave} disabled={leaving}>
            {leaving
              ? <ActivityIndicator size="small" color={Colors.error} />
              : <Text style={{ color: Colors.error, fontWeight: '600', fontSize: 13 }}>Leave</Text>
            }
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.joinBtn}
            onPress={() => joinGroup({ groupId: groupId as Id<'groups'> }).catch(() => {})}
          >
            <Text style={{ color: Colors.white, fontWeight: '600', fontSize: 13 }}>Join</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['feed', 'members'] as const).map((t) => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'feed' ? 'Discussions' : `Members (${members?.length ?? 0})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      {tab === 'feed' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {isMember && (
            <TouchableOpacity
              style={styles.newPostBtn}
              onPress={() => Alert.alert('Post', 'Create a post in this group (coming soon)')}
            >
              <Ionicons name="create-outline" size={18} color={Colors.azure} />
              <Text style={{ color: Colors.azure, fontWeight: '600', fontSize: 14 }}>
                Write something...
              </Text>
            </TouchableOpacity>
          )}

          {forumPosts && forumPosts.length > 0 ? (
            forumPosts.map((post: any) => (
              <TouchableOpacity
                key={post._id}
                style={styles.postCard}
                onPress={() => router.push(`/forum/${post._id}` as any)}
                activeOpacity={0.85}
              >
                {post.isPinned && (
                  <View style={styles.pinnedRow}>
                    <Ionicons name="pin" size={12} color={Colors.azure} />
                    <Text style={styles.pinnedText}>Pinned</Text>
                  </View>
                )}
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.postPreview} numberOfLines={2}>{post.content}</Text>
                <View style={styles.postFooter}>
                  <Text style={styles.postReactions}>
                    👍 {post.reactions.like}  💡 {post.reactions.helpful}  🔥 {post.reactions.fire}
                  </Text>
                  <Text style={Typography.caption}>{post.commentCount} comments</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.textLight} />
              <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: Spacing.sm, textAlign: 'center' }]}>
                No posts yet. Start the conversation!
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Members */}
      {tab === 'members' && (
        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {members?.map((member: any) => (
            <View key={member._id} style={styles.memberRow}>
              <Avatar name={member.name ?? 'Student'} imageUrl={member.avatarUrl} size={40} />
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <Text style={styles.memberName}>{member.name ?? 'Student'}</Text>
                  {member.role === 'admin' && (
                    <View style={styles.adminBadge}>
                      <Text style={styles.adminText}>Admin</Text>
                    </View>
                  )}
                </View>
                {member.school && (
                  <Text style={styles.memberSchool}>{member.school}</Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  groupAvatar: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupName: { fontSize: 17, fontWeight: '700', color: Colors.text },
  groupMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  groupDesc: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 4 },
  leaveBtn: {
    borderWidth: 1.5,
    borderColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  joinBtn: {
    backgroundColor: Colors.azure,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.azure },
  tabText: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabTextActive: { color: Colors.azure },
  scroll: { flex: 1 },
  newPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.azureMid,
    borderStyle: 'dashed',
    padding: Spacing.md,
  },
  postCard: {
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  pinnedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  pinnedText: { fontSize: 11, color: Colors.azure, fontWeight: '600' },
  postTitle: { fontSize: 15, fontWeight: '600', color: Colors.text, marginBottom: 4 },
  postPreview: { ...Typography.bodySmall, color: Colors.textMuted, lineHeight: 18 },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  postReactions: { fontSize: 12, color: Colors.textMuted },
  empty: { padding: Spacing.xxl, alignItems: 'center' },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  memberName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  memberSchool: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  adminBadge: {
    backgroundColor: Colors.azureLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  adminText: { fontSize: 10, fontWeight: '700', color: Colors.azure },
});
