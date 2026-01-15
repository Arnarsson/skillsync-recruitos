/**
 * API Response Utilities
 *
 * Standardized response helpers for consistent API output.
 */

import type { VercelResponse } from '@vercel/node';
import { ErrorCode, type ErrorCodeType, formatZodError } from './schemas';
import { z } from 'zod';

// ============================================================
// CORS HEADERS
// ============================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-BrightData-Key, X-SERP-Key, X-GitHub-Token',
};

/**
 * Apply CORS headers to response
 */
export function applyCors(res: VercelResponse): void {
  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

/**
 * Handle CORS preflight request
 */
export function handleCors(res: VercelResponse): VercelResponse {
  applyCors(res);
  return res.status(200).end();
}

// ============================================================
// SUCCESS RESPONSES
// ============================================================

interface SuccessOptions {
  status?: number;
  meta?: Record<string, unknown>;
}

/**
 * Send a successful JSON response
 */
export function success<T>(
  res: VercelResponse,
  data: T,
  options: SuccessOptions = {}
): VercelResponse {
  const { status = 200, meta } = options;

  applyCors(res);

  const response = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    ...(meta ? { meta } : {}),
  };

  return res.status(status).json(response);
}

/**
 * Send raw data response (for backwards compatibility)
 */
export function rawSuccess<T>(
  res: VercelResponse,
  data: T,
  status = 200
): VercelResponse {
  applyCors(res);
  return res.status(status).json(data);
}

// ============================================================
// ERROR RESPONSES
// ============================================================

interface ErrorOptions {
  code?: ErrorCodeType;
  details?: Record<string, unknown>;
  logError?: boolean;
}

/**
 * Send an error response with structured error code
 */
export function error(
  res: VercelResponse,
  message: string,
  status: number,
  options: ErrorOptions = {}
): VercelResponse {
  const { code, details, logError = status >= 500 } = options;

  if (logError) {
    console.error(`[API Error] ${code || 'UNKNOWN'}:`, message, details);
  }

  applyCors(res);

  const response = {
    success: false,
    error: message,
    code: code || inferErrorCode(status),
    timestamp: new Date().toISOString(),
    ...(details ? { details } : {}),
  };

  return res.status(status).json(response);
}

/**
 * Send a validation error (400)
 */
export function validationError(
  res: VercelResponse,
  zodError: z.ZodError
): VercelResponse {
  return error(res, formatZodError(zodError), 400, {
    code: ErrorCode.VALIDATION_ERROR,
    details: {
      issues: zodError.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    },
  });
}

/**
 * Send an authentication error (401)
 */
export function authError(
  res: VercelResponse,
  message = 'API key required'
): VercelResponse {
  return error(res, message, 401, { code: ErrorCode.AUTH_MISSING });
}

/**
 * Send a not found error (404)
 */
export function notFound(
  res: VercelResponse,
  resource = 'Resource'
): VercelResponse {
  return error(res, `${resource} not found`, 404);
}

/**
 * Send a rate limit error (429)
 */
export function rateLimited(
  res: VercelResponse,
  retryAfterSeconds = 60
): VercelResponse {
  res.setHeader('Retry-After', retryAfterSeconds.toString());
  return error(res, 'Rate limit exceeded', 429, {
    code: ErrorCode.RATE_LIMITED,
    details: { retryAfter: retryAfterSeconds },
  });
}

/**
 * Send an external service error (502)
 */
export function externalError(
  res: VercelResponse,
  service: string,
  originalError?: string
): VercelResponse {
  return error(res, `${service} service error: ${originalError || 'Unknown'}`, 502, {
    code: ErrorCode.EXTERNAL_SERVICE_ERROR,
    details: { service },
    logError: true,
  });
}

/**
 * Send an internal server error (500)
 */
export function internalError(
  res: VercelResponse,
  err: unknown
): VercelResponse {
  const message = err instanceof Error ? err.message : 'Internal server error';
  return error(res, message, 500, {
    code: ErrorCode.INTERNAL_ERROR,
    logError: true,
  });
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Infer error code from HTTP status
 */
function inferErrorCode(status: number): ErrorCodeType {
  switch (status) {
    case 400:
      return ErrorCode.VALIDATION_ERROR;
    case 401:
      return ErrorCode.AUTH_MISSING;
    case 429:
      return ErrorCode.RATE_LIMITED;
    case 502:
    case 503:
      return ErrorCode.EXTERNAL_SERVICE_ERROR;
    default:
      return ErrorCode.INTERNAL_ERROR;
  }
}

/**
 * Log request for debugging (dev only)
 */
export function logRequest(
  method: string,
  url: string,
  body?: unknown
): string {
  const requestId = Math.random().toString(36).slice(2, 10);

  if (process.env.NODE_ENV === 'development') {
    console.log(`[${requestId}] ${method} ${url}`, body ? JSON.stringify(body).slice(0, 200) : '');
  }

  return requestId;
}
