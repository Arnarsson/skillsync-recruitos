/**
 * Analytics Funnel API Endpoint
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * GET /api/analytics/funnel - Get funnel metrics for a time period
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getFunnelAnalytics } from '@/lib/analytics/metricsService';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const allUsers = searchParams.get('allUsers') === 'true';

    // Default to last 30 days if not specified
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get analytics
    const analytics = await getFunnelAnalytics({
      userId: allUsers ? undefined : session.user.id,
      startDate: start,
      endDate: end,
    });

    return NextResponse.json(analytics);
  } catch (error) {
    console.error('[API] Error fetching funnel analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
