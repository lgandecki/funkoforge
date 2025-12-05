"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "@/components/Hero";
import { StepIndicator } from "@/components/StepIndicator";
import { ImageUploader } from "@/components/ImageUploader";
import { ProcessingStep } from "@/components/ProcessingStep";
import { ResultPreview } from "@/components/ResultPreview";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const steps = [
  { label: "Upload", icon: null },
  { label: "Transform", icon: null },
  { label: "3D Convert", icon: null },
  { label: "Preview", icon: null },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [submissionId, setSubmissionId] = useState<Id<"submissions"> | null>(null);
  const [transformedImageUrl, setTransformedImageUrl] = useState<string | null>(null);

  const handleSubmissionCreated = useCallback((id: Id<"submissions">) => {
    setSubmissionId(id);
    setCurrentStep(1);
  }, []);

  const handleTransformComplete = useCallback((resultImageUrl: string) => {
    setTransformedImageUrl(resultImageUrl);
    setCurrentStep(2);
  }, []);

  const handleTransformError = useCallback((error: string) => {
    toast.error("Transformation failed", {
      description: error,
    });
    // Don't reset - let the user see the error in ProcessingStep
  }, []);

  const handleConvert3DComplete = useCallback(() => {
    setCurrentStep(3);
  }, []);

  const handleStartOver = useCallback(() => {
    setCurrentStep(0);
    setSubmissionId(null);
    setTransformedImageUrl(null);
  }, []);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-accent/3 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <Hero />

        <div className="mb-12">
          <StepIndicator currentStep={currentStep} steps={steps} />
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 0 && (
            <motion.div
              key="upload"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ImageUploader onSubmissionCreated={handleSubmissionCreated} />
            </motion.div>
          )}

          {currentStep === 1 && submissionId && (
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
              />
            </motion.div>
          )}

          {currentStep === 2 && submissionId && transformedImageUrl && (
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

          {currentStep === 3 && submissionId && (
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
      </div>

      {/* Footer */}
      <footer className="relative z-10 mt-auto py-6 text-center">
        <p className="text-sm text-muted-foreground">
          Made with magic for collectors everywhere
        </p>
      </footer>
    </div>
  );
}
