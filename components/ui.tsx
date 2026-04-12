import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

// ─── Button ──────────────────────────────────────────────────────────────────
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled,
  loading,
  icon,
  fullWidth,
}: ButtonProps) {
  const variantStyles = {
    primary: { bg: Colors.azure, text: Colors.white, border: Colors.azure },
    secondary: { bg: Colors.lilyLight, text: Colors.lilyDark, border: Colors.lilyLight },
    outline: { bg: 'transparent', text: Colors.azure, border: Colors.azure },
    ghost: { bg: 'transparent', text: Colors.textMuted, border: 'transparent' },
    danger: { bg: Colors.error, text: Colors.white, border: Colors.error },
  }[variant];

  const sizeStyles = {
    sm: { py: 6, px: 12, fontSize: 13, radius: Radius.sm },
    md: { py: 11, px: 20, fontSize: 15, radius: Radius.md },
    lg: { py: 15, px: 28, fontSize: 17, radius: Radius.md },
  }[size];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: variantStyles.bg,
          borderColor: variantStyles.border,
          paddingVertical: sizeStyles.py,
          paddingHorizontal: sizeStyles.px,
          borderRadius: sizeStyles.radius,
          opacity: disabled ? 0.5 : 1,
          alignSelf: fullWidth ? 'stretch' : 'flex-start',
        },
      ]}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator size="small" color={variantStyles.text} />
      ) : (
        <View style={styles.buttonInner}>
          {icon && <View style={{ marginRight: 6 }}>{icon}</View>}
          <Text style={[styles.buttonText, { color: variantStyles.text, fontSize: sizeStyles.fontSize }]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  error?: string;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: React.ReactNode;
}

export function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  multiline,
  numberOfLines = 1,
  error,
  autoCapitalize = 'sentences',
  keyboardType = 'default',
  icon,
}: InputProps) {
  const { TextInput } = require('react-native');
  return (
    <View style={styles.inputContainer}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <View style={[styles.inputWrapper, error ? styles.inputError : null]}>
        {icon && <View style={styles.inputIcon}>{icon}</View>}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textLight}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          numberOfLines={numberOfLines}
          autoCapitalize={autoCapitalize}
          keyboardType={keyboardType}
          style={[
            styles.input,
            icon ? { paddingLeft: 0 } : null,
            multiline ? { height: numberOfLines * 24, textAlignVertical: 'top' } : null,
          ]}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

// ─── Card ────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: object;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style, onPress, padding = Spacing.md }: CardProps) {
  const content = (
    <View style={[styles.card, { padding }, style]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function Divider({ spacing = Spacing.md }: { spacing?: number }) {
  return (
    <View style={{ marginVertical: spacing, height: 1, backgroundColor: Colors.border }} />
  );
}

// ─── Badge ───────────────────────────────────────────────────────────────────
interface BadgeProps {
  label: string;
  color?: string;
  bg?: string;
}

export function Badge({ label, color = Colors.azure, bg = Colors.azureLight }: BadgeProps) {
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Avatar ──────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string;
  imageUrl?: string | null;
  size?: number;
  color?: string;
}

export function Avatar({ name, imageUrl, size = 40, color = Colors.azure }: AvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (imageUrl) {
    const { Image } = require('react-native');
    return (
      <Image
        source={{ uri: imageUrl }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: Colors.white, fontSize: size * 0.38, fontWeight: '600' }}>
        {initials}
      </Text>
    </View>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
  action?: { label: string; onPress: () => void };
}

export function EmptyState({ icon = '📭', title, subtitle, action }: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>{icon}</Text>
      <Text style={[Typography.h4, { textAlign: 'center', marginBottom: Spacing.sm }]}>{title}</Text>
      {subtitle && (
        <Text style={[Typography.bodySmall, { textAlign: 'center', marginBottom: Spacing.lg }]}>
          {subtitle}
        </Text>
      )}
      {action && <Button title={action.label} onPress={action.onPress} />}
    </View>
  );
}

// ─── Plan Badge ──────────────────────────────────────────────────────────────
export function PlanBadge({ plan }: { plan: string }) {
  const configs = {
    free: { label: 'Free', color: Colors.textMuted, bg: Colors.borderLight },
    starter: { label: 'Starter', color: Colors.azureDark, bg: Colors.azureLight },
    premium: { label: 'Premium ✦', color: Colors.lilyDark, bg: Colors.lilyLight },
  }[plan] ?? { label: plan, color: Colors.textMuted, bg: Colors.borderLight };

  return <Badge label={configs.label} color={configs.color} bg={configs.bg} />;
}

const styles = StyleSheet.create({
  button: {
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },
  inputContainer: {
    marginBottom: Spacing.md,
  },
  inputLabel: {
    ...Typography.label,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    ...Typography.body,
    color: Colors.text,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.error,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
});
