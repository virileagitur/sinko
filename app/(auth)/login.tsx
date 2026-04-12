import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { router } from 'expo-router';
import { useAuthActions } from '@convex-dev/auth/react';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { Button, Input } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '552069661109-1fvaa4g45ugjtrr1d9njpqmdmboescin.apps.googleusercontent.com';

export default function LoginScreen() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: GOOGLE_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'sinko', path: 'auth' }),
    scopes: ['openid', 'profile', 'email'],
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleToken(id_token);
      } else {
        Alert.alert('Google Sign-In failed', 'No ID token returned.');
        setGoogleLoading(false);
      }
    } else if (response?.type === 'error') {
      Alert.alert('Google Sign-In failed', response.error?.message ?? 'Try again.');
      setGoogleLoading(false);
    } else if (response?.type === 'dismiss') {
      setGoogleLoading(false);
    }
  }, [response]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      await signIn('google', { idToken });
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('Sign-in failed', err?.message ?? 'Google authentication failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    await promptAsync();
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    try {
      await signIn('password', { email, password, flow: 'signIn' });
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login failed', 'Invalid email or password. Please try again.');
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
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoIcon}>⚡</Text>
          </View>
          <Text style={styles.logoText}>sinko</Text>
          <Text style={styles.tagline}>Smart flashcards for every college student</Text>
        </View>

        {/* Google Sign In — Primary CTA */}
        <TouchableOpacity
          style={[styles.googleBtn, (googleLoading || !request) && { opacity: 0.7 }]}
          onPress={handleGoogleSignIn}
          disabled={googleLoading || !request}
          activeOpacity={0.85}
        >
          {googleLoading ? (
            <ActivityIndicator size="small" color={Colors.text} />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleBtnText}>Continue with Google</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or sign in with email</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Email / Password Form */}
        <View style={styles.form}>
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="your@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            icon={<Ionicons name="mail-outline" size={18} color={Colors.textLight} />}
          />

          <View>
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              autoCapitalize="none"
              secureTextEntry={!showPass}
              icon={<Ionicons name="lock-closed-outline" size={18} color={Colors.textLight} />}
            />
            <TouchableOpacity style={styles.showPass} onPress={() => setShowPass(!showPass)}>
              <Text style={{ ...Typography.bodySmall, color: Colors.azure }}>
                {showPass ? 'Hide' : 'Show'}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            fullWidth
            size="lg"
          />

          <TouchableOpacity style={styles.signupRow} onPress={() => router.push('/(auth)/signup')}>
            <Text style={{ ...Typography.body, color: Colors.textMuted }}>
              Don't have an account?{' '}
              <Text style={{ color: Colors.azure, fontWeight: '600' }}>Sign up free</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
  },
  logoArea: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.azure,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoIcon: { fontSize: 36 },
  logoText: {
    fontSize: 36,
    fontWeight: '800',
    color: Colors.azure,
    letterSpacing: -1,
  },
  tagline: {
    ...Typography.bodySmall,
    textAlign: 'center',
    marginTop: 4,
    color: Colors.textMuted,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4285F4',
  },
  googleBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    ...Typography.label,
    marginHorizontal: Spacing.sm,
    color: Colors.textMuted,
  },
  form: { gap: Spacing.xs },
  showPass: {
    position: 'absolute',
    right: Spacing.md,
    top: 38,
    zIndex: 10,
  },
  signupRow: {
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  footer: {
    ...Typography.caption,
    textAlign: 'center',
    marginTop: Spacing.xl,
    color: Colors.textLight,
  },
});
