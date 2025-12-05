"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { after } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const inputSchema = z.object({
  submissionId: z.string(),
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/image-to-3d";

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

async function createMeshyTask(imageUrl: string): Promise<string> {
  const response = await fetch(MESHY_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MESHY_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      image_url: imageUrl,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create Meshy task: ${error}`);
  }

  const data = await response.json();
  return data.result;
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

async function pollMeshyTask(
  taskId: string,
  submissionId: Id<"submissions">,
  maxAttempts = 120, // 10 minutes with 5s intervals
  intervalMs = 5000
): Promise<void> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await getMeshyTaskStatus(taskId);

    // Update progress in Convex
    const convexStatus =
      status.status === "PENDING"
        ? "pending"
        : status.status === "IN_PROGRESS"
          ? "processing"
          : status.status === "SUCCEEDED"
            ? "completed"
            : "failed";

    await convex.mutation(api.submissions.updateMeshProgress, {
      id: submissionId,
      progress: status.progress,
      status: convexStatus as "pending" | "processing" | "completed" | "failed",
      thumbnailUrl: status.thumbnail_url || undefined,
    });

    if (status.status === "SUCCEEDED") {
      // Complete with model URLs
      await convex.mutation(api.submissions.completeMesh, {
        id: submissionId,
        thumbnailUrl: status.thumbnail_url,
        modelUrls: {
          glb: status.model_urls.glb,
          fbx: status.model_urls.fbx,
          obj: status.model_urls.obj,
          usdz: status.model_urls.usdz,
        },
      });
      return;
    }

    if (status.status === "FAILED" || status.status === "CANCELED") {
      throw new Error(status.task_error?.message || "Mesh generation failed");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  throw new Error("Mesh generation timed out");
}

export const imageToMeshAction = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput: { submissionId: submissionIdStr } }) => {
    const submissionId = submissionIdStr as Id<"submissions">;

    // Get the result image URL from Convex
    const resultImageUrl = await convex.query(api.submissions.getResultImageUrl, {
      id: submissionId,
    });

    if (!resultImageUrl) {
      throw new Error("No transformed image found for this submission");
    }

    // Create Meshy task
    const meshyTaskId = await createMeshyTask(resultImageUrl);

    // Store the task ID in Convex
    await convex.mutation(api.submissions.startMeshGeneration, {
      id: submissionId,
      meshyTaskId,
    });

    // Poll for completion in background
    after(async () => {
      try {
        await pollMeshyTask(meshyTaskId, submissionId);
      } catch (error) {
        console.error("Mesh generation error:", error);
        await convex.mutation(api.submissions.failMesh, {
          id: submissionId,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    });

    return { meshyTaskId };
  });
