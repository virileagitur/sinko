import { ConvexError, v } from "convex/values";
import { action, mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { api } from "./_generated/api";

// Live PayPal API — money goes directly to @noaguinang
const PAYPAL_BASE_URL = "https://api-m.paypal.com";
const PLANS = {
  starter: {
    name: "Sinko Starter",
    price: "1.99",
    description: "10 AI document imports per day",
  },
  premium: {
    name: "Sinko Premium",
    price: "4.99",
    description: "Unlimited AI document imports",
  },
};

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new ConvexError("PayPal not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const err = await response.json();
    throw new ConvexError(`PayPal auth failed: ${err.error_description ?? response.statusText}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new ConvexError("PayPal returned no access token — check your Client ID and Secret");
  }
  return data.access_token;
}

export const createPayPalOrder = action({
  args: {
    plan: v.union(v.literal("starter"), v.literal("premium")),
  },
  handler: async (ctx, { plan }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const token = await getPayPalAccessToken();
    const planInfo = PLANS[plan];

    const response = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: planInfo.price,
            },
            description: planInfo.description,
          },
        ],
        application_context: {
          brand_name: "Sinko",
          return_url: "sinko://subscription/success",
          cancel_url: "sinko://subscription/cancel",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new ConvexError(`PayPal order creation failed: ${JSON.stringify(err.details ?? err.message ?? err)}`);
    }

    const order = await response.json();

    const approvalLink = order.links?.find(
      (l: { rel: string; href: string }) => l.rel === "approve" || l.rel === "payer-action"
    )?.href;

    if (!approvalLink) {
      throw new ConvexError("PayPal did not return an approval URL");
    }

    return { orderId: order.id, approvalUrl: approvalLink };
  },
});

export const capturePayPalOrder = action({
  args: {
    orderId: v.string(),
    plan: v.union(v.literal("starter"), v.literal("premium")),
  },
  handler: async (ctx, { orderId, plan }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Not authenticated");

    const token = await getPayPalAccessToken();

    const response = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      const err = await response.json();
      throw new ConvexError(`PayPal capture failed: ${JSON.stringify(err.details ?? err.message ?? err)}`);
    }

    const capture = await response.json();

    if (capture.status === "COMPLETED") {
      // 30 days expiry for monthly subscription simulation
      const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
      await ctx.runMutation(api.subscriptions.activatePlan, {
        plan,
        paypalOrderId: orderId,
        currentPeriodEnd: expiresAt,
      });
      return { success: true };
    }

    throw new ConvexError("Payment capture failed");
  },
});

export const activatePlan = mutation({
  args: {
    plan: v.union(v.literal("starter"), v.literal("premium")),
    paypalOrderId: v.string(),
    currentPeriodEnd: v.number(),
  },
  handler: async (ctx, { plan, paypalOrderId, currentPeriodEnd }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Update user profile plan
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (profile) await ctx.db.patch(profile._id, { plan });

    // Upsert subscription record
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        plan,
        paypalOrderId,
        status: "active",
        currentPeriodEnd,
      });
    } else {
      await ctx.db.insert("subscriptions", {
        userId,
        plan,
        paypalOrderId,
        status: "active",
        currentPeriodEnd,
      });
    }
  },
});

export const getMySubscription = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("subscriptions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});
