/**
 * Team Tailor Export API
 * 
 * POST /api/teamtailor/export
 * 
 * Export RecruitOS candidate(s) to Team Tailor ATS.
 * Critical for Danish market friction reduction.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createTeamTailorService } from '@/services/teamTailorService';
import { Candidate } from '@/types';
import { teamTailorExportSchema } from '@/lib/validation/apiSchemas';

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse and validate request body
    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const parsed = teamTailorExportSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: parsed.error.issues.map((e) => ({
            path: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    const body = parsed.data;

    // Initialize Team Tailor service
    const teamTailorService = createTeamTailorService();
    if (!teamTailorService) {
      return NextResponse.json(
        {
          error: 'Team Tailor integration not configured',
          details: 'TEAMTAILOR_API_TOKEN environment variable not set',
        },
        { status: 503 }
      );
    }

    // Test connection before proceeding
    const connectionTest = await teamTailorService.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json(
        {
          error: 'Team Tailor API connection failed',
          details: connectionTest.error,
        },
        { status: 503 }
      );
    }

    // Export candidates
    const results = await teamTailorService.exportCandidates(
      body.candidates.map(c => ({
        ...(c.candidate as unknown as Candidate),
        email: c.email,
        phone: c.phone,
      })),
      {
        jobId: body.jobId,
        includeEvidence: body.includeEvidence ?? true,
        tags: body.tags,
        maxConcurrent: 3, // Respect Team Tailor rate limits
      }
    );

    // Aggregate results
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);

    return NextResponse.json({
      success: true,
      summary: {
        total: results.length,
        successful: successful.length,
        failed: failed.length,
      },
      results: results,
      exported: successful.map(r => ({
        candidateId: r.candidateId,
        teamTailorId: r.teamTailorId,
        teamTailorUrl: r.teamTailorUrl,
      })),
      errors: failed.map(r => ({
        candidateId: r.candidateId,
        error: r.error,
        details: r.details,
      })),
    });

  } catch (error) {
    console.error('[TeamTailor Export] Error:', error);
    return NextResponse.json(
      {
        error: 'Export failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check Team Tailor integration status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const teamTailorService = createTeamTailorService();
    if (!teamTailorService) {
      return NextResponse.json({
        configured: false,
        available: false,
        message: 'Team Tailor API token not configured',
      });
    }

    const connectionTest = await teamTailorService.testConnection();

    return NextResponse.json({
      configured: true,
      available: connectionTest.success,
      message: connectionTest.success
        ? 'Team Tailor integration ready'
        : `Connection failed: ${connectionTest.error}`,
    });

  } catch (error) {
    console.error('[TeamTailor Status] Error:', error);
    return NextResponse.json(
      {
        configured: false,
        available: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
