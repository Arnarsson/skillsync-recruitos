import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Mock data for when Supabase is not configured
const mockTeam = {
  id: "team-1",
  name: "Engineering",
  description: "Engineering team for product development",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ownerId: "mock-user",
  memberCount: 5,
};

interface RouteParams {
  params: Promise<{ teamId: string }>;
}

// Helper to check if user has access to team
async function checkTeamAccess(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  teamId: string,
  userId: string
): Promise<{ hasAccess: boolean; isOwner: boolean; team: unknown | null }> {
  if (!supabase) {
    return { hasAccess: true, isOwner: true, team: mockTeam };
  }

  // Fetch team
  const { data: team, error: teamError } = await supabase
    .from("teams")
    .select("*")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    return { hasAccess: false, isOwner: false, team: null };
  }

  // Check if user is owner
  if (team.owner_id === userId) {
    return { hasAccess: true, isOwner: true, team };
  }

  // Check if user is a member
  const { data: membership } = await supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .single();

  return {
    hasAccess: !!membership,
    isOwner: false,
    team: membership ? team : null,
  };
}

// GET - Get team details
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
      console.log("Supabase not configured, returning mock team");
      return NextResponse.json({
        team: { ...mockTeam, id: teamId },
      });
    }

    const { hasAccess, team } = await checkTeamAccess(supabase, teamId, userId);

    if (!hasAccess || !team) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Get member count
    const { count } = await supabase
      .from("team_members")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId);

    return NextResponse.json({
      team: {
        ...team,
        memberCount: count || 0,
      },
    });
  } catch (error) {
    console.error("Team fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team" },
      { status: 500 }
    );
  }
}

// PATCH - Update team
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const userId = (session.user as { id?: string }).id || "";
    const body = await request.json();

    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock updated team
    if (!supabase) {
      console.log("Supabase not configured, returning mock updated team");
      return NextResponse.json({
        team: {
          ...mockTeam,
          id: teamId,
          name: body.name || mockTeam.name,
          description: body.description ?? mockTeam.description,
          updatedAt: new Date().toISOString(),
        },
      });
    }

    const { hasAccess, isOwner, team } = await checkTeamAccess(
      supabase,
      teamId,
      userId
    );

    if (!hasAccess || !team) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Only owner can update team details
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only team owner can update team details" },
        { status: 403 }
      );
    }

    // Build update object
    const updates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) {
      const teamName = String(body.name).trim();
      if (teamName.length < 1 || teamName.length > 100) {
        return NextResponse.json(
          { error: "Team name must be between 1 and 100 characters" },
          { status: 400 }
        );
      }
      updates.name = teamName;
    }

    if (body.description !== undefined) {
      updates.description = body.description;
    }

    const { data: updatedTeam, error } = await supabase
      .from("teams")
      .update(updates)
      .eq("id", teamId)
      .select()
      .single();

    if (error) {
      console.error("Error updating team:", error);
      return NextResponse.json(
        { error: "Failed to update team" },
        { status: 500 }
      );
    }

    return NextResponse.json({ team: updatedTeam });
  } catch (error) {
    console.error("Team update error:", error);
    return NextResponse.json(
      { error: "Failed to update team" },
      { status: 500 }
    );
  }
}

// DELETE - Delete team
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { teamId } = await params;
    const userId = (session.user as { id?: string }).id || "";
    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock success
    if (!supabase) {
      console.log("Supabase not configured, returning mock delete success");
      return NextResponse.json({ success: true, deletedId: teamId });
    }

    const { hasAccess, isOwner } = await checkTeamAccess(
      supabase,
      teamId,
      userId
    );

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Only owner can delete team
    if (!isOwner) {
      return NextResponse.json(
        { error: "Only team owner can delete the team" },
        { status: 403 }
      );
    }

    // Delete team members first (cascade might handle this depending on DB setup)
    await supabase.from("team_members").delete().eq("team_id", teamId);

    // Delete team pipelines
    await supabase.from("team_pipelines").delete().eq("team_id", teamId);

    // Delete the team
    const { error } = await supabase.from("teams").delete().eq("id", teamId);

    if (error) {
      console.error("Error deleting team:", error);
      return NextResponse.json(
        { error: "Failed to delete team" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deletedId: teamId });
  } catch (error) {
    console.error("Team deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete team" },
      { status: 500 }
    );
  }
}
