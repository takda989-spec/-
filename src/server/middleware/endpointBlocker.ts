/**
 * Endpoint blocking middleware
 * Blocks access to configured endpoints via the Spoof settings
 */

import { isEndpointBlocked } from "@/lib/localDb";
import { NextRequest, NextResponse } from "next/server";
import { errorResponse } from "@omniroute/open-sse/utils/error";

/**
 * Check if the request path matches a blocked endpoint
 * Returns true if blocked, false if allowed
 */
export function isRequestBlocked(pathname: string): boolean {
  try {
    return isEndpointBlocked(pathname);
  } catch (err) {
    // If DB check fails, log but allow the request through (fail-open)
    console.error("[endpointBlocker] DB check failed:", err);
    return false;
  }
}

/**
 * Middleware helper to block requests to configured endpoints
 * Usage in route handlers:
 *
 * ```ts
 * export async function GET(req: NextRequest) {
 *   const blockResult = checkEndpointBlock(req);
 *   if (blockResult) return blockResult;
 *   // ... rest of handler
 * }
 * ```
 */
export function checkEndpointBlock(req: NextRequest): NextResponse | null {
  const pathname = new URL(req.url).pathname;

  if (isRequestBlocked(pathname)) {
    return errorResponse(
      403,
      "ACCESS_DENIED",
      "This endpoint has been blocked by the administrator"
    );
  }

  return null;
}

/**
 * Express-style middleware variant for non-Next.js routes
 */
export function endpointBlockerMiddleware(
  req: { url: string },
  res: { status: (code: number) => { json: (body: unknown) => void } },
  next: () => void
): void {
  const pathname = new URL(req.url, "http://localhost").pathname;

  if (isRequestBlocked(pathname)) {
    res.status(403).json({
      error: {
        type: "ACCESS_DENIED",
        message: "This endpoint has been blocked by the administrator",
      },
    });
    return;
  }

  next();
}
