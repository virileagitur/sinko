import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Spacing, Radius, Typography, Colors } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

export default function DiscoverScreen() {
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string | undefined>(undefined);
  const seedCourses = useMutation(api.courses.seedCourses);

  const courses = useQuery(api.courses.listAll, { search: search || undefined, department });
  const departments = useQuery(api.courses.getDepartments);

  React.useEffect(() => {
    if (courses && courses.length === 0) {
      seedCourses();
    }
  }, [courses]);

  const renderCourse = ({ item }: { item: any }) => (
    <Pressable
      style={({ pressed }) => [styles.courseCard, { backgroundColor: colors.white, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
      onPress={() => router.push(`/course/${item._id}`)}
    >
      <View style={[styles.courseIcon, { backgroundColor: item.color + '18' }]}>
        <Text style={{ fontSize: 28 }}>{item.icon}</Text>
      </View>
      <View style={styles.courseInfo}>
        <Text style={[styles.courseName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.courseDepth, { color: colors.azure }]}>{item.department}</Text>
        <Text style={[styles.courseDesc, { color: colors.textMuted }]} numberOfLines={1}>{item.description}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
    </Pressable>
  );

  const ListHeader = () => (
    <>
      <View style={[styles.searchContainer, { backgroundColor: colors.white, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.borderLight }]}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search courses, departments..."
            placeholderTextColor={colors.textLight}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {departments && departments.length > 0 && (
        <FlatList
          horizontal
          data={[{ _id: undefined, name: 'All' }, ...departments.map((d) => ({ _id: d, name: d }))]}
          keyExtractor={(item) => item.name}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.filterList, { backgroundColor: colors.white, borderBottomColor: colors.border }]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                { backgroundColor: colors.borderLight },
                (item._id === department || (item._id === undefined && !department)) && { backgroundColor: colors.azure },
              ]}
              onPress={() => setDepartment(item._id as string | undefined)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: colors.textMuted },
                  (item._id === department || (item._id === undefined && !department)) && { color: '#fff' },
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top']}>
      <FlatList
        data={courses}
        keyExtractor={(item) => item._id}
        renderItem={renderCourse}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={() => (
          <View style={styles.empty}>
            <Text style={{ fontSize: 40, textAlign: 'center' }}>🎓</Text>
            <Text style={[Typography.h4, { textAlign: 'center', marginTop: Spacing.md, color: colors.text }]}>
              {search ? 'No courses found' : 'Loading courses...'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.borderLight,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },
  filterList: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.borderLight,
    marginRight: Spacing.xs,
  },
  filterChipActive: { backgroundColor: Colors.azure },
  filterChipText: { fontSize: 13, fontWeight: '500', color: Colors.textMuted },
  filterChipTextActive: { color: Colors.white },
  list: { padding: Spacing.md, paddingBottom: 100 },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  courseIcon: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  courseInfo: { flex: 1 },
  courseName: { fontSize: 15, fontWeight: '600', color: Colors.text },
  courseDepth: { ...Typography.caption, color: Colors.azure, marginTop: 1 },
  courseDesc: { ...Typography.caption, color: Colors.textMuted, marginTop: 2 },
  separator: { height: Spacing.sm },
  empty: { paddingTop: Spacing.xxl, padding: Spacing.xl },
});
