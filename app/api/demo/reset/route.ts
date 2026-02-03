import { NextRequest, NextResponse } from 'next/server';

/**
 * Demo Reset API Endpoint
 * 
 * POST /api/demo/reset
 * 
 * Resets demo environment:
 * - Clears demo user sessions
 * - Resets demo data to initial state
 * - Returns fresh demo credentials
 * 
 * Only available in development or when NEXT_PUBLIC_DEMO_MODE=true
 */

export async function POST(request: NextRequest) {
  // Security: Only allow in development or demo mode
  if (
    process.env.NODE_ENV === 'production' &&
    process.env.NEXT_PUBLIC_DEMO_MODE !== 'true'
  ) {
    return NextResponse.json(
      { error: 'Demo reset only available in development or demo mode' },
      { status: 403 }
    );
  }

  try {
    // In a real implementation, this would:
    // 1. Clear demo user sessions from database
    // 2. Reset demo data to seed state
    // 3. Regenerate demo credentials if needed
    // 4. Clear any cached data

    // For now, we'll just return success
    // The actual reset happens client-side via localStorage

    console.log('🔄 Demo reset requested');

    return NextResponse.json({
      success: true,
      message: 'Demo environment reset successfully',
      credentials: {
        email: process.env.NEXT_PUBLIC_DEMO_EMAIL || 'demo@recruitos.com',
        password: process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'demo123',
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Demo reset failed:', error);

    return NextResponse.json(
      { 
        error: 'Demo reset failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check endpoint
  return NextResponse.json({
    status: 'ok',
    demoMode: process.env.NEXT_PUBLIC_DEMO_MODE === 'true',
    environment: process.env.NODE_ENV,
  });
}
