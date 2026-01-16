import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Mock data for when Supabase is not configured
const mockTeams = [
  {
    id: "team-1",
    name: "Engineering",
    description: "Engineering team",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: "mock-user",
    memberCount: 5,
  },
  {
    id: "team-2",
    name: "Product",
    description: "Product team",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId: "mock-user",
    memberCount: 3,
  },
];

// GET - List user's teams
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock data
    if (!supabase) {
      console.log("Supabase not configured, returning mock teams");
      return NextResponse.json({
        teams: mockTeams,
        total: mockTeams.length,
      });
    }

    // Fetch teams where user is owner or member
    const { data: ownedTeams, error: ownedError } = await supabase
      .from("teams")
      .select("*")
      .eq("owner_id", userId);

    if (ownedError) {
      console.error("Error fetching owned teams:", ownedError);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    // Fetch teams where user is a member
    const { data: memberTeams, error: memberError } = await supabase
      .from("team_members")
      .select("team_id, teams(*)")
      .eq("user_id", userId);

    if (memberError) {
      console.error("Error fetching member teams:", memberError);
      return NextResponse.json(
        { error: "Failed to fetch teams" },
        { status: 500 }
      );
    }

    // Combine and deduplicate teams
    const memberTeamData = memberTeams
      ?.map((m) => m.teams)
      .filter(Boolean) as typeof ownedTeams;
    const allTeams = [...(ownedTeams || []), ...(memberTeamData || [])];
    const uniqueTeams = Array.from(
      new Map(allTeams.map((t) => [t.id, t])).values()
    );

    return NextResponse.json({
      teams: uniqueTeams,
      total: uniqueTeams.length,
    });
  } catch (error) {
    console.error("Teams list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teams" },
      { status: 500 }
    );
  }
}

// POST - Create a new team
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    const body = await request.json();

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json(
        { error: "Team name is required" },
        { status: 400 }
      );
    }

    const teamName = body.name.trim();
    if (teamName.length < 1 || teamName.length > 100) {
      return NextResponse.json(
        { error: "Team name must be between 1 and 100 characters" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock created team
    if (!supabase) {
      console.log("Supabase not configured, returning mock created team");
      const mockTeam = {
        id: `team-${Date.now()}`,
        name: teamName,
        description: body.description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ownerId: userId || "mock-user",
        memberCount: 1,
      };
      return NextResponse.json({ team: mockTeam }, { status: 201 });
    }

    // Create team in database
    const { data: team, error } = await supabase
      .from("teams")
      .insert({
        name: teamName,
        description: body.description || null,
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating team:", error);
      return NextResponse.json(
        { error: "Failed to create team" },
        { status: 500 }
      );
    }

    // Add owner as a member with 'owner' role
    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: userId,
      role: "owner",
      joined_at: new Date().toISOString(),
    });

    if (memberError) {
      console.error("Error adding owner as member:", memberError);
      // Team was created but member wasn't added - log but don't fail
    }

    return NextResponse.json({ team }, { status: 201 });
  } catch (error) {
    console.error("Team creation error:", error);
    return NextResponse.json(
      { error: "Failed to create team" },
      { status: 500 }
    );
  }
}
