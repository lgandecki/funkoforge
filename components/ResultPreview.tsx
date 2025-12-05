"use client";

import { motion } from "framer-motion";
import { RotateCcw, Download, Share2, FileBox, Cube } from "lucide-react";
import { useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface ResultPreviewProps {
  submissionId: Id<"submissions">;
  onStartOver: () => void;
}

export const ResultPreview = ({
  submissionId,
  onStartOver,
}: ResultPreviewProps) => {
  const submission = useQuery(api.submissions.get, { id: submissionId });

  const handleDownloadImage = () => {
    if (submission?.resultImageUrl) {
      const link = document.createElement("a");
      link.href = submission.resultImageUrl;
      link.download = "funko-pop.png";
      link.click();
    }
  };

  const handleDownloadModel = (format: "glb" | "fbx" | "obj" | "usdz") => {
    const url = submission?.modelUrls?.[format];
    if (url) {
      const link = document.createElement("a");
      link.href = url;
      link.download = `funko-pop-model.${format}`;
      link.target = "_blank";
      link.click();
    }
  };

  const handleShare = async () => {
    if (navigator.share && submission?.resultImageUrl) {
      try {
        await navigator.share({
          title: "My Funko Pop!",
          text: "Check out my custom Funko Pop figurine created with FunkoForge!",
          url: window.location.href,
        });
      } catch (error) {
        // User cancelled or share failed
        console.log("Share cancelled");
      }
    }
  };

  if (!submission) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <div className="glass-strong rounded-2xl p-8 animate-pulse">
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

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
            {submission.resultImageUrl ? (
              <img
                src={submission.resultImageUrl}
                alt="Funko Pop version"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-muted-foreground">Loading...</span>
              </div>
            )}
          </div>
        </div>

        {/* 3D Model Preview */}
        <div className="glass-strong rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-display font-semibold text-foreground">
            3D Model Preview
          </h3>
          <div className="aspect-square rounded-xl overflow-hidden bg-muted/50">
            {submission.meshThumbnailUrl ? (
              <img
                src={submission.meshThumbnailUrl}
                alt="3D Model Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center border-2 border-dashed border-border">
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
                  <Cube className="w-full h-full text-muted-foreground opacity-30" />
                </motion.div>
                <p className="text-sm text-muted-foreground">
                  3D model preview
                </p>
              </div>
            )}
          </div>

          {/* Download Model Buttons */}
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
        <Button
          variant="outline"
          size="lg"
          onClick={handleDownloadImage}
          disabled={!submission.resultImageUrl}
        >
          <Download className="w-5 h-5" />
          Download Image
        </Button>
        <Button variant="secondary" size="lg" onClick={handleShare}>
          <Share2 className="w-5 h-5" />
          Share
        </Button>
      </motion.div>
    </motion.div>
  );
};
