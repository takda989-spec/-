/**
 * API Route: POST /api/spoof/endpoint-blocks/add
 * Add a new blocked endpoint
 */

import { NextRequest, NextResponse } from "next/server";
import { addEndpointBlock } from "@/lib/localDb";
import { errorResponse } from "@omniroute/open-sse/utils/error";
import { z } from "zod";

const AddEndpointBlockSchema = z.object({
  endpoint: z.string().min(1, "Endpoint path is required"),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = AddEndpointBlockSchema.parse(body);

    const block = addEndpointBlock(validated);
    return NextResponse.json({ block });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(400, "VALIDATION_ERROR", err.errors[0].message);
    }
    console.error("[endpoint-blocks/add] POST failed:", err);
    return errorResponse(500, "INTERNAL_ERROR", "Failed to add endpoint block");
  }
}
