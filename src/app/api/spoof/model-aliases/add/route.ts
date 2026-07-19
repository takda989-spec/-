/**
 * API Route: POST /api/spoof/model-aliases/add
 * Добавить переименование модели
 */

import { NextRequest, NextResponse } from "next/server";
import { addModelAlias } from "@/lib/localDb";
import { errorResponse } from "@omniroute/open-sse/utils/error";
import { z } from "zod";

const Schema = z.object({
  original_name: z.string().min(1, "Оригинальное имя обязательно"),
  display_name: z.string().min(1, "Новое имя обязательно"),
  description: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = Schema.parse(body);
    const rename = addModelAlias(validated);
    return NextResponse.json({ rename });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return errorResponse(400, "VALIDATION_ERROR", err.errors[0].message);
    }
    console.error("[model-aliases/add] POST failed:", err);
    return errorResponse(500, "INTERNAL_ERROR", "Failed to add model rename");
  }
}
