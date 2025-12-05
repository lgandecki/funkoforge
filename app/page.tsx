"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Hero } from "@/components/Hero";
import { StepIndicator } from "@/components/StepIndicator";
import { ImageUploader } from "@/components/ImageUploader";
import { ProcessingStep } from "@/components/ProcessingStep";
import { ResultPreview } from "@/components/ResultPreview";

const steps = [
  { label: "Upload", icon: null },
  { label: "Transform", icon: null },
  { label: "3D Convert", icon: null },
  { label: "Preview", icon: null },
];

export default function Home() {
  const [currentStep, setCurrentStep] = useState(0);
  const [sourceImage, setSourceImage] = useState<string | null>(null);
  const [transformedImage, setTransformedImage] = useState<string | null>(null);

  const handleImageSelect = (image: string) => {
    setSourceImage(image);
    setCurrentStep(1);
  };

  const handleTransformComplete = (result: string) => {
    setTransformedImage(result);
    setCurrentStep(2);
  };

  const handleConvert3DComplete = () => {
    setCurrentStep(3);
  };

  const handleStartOver = () => {
    setCurrentStep(0);
    setSourceImage(null);
    setTransformedImage(null);
  };

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
              <ImageUploader onImageSelect={handleImageSelect} />
            </motion.div>
          )}

          {currentStep === 1 && sourceImage && (
            <motion.div
              key="transform"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProcessingStep
                type="transform"
                sourceImage={sourceImage}
                onComplete={handleTransformComplete}
              />
            </motion.div>
          )}

          {currentStep === 2 && transformedImage && (
            <motion.div
              key="convert3d"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ProcessingStep
                type="convert3d"
                sourceImage={transformedImage}
                onComplete={handleConvert3DComplete}
              />
            </motion.div>
          )}

          {currentStep === 3 && transformedImage && (
            <motion.div
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <ResultPreview
                transformedImage={transformedImage}
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
