import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { router } from 'expo-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button, Input } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';

const YEAR_LEVELS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'];

export default function SignupScreen() {
  const { signIn } = useAuthActions();
  const ensureProfile = useMutation(api.users.ensureProfile);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name || !email || !password) {
      Alert.alert('Missing fields', 'Please fill in all required fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Weak password', 'Password must be at least 8 characters.');
      return;
    }

    setLoading(true);
    try {
      await signIn('password', { email, password, flow: 'signUp', name });
      await ensureProfile({ name });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Sign up failed', err?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.white }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color={Colors.azure} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create account</Text>
          <Text style={{ ...Typography.body, color: Colors.textMuted }}>
            Join thousands of students studying smarter
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="Full Name *"
            value={name}
            onChangeText={setName}
            placeholder="Juan Dela Cruz"
            icon={<Ionicons name="person-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="Email *"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="School / University"
            value={school}
            onChangeText={setSchool}
            placeholder="e.g. University of the Philippines"
            icon={<Ionicons name="school-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="Password *"
            value={password}
            onChangeText={setPassword}
            placeholder="Min. 8 characters"
            autoCapitalize="none"
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} />}
          />
          <Input
            label="Confirm Password *"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Repeat password"
            autoCapitalize="none"
            secureTextEntry
            icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} />}
          />

          <Button
            title="Create Account"
            onPress={handleSignup}
            loading={loading}
            fullWidth
            size="lg"
          />

          <TouchableOpacity style={styles.loginRow} onPress={() => router.back()}>
            <Text style={{ ...Typography.body, color: Colors.textMuted }}>
              Already have an account?{' '}
              <Text style={{ color: Colors.azure, fontWeight: '600' }}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingTop: Spacing.xxl,
  },
  backBtn: {
    marginBottom: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.h1,
    marginBottom: 4,
  },
  form: {
    gap: Spacing.xs,
  },
  loginRow: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
});
