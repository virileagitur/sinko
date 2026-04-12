import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CommunityScreen() {
  const courses = useQuery(api.courses.listAll, {});
  const myGroups = useQuery(api.groups.getMyGroups);

  const popularCourses = courses?.slice(0, 8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Community</Text>
          <Text style={styles.pageSubtitle}>Connect with students in your courses</Text>
        </View>

        {/* My Groups */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Groups</Text>
          </View>
          {myGroups && myGroups.length > 0 ? (
            <View style={styles.groupList}>
              {myGroups.map((group: any) => (
                <TouchableOpacity
                  key={group._id}
                  style={styles.groupCard}
                  onPress={() => router.push(`/group/${group._id}` as any)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.groupAvatar, { backgroundColor: group.avatarColor + '25' }]}>
                    <Text style={{ color: group.avatarColor, fontWeight: '700', fontSize: 16 }}>
                      {group.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={styles.groupName}>{group.name}</Text>
                    <Text style={styles.groupMeta}>{group.memberCount} members</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={Colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyGroups}>
              <Ionicons name="people-outline" size={32} color={Colors.textLight} />
              <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginTop: Spacing.sm }]}>
                Join a group from any course page
              </Text>
            </View>
          )}
        </View>

        {/* Popular Course Forums */}
        <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
          <Text style={styles.sectionTitle}>Course Forums</Text>
          <Text style={[Typography.bodySmall, { color: Colors.textMuted, marginBottom: Spacing.md }]}>
            Tap any course to join the discussion
          </Text>
          <View style={styles.forumList}>
            {popularCourses?.map((course) => (
              <TouchableOpacity
                key={course._id}
                style={styles.forumCard}
                onPress={() => router.push(`/course/${course._id}?tab=forum`)}
                activeOpacity={0.85}
              >
                <View style={[styles.forumIcon, { backgroundColor: course.color + '18' }]}>
                  <Text style={{ fontSize: 20 }}>{course.icon}</Text>
                </View>
                <View style={styles.forumInfo}>
                  <Text style={styles.forumName}>{course.name}</Text>
                  <Text style={styles.forumDept}>{course.department}</Text>
                </View>
                <View style={styles.forumBadge}>
                  <Ionicons name="chatbubbles-outline" size={14} color={Colors.azure} />
                  <Text style={styles.forumBadgeText}>Forum</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/discover')}
            >
              <Text style={{ color: Colors.azure, fontWeight: '600', fontSize: 14 }}>
                View all {courses?.length} courses →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageHeader: { padding: Spacing.md, paddingBottom: 0 },
  pageTitle: { ...Typography.h2, marginBottom: 4 },
  pageSubtitle: { ...Typography.bodySmall, color: Colors.textMuted },
  section: { padding: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { ...Typography.h4 },
  groupList: { gap: Spacing.sm },
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
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  groupMeta: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  emptyGroups: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  forumList: { gap: Spacing.sm },
  forumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  forumIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  forumInfo: { flex: 1 },
  forumName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  forumDept: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  forumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.azureLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  forumBadgeText: { fontSize: 11, fontWeight: '600', color: Colors.azure },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
