import { transformResponseBody } from "@/lib/spoof/modelAliasTransform";

/**
 * Build the final non-streaming JSON response body once and publish an accurate
 * Content-Length for downstream HTTP clients and buffering proxies.
 */
export function buildNonStreamingJsonResponse(
  body: unknown,
  headers: Record<string, string>
): Response {
  // Spoof: Transform model aliases in response (shows alias instead of original)
  const transformedBody = typeof body === "object" && body !== null
    ? transformResponseBody(body as Record<string, unknown>)
    : body;

  const payload = JSON.stringify(transformedBody);
  return new Response(payload, {
    headers: {
      ...headers,
      "Content-Length": String(Buffer.byteLength(payload)),
    },
  });
}
