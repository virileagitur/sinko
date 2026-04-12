import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { Colors, Typography, Spacing, Radius } from '../../constants/theme';
import { PlanBadge } from '../../components/ui';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const PLANS = [
  {
    id: 'free',
    name: 'Free Trial',
    price: '$0',
    period: 'forever',
    color: Colors.textMuted,
    features: [
      '2 AI document imports per day',
      'Unlimited manual flashcard creation',
      'Basic study modes',
      'Community forum access',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '$1.99',
    period: '/month',
    color: Colors.azure,
    popular: false,
    features: [
      '10 AI document imports per day',
      'All study modes',
      'Create & join groups',
      'Share documents in forums',
      'Priority AI processing',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$4.99',
    period: '/month',
    color: Colors.lilyDark,
    popular: true,
    features: [
      'Unlimited AI document imports ✦',
      'All Starter features',
      'AI visual card generation',
      'Advanced analytics',
      'Early access to new features',
    ],
  },
];

export default function SubscriptionScreen() {
  const profile = useQuery(api.users.getMyProfile);
  const subscription = useQuery(api.subscriptions.getMySubscription);
  const createOrder = useAction(api.subscriptions.createPayPalOrder);
  const captureOrder = useAction(api.subscriptions.capturePayPalOrder);
  const [loading, setLoading] = useState<string | null>(null);

  const currentPlan = profile?.plan ?? 'free';

  const handleUpgrade = async (planId: 'starter' | 'premium') => {
    if (planId === currentPlan) return;
    setLoading(planId);

    try {
      const { orderId, approvalUrl } = await createOrder({ plan: planId });

      if (!approvalUrl) {
        Alert.alert('Error', 'Could not initiate PayPal checkout. Please try again.');
        setLoading(null);
        return;
      }

      const result = await WebBrowser.openAuthSessionAsync(
        approvalUrl,
        'sinko://subscription/success'
      );

      if (result.type === 'success' && result.url) {
        // Extract order ID from return URL
        const url = new URL(result.url);
        const token = url.searchParams.get('token') ?? orderId;
        await captureOrder({ orderId: token, plan: planId });
        Alert.alert('Success! 🎉', `You're now on the ${planId} plan!`);
      } else {
        Alert.alert('Cancelled', 'Payment was cancelled.');
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Payment failed. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }} edges={['bottom']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Current plan */}
        <View style={styles.currentPlan}>
          <View>
            <Text style={styles.currentLabel}>Current Plan</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 }}>
              <PlanBadge plan={currentPlan} />
              {subscription?.currentPeriodEnd && (
                <Text style={Typography.caption}>
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="diamond-outline" size={32} color={Colors.lilyDark} />
        </View>

        <Text style={styles.sectionTitle}>Choose a Plan</Text>

        {PLANS.map((plan) => {
          const isCurrentPlan = plan.id === currentPlan;
          const isLoading = loading === plan.id;
          const isFree = plan.id === 'free';

          return (
            <View
              key={plan.id}
              style={[
                styles.planCard,
                plan.popular && styles.planCardPopular,
                isCurrentPlan && { borderColor: plan.color },
              ]}
            >
              {plan.popular && (
                <View style={[styles.popularBadge, { backgroundColor: plan.color }]}>
                  <Text style={styles.popularText}>MOST POPULAR</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: plan.color }]}>{plan.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.planPrice}>{plan.price}</Text>
                    <Text style={styles.planPeriod}>{plan.period}</Text>
                  </View>
                </View>
                {isCurrentPlan && (
                  <View style={[styles.activeBadge, { backgroundColor: plan.color + '20' }]}>
                    <Ionicons name="checkmark" size={14} color={plan.color} />
                    <Text style={[styles.activeBadgeText, { color: plan.color }]}>Active</Text>
                  </View>
                )}
              </View>

              <View style={styles.featureList}>
                {plan.features.map((feature, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={16} color={plan.color} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              {!isFree && !isCurrentPlan && (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: plan.color }]}
                  onPress={() => handleUpgrade(plan.id as 'starter' | 'premium')}
                  disabled={!!loading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={16} color={Colors.white} />
                      <Text style={styles.upgradeBtnText}>
                        Upgrade with PayPal
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <Text style={styles.disclaimer}>
          Payments are processed securely via PayPal. By upgrading, you authorize Sinko to charge your PayPal account monthly. Cancel anytime.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  currentPlan: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  currentLabel: { ...Typography.label, letterSpacing: 0.5 },
  sectionTitle: { ...Typography.h3, padding: Spacing.md, paddingBottom: 0 },
  planCard: {
    margin: Spacing.md,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: Spacing.md,
    overflow: 'hidden',
  },
  planCardPopular: {
    borderColor: Colors.lilyDark,
    borderWidth: 2,
  },
  popularBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  popularText: { color: Colors.white, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  planName: { fontSize: 18, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 },
  planPrice: { fontSize: 28, fontWeight: '800', color: Colors.text },
  planPeriod: { ...Typography.bodySmall, color: Colors.textMuted },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  activeBadgeText: { fontSize: 12, fontWeight: '700' },
  featureList: { gap: 8, marginBottom: Spacing.md },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  featureText: { fontSize: 14, color: Colors.text, flex: 1, lineHeight: 20 },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.lg,
    padding: 14,
    marginTop: Spacing.sm,
  },
  upgradeBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textLight,
    textAlign: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    lineHeight: 16,
  },
});
