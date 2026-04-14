import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { Spacing, Radius, Typography } from '../../constants/theme';
import { Avatar, PlanBadge, Divider } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

function MenuItem({ icon, label, onPress, badge, danger, colors }: {
  icon: string; label: string; onPress: () => void; badge?: string; danger?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <TouchableOpacity style={[styles.menuItem, { borderColor: colors.border }]} onPress={onPress} activeOpacity={0.75}>
      <Ionicons name={icon as any} size={20} color={danger ? colors.error : colors.text} />
      <Text style={[styles.menuLabel, { color: danger ? colors.error : colors.text }]}>{label}</Text>
      {badge ? (
        <View style={[styles.menuBadge, { backgroundColor: colors.azure }]}>
          <Text style={styles.menuBadgeText}>{badge}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textLight} style={{ marginLeft: 'auto' }} />
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const profile = useQuery(api.users.getMyProfile);
  const myDecks = useQuery(api.decks.listMine, {});
  const { signOut } = useAuthActions();

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.push('/settings/profile')}>
            <Avatar name={profile?.name ?? 'Student'} imageUrl={profile?.avatarUrl} size={72} color={colors.azure} />
          </TouchableOpacity>
          <View style={styles.profileInfo}>
            <View style={styles.profileNameRow}>
              <Text style={[styles.profileName, { color: colors.text }]}>{profile?.name ?? 'Student'}</Text>
              <PlanBadge plan={profile?.plan ?? 'free'} />
            </View>
            {/* School Badge */}
            {profile?.school && (
              <View style={[styles.schoolBadge, { backgroundColor: colors.azure + '18', borderColor: colors.azure + '40' }]}>
                <Ionicons name="school-outline" size={13} color={colors.azure} />
                <Text style={[styles.schoolBadgeText, { color: colors.azure }]}>{profile.school}</Text>
              </View>
            )}
            {profile?.bio && <Text style={[styles.profileBio, { color: colors.textMuted }]}>{profile.bio}</Text>}
            {profile?.courseEnrolled && <Text style={[styles.profileCourse, { color: colors.azure }]}>Enrolled in {profile.courseEnrolled}</Text>}
          </View>
          <TouchableOpacity style={[styles.editBtn, { backgroundColor: colors.azureLight }]} onPress={() => router.push('/settings/profile')}>
            <Ionicons name="create-outline" size={18} color={colors.azure} />
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={[styles.stats, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>{myDecks?.length ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Decks</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>🔥 {profile?.streakDays ?? 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Streak</Text>
          </View>
          <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.text }]}>
              {profile?.plan === 'premium' ? '∞' : profile?.plan === 'starter' ? '10' : '2'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Daily Imports</Text>
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ACCOUNT</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <MenuItem icon="person-outline" label="Edit Profile" onPress={() => router.push('/settings/profile')} colors={colors} />
            <Divider spacing={0} />
            <MenuItem icon="diamond-outline" label="Subscription & Plans" onPress={() => router.push('/settings/subscription')} colors={colors} />
          </View>
        </View>

        {/* Study */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>STUDY</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <MenuItem icon="albums-outline" label="My Decks" onPress={() => router.push('/mydecks' as any)} colors={colors} />
            <Divider spacing={0} />
            <MenuItem icon="time-outline" label="Study History" onPress={() => router.push('/settings/history' as any)} colors={colors} />
          </View>
        </View>

        {/* App */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>APP</Text>
          <View style={[styles.menuGroup, { backgroundColor: colors.white, borderColor: colors.border }]}>
            {/* Dark Mode toggle */}
            <View style={[styles.menuItem, { borderColor: colors.border }]}>
              <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={20} color={colors.text} />
              <Text style={[styles.menuLabel, { color: colors.text }]}>Dark Mode</Text>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.azure }}
                thumbColor={colors.white}
                style={{ marginLeft: 'auto' }}
              />
            </View>
            <Divider spacing={0} />
            <MenuItem icon="notifications-outline" label="Notifications" onPress={() => router.push('/settings/notifications' as any)} colors={colors} />
            <Divider spacing={0} />
            <MenuItem icon="shield-outline" label="Privacy Policy" onPress={() => router.push('/settings/privacy' as any)} colors={colors} />
            <Divider spacing={0} />
            <MenuItem icon="help-circle-outline" label="Help & Support" onPress={() => router.push('/settings/help' as any)} colors={colors} />
          </View>
        </View>

        {/* Sign Out */}
        <View style={[styles.section, { marginBottom: Spacing.xxl }]}>
          <View style={[styles.menuGroup, { backgroundColor: colors.white, borderColor: colors.border }]}>
            <MenuItem icon="log-out-outline" label="Sign Out" onPress={handleSignOut} danger colors={colors} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
  },
  profileInfo: { flex: 1 },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 6, flexWrap: 'wrap' },
  profileName: { fontSize: 18, fontWeight: '700' },
  schoolBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: Radius.full, borderWidth: 1, marginBottom: 4,
  },
  schoolBadgeText: { fontSize: 11, fontWeight: '600' },
  profileBio: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  profileCourse: { fontSize: 11, marginTop: 4 },
  editBtn: { width: 36, height: 36, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
  stats: { flexDirection: 'row', borderBottomWidth: 1, paddingVertical: Spacing.md },
  statItem: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1 },
  section: { padding: Spacing.md, paddingBottom: 0 },
  sectionLabel: { fontSize: 12, fontWeight: '500', letterSpacing: 1, marginBottom: Spacing.sm },
  menuGroup: { borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  menuLabel: { fontSize: 15, flex: 1 },
  menuBadge: { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 'auto' },
  menuBadgeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
});
