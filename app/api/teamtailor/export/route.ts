import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import TeamTailorService, { RecruitOSProfile } from '@/lib/teamtailor';

/**
 * POST /api/teamtailor/export
 * 
 * Export one or more RecruitOS profiles to Team Tailor
 * 
 * Body:
 * {
 *   apiKey: string,
 *   profiles: RecruitOSProfile[],
 *   companyId?: string
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
    const { apiKey, profiles, companyId } = body;

    // Validate input
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Team Tailor API key is required' },
        { status: 400 }
      );
    }

    if (!profiles || !Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one profile is required' },
        { status: 400 }
      );
    }

    // Initialize Team Tailor service
    const teamTailor = new TeamTailorService({ apiKey, companyId });

    // Export profiles
    let results;
    if (profiles.length === 1) {
      // Single export
      try {
        const result = await teamTailor.exportProfile(profiles[0]);
        results = {
          successful: 1,
          failed: 0,
          errors: [],
          data: result,
        };
      } catch (error) {
        results = {
          successful: 0,
          failed: 1,
          errors: [{
            username: profiles[0].username,
            error: error instanceof Error ? error.message : 'Unknown error',
          }],
        };
      }
    } else {
      // Bulk export
      results = await teamTailor.bulkExport(profiles);
    }

    return NextResponse.json({
      success: results.successful > 0,
      ...results,
    });

  } catch (error) {
    console.error('Team Tailor export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
