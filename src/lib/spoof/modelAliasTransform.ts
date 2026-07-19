/**
 * Model renaming transform — полное переименование модели.
 *
 * Входящий запрос (клиент → роутер):
 *   display_name → original_name  (чтобы правильно маршрутизировать к провайдеру)
 *
 * Исходящий ответ (роутер → клиент):
 *   original_name → display_name  (старое имя нигде не появляется)
 *
 * Логи, SSE стримы — то же самое: original_name → display_name везде.
 */

import { resolveIncomingModel, resolveOutgoingModel } from "@/lib/db/modelAliases";

/**
 * Входящий запрос: заменяет display_name на original_name для роутинга
 */
export function transformRequestBody<T extends Record<string, unknown>>(body: T): T {
  if (!body) return body;
  const out = { ...body };
  if (typeof out.model === "string") {
    out.model = resolveIncomingModel(out.model);
  }
  return out;
}

/**
 * Исходящий ответ: заменяет original_name на display_name везде
 */
export function transformResponseBody<T extends Record<string, unknown>>(body: T): T {
  if (!body) return body;
  const out = { ...body };

  // Поле model верхнего уровня
  if (typeof out.model === "string") {
    out.model = resolveOutgoingModel(out.model);
  }

  // choices[].delta.model и choices[].message.model (стриминг и обычный ответ)
  if (Array.isArray(out.choices)) {
    out.choices = out.choices.map((choice: unknown) => {
      if (typeof choice !== "object" || choice === null) return choice;
      const c = choice as Record<string, unknown>;
      const patched: Record<string, unknown> = { ...c };
      if (typeof c.delta === "object" && c.delta !== null) {
        const d = c.delta as Record<string, unknown>;
        if (typeof d.model === "string") patched.delta = { ...d, model: resolveOutgoingModel(d.model) };
      }
      if (typeof c.message === "object" && c.message !== null) {
        const m = c.message as Record<string, unknown>;
        if (typeof m.model === "string") patched.message = { ...m, model: resolveOutgoingModel(m.model) };
      }
      return patched;
    });
  }

  // data[].id — список моделей (/v1/models)
  if (Array.isArray(out.data)) {
    out.data = out.data.map((item: unknown) => {
      if (typeof item !== "object" || item === null) return item;
      const obj = item as Record<string, unknown>;
      if (typeof obj.id === "string") {
        return { ...obj, id: resolveOutgoingModel(obj.id) };
      }
      return obj;
    });
  }

  return out;
}

/**
 * SSE строка ("data: {...}") — заменяет original_name на display_name
 */
export function transformSSEData(data: string): string {
  if (data === "[DONE]" || !data.trim()) return data;
  try {
    const parsed = JSON.parse(data);
    return JSON.stringify(transformResponseBody(parsed));
  } catch {
    return data;
  }
}
