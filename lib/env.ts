/**
 * Environment variable validation
 * Run this on app startup to ensure all required vars are present
 */

import { validateEnv } from './validation/apiSchemas';

// Only validate in Node.js environment (not browser)
let validatedEnv: ReturnType<typeof validateEnv> | null = null;

if (typeof process !== 'undefined' && process.env) {
  try {
    validatedEnv = validateEnv(process.env);
    console.log('✅ Environment variables validated successfully');
  } catch (error) {
    // In development, log the error but don't crash
    // In production, this should fail the build/startup
    if (process.env.NODE_ENV === 'production') {
      console.error('💥 CRITICAL: Environment validation failed in production!');
      process.exit(1);
    } else {
      console.warn('⚠️  Environment validation failed (continuing in development mode)');
    }
  }
}

export { validatedEnv };
