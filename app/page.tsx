"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { Hero } from "@/components/Hero";
import { StepIndicator } from "@/components/StepIndicator";
import { ImageUploader } from "@/components/ImageUploader";
import { ProcessingStep } from "@/components/ProcessingStep";
import { TransformConfirm } from "@/components/TransformConfirm";
import { ResultPreview } from "@/components/ResultPreview";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const steps = [
  { label: "Upload", icon: null },
  { label: "Transform", icon: null },
  { label: "3D Convert", icon: null },
  { label: "Preview", icon: null },
];

type AppPhase =
  | "upload"
  | "transforming"
  | "transform-confirm"
  | "converting-3d"
  | "preview";

export default function Home() {
  const [phase, setPhase] = useState<AppPhase>("upload");
  const [submissionId, setSubmissionId] = useState<Id<"submissions"> | null>(
    null,
  );
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);

  // Map phase to step indicator
  const currentStep =
    phase === "upload"
      ? 0
      : phase === "transforming" || phase === "transform-confirm"
        ? 1
        : phase === "converting-3d"
          ? 2
          : 3;

  const handleSubmissionCreated = useCallback((id: Id<"submissions">, imageBase64: string) => {
    setSubmissionId(id);
    setUploadedImageUrl(imageBase64);
    setPhase("transforming");
  }, []);

  const handleTransformComplete = useCallback(() => {
    setPhase("transform-confirm");
  }, []);

  const handleTransformError = useCallback((error: string) => {
    toast.error("Transformation failed", {
      description: error,
    });
  }, []);

  const handleConfirmTransform = useCallback(() => {
    setPhase("converting-3d");
  }, []);

  const handleBackToUpload = useCallback(() => {
    setPhase("upload");
    setSubmissionId(null);
    setUploadedImageUrl(null);
  }, []);

  const handleConvert3DComplete = useCallback(() => {
    setPhase("preview");
  }, []);

  const handleStartOver = useCallback(() => {
    setPhase("upload");
    setSubmissionId(null);
    setUploadedImageUrl(null);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12 flex-1">
        <Hero />

        <div className="mb-12">
          <StepIndicator currentStep={currentStep} steps={steps} />
        </div>

        <AnimatePresence mode="wait">
          {phase === "upload" && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ImageUploader onSubmissionCreated={handleSubmissionCreated} />
            </motion.div>
          )}

          {phase === "transforming" && submissionId && (
            <motion.div
              key="transform"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProcessingStep
                type="transform"
                submissionId={submissionId}
                onComplete={handleTransformComplete}
                onError={handleTransformError}
                initialImageUrl={uploadedImageUrl ?? undefined}
              />
            </motion.div>
          )}

          {phase === "transform-confirm" && submissionId && (
            <motion.div
              key="transform-confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TransformConfirm
                submissionId={submissionId}
                onConfirm={handleConfirmTransform}
                onBack={handleBackToUpload}
              />
            </motion.div>
          )}

          {phase === "converting-3d" && submissionId && (
            <motion.div
              key="convert3d"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProcessingStep
                type="convert3d"
                submissionId={submissionId}
                onComplete={handleConvert3DComplete}
              />
            </motion.div>
          )}

          {phase === "preview" && submissionId && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResultPreview
                submissionId={submissionId}
                onStartOver={handleStartOver}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Process Preview - only show on upload phase */}
        {phase === "upload" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-8 mb-8"
          >
            <div className="flex items-center justify-center gap-2 md:gap-4">
              {/* Step 1: Original */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden ring-1 ring-border">
                  <Image
                    src="/original.webp"
                    alt="Original photo"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-muted-foreground">Photo</span>
              </div>

              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />

              {/* Step 2: 2D Figurine */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden ring-1 ring-primary/50">
                  <Image
                    src="/Figurine-2d.webp"
                    alt="2D Figurine"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-muted-foreground">2D</span>
              </div>

              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground flex-shrink-0" />

              {/* Step 3: 3D Figurine */}
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden ring-2 ring-accent glow-accent">
                  <Image
                    src="/Figurine-3d.webp"
                    alt="3D Figurine"
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xs text-accent font-medium">3D</span>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Footer */}
      <footer className="relative z-10 py-6 text-center space-y-1">
        <p className="text-sm text-muted-foreground">
          Made with magic for collectors everywhere
        </p>
        <p className="text-xs text-muted-foreground">
          by{" "}
          <a
            href="https://lgandecki.net"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Łukasz Gandecki
          </a>
        </p>
      </footer>
    </div>
  );
}
