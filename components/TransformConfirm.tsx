"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TransformConfirmProps {
  submissionId: Id<"submissions">;
  onConfirm: () => void;
  onBack: () => void;
}

export const TransformConfirm = ({
  submissionId,
  onConfirm,
  onBack,
}: TransformConfirmProps) => {
  const submission = useQuery(api.submissions.get, { id: submissionId });

  if (!submission) {
    return (
      <div className="w-full max-w-xl mx-auto">
        <div className="glass-strong rounded-2xl p-8 animate-pulse">
          <div className="aspect-square bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto"
    >
      <div className="glass-strong rounded-2xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-xl bg-primary/20 text-primary flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-display font-bold text-foreground">
            Transformation Complete!
          </h3>
          <p className="text-sm text-muted-foreground">
            Review your Go Figure and continue to 3D conversion
          </p>
        </div>

        {/* Before/After Comparison */}
        <div className="grid grid-cols-2 gap-4">
          {/* Original */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center uppercase tracking-wide font-medium">
              Original
            </p>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted relative">
              {submission.sourceImageUrl ? (
                <Image
                  src={submission.sourceImageUrl}
                  alt="Original"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full animate-pulse" />
              )}
            </div>
          </div>

          {/* Transformed */}
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center uppercase tracking-wide font-medium">
              Go Figure
            </p>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted ring-2 ring-primary ring-offset-2 ring-offset-background relative">
              {submission.resultImageUrl ? (
                <Image
                  src={submission.resultImageUrl}
                  alt="Go Figure"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            size="lg"
            onClick={onBack}
            className="flex-1"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Try Again
          </Button>
          <Button
            variant="hero"
            size="lg"
            onClick={onConfirm}
            className="flex-1"
          >
            Continue to 3D
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
