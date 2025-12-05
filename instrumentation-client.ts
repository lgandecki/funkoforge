import { initBotId } from "botid/client/core";

// Only initialize botid if crypto.subtle is available (not in all dev environments)
if (typeof window !== "undefined" && window.crypto?.subtle) {
  try {
    initBotId({
      protect: [
        {
          path: "/",
          method: "POST",
        },
      ],
    });
  } catch (error) {
    console.warn("BotId initialization failed:", error);
  }
}
