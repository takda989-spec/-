/**
 * API Route: GET /api/statistic/usage
 * Get usage statistics for an API key
 * Supports: Authorization header OR ?apikey= query param
 */

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/localDb";
import { getDbInstance } from "@/lib/db/core";
import { errorResponse } from "@omniroute/open-sse/utils/error";

export async function GET(req: NextRequest) {
  try {
    // Extract API key from Authorization header OR query param
    const authHeader = req.headers.get("authorization");
    const queryKey = req.nextUrl.searchParams.get("apikey");

    let apiKey: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      apiKey = authHeader.substring(7);
    } else if (queryKey) {
      apiKey = queryKey;
    }

    if (!apiKey) {
      return errorResponse(401, "UNAUTHORIZED", "API key is required");
    }

    // Validate API key (boolean return)
    const isValid = await validateApiKey(apiKey);
    if (!isValid) {
      return errorResponse(401, "INVALID_API_KEY", "Invalid API key");
    }

    // Look up key record — usage_history references api_key_id (UUID) or api_key_name
    const db = getDbInstance();
    const keyRow = db
      .prepare("SELECT id, name FROM api_keys WHERE key = ?")
      .get(apiKey) as { id: string; name: string } | undefined;

    if (!keyRow) {
      return errorResponse(404, "KEY_NOT_FOUND", "API key record not found");
    }

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // usage_history uses `timestamp` (not created_at), no cost_usd column
    // Cost is calculated: tokens / 200_000 * 1 (the user's configured rate)
    const row = db
      .prepare(
        `SELECT
           COALESCE(SUM(tokens_input + tokens_output), 0) AS total_tokens,
           COALESCE(SUM(tokens_input), 0) AS total_input,
           COALESCE(SUM(tokens_output), 0) AS total_output,
           COUNT(*) AS total_requests
         FROM usage_history
         WHERE (api_key_id = ? OR api_key_name = ?)
           AND timestamp >= ?`
      )
      .get(keyRow.id, keyRow.name, periodStart) as
      | { total_tokens: number; total_input: number; total_output: number; total_requests: number }
      | undefined;

    const totalTokens = row?.total_tokens ?? 0;
    const totalRequests = row?.total_requests ?? 0;
    // $1 = 200,000 tokens
    const totalCost = totalTokens / 200000;

    return NextResponse.json({
      totalTokens,
      totalInput: row?.total_input ?? 0,
      totalOutput: row?.total_output ?? 0,
      totalRequests,
      totalCost,
      apiKeyName: keyRow.name || "Unnamed Key",
      periodStart: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      periodEnd: now.toISOString(),
    });
  } catch (err) {
    console.error("[statistic/usage] GET failed:", err);
    return errorResponse(500, "INTERNAL_ERROR", "Failed to retrieve usage statistics");
  }
}
