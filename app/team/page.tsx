"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  UserPlus,
  Shield,
  MoreVertical,
  Mail,
  X,
  Crown,
  Briefcase,
  Eye,
  Search,
  Building2,
  Trash2,
  ChevronDown,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n";

// Types
type TeamRole = "admin" | "recruiter" | "hiring_manager" | "viewer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: TeamRole;
  avatarUrl?: string;
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  logoUrl?: string;
  createdAt: string;
  members: TeamMember[];
}

interface PendingInvite {
  id: string;
  email: string;
  role: TeamRole;
  invitedAt: string;
  expiresAt: string;
}

// Role style configuration
const ROLE_STYLES: Record<TeamRole, { icon: React.ReactNode; color: string }> = {
  admin: {
    icon: <Crown className="w-4 h-4" />,
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  },
  recruiter: {
    icon: <Search className="w-4 h-4" />,
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  },
  hiring_manager: {
    icon: <Briefcase className="w-4 h-4" />,
    color: "bg-purple-500/10 text-purple-600 border-purple-500/30",
  },
  viewer: {
    icon: <Eye className="w-4 h-4" />,
    color: "bg-gray-500/10 text-gray-600 border-gray-500/30",
  },
};

const STORAGE_KEY = "recruitos_team_data";
const INVITES_STORAGE_KEY = "recruitos_pending_invites";

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Get initials from name
function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Default team data
function getDefaultTeam(): Team {
  return {
    id: generateId(),
    name: "My Team",
    createdAt: new Date().toISOString(),
    members: [
      {
        id: generateId(),
        name: "You (Owner)",
        email: "owner@example.com",
        role: "admin",
        joinedAt: new Date().toISOString(),
      },
    ],
  };
}

export default function TeamPage() {
  const { lang } = useLanguage();
  const isDa = lang === "da";
  const ROLE_CONFIG: Record<
    TeamRole,
    { label: string; icon: React.ReactNode; color: string; description: string }
  > = {
    admin: {
      ...ROLE_STYLES.admin,
      label: isDa ? "Admin" : "Admin",
      description: isDa
        ? "Fuld adgang til alle teamindstillinger og medlemmer"
        : "Full access to all team settings and members",
    },
    recruiter: {
      ...ROLE_STYLES.recruiter,
      label: isDa ? "Rekrutterer" : "Recruiter",
      description: isDa
        ? "Kan søge, kontakte og håndtere kandidater"
        : "Can search, contact, and manage candidates",
    },
    hiring_manager: {
      ...ROLE_STYLES.hiring_manager,
      label: isDa ? "Ansættelsesansvarlig" : "Hiring Manager",
      description: isDa
        ? "Kan vurdere kandidater og træffe ansættelsesbeslutninger"
        : "Can review candidates and make hiring decisions",
    },
    viewer: {
      ...ROLE_STYLES.viewer,
      label: isDa ? "Læser" : "Viewer",
      description: isDa
        ? "Kan kun se kandidater og pipeline"
        : "Can view candidates and pipeline only",
    },
  };
  const [team, setTeam] = useState<Team | null>(null);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamRole>("recruiter");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserRole, setCurrentUserRole] = useState<TeamRole>("admin");

  // Load team data from localStorage
  useEffect(() => {
    const loadData = () => {
      try {
        const storedTeam = localStorage.getItem(STORAGE_KEY);
        const storedInvites = localStorage.getItem(INVITES_STORAGE_KEY);

        if (storedTeam) {
          setTeam(JSON.parse(storedTeam));
        } else {
          const defaultTeam = getDefaultTeam();
          setTeam(defaultTeam);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultTeam));
        }

        if (storedInvites) {
          setPendingInvites(JSON.parse(storedInvites));
        }
      } catch (error) {
        console.error("Failed to load team data:", error);
        const defaultTeam = getDefaultTeam();
        setTeam(defaultTeam);
      } finally {
        setIsLoading(false);
      }
    };

    // Simulate async loading for realistic UX
    const timer = setTimeout(loadData, 500);
    return () => clearTimeout(timer);
  }, []);

  // Save team data to localStorage
  const saveTeam = useCallback((updatedTeam: Team) => {
    setTeam(updatedTeam);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTeam));
  }, []);

  // Save pending invites to localStorage
  const saveInvites = useCallback((updatedInvites: PendingInvite[]) => {
    setPendingInvites(updatedInvites);
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(updatedInvites));
  }, []);

  // Update team name
  const handleUpdateTeamName = useCallback(
    (newName: string) => {
      if (team && newName.trim()) {
        saveTeam({ ...team, name: newName.trim() });
      }
    },
    [team, saveTeam]
  );

  // Invite member
  const handleInviteMember = useCallback(() => {
    if (!inviteEmail.trim()) return;

    // Check if already invited or member
    const isExistingMember = team?.members.some(
      (m) => m.email.toLowerCase() === inviteEmail.toLowerCase()
    );
    const isAlreadyInvited = pendingInvites.some(
      (i) => i.email.toLowerCase() === inviteEmail.toLowerCase()
    );

    if (isExistingMember || isAlreadyInvited) {
      alert(
        isDa
          ? "Denne email er allerede teammedlem eller har en afventende invitation."
          : "This email is already a team member or has a pending invite."
      );
      return;
    }

    const newInvite: PendingInvite = {
      id: generateId(),
      email: inviteEmail.trim().toLowerCase(),
      role: inviteRole,
      invitedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    };

    saveInvites([...pendingInvites, newInvite]);
    setInviteEmail("");
    setInviteRole("recruiter");
    setShowInviteModal(false);
  }, [inviteEmail, inviteRole, team, pendingInvites, saveInvites]);

  // Cancel invite
  const handleCancelInvite = useCallback(
    (inviteId: string) => {
      saveInvites(pendingInvites.filter((i) => i.id !== inviteId));
    },
    [pendingInvites, saveInvites]
  );

  // Change member role
  const handleChangeRole = useCallback(
    (memberId: string, newRole: TeamRole) => {
      if (!team) return;

      // Prevent removing the last admin
      const adminCount = team.members.filter((m) => m.role === "admin").length;
      const member = team.members.find((m) => m.id === memberId);
      if (member?.role === "admin" && newRole !== "admin" && adminCount <= 1) {
        alert(
          isDa
            ? "Kan ikke ændre rolle. Teamet skal have mindst én admin."
            : "Cannot change role. Team must have at least one admin."
        );
        return;
      }

      const updatedMembers = team.members.map((m) =>
        m.id === memberId ? { ...m, role: newRole } : m
      );
      saveTeam({ ...team, members: updatedMembers });
    },
    [isDa, team, saveTeam]
  );

  // Remove member
  const handleRemoveMember = useCallback(
    (memberId: string) => {
      if (!team) return;

      const member = team.members.find((m) => m.id === memberId);
      if (!member) return;

      // Prevent removing the last admin
      const adminCount = team.members.filter((m) => m.role === "admin").length;
      if (member.role === "admin" && adminCount <= 1) {
        alert(
          isDa
            ? "Kan ikke fjerne den sidste admin fra teamet."
            : "Cannot remove the last admin from the team."
        );
        return;
      }

      if (
        !confirm(
          isDa
            ? `Fjern ${member.name} fra teamet?`
            : `Remove ${member.name} from the team?`
        )
      )
        return;

      const updatedMembers = team.members.filter((m) => m.id !== memberId);
      saveTeam({ ...team, members: updatedMembers });
    },
    [isDa, team, saveTeam]
  );

  // Filter members by search query
  const filteredMembers = team?.members.filter(
    (m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdmin = currentUserRole === "admin";

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-6 w-24 mb-2" />
            <Skeleton className="h-9 w-64 mb-1" />
            <Skeleton className="h-5 w-48" />
          </div>
          <Card className="mb-8">
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-6 w-40 mb-2" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b last:border-0">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Empty state (should not normally occur with default team)
  if (!team) {
    return (
      <div className="min-h-screen pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto text-center py-16">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">
            {isDa ? "Intet team fundet" : "No Team Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {isDa
              ? "Opret et team for at begynde at samarbejde med dine kolleger."
              : "Create a team to start collaborating with your colleagues."}
          </p>
          <Button
            onClick={() => {
              const defaultTeam = getDefaultTeam();
              saveTeam(defaultTeam);
            }}
          >
            <Users className="w-4 h-4 mr-2" />
            {isDa ? "Opret team" : "Create Team"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Badge className="mb-2 bg-primary/20 text-primary">{isDa ? "Team" : "Team"}</Badge>
            <h1 className="text-3xl font-bold">
              {isDa ? "Teamadministration" : "Team Management"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isDa
                ? "Administrér teammedlemmer og deres rettigheder"
                : "Manage your team members and their permissions"}
            </p>
          </div>
          {isAdmin && (
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isDa ? "Invitér medlem" : "Invite Member"}
            </Button>
          )}
        </div>

        {/* Team Overview Card */}
        <Card className="mb-8">
          <CardContent className="py-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {team.logoUrl ? (
                  <img
                    src={team.logoUrl}
                    alt={team.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-8 h-8 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                {isAdmin ? (
                  <Input
                    value={team.name}
                    onChange={(e) => handleUpdateTeamName(e.target.value)}
                    className="text-xl font-semibold border-0 px-0 h-auto focus-visible:ring-0 bg-transparent"
                  />
                ) : (
                  <h2 className="text-xl font-semibold">{team.name}</h2>
                )}
                <p className="text-muted-foreground">
                  {team.members.length}{" "}
                  {isDa
                    ? team.members.length !== 1
                      ? "medlemmer"
                      : "medlem"
                    : `member${team.members.length !== 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={ROLE_CONFIG[currentUserRole].color}>
                  {ROLE_CONFIG[currentUserRole].icon}
                  <span className="ml-1">{ROLE_CONFIG[currentUserRole].label}</span>
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Invites */}
        {pendingInvites.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {isDa ? "Afventende invitationer" : "Pending Invites"} ({pendingInvites.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {pendingInvites.map((invite) => (
                  <motion.div
                    key={invite.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{invite.email}</p>
                        <p className="text-xs text-muted-foreground">
                          {isDa ? "Inviteret som" : "Invited as"} {ROLE_CONFIG[invite.role].label}
                        </p>
                      </div>
                    </div>
                    {isAdmin && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCancelInvite(invite.id)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Team Members */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                {isDa ? "Teammedlemmer" : "Team Members"}
              </CardTitle>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={isDa ? "Søg medlemmer..." : "Search members..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
            </div>
            <CardDescription>
              {team.members.length}{" "}
              {isDa
                ? team.members.length !== 1
                  ? "medlemmer i alt"
                  : "medlem i alt"
                : `total member${team.members.length !== 1 ? "s" : ""}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredMembers && filteredMembers.length > 0 ? (
              <div className="divide-y">
                {filteredMembers.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center gap-4 py-4"
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={member.avatarUrl} alt={member.name} />
                      <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{member.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                    </div>
                    <Badge variant="outline" className={ROLE_CONFIG[member.role].color}>
                      {ROLE_CONFIG[member.role].icon}
                      <span className="ml-1">{ROLE_CONFIG[member.role].label}</span>
                    </Badge>
                    {isAdmin && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>
                            {isDa ? "Skift rolle" : "Change Role"}
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          {(Object.keys(ROLE_CONFIG) as TeamRole[]).map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => handleChangeRole(member.id, role)}
                              disabled={member.role === role}
                            >
                              <span className="mr-2">{ROLE_CONFIG[role].icon}</span>
                              {ROLE_CONFIG[role].label}
                              {member.role === role && (
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {isDa ? "Aktuel" : "Current"}
                                </span>
                              )}
                            </DropdownMenuItem>
                          ))}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => handleRemoveMember(member.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDa ? "Fjern fra team" : "Remove from team"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
                  <Search className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {isDa
                    ? "Ingen medlemmer matcher din søgning."
                    : "No members found matching your search."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Role Descriptions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" />
              {isDa ? "Rolle-rettigheder" : "Role Permissions"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {(Object.keys(ROLE_CONFIG) as TeamRole[]).map((role) => (
                <div
                  key={role}
                  className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${ROLE_CONFIG[role].color}`}
                  >
                    {ROLE_CONFIG[role].icon}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{ROLE_CONFIG[role].label}</p>
                    <p className="text-xs text-muted-foreground">
                      {ROLE_CONFIG[role].description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setShowInviteModal(false)}
            />
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5" />
                      {isDa ? "Invitér teammedlem" : "Invite Team Member"}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowInviteModal(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardDescription>
                    {isDa
                      ? "Send en invitation til at blive en del af dit team"
                      : "Send an invitation to join your team"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {isDa ? "Emailadresse" : "Email Address"}
                      </label>
                      <Input
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleInviteMember();
                        }}
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        {isDa ? "Rolle" : "Role"}
                      </label>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="w-full justify-between">
                            <span className="flex items-center gap-2">
                              {ROLE_CONFIG[inviteRole].icon}
                              {ROLE_CONFIG[inviteRole].label}
                            </span>
                            <ChevronDown className="w-4 h-4 opacity-50" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-full min-w-[200px]">
                          {(Object.keys(ROLE_CONFIG) as TeamRole[]).map((role) => (
                            <DropdownMenuItem
                              key={role}
                              onClick={() => setInviteRole(role)}
                            >
                              <span className="mr-2">{ROLE_CONFIG[role].icon}</span>
                              {ROLE_CONFIG[role].label}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <p className="text-xs text-muted-foreground mt-2">
                        {ROLE_CONFIG[inviteRole].description}
                      </p>
                    </div>
                    <div className="flex gap-2 pt-4">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => setShowInviteModal(false)}
                      >
                        {isDa ? "Annuller" : "Cancel"}
                      </Button>
                      <Button
                        className="flex-1"
                        onClick={handleInviteMember}
                        disabled={!inviteEmail.trim()}
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        {isDa ? "Send invitation" : "Send Invite"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
