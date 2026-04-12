import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const startSession = mutation({
  args: {
    deckId: v.id("decks"),
    mode: v.union(
      v.literal("flashcard"),
      v.literal("pomodoro"),
      v.literal("quiz"),
      v.literal("matching"),
      v.literal("spaced"),
      v.literal("write")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    return ctx.db.insert("studySessions", {
      ...args,
      userId,
      startedAt: Date.now(),
      cardsReviewed: 0,
    });
  },
});

export const endSession = mutation({
  args: {
    sessionId: v.id("studySessions"),
    cardsReviewed: v.number(),
    score: v.optional(v.number()),
    pomodoroSessions: v.optional(v.number()),
  },
  handler: async (ctx, { sessionId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    await ctx.db.patch(sessionId, { ...updates, endedAt: Date.now() });

    // Update streak
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (profile) {
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      if (profile.lastStudiedDate === yesterday) {
        await ctx.db.patch(profile._id, {
          streakDays: profile.streakDays + 1,
          lastStudiedDate: today,
        });
      } else if (profile.lastStudiedDate !== today) {
        await ctx.db.patch(profile._id, {
          streakDays: 1,
          lastStudiedDate: today,
        });
      }
    }
  },
});

export const getRecentSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    return ctx.db
      .query("studySessions")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(10);
  },
});
