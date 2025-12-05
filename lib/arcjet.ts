import arcjet, { detectBot, tokenBucket } from "@arcjet/next";

if (!process.env.ARCJET_KEY) {
  throw new Error("ARCJET_KEY is not set");
}

export const aj = arcjet({
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
});
