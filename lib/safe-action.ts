import { createSafeActionClient } from "next-safe-action";
import { checkBotId } from "botid/server";
import { headers } from "next/headers";
import { aj } from "@/lib/arcjet";

export const actionClient = createSafeActionClient()
  .use(async ({ next }) => {
    // Skip botid check in development or if it fails
    if (process.env.NODE_ENV === "development") {
      return next();
    }

    try {
      const verification = await checkBotId();

      if (verification.isBot) {
        throw new Error("Bot detected. Access denied.");
      }
    } catch (error) {
      // In case botid fails, log and continue in development
      console.warn("BotId check failed:", error);
    }

    return next();
  })
  .use(async ({ next }) => {
    // Skip arcjet in development if ARCJET_KEY is not set
    if (!process.env.ARCJET_KEY) {
      return next();
    }

    const req = new Request("https://funkoforge.com", { headers: await headers() });

    const decision = await aj.protect(req, { requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isRateLimit()) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      throw new Error("Request blocked for security reasons.");
    }

    if (decision.ip.isHosting()) {
      throw new Error("Forbidden");
    }

    return next();
  });
