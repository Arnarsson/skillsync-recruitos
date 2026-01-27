import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TeamTailorService from '@/lib/teamtailor';

/**
 * POST /api/teamtailor/test
 * 
 * Test Team Tailor API connection
 * 
 * Body:
 * {
 *   apiKey: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { apiKey } = body;

    // Validate input
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Team Tailor API key is required' },
        { status: 400 }
      );
    }

    // Test connection
    const teamTailor = new TeamTailorService({ apiKey });
    const result = await teamTailor.testConnection();

    return NextResponse.json(result);

  } catch (error) {
    console.error('Team Tailor test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
