"use client";

import { useEffect, useState, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ModelViewerProps {
  src: string;
  alt?: string;
  className?: string;
  poster?: string;
}

export function ModelViewer({
  src,
  alt = "3D Model",
  className,
  poster,
}: ModelViewerProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const modelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Dynamically import model-viewer to avoid SSR issues
    import("@google/model-viewer");
  }, []);

  useEffect(() => {
    const modelViewer = modelRef.current;
    if (!modelViewer) return;

    const handleLoad = () => setIsLoaded(true);
    modelViewer.addEventListener("load", handleLoad);

    return () => {
      modelViewer.removeEventListener("load", handleLoad);
    };
  }, []);

  return (
    <div className={`relative ${className || ""}`}>
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-xl z-10">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}
      {/* @ts-expect-error - model-viewer is a web component */}
      <model-viewer
        ref={modelRef}
        src={src}
        alt={alt}
        auto-rotate
        camera-controls
        shadow-intensity="1"
        environment-image="neutral"
        exposure="0.7"
        poster={poster}
        loading="eager"
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "transparent",
        }}
      />
    </div>
  );
}
