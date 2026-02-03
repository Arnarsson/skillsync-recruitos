/**
 * Analytics Export API Endpoint
 * Linear Issue: 7-308 - Instrument Outcomes + Build Feedback Loop
 * 
 * GET /api/analytics/export - Export model tuning data
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { exportModelTuningData } from '@/lib/analytics/metricsService';

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
    const format = searchParams.get('format') || 'json';

    // Default to last 90 days for model tuning
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Export data
    const data = await exportModelTuningData({
      userId: session.user.id,
      startDate: start,
      endDate: end,
    });

    // Return as CSV if requested
    if (format === 'csv') {
      const csv = convertToCSV(data);
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="model-tuning-data-${start.toISOString().split('T')[0]}-to-${end.toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // Default to JSON
    return NextResponse.json({
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      count: data.length,
      data,
    });
  } catch (error) {
    console.error('[API] Error exporting model tuning data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  // Headers
  const headers = [
    'candidateId',
    'searchId',
    'matchScore',
    'predictedOutcome',
    'actualOutcome',
    'skillsMatch',
    'experienceMatch',
    'locationMatch',
    'outcomeTimestamp',
  ];

  const rows = data.map((item) => [
    item.candidateId,
    item.searchId,
    item.matchScore,
    item.predictedOutcome,
    item.actualOutcome,
    item.features.skillsMatch,
    item.features.experienceMatch,
    item.features.locationMatch,
    item.outcomeTimestamp,
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.join(',')),
  ].join('\n');

  return csvContent;
}
