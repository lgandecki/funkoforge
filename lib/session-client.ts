const SESSION_COOKIE_NAME = "sessionId";

/**
 * Get sessionId from cookies (client-side)
 * Returns the sessionId from document.cookie
 */
export function getSessionIdClient(): string {
  if (typeof document === "undefined") return "";

  const match = document.cookie.match(new RegExp(`(^| )${SESSION_COOKIE_NAME}=([^;]+)`));
  return match ? match[2] : "";
}
