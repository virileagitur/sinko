import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image
} from 'react-native';
import { router } from 'expo-router';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Spacing, Radius, Typography } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function CommunityScreen() {
  const { colors } = useTheme();
  const courses = useQuery(api.courses.listAll, {});
  const myGroups = useQuery(api.groups.getMyGroups);

  const popularCourses = courses?.slice(0, 8);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Community</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>Connect with students in your courses</Text>
        </View>

        {/* My Groups */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>My Groups</Text>
          </View>
          {myGroups && myGroups.length > 0 ? (
            <View style={styles.groupList}>
              {myGroups.map((group: any) => (
                <TouchableOpacity
                  key={group._id}
                  style={[styles.groupCard, { backgroundColor: colors.white, borderColor: colors.border }]}
                  onPress={() => router.push(`/group/${group._id}` as any)}
                  activeOpacity={0.85}
                >
                  {/* Show real avatar or initials */}
                  <View style={[styles.groupAvatar, { backgroundColor: group.avatarColor + '25' }]}>
                    {group.avatarUrl ? (
                      <Image
                        source={{ uri: group.avatarUrl }}
                        style={{ width: '100%', height: '100%', borderRadius: Radius.md }}
                      />
                    ) : (
                      <Text style={{ color: group.avatarColor, fontWeight: '700', fontSize: 16 }}>
                        {group.name.slice(0, 2).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.groupInfo}>
                    <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                    <Text style={[styles.groupMeta, { color: colors.textMuted }]}>{group.memberCount} members</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={[styles.emptyGroups, { backgroundColor: colors.white, borderColor: colors.border }]}>
              <Ionicons name="people-outline" size={32} color={colors.textLight} />
              <Text style={[Typography.bodySmall, { color: colors.textMuted, marginTop: Spacing.sm }]}>
                Join a group from any course page
              </Text>
            </View>
          )}
        </View>

        {/* Popular Course Forums */}
        <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Course Forums</Text>
          <Text style={[Typography.bodySmall, { color: colors.textMuted, marginBottom: Spacing.md }]}>
            Tap any course to join the discussion
          </Text>
          <View style={styles.forumList}>
            {popularCourses?.map((course) => (
              <TouchableOpacity
                key={course._id}
                style={[styles.forumCard, { backgroundColor: colors.white, borderColor: colors.border }]}
                onPress={() => router.push(`/course/${course._id}?tab=forum`)}
                activeOpacity={0.85}
              >
                <View style={[styles.forumIcon, { backgroundColor: course.color + '18' }]}>
                  <Text style={{ fontSize: 20 }}>{course.icon}</Text>
                </View>
                <View style={styles.forumInfo}>
                  <Text style={[styles.forumName, { color: colors.text }]}>{course.name}</Text>
                  <Text style={[styles.forumDept, { color: colors.textMuted }]}>{course.department}</Text>
                </View>
                <View style={[styles.forumBadge, { backgroundColor: colors.azureLight }]}>
                  <Ionicons name="chatbubbles-outline" size={14} color={colors.azure} />
                  <Text style={[styles.forumBadgeText, { color: colors.azure }]}>Forum</Text>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => router.push('/discover')}
            >
              <Text style={{ color: colors.azure, fontWeight: '600', fontSize: 14 }}>
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
  pageTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  pageSubtitle: { fontSize: 13 },
  section: { padding: Spacing.md },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 0 },
  groupList: { gap: Spacing.sm },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  groupAvatar: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  groupInfo: { flex: 1 },
  groupName: { fontSize: 15, fontWeight: '600' },
  groupMeta: { fontSize: 11, marginTop: 2 },
  emptyGroups: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  forumList: { gap: Spacing.sm },
  forumCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
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
  forumName: { fontSize: 14, fontWeight: '600' },
  forumDept: { fontSize: 11, marginTop: 1 },
  forumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  forumBadgeText: { fontSize: 11, fontWeight: '600' },
  viewAllBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
});
