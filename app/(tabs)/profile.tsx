import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Avatar, PlanBadge, Divider } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
  danger?: boolean;
}

function MenuItem({ icon, label, onPress, badge, danger }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={icon as any} size={20} color={danger ? Colors.error : Colors.text} />
      <Text style={[styles.menuLabel, danger && { color: Colors.error }]}>{label}</Text>
      {badge && (
        <View style={styles.menuBadge}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      )}
      {!badge && <Ionicons name="chevron-forward" size={16} color={Colors.textLight} style={{ marginLeft: 'auto' }} />}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const profile = useQuery(api.users.getMyProfile);
  const myDecks = useQuery(api.decks.listMine);
  const subscription = useQuery(api.subscriptions.getMySubscription);
  const { signOut } = useAuthActions();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive', onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        }
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={() => router.push('/settings/profile')}>
            <Avatar
              name={profile?.name ?? 'Student'}
              imageUrl={profile?.avatarUrl}
              size={72}
              color={Colors.azure}
            />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={styles.profileName}>{profile?.name ?? 'Student'}</Text>
              <PlanBadge plan={profile?.plan ?? 'free'} />
            </View>
            {profile?.school && (
              <Text style={styles.profileSchool}>🎓 {profile.school}</Text>
            )}
            {profile?.bio && (
              <Text style={styles.profileBio}>{profile.bio}</Text>
            )}
            {profile?.courseEnrolled && (
              <Text style={styles.profileCourse}>Enrolled in {profile.courseEnrolled}</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/settings/profile')}
          >
            <Ionicons name="create-outline" size={18} color={Colors.azure} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{myDecks?.length ?? 0}</Text>
            <Text style={styles.statLabel}>Decks</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>🔥 {profile?.streakDays ?? 0}</Text>
            <Text style={styles.statLabel}>Streak</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {profile?.plan === 'premium' ? '∞' : profile?.plan === 'starter' ? '10' : '2'}
            </Text>
            <Text style={styles.statLabel}>Daily Imports</Text>
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/settings/profile')} />
            <Divider spacing={0} />
            <MenuItem icon="diamond-outline" label="Subscription & Plans" onPress={() => router.push('/settings/subscription')} />
          </View>
        </View>

        {/* Study Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>STUDY</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="albums-outline" label="My Decks" onPress={() => router.push('/discover')} />
            <Divider spacing={0} />
            <MenuItem icon="time-outline" label="Study History" onPress={() => {}} />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>APP</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
            <Divider spacing={0} />
            <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => {}} />
            <Divider spacing={0} />
            <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => {}} />
          </View>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
          <View style={styles.menuGroup}>
            <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileInfo: { flex: 1 },
  profileNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  profileName: { fontSize: 18, fontWeight: '700', color: Colors.text },
  profileSchool: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 2 },
  profileBio: { ...Typography.bodySmall, color: Colors.textMuted, marginTop: 4, lineHeight: 18 },
  profileCourse: { ...Typography.caption, color: Colors.azure, marginTop: 4 },
  editBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.azureLight,
  },
  stats: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.md,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700', color: Colors.text },
  statLabel: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  section: { padding: Spacing.md, paddingBottom: 0 },
  sectionLabel: {
    ...Typography.label,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  menuGroup: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  menuLabel: { fontSize: 15, color: Colors.text, flex: 1 },
  menuBadge: {
    backgroundColor: Colors.azure,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 'auto',
  },
  menuBadgeText: { color: Colors.white, fontSize: 11, fontWeight: '600' },
});
