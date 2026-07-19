/**
 * API Route: GET /api/spoof/model-aliases
 * Список всех переименований
 */

import { NextRequest, NextResponse } from "next/server";
import { getAllModelAliases } from "@/lib/localDb";
import { errorResponse } from "@omniroute/open-sse/utils/error";

export async function GET(_req: NextRequest) {
  try {
    const renames = getAllModelAliases();
    return NextResponse.json({ renames });
  } catch (err) {
    console.error("[model-aliases] GET failed:", err);
    return errorResponse(500, "INTERNAL_ERROR", "Failed to retrieve model renames");
  }
}
