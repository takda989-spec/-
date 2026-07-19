/**
 * API Route: DELETE /api/spoof/model-aliases/[id]
 * Remove a model alias
 */

import { NextRequest, NextResponse } from "next/server";
import { removeModelAlias } from "@/lib/localDb";
import { errorResponse } from "@omniroute/open-sse/utils/error";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15+ передаёт params как Promise
    const params = context.params instanceof Promise ? await context.params : context.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) return errorResponse(400, "INVALID_ID", "Invalid ID");

    const success = removeModelAlias(id);
    if (!success) return errorResponse(404, "NOT_FOUND", "Rename not found");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[model-aliases/delete] DELETE failed:", err);
    return errorResponse(500, "INTERNAL_ERROR", "Failed to remove model rename");
  }
}
