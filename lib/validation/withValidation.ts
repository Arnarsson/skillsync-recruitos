import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * Higher-order function that wraps a Next.js API route handler with Zod validation.
 * Parses the request body against the given schema before invoking the handler.
 *
 * Usage:
 *   export const POST = withValidation(mySchema, async (request, context, validated) => {
 *     // validated is typed as z.infer<typeof mySchema>
 *     return NextResponse.json({ ok: true });
 *   });
 */
export function withValidation<T extends z.ZodType>(
  schema: T,
  handler: (
    request: NextRequest,
    context: { params: Promise<Record<string, string>> } | undefined,
    validated: z.infer<T>,
  ) => Promise<NextResponse> | NextResponse,
) {
  return async (
    request: NextRequest,
    context?: { params: Promise<Record<string, string>> },
  ): Promise<NextResponse> => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 },
      );
    }

    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: result.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      );
    }

    return handler(request, context, result.data);
  };
}

/**
 * Validate query parameters from a NextRequest against a Zod schema.
 * Returns the validated params or a 400 NextResponse on failure.
 */
export function validateSearchParams<T extends z.ZodType>(
  request: NextRequest,
  schema: T,
): { data: z.infer<T> } | { error: NextResponse } {
  const raw: Record<string, string> = {};
  request.nextUrl.searchParams.forEach((value, key) => {
    raw[key] = value;
  });

  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      error: NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: result.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 },
      ),
    };
  }

  return { data: result.data };
}
