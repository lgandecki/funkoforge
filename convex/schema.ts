import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  submissions: defineTable({
    // Ownership
    sessionId: v.optional(v.string()),
    userId: v.optional(v.string()),

    // Source image (stored in Convex storage)
    sourceImageId: v.id("_storage"),

    // Status for 2D transformation
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),

    // Timestamps
    createdAt: v.number(),
    completedAt: v.optional(v.number()),

    // Error (if failed)
    error: v.optional(v.string()),

    // Result (when completed) - transformed image stored in Convex storage
    resultImageId: v.optional(v.id("_storage")),

    // 3D Mesh generation (Meshy)
    meshyTaskId: v.optional(v.string()),
    meshStatus: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("completed"),
        v.literal("failed")
      )
    ),
    meshProgress: v.optional(v.number()),
    meshThumbnailUrl: v.optional(v.string()),
    modelUrls: v.optional(
      v.object({
        glb: v.string(),
        fbx: v.string(),
        obj: v.string(),
        usdz: v.string(),
      })
    ),
    meshError: v.optional(v.string()),
    meshCompletedAt: v.optional(v.number()),
  })
    .index("by_sessionId", ["sessionId"])
    .index("by_userId", ["userId"])
    .index("by_meshyTaskId", ["meshyTaskId"]),

  // Keep existing numbers table
  numbers: defineTable({
    value: v.number(),
  }),
});
