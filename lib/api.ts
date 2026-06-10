/* Shared helpers for route handlers. */

export function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, init);
}

export function badRequest(message: string): Response {
  return Response.json({ error: message }, { status: 400 });
}

export function unauthorized(message = "Unauthorized"): Response {
  return Response.json({ error: message }, { status: 401 });
}

export function notFound(message = "Not found"): Response {
  return Response.json({ error: message }, { status: 404 });
}

export function serverError(message = "Something went wrong"): Response {
  return Response.json({ error: message }, { status: 500 });
}

/** Normalize an admin-supplied image URL list: trim, drop empties, cap at 8. */
export function cleanImageUrls(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  return input
    .filter((u): u is string => typeof u === "string")
    .map((u) => u.trim())
    .filter(Boolean)
    .slice(0, 8);
}

/**
 * Wraps a handler so that a thrown `Response` (e.g. from requireAdmin) is
 * returned directly, and anything else becomes a clean 500.
 */
export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Response) return err;
    console.error(err);
    return serverError();
  }
}
