import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Mock data for when Supabase is not configured
const mockPipelines = [
  {
    id: "pipeline-1",
    teamId: "team-1",
    name: "Senior Frontend Developer",
    description: "Hiring pipeline for senior frontend roles",
    status: "active",
    candidateCount: 12,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-1",
  },
  {
    id: "pipeline-2",
    teamId: "team-1",
    name: "Backend Engineer",
    description: "Backend engineering positions",
    status: "active",
    candidateCount: 8,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: "user-1",
  },
];

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// Helper to check if user has access to team
async function checkTeamAccess(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  teamId: string,
  userId: string
): Promise<{ hasAccess: boolean; isOwner: boolean; isAdmin: boolean }> {
  if (!supabase) {
    return { hasAccess: true, isOwner: true, isAdmin: true };
  }

  // Fetch team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("owner_id")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return { hasAccess: false, isOwner: false, isAdmin: false };
  }

  // Check if user is owner
  if (team.owner_id === userId) {
    return { hasAccess: true, isOwner: true, isAdmin: true };
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  if (!membership) {
    return { hasAccess: false, isOwner: false, isAdmin: false };
  }

  return {
    hasAccess: true,
    isOwner: false,
    isAdmin: membership.role === "admin" || membership.role === "owner",
  };
}

// GET - List team pipelines
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const userId = (session.user as { id?: string }).id || "";
    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock data
    if (!supabase) {
      console.log("Supabase not configured, returning mock pipelines");
      return NextResponse.json({
        pipelines: mockPipelines.map((p) => ({ ...p, teamId })),
        total: mockPipelines.length,
      });
    }

    const { hasAccess } = await checkTeamAccess(supabase, teamId, userId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Build query
    let query = supabase
      .from("team_pipelines")
      .select("*", { count: "exact" })
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq("status", status);
    }

    const { data: pipelines, error, count } = await query;

    if (error) {
      console.error("Error fetching pipelines:", error);
      return NextResponse.json(
        { error: "Failed to fetch pipelines" },
        { status: 500 }
      );
    }

    // Get candidate counts for each pipeline
    const pipelineIds = pipelines?.map((p) => p.id) || [];
    let candidateCounts: Record<string, number> = {};

    if (pipelineIds.length > 0) {
      const { data: counts } = await supabase
        .from("pipeline_candidates")
        .select("pipeline_id")
        .in("pipeline_id", pipelineIds);

      if (counts) {
        candidateCounts = counts.reduce(
          (acc, curr) => {
            acc[curr.pipeline_id] = (acc[curr.pipeline_id] || 0) + 1;
            return acc;
          },
          {} as Record<string, number>
        );
      }
    }

    // Transform response
    const transformedPipelines = pipelines?.map((p) => ({
      id: p.id,
      teamId: p.team_id,
      name: p.name,
      description: p.description,
      status: p.status,
      candidateCount: candidateCounts[p.id] || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      createdBy: p.created_by,
    }));

    return NextResponse.json({
      pipelines: transformedPipelines || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Pipelines list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch pipelines" },
      { status: 500 }
    );
  }
}

// POST - Create a new pipeline
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const userId = (session.user as { id?: string }).id || "";
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Pipeline name is required" },
        { status: 400 }
      );
    }

    const pipelineName = body.name.trim();
    if (pipelineName.length < 1 || pipelineName.length > 200) {
      return NextResponse.json(
        { error: "Pipeline name must be between 1 and 200 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock created pipeline
    if (!supabase) {
      console.log("Supabase not configured, returning mock created pipeline");
      const mockPipeline = {
        id: `pipeline-${Date.now()}`,
        teamId,
        name: pipelineName,
        description: body.description || null,
        status: body.status || "active",
        candidateCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: userId || "mock-user",
      };
      return NextResponse.json({ pipeline: mockPipeline }, { status: 201 });
    }

    const { hasAccess } = await checkTeamAccess(supabase, teamId, userId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Validate status if provided
    const validStatuses = ["active", "paused", "closed", "archived"];
    const status = body.status || "active";
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be 'active', 'paused', 'closed', or 'archived'",
        },
        { status: 400 }
      );
    }

    // Create pipeline in database
    const { data: pipeline, error } = await supabase
      .from("team_pipelines")
      .insert({
        team_id: teamId,
        name: pipelineName,
        description: body.description || null,
        status,
        created_by: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating pipeline:", error);
      return NextResponse.json(
        { error: "Failed to create pipeline" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        pipeline: {
          id: pipeline.id,
          teamId: pipeline.team_id,
          name: pipeline.name,
          description: pipeline.description,
          status: pipeline.status,
          candidateCount: 0,
          createdAt: pipeline.created_at,
          updatedAt: pipeline.updated_at,
          createdBy: pipeline.created_by,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Pipeline creation error:", error);
    return NextResponse.json(
      { error: "Failed to create pipeline" },
      { status: 500 }
    );
  }
}
