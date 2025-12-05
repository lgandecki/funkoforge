"use client";

import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, X, Image as ImageIcon, Sparkles, Loader2 } from "lucide-react";
import Webcam from "react-webcam";
import { useAction } from "next-safe-action/hooks";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { transformImageAction } from "@/app/actions/transform-image-action";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { getSessionIdClient } from "@/lib/session-client";

interface ImageUploaderProps {
  onSubmissionCreated: (submissionId: Id<"submissions">) => void;
}

export const ImageUploader = ({ onSubmissionCreated }: ImageUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { executeAsync } = useAction(transformImageAction);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  }, []);

  const handleFile = (file: File) => {
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviewImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
  };

  const capturePhoto = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setPreviewImage(imageSrc);
      setShowCamera(false);
    }
  }, []);

  const handleConfirm = async () => {
    if (!previewImage) return;

    setIsSubmitting(true);

    try {
      const sessionId = getSessionIdClient() || undefined;
      const response = await executeAsync({
        imageBase64: previewImage,
        sessionId,
      });

      if (response?.data?.submissionId) {
        onSubmissionCreated(response.data.submissionId);
      } else if (response?.serverError) {
        toast.error("Failed to start transformation", {
          description: response.serverError,
        });
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error("Transform error:", error);
      toast.error("Failed to start transformation");
      setIsSubmitting(false);
    }
  };

  const clearImage = () => {
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xl mx-auto"
    >
      <AnimatePresence mode="wait">
        {showCamera ? (
          <motion.div
            key="camera"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-strong rounded-2xl p-6 space-y-4"
          >
            <div className="relative rounded-xl overflow-hidden">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                className="w-full rounded-xl"
                videoConstraints={{
                  facingMode: "user",
                  aspectRatio: 1,
                }}
              />
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="glass"
                size="lg"
                onClick={() => setShowCamera(false)}
              >
                <X className="w-5 h-5" />
                Cancel
              </Button>
              <Button variant="hero" size="lg" onClick={capturePhoto}>
                <Camera className="w-5 h-5" />
                Capture
              </Button>
            </div>
          </motion.div>
        ) : previewImage ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="glass-strong rounded-2xl p-6 space-y-4"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden">
              <img
                src={previewImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
              {!isSubmitting && (
                <button
                  onClick={clearImage}
                  className="absolute top-3 right-3 p-2 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            <div className="flex gap-3 justify-center">
              <Button
                variant="glass"
                size="lg"
                onClick={clearImage}
                disabled={isSubmitting}
              >
                Choose Different
              </Button>
              <Button
                variant="hero"
                size="lg"
                onClick={handleConfirm}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Transform to Funko
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="upload"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={cn(
              "glass-strong rounded-2xl p-8 md:p-12 transition-all duration-300 cursor-pointer group",
              isDragging && "border-primary glow-primary"
            )}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
            <div className="flex flex-col items-center text-center space-y-6">
              <motion.div
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                  isDragging
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                )}
                animate={isDragging ? { scale: 1.1 } : { scale: 1 }}
              >
                <ImageIcon className="w-10 h-10" />
              </motion.div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-foreground">
                  Drop your photo here
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse • PNG, JPG up to 10MB
                </p>
              </div>
              <div className="flex items-center gap-4 w-full">
                <div className="flex-1 h-px bg-border" />
                <span className="text-sm text-muted-foreground">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <Button
                variant="secondary"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCamera(true);
                }}
              >
                <Camera className="w-5 h-5" />
                Take a Selfie
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
