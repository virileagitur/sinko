import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const GROUP_COLORS = ["#2563EB", "#7C3AED", "#DC2626", "#16A34A", "#D97706", "#0891B2", "#BE185D"];

export const create = mutation({
  args: {
    courseId: v.id("courses"),
    name: v.string(),
    description: v.optional(v.string()),
    isPrivate: v.boolean(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const color = GROUP_COLORS[Math.floor(Math.random() * GROUP_COLORS.length)];

    const groupId = await ctx.db.insert("groups", {
      ...args,
      creatorId: userId,
      memberCount: 1,
      avatarColor: color,
    });

    // Creator is admin
    await ctx.db.insert("groupMembers", {
      groupId,
      userId,
      role: "admin",
    });

    return groupId;
  },
});

export const join = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const existing = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId)
      )
      .first();

    if (existing) throw new ConvexError("Already a member");

    await ctx.db.insert("groupMembers", { groupId, userId, role: "member" });

    const group = await ctx.db.get(groupId);
    if (group) await ctx.db.patch(groupId, { memberCount: group.memberCount + 1 });
  },
});

export const leave = mutation({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");

    const membership = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId)
      )
      .first();

    if (!membership) throw new ConvexError("Not a member");

    await ctx.db.delete(membership._id);

    const group = await ctx.db.get(groupId);
    if (group && group.memberCount > 0) {
      await ctx.db.patch(groupId, { memberCount: group.memberCount - 1 });
    }
  },
});

export const listByCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, { courseId }) => {
    return ctx.db
      .query("groups")
      .withIndex("by_course", (q) => q.eq("courseId", courseId))
      .collect();
  },
});

export const getById = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => ctx.db.get(groupId),
});

export const getMembers = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_group", (q) => q.eq("groupId", groupId))
      .collect();

    return Promise.all(
      memberships.map(async (m) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_userId", (q) => q.eq("userId", m.userId))
          .first();
        return {
          ...m,
          name: profile?.name ?? "Student",
          avatarUrl: profile?.avatarUrl,
          school: profile?.school,
        };
      })
    );
  },
});

export const getMyGroups = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("groupMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const groups = await Promise.all(
      memberships.map((m) => ctx.db.get(m.groupId))
    );
    return groups.filter(Boolean);
  },
});

export const isMember = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return false;
    const m = await ctx.db
      .query("groupMembers")
      .withIndex("by_group_user", (q) =>
        q.eq("groupId", groupId).eq("userId", userId)
      )
      .first();
    return !!m;
  },
});
export const updateGroup = mutation({
  args: {
    groupId: v.id("groups"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isPrivate: v.optional(v.boolean()),
    avatarUrl: v.optional(v.string()),
    avatarStorageId: v.optional(v.id("_storage")),
    bannerUrl: v.optional(v.string()),
    bannerStorageId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { groupId, ...updates }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const membership = await ctx.db.query("groupMembers")
      .withIndex("by_group_user", q => q.eq("groupId", groupId).eq("userId", userId)).first();
    if (!membership || membership.role !== "admin") throw new ConvexError("Admin only");
    const patch: Record<string, any> = {};
    if (updates.name !== undefined) patch.name = updates.name;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.isPrivate !== undefined) patch.isPrivate = updates.isPrivate;
    if (updates.avatarUrl !== undefined) patch.avatarUrl = updates.avatarUrl;
    if (updates.avatarStorageId !== undefined) patch.avatarStorageId = updates.avatarStorageId;
    if (updates.bannerUrl !== undefined) patch.bannerUrl = updates.bannerUrl;
    if (updates.bannerStorageId !== undefined) patch.bannerStorageId = updates.bannerStorageId;
    await ctx.db.patch(groupId, patch);
  },
});

export const sendMessage = mutation({
  args: {
    groupId: v.id("groups"),
    content: v.string(),
  },
  handler: async (ctx, { groupId, content }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new ConvexError("Not authenticated");
    const membership = await ctx.db.query("groupMembers")
      .withIndex("by_group_user", q => q.eq("groupId", groupId).eq("userId", userId)).first();
    if (!membership) throw new ConvexError("Not a member");
    return ctx.db.insert("groupMessages", { groupId, authorId: userId, content });
  },
});

export const listMessages = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const messages = await ctx.db.query("groupMessages")
      .withIndex("by_group", q => q.eq("groupId", groupId))
      .order("asc")
      .collect();
    return Promise.all(messages.map(async (msg) => {
      const profile = await ctx.db.query("userProfiles")
        .withIndex("by_userId", q => q.eq("userId", msg.authorId)).first();
      return { ...msg, authorName: profile?.name ?? "Student", authorAvatar: profile?.avatarUrl };
    }));
  },
});

export const getMyRole = query({
  args: { groupId: v.id("groups") },
  handler: async (ctx, { groupId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;
    const m = await ctx.db.query("groupMembers")
      .withIndex("by_group_user", q => q.eq("groupId", groupId).eq("userId", userId)).first();
    return m?.role ?? null;
  },
});
