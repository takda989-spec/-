/**
 * API Route: GET /api/spoof/endpoint-blocks
 * List all blocked endpoints
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllEndpointBlocks } from "@/lib/localDb";
import { errorResponse } from "@omniroute/open-sse/utils/error";

export async function GET(req: NextRequest) {
  try {
    const blocks = getAllEndpointBlocks();
    return NextResponse.json({ blocks });
  } catch (err) {
    console.error("[endpoint-blocks] GET failed:", err);
    return errorResponse(500, "INTERNAL_ERROR", "Failed to retrieve endpoint blocks");
  }
}
