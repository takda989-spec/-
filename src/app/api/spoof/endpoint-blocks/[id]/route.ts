/**
 * API Route: DELETE /api/spoof/endpoint-blocks/[id]
 * Remove a blocked endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { removeEndpointBlock } from "@/lib/localDb";
import { errorResponse } from "@omniroute/open-sse/utils/error";

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Next.js 15+ передаёт params как Promise
    const params = context.params instanceof Promise ? await context.params : context.params;
    const id = parseInt(params.id, 10);

    if (isNaN(id)) {
      return errorResponse(400, "INVALID_ID", "Invalid endpoint block ID");
    }

    const success = removeEndpointBlock(id);
    if (!success) {
      return errorResponse(404, "NOT_FOUND", "Endpoint block not found");
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[endpoint-blocks/delete] DELETE failed:", err);
    return errorResponse(500, "INTERNAL_ERROR", "Failed to remove endpoint block");
  }
}
