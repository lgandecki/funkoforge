import { NextRequest, NextResponse } from "next/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const ALLOWED_FORMATS = ["glb", "fbx", "obj", "usdz"] as const;
type ModelFormat = (typeof ALLOWED_FORMATS)[number];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> }
) {
  const { submissionId } = await params;
  const formatParam = request.nextUrl.searchParams.get("format") || "glb";

  if (!ALLOWED_FORMATS.includes(formatParam as ModelFormat)) {
    return NextResponse.json(
      { error: `Format ${formatParam} not allowed` },
      { status: 400 }
    );
  }
  const format = formatParam as ModelFormat;

  try {
    // Fetch submission from Convex
    const submission = await fetchQuery(api.submissions.get, {
      id: submissionId as Id<"submissions">,
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    if (!submission.modelUrls) {
      return NextResponse.json(
        { error: "No 3D model available" },
        { status: 404 }
      );
    }

    // Get the model URL for the requested format
    const modelUrl = submission.modelUrls[format as keyof typeof submission.modelUrls];

    if (!modelUrl) {
      return NextResponse.json(
        { error: `Format ${format} not available` },
        { status: 404 }
      );
    }

    // Fetch the model from Meshy's CDN
    const modelResponse = await fetch(modelUrl);

    if (!modelResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch model" },
        { status: 502 }
      );
    }

    // Get the model data as an ArrayBuffer
    const modelData = await modelResponse.arrayBuffer();

    // Determine content type based on format
    const contentTypes: Record<string, string> = {
      glb: "model/gltf-binary",
      fbx: "application/octet-stream",
      obj: "text/plain",
      usdz: "model/vnd.usdz+zip",
    };

    // Return the model with proper headers
    return new NextResponse(modelData, {
      headers: {
        "Content-Type": contentTypes[format] || "application/octet-stream",
        "Content-Disposition": `inline; filename="model.${format}"`,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
      },
    });
  } catch (error) {
    console.error("Error proxying model:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
