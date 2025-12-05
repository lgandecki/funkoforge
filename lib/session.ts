import { cookies } from "next/headers";

const SESSION_COOKIE_NAME = "sessionId";
const SESSION_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

/**
 * READ ONLY - for Server Components
 * Returns sessionId if exists, null otherwise
 */
export async function getSessionIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * READ + SET - for Server Actions only
 * Creates new sessionId if doesn't exist
 */
export async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = crypto.randomUUID();
  }

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_COOKIE_MAX_AGE,
    path: "/",
  });

  return sessionId;
}
