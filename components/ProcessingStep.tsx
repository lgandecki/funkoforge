"use client";

import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Box, AlertCircle } from "lucide-react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { useAction } from "next-safe-action/hooks";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { imageToMeshAction } from "@/app/actions/image-to-mesh-action";

interface ProcessingStepProps {
  type: "transform" | "convert3d";
  submissionId: Id<"submissions">;
  onComplete: () => void;
  onError?: (error: string) => void;
}

export const ProcessingStep = ({
  type,
  submissionId,
  onComplete,
  onError,
}: ProcessingStepProps) => {
  const [progress, setProgress] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);
  const hasStartedMesh = useRef(false);

  const { executeAsync: startMeshGeneration } = useAction(imageToMeshAction);

  // Subscribe to submission updates from Convex
  const submission = useQuery(api.submissions.get, { id: submissionId });

  const isTransform = type === "transform";
  const title = isTransform ? "Creating Your Figure" : "Building 3D Model";
  const subtitle = isTransform
    ? "AI is transforming your photo into a memorable masterpiece..."
    : "Converting your figurine into a 3D printable model...";

  // Start mesh generation when in convert3d mode
  useEffect(() => {
    if (
      type === "convert3d" &&
      submission &&
      submission.status === "completed" &&
      !submission.meshyTaskId &&
      !hasStartedMesh.current
    ) {
      hasStartedMesh.current = true;
      startMeshGeneration({ submissionId: submissionId as string }).catch(
        (error) => {
          console.error("Failed to start mesh generation:", error);
          onError?.(error.message || "Failed to start 3D conversion");
        },
      );
    }
  }, [type, submission, submissionId, startMeshGeneration, onError]);

  // Handle progress and completion
  useEffect(() => {
    if (!submission) return;

    if (isTransform) {
      // Handle 2D transformation completion
      if (
        submission.status === "completed" &&
        submission.resultImageUrl &&
        !hasCompleted
      ) {
        setProgress(100);
        setHasCompleted(true);
        setTimeout(() => onComplete(), 500);
        return;
      }

      // Handle error
      if (submission.status === "failed" && onError) {
        onError(submission.error || "Unknown error");
        return;
      }

      // Simulate progress based on time elapsed for transform
      if (
        submission.status === "pending" ||
        submission.status === "processing"
      ) {
        const duration = 60000;
        const interval = 100;

        const timer = setInterval(() => {
          const elapsed = Date.now() - submission.createdAt;
          let newProgress = 0;

          if (elapsed < duration * 0.8) {
            newProgress = (elapsed / (duration * 0.8)) * 90;
          } else {
            newProgress =
              90 + ((elapsed - duration * 0.8) / (duration * 0.5)) * 9;
          }

          newProgress = Math.min(newProgress, 99);
          setProgress(newProgress);
        }, interval);

        return () => clearInterval(timer);
      }
    } else {
      // Handle 3D mesh generation
      if (
        submission.meshStatus === "completed" &&
        submission.meshThumbnailUrl &&
        !hasCompleted
      ) {
        setProgress(100);
        setHasCompleted(true);
        setTimeout(() => onComplete(), 500);
        return;
      }

      // Handle mesh error
      if (submission.meshStatus === "failed" && onError) {
        onError(submission.meshError || "3D conversion failed");
        return;
      }

      // Use real progress from Meshy
      if (submission.meshProgress !== undefined) {
        setProgress(submission.meshProgress);
      }
    }
  }, [submission, onComplete, onError, isTransform, hasCompleted]);

  // Derive image URL for preview
  const previewImageUrl = isTransform
    ? submission?.sourceImageUrl
    : submission?.resultImageUrl || submission?.meshThumbnailUrl;

  // Check for failure states
  const isFailed = isTransform
    ? submission?.status === "failed"
    : submission?.meshStatus === "failed";

  const errorMessage = isTransform ? submission?.error : submission?.meshError;

  if (isFailed) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto"
      >
        <div className="glass-strong rounded-2xl p-8 space-y-6 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-destructive/20 text-destructive flex items-center justify-center">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-display font-bold text-foreground">
              {isTransform ? "Transformation Failed" : "3D Conversion Failed"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {errorMessage || "Something went wrong. Please try again."}
            </p>
          </div>
          <Button
            variant="hero"
            size="lg"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="glass-strong rounded-2xl p-8 space-y-8">
        {/* Image Preview */}
        <div className="relative aspect-square max-w-xs mx-auto rounded-xl overflow-hidden">
          {previewImageUrl ? (
            <Image
              src={previewImageUrl}
              alt="Processing"
              fill
              className={cn(
                "object-cover transition-all duration-700",
                progress > 50 && isTransform && "saturate-150 contrast-110",
              )}
            />
          ) : (
            <div className="w-full h-full bg-muted animate-pulse" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />

          {/* Animated overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-primary opacity-20"
            animate={{
              opacity: [0.1, 0.3, 0.1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Scanning line effect */}
          <motion.div
            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
            animate={{
              top: ["0%", "100%"],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <motion.div
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center",
              isTransform
                ? "bg-primary/20 text-primary"
                : "bg-accent/20 text-accent",
            )}
            animate={{
              scale: [1, 1.1, 1],
              rotate: isTransform ? [0, 5, -5, 0] : [0, 0, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {isTransform ? (
              <Sparkles className="w-8 h-8" />
            ) : (
              <Box className="w-8 h-8" />
            )}
          </motion.div>
        </div>

        {/* Text */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-display font-bold text-foreground">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span
              className={cn(
                "font-semibold",
                isTransform ? "text-primary" : "text-accent",
              )}
            >
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full rounded-full",
                isTransform ? "bg-gradient-primary" : "bg-accent",
              )}
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Processing steps */}
        <div className="space-y-2">
          {(isTransform
            ? [
                { label: "Analyzing facial features", threshold: 20 },
                { label: "Applying Fun style", threshold: 50 },
                { label: "Refining details", threshold: 80 },
                { label: "Finalizing artwork", threshold: 95 },
              ]
            : [
                { label: "Extracting depth information", threshold: 15 },
                { label: "Generating mesh geometry", threshold: 40 },
                { label: "Applying textures", threshold: 70 },
                { label: "Optimizing 3D model", threshold: 90 },
              ]
          ).map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{
                opacity: progress >= step.threshold - 15 ? 1 : 0.3,
                x: 0,
              }}
              className="flex items-center gap-3 text-sm"
            >
              <div
                className={cn(
                  "w-2 h-2 rounded-full transition-colors duration-300",
                  progress >= step.threshold
                    ? isTransform
                      ? "bg-primary"
                      : "bg-accent"
                    : "bg-muted-foreground/30",
                )}
              />
              <span
                className={cn(
                  "transition-colors duration-300",
                  progress >= step.threshold
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.label}
              </span>
              {progress >= step.threshold && (
                <motion.span
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    "ml-auto text-xs font-medium",
                    isTransform ? "text-primary" : "text-accent",
                  )}
                >
                  ✓
                </motion.span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
