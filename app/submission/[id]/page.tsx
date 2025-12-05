"use client";

import { useParams } from "next/navigation";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { ArrowLeft, Download, FileBox, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { ModelViewer } from "@/components/ModelViewer";

export default function SubmissionPage() {
  const params = useParams();
  const submissionId = params.id as string;

  const submission = useQuery(
    api.submissions.get,
    submissionId ? { id: submissionId as Id<"submissions"> } : "skip",
  );

  const handleDownloadModel = (format: "glb" | "fbx" | "obj" | "usdz") => {
    if (submission?.modelUrls?.[format]) {
      const link = document.createElement("a");
      link.href = `/api/model/${submissionId}?format=${format}`;
      link.download = `figurine-model.${format}`;
      link.click();
    }
  };

  const handleDownloadImage = (type: "source" | "result") => {
    const url =
      type === "source"
        ? submission?.sourceImageUrl
        : submission?.resultImageUrl;
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `figurine-${type}.png`;
      link.click();
    }
  };

  if (submission === undefined) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (submission === null) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-display font-bold">
          Submission Not Found
        </h1>
        <p className="text-muted-foreground">
          The submission you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link href="/">
          <Button variant="hero">
            <ArrowLeft className="w-4 h-4" />
            Go Home
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold">
              <span className="text-gradient">Submission</span> Details
            </h1>
            <p className="text-sm text-muted-foreground font-mono">
              {submissionId}
            </p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Original Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-strong rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-foreground">
                Original Photo
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadImage("source")}
                disabled={!submission.sourceImageUrl}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
              {submission.sourceImageUrl ? (
                <Image
                  src={submission.sourceImageUrl}
                  alt="Original photo"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">No image</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Transformed Image */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-display font-semibold text-foreground">
                Figurine
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDownloadImage("result")}
                disabled={!submission.resultImageUrl}
              >
                <Download className="w-4 h-4" />
              </Button>
            </div>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
              {submission.resultImageUrl ? (
                <Image
                  src={submission.resultImageUrl}
                  alt="Figurine version"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">
                    {submission.status === "processing"
                      ? "Processing..."
                      : "No result"}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* 3D Model */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-2xl p-6 space-y-4"
          >
            <h3 className="text-lg font-display font-semibold text-foreground">
              3D Model
            </h3>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted/50">
              {submission.modelUrls?.glb ? (
                <ModelViewer
                  src={`/api/model/${submissionId}?format=glb`}
                  alt="Figurine 3D Model"
                  poster={submission.meshThumbnailUrl}
                  className="w-full h-full"
                />
              ) : submission.meshThumbnailUrl ? (
                <div className="relative w-full h-full">
                  <Image
                    src={submission.meshThumbnailUrl}
                    alt="3D Model Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-muted-foreground">
                    {submission.meshStatus === "processing"
                      ? `Generating... ${submission.meshProgress || 0}%`
                      : "No 3D model"}
                  </span>
                </div>
              )}
            </div>

            {/* Download buttons */}
            {submission.modelUrls && (
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">
                  Download 3D Model:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadModel("glb")}
                    className="w-full"
                  >
                    <FileBox className="w-4 h-4 mr-2" />
                    GLB
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadModel("fbx")}
                    className="w-full"
                  >
                    <FileBox className="w-4 h-4 mr-2" />
                    FBX
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadModel("obj")}
                    className="w-full"
                  >
                    <FileBox className="w-4 h-4 mr-2" />
                    OBJ
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadModel("usdz")}
                    className="w-full"
                  >
                    <FileBox className="w-4 h-4 mr-2" />
                    USDZ
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Status Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 glass rounded-xl p-4"
        >
          <div className="flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Status: </span>
              <span
                className={
                  submission.status === "completed"
                    ? "text-accent"
                    : submission.status === "failed"
                      ? "text-destructive"
                      : "text-primary"
                }
              >
                {submission.status}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">3D Status: </span>
              <span
                className={
                  submission.meshStatus === "completed"
                    ? "text-accent"
                    : submission.meshStatus === "failed"
                      ? "text-destructive"
                      : "text-primary"
                }
              >
                {submission.meshStatus || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Created: </span>
              <span className="text-foreground">
                {new Date(submission.createdAt).toLocaleString()}
              </span>
            </div>
            {submission.completedAt && (
              <div>
                <span className="text-muted-foreground">Completed: </span>
                <span className="text-foreground">
                  {new Date(submission.completedAt).toLocaleString()}
                </span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Create New Button */}
        <div className="mt-8 text-center">
          <Link href="/">
            <Button variant="hero" size="lg">
              Create Your Own Figurine
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
