import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NotifRowProps {
  icon: string;
  label: string;
  sublabel: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

function NotifRow({ icon, label, sublabel, value, onChange }: NotifRowProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIconWrap}>
        <Ionicons name={icon as any} size={20} color={Colors.azure} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sublabel}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.azure }}
        thumbColor={Colors.white}
      />
    </View>
  );
}

export default function NotificationsScreen() {
  const profile = useQuery(api.users.getMyProfile);
  const updatePrefs = useMutation(api.users.updateNotifPrefs);
  const [saving, setSaving] = useState(false);

  if (!profile) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator color={Colors.azure} />
      </SafeAreaView>
    );
  }

  const update = async (key: string, val: boolean) => {
    setSaving(true);
    try {
      await updatePrefs({ [key]: val } as any);
    } finally {
      setSaving(false);
    }
  };

  const prefs = {
    notifyDailyReminder: profile.notifyDailyReminder ?? true,
    notifyStreak: profile.notifyStreak ?? true,
    notifyGroupMessages: profile.notifyGroupMessages ?? true,
    notifySubscription: profile.notifySubscription ?? true,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={{ padding: Spacing.md }}>
        <Text style={styles.sectionLabel}>STUDY</Text>
        <View style={styles.card}>
          <NotifRow
            icon="sunny-outline"
            label="Daily Study Reminder"
            sublabel="Get reminded to study every day"
            value={prefs.notifyDailyReminder}
            onChange={(v) => update('notifyDailyReminder', v)}
          />
          <View style={styles.divider} />
          <NotifRow
            icon="flame-outline"
            label="Streak Alerts"
            sublabel="Don't break your study streak"
            value={prefs.notifyStreak}
            onChange={(v) => update('notifyStreak', v)}
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>COMMUNITY</Text>
        <View style={styles.card}>
          <NotifRow
            icon="chatbubble-outline"
            label="Group Messages"
            sublabel="New messages in your study groups"
            value={prefs.notifyGroupMessages}
            onChange={(v) => update('notifyGroupMessages', v)}
          />
        </View>

        <Text style={[styles.sectionLabel, { marginTop: Spacing.lg }]}>ACCOUNT</Text>
        <View style={styles.card}>
          <NotifRow
            icon="diamond-outline"
            label="Subscription Updates"
            sublabel="Plan renewals and billing notices"
            value={prefs.notifySubscription}
            onChange={(v) => update('notifySubscription', v)}
          />
        </View>

        {saving && (
          <View style={styles.savingRow}>
            <ActivityIndicator size="small" color={Colors.azure} />
            <Text style={{ color: Colors.textMuted, fontSize: 13 }}>Saving...</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, paddingHorizontal: Spacing.md, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  sectionLabel: { ...Typography.label, color: Colors.textMuted, marginBottom: Spacing.sm, marginLeft: 2 },
  card: {
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, padding: Spacing.md },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: Radius.md, backgroundColor: Colors.azureLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: Colors.text },
  rowSub: { ...Typography.caption, color: Colors.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: Colors.border },
  savingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.md, justifyContent: 'center' },
});
