import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// ─── Get or create user profile ──────────────────────────────────────────────
export const getMyProfile = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    return profile;
  },
});

export const ensureProfile = mutation({
  args: { name: v.optional(v.string()), email: v.optional(v.string()) },
  handler: async (ctx, { name }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) return existing._id;

    // Try to get name from the auth user record if not provided
    let displayName = name;
    if (!displayName) {
      const user = await ctx.db.get(userId);
      displayName = (user as any)?.name ?? (user as any)?.email?.split('@')[0] ?? 'Student';
    }

    return await ctx.db.insert("userProfiles", {
      userId,
      name: displayName ?? "Student",
      plan: "free",
      dailyImportCount: 0,
      streakDays: 0,
    });
  },
});

export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    school: v.optional(v.string()),
    yearLevel: v.optional(v.string()),
    courseEnrolled: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (!profile) throw new ConvexError("Profile not found");

    await ctx.db.patch(profile._id, {
      ...(args.name && { name: args.name }),
      ...(args.bio !== undefined && { bio: args.bio }),
      ...(args.school !== undefined && { school: args.school }),
      ...(args.yearLevel !== undefined && { yearLevel: args.yearLevel }),
      ...(args.courseEnrolled !== undefined && { courseEnrolled: args.courseEnrolled }),
      ...(args.avatarUrl !== undefined && { avatarUrl: args.avatarUrl }),
    });
  },
});

export const getProfileById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

export const updateNotifPrefs = mutation({
  args: {
    notifyDailyReminder: v.optional(v.boolean()),
    notifyStreak: v.optional(v.boolean()),
    notifyGroupMessages: v.optional(v.boolean()),
    notifySubscription: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const profile = await ctx.db.query("userProfiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (!profile) throw new ConvexError("Profile not found");
    await ctx.db.patch(profile._id, args);
  },
});

export const updateTheme = mutation({
  args: { theme: v.union(v.literal("light"), v.literal("dark")) },
  handler: async (ctx, { theme }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const profile = await ctx.db.query("userProfiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    if (!profile) throw new ConvexError("Profile not found");
    await ctx.db.patch(profile._id, { theme });
  },
});

export const getPlanGates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return { plan: "free" as const, canUseAllModes: false, canCreateGroups: false, canShareFiles: false, canPickIcon: false, canSetBackground: false, fileSizeLimitMb: 0 };
    const profile = await ctx.db.query("userProfiles").withIndex("by_userId", q => q.eq("userId", userId)).first();
    const plan = profile?.plan ?? "free";
    const isPaid = plan === "starter" || plan === "premium";
    const isPremium = plan === "premium";
    return {
      plan,
      canUseAllModes: isPaid,
      canCreateGroups: isPaid,
      canShareFiles: isPaid,
      canPickIcon: isPaid,
      canSetBackground: isPremium,
      fileSizeLimitMb: isPremium ? 100 : isPaid ? 50 : 0,
    };
  },
});

