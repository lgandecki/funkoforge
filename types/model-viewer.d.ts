declare namespace JSX {
  interface IntrinsicElements {
    "model-viewer": React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src?: string;
        alt?: string;
        poster?: string;
        loading?: "auto" | "lazy" | "eager";
        reveal?: "auto" | "manual";
        "auto-rotate"?: boolean;
        "auto-rotate-delay"?: number;
        "rotation-per-second"?: string;
        "camera-controls"?: boolean;
        "disable-zoom"?: boolean;
        "disable-pan"?: boolean;
        "touch-action"?: string;
        "interaction-prompt"?: "auto" | "none";
        "shadow-intensity"?: string;
        "shadow-softness"?: string;
        "environment-image"?: string;
        exposure?: string;
        "tone-mapping"?: string;
        ar?: boolean;
        "ar-modes"?: string;
        "ar-scale"?: string;
        "ios-src"?: string;
        onLoad?: () => void;
        onError?: (event: ErrorEvent) => void;
        onProgress?: (event: ProgressEvent) => void;
      },
      HTMLElement
    >;
  }
}
