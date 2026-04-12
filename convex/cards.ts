import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const DEFAULT_EASE = 2.5;

export const create = mutation({
  args: {
    deckId: v.id("decks"),
    front: v.string(),
    back: v.string(),
    type: v.union(
      v.literal("basic"),
      v.literal("visual"),
      v.literal("cloze"),
      v.literal("definition")
    ),
    frontImageUrl: v.optional(v.string()),
    backImageUrl: v.optional(v.string()),
    tags: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const cardId = await ctx.db.insert("cards", {
      ...args,
      interval: 1,
      easeFactor: DEFAULT_EASE,
      nextReview: Date.now(),
      repetitions: 0,
    });

    // Increment deck card count
    const deck = await ctx.db.get(args.deckId);
    if (deck) await ctx.db.patch(args.deckId, { cardCount: deck.cardCount + 1 });

    return cardId;
  },
});

export const bulkCreate = mutation({
  args: {
    deckId: v.id("decks"),
    cards: v.array(
      v.object({
        front: v.string(),
        back: v.string(),
        type: v.union(
          v.literal("basic"),
          v.literal("visual"),
          v.literal("cloze"),
          v.literal("definition")
        ),
        frontImageUrl: v.optional(v.string()),
        backImageUrl: v.optional(v.string()),
        tags: v.array(v.string()),
      })
    ),
  },
  handler: async (ctx, { deckId, cards }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const ids: string[] = [];
    for (const card of cards) {
      const id = await ctx.db.insert("cards", {
        ...card,
        deckId,
        interval: 1,
        easeFactor: DEFAULT_EASE,
        nextReview: Date.now(),
        repetitions: 0,
      });
      ids.push(id);
    }

    const deck = await ctx.db.get(deckId);
    if (deck) await ctx.db.patch(deckId, { cardCount: deck.cardCount + cards.length });

    return ids;
  },
});

export const update = mutation({
  args: {
    cardId: v.id("cards"),
    front: v.optional(v.string()),
    back: v.optional(v.string()),
    frontImageUrl: v.optional(v.string()),
    backImageUrl: v.optional(v.string()),
    frontAnnotations: v.optional(v.array(v.any())),
    backAnnotations: v.optional(v.array(v.any())),
    tags: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { cardId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    await ctx.db.patch(cardId, updates);
  },
});

export const remove = mutation({
  args: { cardId: v.id("cards") },
  handler: async (ctx, { cardId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const card = await ctx.db.get(cardId);
    if (!card) return;

    await ctx.db.delete(cardId);

    const deck = await ctx.db.get(card.deckId);
    if (deck && deck.cardCount > 0) {
      await ctx.db.patch(card.deckId, { cardCount: deck.cardCount - 1 });
    }
  },
});

export const listByDeck = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, { deckId }) => {
    return ctx.db
      .query("cards")
      .withIndex("by_deck", (q) => q.eq("deckId", deckId))
      .collect();
  },
});

// SM-2 spaced repetition review update
// quality: 0 = Again, 1 = Hard, 2 = Good, 3 = Easy
export const reviewCard = mutation({
  args: {
    cardId: v.id("cards"),
    quality: v.number(), // 0-3
  },
  handler: async (ctx, { cardId, quality }) => {
    const card = await ctx.db.get(cardId);
    if (!card) throw new ConvexError("Card not found");

    let { easeFactor, interval, repetitions } = card;

    if (quality < 1) {
      // Again — reset
      repetitions = 0;
      interval = 1;
    } else {
      if (repetitions === 0) interval = 1;
      else if (repetitions === 1) interval = 6;
      else interval = Math.round(interval * easeFactor);

      repetitions += 1;
      easeFactor = Math.max(
        1.3,
        easeFactor + 0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)
      );
    }

    const nextReview = Date.now() + interval * 24 * 60 * 60 * 1000;

    await ctx.db.patch(cardId, { easeFactor, interval, repetitions, nextReview });
  },
});

export const getDueCards = query({
  args: { deckId: v.id("decks") },
  handler: async (ctx, { deckId }) => {
    const now = Date.now();
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_deck", (q) => q.eq("deckId", deckId))
      .collect();
    return cards.filter((c) => c.nextReview <= now);
  },
});
