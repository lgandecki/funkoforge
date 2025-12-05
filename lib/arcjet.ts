import arcjet, { detectBot, tokenBucket } from "@arcjet/next";

// Only create arcjet instance if key is available
export const aj = process.env.ARCJET_KEY
  ? arcjet({
      key: process.env.ARCJET_KEY,
      rules: [
        detectBot({
          mode: "LIVE",
          allow: [],
        }),
        tokenBucket({
          mode: "LIVE",
          characteristics: ["ip.src"],
          refillRate: 5,
          interval: parseInt(process.env.ARCJET_RATE_LIMIT_INTERVAL || "120"),
          capacity: parseInt(process.env.ARCJET_RATE_LIMIT_CAPACITY || "5"),
        }),
      ],
    })
  : null!;
