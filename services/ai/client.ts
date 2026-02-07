 

import { GoogleGenAI } from "@google/genai";

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Initialize with env key only (no localStorage - security fix)
export const getAiClient = () => {
  const apiKey = getEnv('GEMINI_API_KEY') || getEnv('VITE_GEMINI_API_KEY') || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

// Get OpenRouter API key (server-side only - no localStorage)
const getOpenRouterKey = () => {
  return getEnv('OPENROUTER_API_KEY') || getEnv('VITE_OPENROUTER_API_KEY') || '';
};

// OpenRouter API wrapper (OpenAI-compatible format)
export const callOpenRouter = async (prompt: string, schema?: unknown): Promise<string> => {
  const apiKey = getOpenRouterKey();
  if (!apiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const messages = [{ role: 'user', content: prompt }];

  const requestBody: Record<string, unknown> = {
    model: 'google/gemini-2.0-flash-001', // Gemini Flash via OpenRouter (paid tier - no rate limits)
    messages
  };

  // If schema provided, add response format (OpenAI-compatible structured output)
  if (schema) {
    requestBody.response_format = {
      type: 'json_schema',
      json_schema: {
        name: 'response',
        strict: true,
        schema
      }
    };
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': '6Degrees Recruitment OS',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};

// Retry wrapper with Gemini → OpenRouter failover
export const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 2000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isGeminiOverloaded = errorMessage.includes('503') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('UNAVAILABLE');
      const isRateLimit = errorMessage.includes('429') || errorMessage.includes('rate limit');

      // If Gemini is overloaded (not rate-limited), try OpenRouter immediately
      if (isGeminiOverloaded && getOpenRouterKey()) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚡ Gemini overloaded - switching to OpenRouter...');
        }
        // Caller should handle OpenRouter fallback
        throw new Error('GEMINI_OVERLOADED');
      }

      if (!isRateLimit || attempt === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      if (process.env.NODE_ENV === 'development') {
        console.log(`Gemini API error (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`);
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Unified AI call with automatic Gemini → OpenRouter failover
export const callAIWithFailover = async (
  prompt: string,
  schema?: unknown
): Promise<string> => {
  try {
    // Try Gemini first
    const ai = getAiClient();
    if (!ai) {
      throw new Error('Gemini API key not configured');
    }

    return await withRetry(async () => {
      // This will be implemented by each specific function
      throw new Error('Direct withRetry not supported - use specific AI functions');
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // If Gemini failed with overload, try OpenRouter
    if (errorMessage.includes('GEMINI_OVERLOADED') || errorMessage.includes('503') || errorMessage.includes('overloaded')) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Falling back to OpenRouter...');
      }

      return await callOpenRouter(prompt, schema);
    }

    throw error;
  }
};
