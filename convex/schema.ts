import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  // ─── Users ───────────────────────────────────────────
  userProfiles: defineTable({
    userId: v.id("users"),
    name: v.string(),
    bio: v.optional(v.string()),
    school: v.optional(v.string()),
    yearLevel: v.optional(v.string()),
    courseEnrolled: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    avatarUrl: v.optional(v.string()),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("premium")),
    dailyImportCount: v.number(),
    dailyImportDate: v.optional(v.string()),
    streakDays: v.number(),
    lastStudiedDate: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // ─── Courses ──────────────────────────────────────────
  courses: defineTable({
    name: v.string(),
    department: v.string(),
    description: v.string(),
    icon: v.string(),
    color: v.string(),
    memberCount: v.number(),
  }).index("by_department", ["department"]),

  // ─── Decks ───────────────────────────────────────────
  decks: defineTable({
    courseId: v.id("courses"),
    creatorId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    cardCount: v.number(),
    colorTag: v.optional(v.string()),
    tags: v.array(v.string()),
  })
    .index("by_course", ["courseId"])
    .index("by_creator", ["creatorId"]),

  // ─── Cards ───────────────────────────────────────────
  cards: defineTable({
    deckId: v.id("decks"),
    front: v.string(),
    frontImageStorageId: v.optional(v.id("_storage")),
    frontImageUrl: v.optional(v.string()),
    frontAnnotations: v.optional(v.array(v.any())),
    back: v.string(),
    backImageStorageId: v.optional(v.id("_storage")),
    backImageUrl: v.optional(v.string()),
    backAnnotations: v.optional(v.array(v.any())),
    type: v.union(
      v.literal("basic"),
      v.literal("visual"),
      v.literal("cloze"),
      v.literal("definition")
    ),
    tags: v.array(v.string()),
    // Spaced repetition (SM-2)
    interval: v.number(),
    easeFactor: v.number(),
    nextReview: v.number(),
    repetitions: v.number(),
  }).index("by_deck", ["deckId"]),

  // ─── Forum Posts ─────────────────────────────────────
  forumPosts: defineTable({
    courseId: v.id("courses"),
    groupId: v.optional(v.id("groups")),
    authorId: v.id("users"),
    title: v.string(),
    content: v.string(),
    fileStorageIds: v.array(v.id("_storage")),
    fileUrls: v.array(v.string()),
    fileNames: v.array(v.string()),
    reactions: v.object({
      like: v.number(),
      helpful: v.number(),
      fire: v.number(),
    }),
    viewCount: v.number(),
    commentCount: v.number(),
    isPinned: v.boolean(),
  })
    .index("by_course", ["courseId"])
    .index("by_group", ["groupId"]),

  // ─── Forum Comments ───────────────────────────────────
  forumComments: defineTable({
    postId: v.id("forumPosts"),
    authorId: v.id("users"),
    content: v.string(),
    reactions: v.object({
      like: v.number(),
      helpful: v.number(),
    }),
  }).index("by_post", ["postId"]),

  // ─── User Post Reactions ──────────────────────────────
  postReactions: defineTable({
    postId: v.id("forumPosts"),
    userId: v.id("users"),
    type: v.union(v.literal("like"), v.literal("helpful"), v.literal("fire")),
  })
    .index("by_post_user", ["postId", "userId"]),

  // ─── Groups ───────────────────────────────────────────
  groups: defineTable({
    courseId: v.id("courses"),
    name: v.string(),
    description: v.optional(v.string()),
    creatorId: v.id("users"),
    isPrivate: v.boolean(),
    memberCount: v.number(),
    avatarColor: v.string(),
  }).index("by_course", ["courseId"]),

  groupMembers: defineTable({
    groupId: v.id("groups"),
    userId: v.id("users"),
    role: v.union(v.literal("admin"), v.literal("member")),
  })
    .index("by_group", ["groupId"])
    .index("by_user", ["userId"])
    .index("by_group_user", ["groupId", "userId"]),

  // ─── Study Sessions ───────────────────────────────────
  studySessions: defineTable({
    userId: v.id("users"),
    deckId: v.id("decks"),
    mode: v.union(
      v.literal("flashcard"),
      v.literal("pomodoro"),
      v.literal("quiz"),
      v.literal("matching"),
      v.literal("spaced"),
      v.literal("write")
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    cardsReviewed: v.number(),
    score: v.optional(v.number()),
    pomodoroSessions: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_deck", ["deckId"]),

  // ─── Subscriptions ────────────────────────────────────
  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.union(v.literal("free"), v.literal("starter"), v.literal("premium")),
    paypalOrderId: v.optional(v.string()),
    paypalSubscriptionId: v.optional(v.string()),
    status: v.union(v.literal("active"), v.literal("cancelled"), v.literal("pending")),
    currentPeriodEnd: v.optional(v.number()),
  }).index("by_userId", ["userId"]),
});
