"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const inputSchema = z.object({
  submissionId: z.string(),
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const MESHY_API_URL = "https://api.meshy.ai/openapi/v1/image-to-3d";

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

    // Start server-side polling (fire and forget)
    // This schedules a Convex action that will poll Meshy with exponential backoff
    await convex.mutation(api.submissions.startMeshPolling, {
      submissionId,
      meshyTaskId,
    });

    return { meshyTaskId };
  });
