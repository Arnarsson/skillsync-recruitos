import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Mock data for when Supabase is not configured
const mockMembers = [
  {
    id: "member-1",
    userId: "user-1",
    teamId: "team-1",
    role: "owner",
    joinedAt: new Date().toISOString(),
    user: {
      id: "user-1",
      name: "John Doe",
      email: "john@example.com",
      image: null,
    },
  },
  {
    id: "member-2",
    userId: "user-2",
    teamId: "team-1",
    role: "member",
    joinedAt: new Date().toISOString(),
    user: {
      id: "user-2",
      name: "Jane Smith",
      email: "jane@example.com",
      image: null,
    },
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

// GET - List team members
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
      console.log("Supabase not configured, returning mock members");
      return NextResponse.json({
        members: mockMembers.map((m) => ({ ...m, teamId })),
        total: mockMembers.length,
      });
    }

    const { hasAccess } = await checkTeamAccess(supabase, teamId, userId);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "Team not found or access denied" },
        { status: 404 }
      );
    }

    // Fetch team members with user info
    const { data: members, error } = await supabase
      .from("team_members")
      .select(
        `
        id,
        user_id,
        team_id,
        role,
        joined_at,
        users (
          id,
          name,
          email,
          image
        )
      `
      )
      .eq("team_id", teamId)
      .order("joined_at", { ascending: true });

    if (error) {
      console.error("Error fetching members:", error);
      return NextResponse.json(
        { error: "Failed to fetch team members" },
        { status: 500 }
      );
    }

    // Transform response
    const transformedMembers = members?.map((m) => ({
      id: m.id,
      userId: m.user_id,
      teamId: m.team_id,
      role: m.role,
      joinedAt: m.joined_at,
      user: m.users,
    }));

    return NextResponse.json({
      members: transformedMembers || [],
      total: transformedMembers?.length || 0,
    });
  } catch (error) {
    console.error("Members list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team members" },
      { status: 500 }
    );
  }
}

// POST - Invite member to team
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
    if (!body.email || typeof body.email !== "string") {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const email = body.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const role = body.role || "member";
    const validRoles = ["member", "admin"];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'member' or 'admin'" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    // If Supabase is not configured, return mock invitation
    if (!supabase) {
      console.log("Supabase not configured, returning mock invitation");
      return NextResponse.json(
        {
          invitation: {
            id: `invite-${Date.now()}`,
            teamId,
            email,
            role,
            status: "pending",
            createdAt: new Date().toISOString(),
            expiresAt: new Date(
              Date.now() + 7 * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        },
        { status: 201 }
      );
    }

    const { hasAccess, isAdmin } = await checkTeamAccess(
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

    // Only owner or admin can invite members
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Only team owner or admin can invite members" },
        { status: 403 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from("team_members")
        .select("id")
        .eq("team_id", teamId)
        .eq("user_id", existingUser.id)
        .single();

      if (existingMember) {
        return NextResponse.json(
          { error: "User is already a member of this team" },
          { status: 409 }
        );
      }

      // Add user directly as member
      const { data: member, error: memberError } = await supabase
        .from("team_members")
        .insert({
          team_id: teamId,
          user_id: existingUser.id,
          role,
          joined_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (memberError) {
        console.error("Error adding member:", memberError);
        return NextResponse.json(
          { error: "Failed to add member" },
          { status: 500 }
        );
      }

      return NextResponse.json({ member, added: true }, { status: 201 });
    }

    // Create invitation for non-existing user
    const { data: invitation, error: inviteError } = await supabase
      .from("team_invitations")
      .insert({
        team_id: teamId,
        email,
        role,
        invited_by: userId,
        status: "pending",
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invitation:", inviteError);
      return NextResponse.json(
        { error: "Failed to create invitation" },
        { status: 500 }
      );
    }

    // TODO: Send invitation email

    return NextResponse.json(
      {
        invitation: {
          id: invitation.id,
          teamId: invitation.team_id,
          email: invitation.email,
          role: invitation.role,
          status: invitation.status,
          createdAt: invitation.created_at,
          expiresAt: invitation.expires_at,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Member invitation error:", error);
    return NextResponse.json(
      { error: "Failed to invite member" },
      { status: 500 }
    );
  }
}
