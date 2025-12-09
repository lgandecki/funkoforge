"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";

const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/image-to-3d";

// Timeout after 1 hour
const MAX_POLLING_TIME_MS = 60 * 60 * 1000;

interface MeshyTaskResponse {
  id: string;
  model_urls: {
    glb: string;
    fbx: string;
    obj: string;
    usdz: string;
  };
  thumbnail_url: string;
  progress: number;
  status: "PENDING" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED" | "CANCELED";
  task_error?: {
    message: string;
  };
}

function getNextInterval(elapsedMs: number): number {
  // 0-5 min: 5 seconds
  if (elapsedMs < 5 * 60 * 1000) {
    return 5 * 1000;
  }
  // 5-10 min: 15 seconds
  if (elapsedMs < 10 * 60 * 1000) {
    return 15 * 1000;
  }
  // 10-30 min: 1 minute
  if (elapsedMs < 30 * 60 * 1000) {
    return 60 * 1000;
  }
  // 30-60 min: 5 minutes
  return 5 * 60 * 1000;
}

async function getMeshyTaskStatus(taskId: string): Promise<MeshyTaskResponse> {
  const response = await fetch(`${MESHY_API_URL}/${taskId}`, {
    headers: {
      Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get Meshy task status: ${error}`);
  }

  return response.json();
}

export const pollMeshyOnce = internalAction({
  args: {
    submissionId: v.id("submissions"),
    meshyTaskId: v.string(),
    startTime: v.number(),
  },
  handler: async (ctx, args) => {
    const { submissionId, meshyTaskId, startTime } = args;
    const elapsedMs = Date.now() - startTime;
    const elapsedSec = Math.round(elapsedMs / 1000);

    console.log(`[meshPoller] Polling started`, {
      submissionId,
      meshyTaskId,
      elapsedSec,
    });

    // Check if we've exceeded max polling time
    if (elapsedMs > MAX_POLLING_TIME_MS) {
      console.log(`[meshPoller] TIMEOUT after ${elapsedSec}s`, { submissionId });
      await ctx.runMutation(internal.submissions.failMeshInternal, {
        submissionId,
        error: "Mesh generation timed out after 1 hour",
      });
      return;
    }

    try {
      console.log(`[meshPoller] Fetching Meshy status...`, { meshyTaskId });
      const status = await getMeshyTaskStatus(meshyTaskId);

      console.log(`[meshPoller] Meshy response`, {
        submissionId,
        meshyStatus: status.status,
        progress: status.progress,
        hasThumbnail: !!status.thumbnail_url,
        hasModelUrls: !!status.model_urls?.glb,
        error: status.task_error?.message,
      });

      // Map Meshy status to our status
      const convexStatus =
        status.status === "PENDING"
          ? "pending"
          : status.status === "IN_PROGRESS"
            ? "processing"
            : status.status === "SUCCEEDED"
              ? "completed"
              : "failed";

      if (status.status === "SUCCEEDED") {
        console.log(`[meshPoller] SUCCESS - completing`, { submissionId });
        await ctx.runMutation(internal.submissions.completeMeshInternal, {
          submissionId,
          thumbnailUrl: status.thumbnail_url,
          modelUrls: {
            glb: status.model_urls.glb,
            fbx: status.model_urls.fbx,
            obj: status.model_urls.obj,
            usdz: status.model_urls.usdz,
          },
        });
        console.log(`[meshPoller] Completed successfully`, { submissionId });
        return;
      }

      if (status.status === "FAILED" || status.status === "CANCELED") {
        console.log(`[meshPoller] FAILED/CANCELED`, {
          submissionId,
          error: status.task_error?.message,
        });
        await ctx.runMutation(internal.submissions.failMeshInternal, {
          submissionId,
          error: status.task_error?.message || "Mesh generation failed",
        });
        return;
      }

      // Still processing - update progress and schedule next poll
      console.log(`[meshPoller] Updating progress`, {
        submissionId,
        progress: status.progress,
        status: convexStatus,
      });
      await ctx.runMutation(internal.submissions.updateMeshProgressInternal, {
        submissionId,
        progress: status.progress,
        status: convexStatus as "pending" | "processing",
        thumbnailUrl: status.thumbnail_url || undefined,
      });

      // Schedule next poll with backoff
      const nextInterval = getNextInterval(elapsedMs);
      console.log(`[meshPoller] Scheduling next poll`, {
        submissionId,
        nextIntervalMs: nextInterval,
        nextIntervalSec: Math.round(nextInterval / 1000),
      });
      await ctx.scheduler.runAfter(nextInterval, internal.meshPoller.pollMeshyOnce, {
        submissionId,
        meshyTaskId,
        startTime,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error(`[meshPoller] ERROR`, {
        submissionId,
        meshyTaskId,
        elapsedSec,
        error: errorMessage,
      });

      // On error, still try to schedule next poll (might be transient)
      // But if we've been polling for a while, just fail
      if (elapsedMs > 10 * 60 * 1000) {
        console.log(`[meshPoller] Giving up after error (elapsed > 10min)`, { submissionId });
        await ctx.runMutation(internal.submissions.failMeshInternal, {
          submissionId,
          error: errorMessage,
        });
        return;
      }

      // Transient error - schedule retry
      const nextInterval = getNextInterval(elapsedMs);
      console.log(`[meshPoller] Transient error, retrying`, {
        submissionId,
        nextIntervalSec: Math.round(nextInterval / 1000),
      });
      await ctx.scheduler.runAfter(nextInterval, internal.meshPoller.pollMeshyOnce, {
        submissionId,
        meshyTaskId,
        startTime,
      });
    }
  },
});
