/**
 * Team Tailor Integration Test Endpoint
 * 
 * GET /api/teamtailor/test
 * 
 * Test Team Tailor API connectivity and configuration.
 * For development and verification purposes.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createTeamTailorService } from '@/services/teamTailorService';

export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if service can be created
    const service = createTeamTailorService();
    if (!service) {
      return NextResponse.json({
        configured: false,
        error: 'TEAMTAILOR_API_TOKEN not set in environment',
        instructions: 'Add TEAMTAILOR_API_TOKEN to your .env file',
      });
    }

    // Test API connection
    const connectionTest = await service.testConnection();

    if (!connectionTest.success) {
      return NextResponse.json({
        configured: true,
        connected: false,
        error: connectionTest.error,
        suggestions: [
          'Verify API token is valid',
          'Check Team Tailor account status',
          'Ensure API permissions are correct',
          'Try generating a new token',
        ],
      });
    }

    return NextResponse.json({
      configured: true,
      connected: true,
      message: 'Team Tailor integration is working correctly',
      apiEndpoint: process.env.TEAMTAILOR_API_URL || 'https://api.teamtailor.com',
      apiVersion: process.env.TEAMTAILOR_API_VERSION || 'v1',
    });

  } catch (error) {
    console.error('[TeamTailor Test] Error:', error);
    return NextResponse.json(
      {
        configured: false,
        connected: false,
        error: 'Test failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
