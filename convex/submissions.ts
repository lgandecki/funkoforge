import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
  return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
  args: {
    sourceImageId: v.id("_storage"),
    sessionId: v.string(),
    userId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submissionId = await ctx.db.insert("submissions", {
      sourceImageId: args.sourceImageId,
      sessionId: args.sessionId,
      userId: args.userId,
      status: "pending",
      createdAt: Date.now(),
    });
    return submissionId;
  },
});

export const get = query({
  args: {
    id: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) return null;

    // Get URLs for the stored images
    const sourceImageUrl = await ctx.storage.getUrl(submission.sourceImageId);
    const resultImageUrl = submission.resultImageId
      ? await ctx.storage.getUrl(submission.resultImageId)
      : null;

    return {
      ...submission,
      sourceImageUrl,
      resultImageUrl,
    };
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("submissions"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status });
  },
});

export const complete = mutation({
  args: {
    id: v.id("submissions"),
    resultImageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      resultImageId: args.resultImageId,
      completedAt: Date.now(),
    });
  },
});

export const fail = mutation({
  args: {
    id: v.id("submissions"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "failed",
      error: args.error,
      completedAt: Date.now(),
    });
  },
});

export const getBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) => {
    return ctx.db
      .query("submissions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .order("desc")
      .collect();
  },
});

export const getByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    return ctx.db
      .query("submissions")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();
  },
});

export const claimSubmissions = mutation({
  args: {
    sessionId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { sessionId, userId }) => {
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("by_sessionId", (q) => q.eq("sessionId", sessionId))
      .collect();

    let claimedCount = 0;
    for (const submission of submissions) {
      if (!submission.userId) {
        await ctx.db.patch(submission._id, { userId });
        claimedCount++;
      }
    }

    return claimedCount;
  },
});

// Get the source image URL for a submission (used by server action)
export const getSourceImageUrl = query({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) return null;
    return await ctx.storage.getUrl(submission.sourceImageId);
  },
});

// Get the result image URL for a submission (used by mesh action)
export const getResultImageUrl = query({
  args: { id: v.id("submissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission || !submission.resultImageId) return null;
    return await ctx.storage.getUrl(submission.resultImageId);
  },
});

// Start mesh generation
export const startMeshGeneration = mutation({
  args: {
    id: v.id("submissions"),
    meshyTaskId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      meshyTaskId: args.meshyTaskId,
      meshStatus: "pending",
      meshProgress: 0,
    });
  },
});

// Update mesh progress
export const updateMeshProgress = mutation({
  args: {
    id: v.id("submissions"),
    progress: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      meshStatus: args.status,
      meshProgress: args.progress,
      ...(args.thumbnailUrl && { meshThumbnailUrl: args.thumbnailUrl }),
    });
  },
});

// Complete mesh generation
export const completeMesh = mutation({
  args: {
    id: v.id("submissions"),
    thumbnailUrl: v.string(),
    modelUrls: v.object({
      glb: v.string(),
      fbx: v.string(),
      obj: v.string(),
      usdz: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      meshStatus: "completed",
      meshProgress: 100,
      meshThumbnailUrl: args.thumbnailUrl,
      modelUrls: args.modelUrls,
      meshCompletedAt: Date.now(),
    });
  },
});

// Fail mesh generation
export const failMesh = mutation({
  args: {
    id: v.id("submissions"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      meshStatus: "failed",
      meshError: args.error,
      meshCompletedAt: Date.now(),
    });
  },
});

// Get submission by Meshy task ID (for webhook or polling)
export const getByMeshyTaskId = query({
  args: { meshyTaskId: v.string() },
  handler: async (ctx, { meshyTaskId }) => {
    return ctx.db
      .query("submissions")
      .withIndex("by_meshyTaskId", (q) => q.eq("meshyTaskId", meshyTaskId))
      .first();
  },
});
