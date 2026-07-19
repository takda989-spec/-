/**
 * SSE transform для замены имён моделей в streaming ответах
 * Преобразует original_name → alias_name в каждом SSE чанке
 */

import { transformSSEData } from "@/lib/spoof/modelAliasTransform";

export function createModelAliasTransform(): TransformStream<string, string> {
  return new TransformStream<string, string>({
    transform(chunk, controller) {
      // Каждая строка SSE: "data: {...}" или "data: [DONE]"
      const lines = chunk.split("\n");
      const transformed = lines
        .map((line) => {
          if (!line.startsWith("data: ")) return line;
          const data = line.slice(6); // убираем "data: "
          return "data: " + transformSSEData(data);
        })
        .join("\n");
      controller.enqueue(transformed);
    },
  });
}
