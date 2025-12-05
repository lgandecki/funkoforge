"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { after } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getOrCreateSessionId } from "@/lib/session";
import { auth } from "@clerk/nextjs/server";
import Replicate from "replicate";

const inputSchema = z.object({
  imageBase64: z.string().min(1),
  sessionId: z.string().uuid().optional(),
});

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const transformImageAction = actionClient
  .inputSchema(inputSchema)
  .action(
    async ({ parsedInput: { imageBase64, sessionId: inputSessionId } }) => {
      // Get authenticated user (if any)
      const { userId } = await auth();

      // Get sessionId from input or create new one
      const sessionId = inputSessionId || (await getOrCreateSessionId());

      // Convert base64 to blob and upload to Convex
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const imageBuffer = Buffer.from(base64Data, "base64");
      const contentType =
        imageBase64.match(/^data:(image\/\w+);base64,/)?.[1] || "image/png";

      // Get upload URL from Convex
      const uploadUrl = await convex.mutation(
        api.submissions.generateUploadUrl,
      );

      // Upload the image to Convex storage
      const uploadResponse = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": contentType },
        body: imageBuffer,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image");
      }

      const { storageId } = await uploadResponse.json();

      // Create submission in Convex
      const submissionId = await convex.mutation(api.submissions.create, {
        sourceImageId: storageId,
        sessionId,
        userId: userId ?? undefined,
      });

      // Schedule background transformation
      after(async () => {
        try {
          // Update status to processing
          await convex.mutation(api.submissions.updateStatus, {
            id: submissionId,
            status: "processing",
          });

          // Get the source image URL from Convex
          const sourceImageUrl = await convex.query(
            api.submissions.getSourceImageUrl,
            {
              id: submissionId,
            },
          );

          if (!sourceImageUrl) {
            throw new Error("Source image not found");
          }

          // Run Replicate transformation
          const input = {
            prompt:
              "Based on the passed picture create a 2d figurine in a style of funko pop model with white background that I will use for doing 2d -> 3d ai-based conversion. Make sure its full body and not just a head or a torso. It's ok if it's a few people too! Add a flat circular base so it is easier to 3d print",
            resolution: "2K",
            image_input: [sourceImageUrl],
            aspect_ratio: "1:1",
            output_format: "png",
            safety_filter_level: "block_only_high",
          };

          const output = await replicate.run("google/nano-banana-pro", {
            input,
          });

          // Get the result URL
          const resultUrl =
            typeof output === "object" && "url" in output
              ? (output as { url: () => string }).url()
              : Array.isArray(output)
                ? output[0]
                : String(output);

          // Download the result image
          const resultResponse = await fetch(resultUrl);
          if (!resultResponse.ok) {
            throw new Error("Failed to download result image");
          }

          const resultBuffer = await resultResponse.arrayBuffer();

          // Upload result to Convex storage
          const resultUploadUrl = await convex.mutation(
            api.submissions.generateUploadUrl,
          );
          const resultUploadResponse = await fetch(resultUploadUrl, {
            method: "POST",
            headers: { "Content-Type": "image/png" },
            body: resultBuffer,
          });

          if (!resultUploadResponse.ok) {
            throw new Error("Failed to upload result image");
          }

          const { storageId: resultStorageId } =
            await resultUploadResponse.json();

          // Mark submission as complete
          await convex.mutation(api.submissions.complete, {
            id: submissionId,
            resultImageId: resultStorageId,
          });
        } catch (error) {
          console.error("Transformation error:", error);
          await convex.mutation(api.submissions.fail, {
            id: submissionId,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      });

      return { submissionId };
    },
  );
