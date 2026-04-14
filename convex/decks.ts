import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const create = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    tags: v.array(v.string()),
    colorTag: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    return ctx.db.insert("decks", {
      ...args,
      creatorId: userId,
      cardCount: 0,
    });
  },
});

export const update = mutation({
  args: {
    deckId: v.id("decks"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    isPublic: v.optional(v.boolean()),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { deckId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const deck = await ctx.db.get(deckId);
    if (!deck || deck.creatorId !== userId)
      throw new ConvexError("Not authorized");

    await ctx.db.patch(deckId, updates);
  },
});

export const remove = mutation({
  args: { deckId: v.id("decks") },
  handler: async (ctx, { deckId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const deck = await ctx.db.get(deckId);
    if (!deck || deck.creatorId !== userId)
      throw new ConvexError("Not authorized");

    // Delete all cards first
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_deck", (q) => q.eq("deckId", deckId))
      .collect();
    for (const card of cards) await ctx.db.delete(card._id);

    await ctx.db.delete(deckId);
  },
});

export const listByCourse = query({
  args: { courseId: v.id("courses"), publicOnly: v.optional(v.boolean()) },
  handler: async (ctx, { courseId, publicOnly }) => {
    const userId = await getAuthUserId(ctx);
    let decks = await ctx.db
      .query("decks")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();

    if (publicOnly || !userId) {
      decks = decks.filter((d) => d.isPublic);
    } else {
      // Show public + user's own
      decks = decks.filter((d) => d.isPublic || d.creatorId === userId);
    }

    return decks.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const listMine = query({
  args: { includeArchived: v.optional(v.boolean()) },
  handler: async (ctx, { includeArchived }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    const decks = await ctx.db
      .query("decks")
      .withIndex("by_creator", (q) => q.eq("creatorId", userId))
      .collect();
    if (includeArchived) return decks;
    return decks.filter((d) => !d.isArchived);
  },
});

export const getById = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, { deckId }) => {
    return ctx.db.get(deckId);
  },
});

export const updateMeta = mutation({
  args: {
    deckId: v.id("decks"),
    colorTag: v.optional(v.string()),
    iconEmoji: v.optional(v.string()),
    backgroundImageUrl: v.optional(v.string()),
    backgroundStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { deckId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const deck = await ctx.db.get(deckId);
    if (!deck || deck.creatorId !== userId) throw new ConvexError("Not authorized");
    await ctx.db.patch(deckId, updates);
  },
});

export const archiveDeck = mutation({
  args: { deckId: v.id("decks") },
  handler: async (ctx, { deckId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const deck = await ctx.db.get(deckId);
    if (!deck || deck.creatorId !== userId) throw new ConvexError("Not authorized");
    await ctx.db.patch(deckId, { isArchived: true });
  },
});

export const unarchiveDeck = mutation({
  args: { deckId: v.id("decks") },
  handler: async (ctx, { deckId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const deck = await ctx.db.get(deckId);
    if (!deck || deck.creatorId !== userId) throw new ConvexError("Not authorized");
    await ctx.db.patch(deckId, { isArchived: false });
  },
});
