import { v } from "convex/values";
import { mutation, query, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

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

// Get stuck submissions that need retry (browser disconnected)
// A submission is "stuck" if it's been in processing state for too long
export const getStuckSubmissions = query({
  args: {
    stuckThresholdMs: v.optional(v.number()), // Default 5 minutes
  },
  handler: async (ctx, args) => {
    const threshold = args.stuckThresholdMs ?? 5 * 60 * 1000; // 5 minutes default
    const cutoffTime = Date.now() - threshold;

    const allSubmissions = await ctx.db.query("submissions").collect();

    const stuckSubmissions = allSubmissions.filter((sub) => {
      // Check if 2D transformation is stuck
      const is2DStuck =
        sub.status === "processing" && sub.createdAt < cutoffTime;

      // Check if mesh generation is stuck (has meshyTaskId but not completed/failed)
      const isMeshStuck =
        sub.meshStatus === "processing" &&
        sub.meshyTaskId &&
        sub.createdAt < cutoffTime;

      return is2DStuck || isMeshStuck;
    });

    return stuckSubmissions;
  },
});

// Clone a submission (keeps sourceImageId, resultImageId, sessionId, userId)
export const clone = mutation({
  args: {
    id: v.id("submissions"),
  },
  handler: async (ctx, args) => {
    const original = await ctx.db.get(args.id);
    if (!original) {
      throw new Error("Submission not found");
    }

    const newSubmissionId = await ctx.db.insert("submissions", {
      sourceImageId: original.sourceImageId,
      sessionId: original.sessionId,
      userId: original.userId,
      // If original has resultImageId, copy it and mark as completed
      ...(original.resultImageId
        ? {
            status: "completed",
            resultImageId: original.resultImageId,
            completedAt: Date.now(),
          }
        : {
            status: "pending",
          }),
      createdAt: Date.now(),
    });

    return newSubmissionId;
  },
});

// Reset a submission for retry
export const resetForRetry = mutation({
  args: {
    id: v.id("submissions"),
    resetType: v.union(v.literal("2d"), v.literal("mesh"), v.literal("both")),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.id);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const updates: Record<string, unknown> = {};

    if (args.resetType === "2d" || args.resetType === "both") {
      updates.status = "pending";
      updates.error = undefined;
      updates.completedAt = undefined;
      updates.resultImageId = undefined;
    }

    if (args.resetType === "mesh" || args.resetType === "both") {
      updates.meshStatus = undefined;
      updates.meshProgress = undefined;
      updates.meshyTaskId = undefined;
      updates.meshThumbnailUrl = undefined;
      updates.modelUrls = undefined;
      updates.meshError = undefined;
      updates.meshCompletedAt = undefined;
    }

    await ctx.db.patch(args.id, updates);
    return { success: true };
  },
});

// Start polling for mesh generation (schedules first poll immediately)
export const startMeshPolling = mutation({
  args: {
    submissionId: v.id("submissions"),
    meshyTaskId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[startMeshPolling] Starting`, {
      submissionId: args.submissionId,
      meshyTaskId: args.meshyTaskId,
    });

    // Update the submission with the meshyTaskId
    await ctx.db.patch(args.submissionId, {
      meshyTaskId: args.meshyTaskId,
      meshStatus: "pending",
      meshProgress: 0,
    });
    console.log(`[startMeshPolling] Patched submission`);

    // Schedule the first poll immediately
    await ctx.scheduler.runAfter(0, internal.meshPoller.pollMeshyOnce, {
      submissionId: args.submissionId,
      meshyTaskId: args.meshyTaskId,
      startTime: Date.now(),
    });
    console.log(`[startMeshPolling] Scheduled first poll`);
  },
});

// Internal mutations for mesh polling (called by meshPoller action)
export const updateMeshProgressInternal = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    progress: v.number(),
    status: v.union(v.literal("pending"), v.literal("processing")),
    thumbnailUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log(`[updateMeshProgressInternal] Called`, {
      submissionId: args.submissionId,
      progress: args.progress,
      status: args.status,
    });
    await ctx.db.patch(args.submissionId, {
      meshStatus: args.status,
      meshProgress: args.progress,
      ...(args.thumbnailUrl && { meshThumbnailUrl: args.thumbnailUrl }),
    });
    console.log(`[updateMeshProgressInternal] Patched successfully`);
  },
});

export const completeMeshInternal = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    thumbnailUrl: v.string(),
    modelUrls: v.object({
      glb: v.string(),
      fbx: v.string(),
      obj: v.string(),
      usdz: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    console.log(`[completeMeshInternal] Called`, {
      submissionId: args.submissionId,
    });
    await ctx.db.patch(args.submissionId, {
      meshStatus: "completed",
      meshProgress: 100,
      meshThumbnailUrl: args.thumbnailUrl,
      modelUrls: args.modelUrls,
      meshCompletedAt: Date.now(),
    });
    console.log(`[completeMeshInternal] Patched successfully`);
  },
});

export const failMeshInternal = internalMutation({
  args: {
    submissionId: v.id("submissions"),
    error: v.string(),
  },
  handler: async (ctx, args) => {
    console.log(`[failMeshInternal] Called`, {
      submissionId: args.submissionId,
      error: args.error,
    });
    await ctx.db.patch(args.submissionId, {
      meshStatus: "failed",
      meshError: args.error,
      meshCompletedAt: Date.now(),
    });
    console.log(`[failMeshInternal] Patched successfully`);
  },
});
