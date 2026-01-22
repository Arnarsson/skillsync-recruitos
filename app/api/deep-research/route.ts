import { NextRequest, NextResponse } from 'next/server';
import {
  createResearchJob,
  getResearchJob,
  executeResearchJob,
  aiResearch,
} from '@/services/deepResearchService';
import type { DeepResearchQuery } from '@/types/socialMatrix';

/**
 * POST /api/deep-research
 *
 * Trigger a deep research job to find connection paths between two people.
 * Returns immediately with a job ID for polling.
 *
 * Body:
 * {
 *   personA: { name, linkedinUrl?, githubUsername?, company? },
 *   personB: { name, linkedinUrl?, githubUsername?, company? },
 *   searchDepth: 'quick' | 'standard' | 'deep',
 *   async?: boolean  // If true, returns job ID for polling. Default: false
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.personA?.name || !body.personB?.name) {
      return NextResponse.json(
        { error: 'Both personA.name and personB.name are required' },
        { status: 400 }
      );
    }

    const query: DeepResearchQuery = {
      personA: {
        name: body.personA.name,
        linkedinUrl: body.personA.linkedinUrl,
        githubUsername: body.personA.githubUsername,
        company: body.personA.company,
      },
      personB: {
        name: body.personB.name,
        linkedinUrl: body.personB.linkedinUrl,
        githubUsername: body.personB.githubUsername,
        company: body.personB.company,
      },
      searchDepth: body.searchDepth || 'standard',
    };

    // If async mode, create a job and return immediately
    if (body.async) {
      const job = createResearchJob(query);

      // Execute in background (don't await)
      executeResearchJob(job.id).catch((error) => {
        console.error('[DeepResearch API] Background job failed:', error);
      });

      return NextResponse.json({
        jobId: job.id,
        status: 'pending',
        message: 'Research job created. Poll GET /api/deep-research?jobId=... for results.',
      });
    }

    // Synchronous mode - execute and return results
    const result = await aiResearch(query);

    return NextResponse.json({
      status: 'completed',
      result,
    });
  } catch (error) {
    console.error('[DeepResearch API] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Research failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/deep-research?jobId=...
 *
 * Check the status of an async research job.
 *
 * Returns:
 * {
 *   jobId: string,
 *   status: 'pending' | 'processing' | 'completed' | 'failed',
 *   result?: DeepResearchResult,
 *   error?: string
 * }
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId query parameter is required' },
      { status: 400 }
    );
  }

  const job = getResearchJob(jobId);

  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }

  return NextResponse.json({
    jobId: job.id,
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
  });
}
