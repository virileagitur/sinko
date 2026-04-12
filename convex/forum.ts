import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

export const createPost = mutation({
  args: {
    courseId: v.id("courses"),
    groupId: v.optional(v.id("groups")),
    title: v.string(),
    content: v.string(),
    fileStorageIds: v.array(v.id("_storage")),
    fileUrls: v.array(v.string()),
    fileNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    return ctx.db.insert("forumPosts", {
      ...args,
      authorId: userId,
      reactions: { like: 0, helpful: 0, fire: 0 },
      viewCount: 0,
      commentCount: 0,
      isPinned: false,
    });
  },
});

export const listByCourse = query({
  args: { courseId: v.id("courses"), groupId: v.optional(v.id("groups")) },
  handler: async (ctx, { courseId, groupId }) => {
    let posts = await ctx.db
      .query("forumPosts")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();

    if (groupId) {
      posts = posts.filter((p) => p.groupId === groupId);
    } else {
      posts = posts.filter((p) => !p.groupId);
    }

    return posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b._creationTime - a._creationTime;
    });
  },
});

export const getPost = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, { postId }) => {
    return ctx.db.get(postId);
  },
});

export const addComment = mutation({
  args: {
    postId: v.id("forumPosts"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const commentId = await ctx.db.insert("forumComments", {
      ...args,
      authorId: userId,
      reactions: { like: 0, helpful: 0 },
    });

    const post = await ctx.db.get(args.postId);
    if (post) {
      await ctx.db.patch(args.postId, { commentCount: post.commentCount + 1 });
    }

    return commentId;
  },
});

export const getComments = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, { postId }) => {
    return ctx.db
      .query("forumComments")
      .withIndex("by_post", (q) => q.eq("postId", postId))
      .collect();
  },
});

export const reactToPost = mutation({
  args: {
    postId: v.id("forumPosts"),
    type: v.union(v.literal("like"), v.literal("helpful"), v.literal("fire")),
  },
  handler: async (ctx, { postId, type }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    // Check if already reacted
    const existing = await ctx.db
      .query("postReactions")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", postId).eq("userId", userId)
      )
      .first();

    const post = await ctx.db.get(postId);
    if (!post) throw new ConvexError("Post not found");

    if (existing) {
      if (existing.type === type) {
        // Un-react
        await ctx.db.delete(existing._id);
        await ctx.db.patch(postId, {
          reactions: { ...post.reactions, [type]: Math.max(0, post.reactions[type] - 1) },
        });
      } else {
        // Change reaction
        const oldType = existing.type;
        await ctx.db.patch(existing._id, { type });
        await ctx.db.patch(postId, {
          reactions: {
            ...post.reactions,
            [oldType]: Math.max(0, post.reactions[oldType] - 1),
            [type]: post.reactions[type] + 1,
          },
        });
      }
    } else {
      await ctx.db.insert("postReactions", { postId, userId, type });
      await ctx.db.patch(postId, {
        reactions: { ...post.reactions, [type]: post.reactions[type] + 1 },
      });
    }
  },
});

export const getMyReaction = query({
  args: { postId: v.id("forumPosts") },
  handler: async (ctx, { postId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    return ctx.db
      .query("postReactions")
      .withIndex("by_post_user", (q) =>
        q.eq("postId", postId).eq("userId", userId)
      )
      .first();
  },
});
