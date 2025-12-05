"use client";

import { motion } from "framer-motion";
import { RotateCcw, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultPreviewProps {
  transformedImage: string;
  onStartOver: () => void;
}

export const ResultPreview = ({
  transformedImage,
  onStartOver,
}: ResultPreviewProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="grid md:grid-cols-2 gap-6">
        {/* Transformed Image */}
        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground">
            Your Funko Pop
          </h3>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted">
            <img
              src={transformedImage}
              alt="Funko Pop version"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* 3D Model Viewer Placeholder */}
        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground">
            3D Model Viewer
          </h3>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted/50 flex flex-col items-center justify-center border-2 border-dashed border-border">
            <motion.div
              className="w-24 h-24 mb-4"
              animate={{
                rotateY: [0, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <svg
                viewBox="0 0 100 100"
                className="w-full h-full text-muted-foreground"
              >
                {/* Simple 3D cube representation */}
                <polygon
                  points="50,10 90,30 90,70 50,90 10,70 10,30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="opacity-30"
                />
                <polygon
                  points="50,10 90,30 50,50 10,30"
                  fill="currentColor"
                  className="opacity-10"
                />
                <polygon
                  points="50,50 90,30 90,70 50,90"
                  fill="currentColor"
                  className="opacity-20"
                />
                <polygon
                  points="50,50 10,30 10,70 50,90"
                  fill="currentColor"
                  className="opacity-15"
                />
                <line
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="90"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="opacity-40"
                />
              </svg>
            </motion.div>
            <p className="text-sm text-muted-foreground text-center px-4">
              3D viewer will be displayed here
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Implementation pending
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap justify-center gap-4 mt-8"
      >
        <Button variant="glass" size="lg" onClick={onStartOver}>
          <RotateCcw className="w-5 h-5" />
          Create Another
        </Button>
        <Button variant="outline" size="lg">
          <Download className="w-5 h-5" />
          Download Image
        </Button>
        <Button variant="secondary" size="lg">
          <Share2 className="w-5 h-5" />
          Share
        </Button>
      </motion.div>
    </motion.div>
  );
};
