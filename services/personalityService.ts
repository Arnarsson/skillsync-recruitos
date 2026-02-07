/**
 * Personality Profile Service
 *
 * Generates personality insights from GitHub data:
 * - Communication Style: Commit messages, PR descriptions, issue comments
 * - Work Pattern: Commit frequency, time-of-day patterns, consistency
 * - Collaboration Score: PR reviews, issue responses, team interactions
 * - Technical Profile: Languages used, repo diversity, specialization
 * - Initiative: Issues opened, repos created, external contributions
 *
 * Uses existing GitHub data — no additional API calls needed.
 */

// ─── Types ────────────────────────────────────────────────────────────

export interface PersonalityDimension {
  score: number;          // 0–100
  label: string;
  sublabel: string;       // one-line human insight
  icon: string;           // Lucide icon name
  traits: PersonalityTrait[];
}

export interface PersonalityTrait {
  name: string;
  value: string;
  detail?: string;
}

export interface PersonalityProfile {
  communicationStyle: PersonalityDimension;
  workPattern: PersonalityDimension;
  collaborationScore: PersonalityDimension;
  technicalProfile: PersonalityDimension;
  initiative: PersonalityDimension;
  /** Single-sentence personality summary */
  summary: string;
  /** Developer persona tag, e.g. "Night-owl polyglot" */
  personaTag: string;
  /** 0-100  — confidence based on data availability */
  confidence: number;
  generatedAt: string;
}

// ─── Input shapes (re-use existing interfaces loosely) ────────────────

export interface PersonalityInput {
  user: {
    login: string;
    name?: string | null;
    bio?: string | null;
    public_repos: number;
    followers: number;
    following: number;
    created_at: string;
  };
  repos: Array<{
    name: string;
    description?: string | null;
    language?: string | null;
    stargazers_count: number;
    forks_count: number;
    topics?: string[];
    fork?: boolean;
    size?: number;
    created_at?: string;
    updated_at?: string;
    pushed_at?: string;
  }>;
  /** Deep analysis data (optional — enriches profile if present) */
  deepAnalysis?: {
    commitActivity?: {
      totalCommits?: number;
      avgCommitsPerWeek?: number;
      mostActiveDay?: string;
      mostActiveHour?: number;
      commitsByDay?: Record<string, number>;
    };
    pullRequests?: {
      totalOpened?: number;
      totalMerged?: number;
      recentPRs?: Array<{
        title: string;
        repo: string;
        state: string;
      }>;
    };
    codeReview?: {
      reviewsGiven?: number;
      commentsGiven?: number;
    };
    contributionPatterns?: {
      consistency?: 'high' | 'moderate' | 'sporadic';
      streak?: number;
      longestStreak?: number;
      activeMonths?: number;
    };
    collaborationStyle?: {
      soloProjects?: number;
      teamProjects?: number;
      opensourceContributions?: number;
      style?: string;
    };
    topLanguages?: Array<{
      name: string;
      percentage: number;
      repoCount: number;
    }>;
  } | null;
}

// ─── Compute helpers ──────────────────────────────────────────────────

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, Math.round(v)));
}

// ─── 1. Communication Style ──────────────────────────────────────────

function computeCommunicationStyle(input: PersonalityInput): PersonalityDimension {
  const { repos, user, deepAnalysis } = input;
  const traits: PersonalityTrait[] = [];

  // Bio expressiveness
  const bioLength = (user.bio || '').length;
  const bioScore = bioLength > 100 ? 30 : bioLength > 40 ? 20 : bioLength > 0 ? 10 : 0;
  traits.push({
    name: 'Bio expressiveness',
    value: bioLength > 100 ? 'Detailed' : bioLength > 40 ? 'Moderate' : bioLength > 0 ? 'Minimal' : 'None',
    detail: `${bioLength} chars`,
  });

  // Repo descriptions completeness
  const reposWithDesc = repos.filter(r => r.description && r.description.length > 10).length;
  const descRatio = repos.length > 0 ? reposWithDesc / repos.length : 0;
  const descScore = descRatio * 30;
  traits.push({
    name: 'Repo documentation',
    value: descRatio > 0.7 ? 'Thorough' : descRatio > 0.4 ? 'Moderate' : 'Sparse',
    detail: `${Math.round(descRatio * 100)}% repos have descriptions`,
  });

  // PR descriptions (from deep analysis)
  const prCount = deepAnalysis?.pullRequests?.totalOpened || 0;
  const prTitleAvgLen = (deepAnalysis?.pullRequests?.recentPRs || [])
    .map(pr => pr.title.length)
    .reduce((a, b) => a + b, 0) / Math.max((deepAnalysis?.pullRequests?.recentPRs || []).length, 1);
  const prScore = prCount > 10 ? 20 : prCount > 3 ? 12 : prCount > 0 ? 5 : 0;
  traits.push({
    name: 'PR communication',
    value: prTitleAvgLen > 40 ? 'Descriptive' : prTitleAvgLen > 20 ? 'Standard' : 'Terse',
    detail: `${prCount} PRs, avg title ${Math.round(prTitleAvgLen)} chars`,
  });

  // Issue engagement (comments given)
  const comments = deepAnalysis?.codeReview?.commentsGiven || 0;
  const commentScore = Math.min(comments / 50, 1) * 20;
  traits.push({
    name: 'Discussion engagement',
    value: comments > 30 ? 'Active' : comments > 10 ? 'Moderate' : 'Quiet',
    detail: `${comments} comments given`,
  });

  const score = clamp(bioScore + descScore + prScore + commentScore);

  // Determine sublabel
  let sublabel: string;
  if (score >= 70) sublabel = 'Expressive communicator — writes clear, detailed descriptions';
  else if (score >= 45) sublabel = 'Balanced communicator — adequate context when needed';
  else sublabel = 'Action-oriented — lets code speak for itself';

  return { score, label: 'Communication', sublabel, icon: 'MessageSquare', traits };
}

// ─── 2. Work Pattern ────────────────────────────────────────────────

function computeWorkPattern(input: PersonalityInput): PersonalityDimension {
  const { repos, user, deepAnalysis } = input;
  const traits: PersonalityTrait[] = [];

  // Commit frequency
  const avgPerWeek = deepAnalysis?.commitActivity?.avgCommitsPerWeek || 0;
  const freqScore = avgPerWeek >= 15 ? 25 : avgPerWeek >= 8 ? 20 : avgPerWeek >= 3 ? 12 : 5;
  traits.push({
    name: 'Commit frequency',
    value: avgPerWeek >= 15 ? 'Intense' : avgPerWeek >= 8 ? 'Steady' : avgPerWeek >= 3 ? 'Regular' : 'Light',
    detail: `~${avgPerWeek} commits/week`,
  });

  // Time-of-day pattern
  const hour = deepAnalysis?.commitActivity?.mostActiveHour;
  let timeLabel = 'Unknown';
  if (hour !== undefined) {
    if (hour >= 5 && hour < 12) timeLabel = 'Early bird 🌅';
    else if (hour >= 12 && hour < 17) timeLabel = 'Afternoon builder ☀️';
    else if (hour >= 17 && hour < 22) timeLabel = 'Evening coder 🌆';
    else timeLabel = 'Night owl 🦉';
  }
  const timeScore = hour !== undefined ? 15 : 5;
  traits.push({
    name: 'Peak hours',
    value: timeLabel,
    detail: hour !== undefined ? `Most active around ${hour}:00` : 'Insufficient data',
  });

  // Most active day
  const activeDay = deepAnalysis?.commitActivity?.mostActiveDay || 'Unknown';
  const daysByCount = deepAnalysis?.commitActivity?.commitsByDay || {};
  const weekendActivity = (daysByCount['Saturday'] || 0) + (daysByCount['Sunday'] || 0);
  const weekdayActivity = Object.entries(daysByCount)
    .filter(([d]) => !['Saturday', 'Sunday'].includes(d))
    .reduce((s, [, v]) => s + v, 0);
  const weekendRatio = weekdayActivity > 0 ? weekendActivity / weekdayActivity : 0;
  traits.push({
    name: 'Weekly rhythm',
    value: weekendRatio > 0.4 ? 'Works weekends' : weekendRatio > 0.15 ? 'Occasionally' : 'Weekdays focused',
    detail: `Most active on ${activeDay}`,
  });

  // Consistency / streak
  const consistency = deepAnalysis?.contributionPatterns?.consistency || 'sporadic';
  const streak = deepAnalysis?.contributionPatterns?.streak || 0;
  const consistencyScore = consistency === 'high' ? 25 : consistency === 'moderate' ? 15 : 5;
  traits.push({
    name: 'Consistency',
    value: consistency === 'high' ? 'Very consistent' : consistency === 'moderate' ? 'Moderate' : 'Sporadic',
    detail: streak > 0 ? `${streak}-day current streak` : 'No active streak',
  });

  // Account age / longevity
  const accountAge = Math.floor((Date.now() - new Date(user.created_at).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const reposPerYear = accountAge > 0 ? repos.length / accountAge : repos.length;
  const longevityScore = accountAge > 5 ? 20 : accountAge > 2 ? 12 : 5;
  traits.push({
    name: 'GitHub tenure',
    value: `${accountAge} years`,
    detail: `~${reposPerYear.toFixed(1)} repos/year`,
  });

  const score = clamp(freqScore + timeScore + consistencyScore + longevityScore);

  let sublabel: string;
  if (score >= 70) sublabel = 'Disciplined builder — consistent, high-frequency output';
  else if (score >= 45) sublabel = 'Steady contributor — regular rhythm with focused bursts';
  else sublabel = 'Burst worker — intensive periods with breaks between';

  return { score, label: 'Work Pattern', sublabel, icon: 'Activity', traits };
}

// ─── 3. Collaboration Score ─────────────────────────────────────────

function computeCollaboration(input: PersonalityInput): PersonalityDimension {
  const { repos, user, deepAnalysis } = input;
  const traits: PersonalityTrait[] = [];

  // Code reviews given
  const reviews = deepAnalysis?.codeReview?.reviewsGiven || 0;
  const reviewScore = Math.min(reviews / 30, 1) * 25;
  traits.push({
    name: 'Code reviews',
    value: reviews > 20 ? 'Active reviewer' : reviews > 5 ? 'Occasional' : 'Rare',
    detail: `${reviews} reviews given`,
  });

  // PRs opened (contributing back)
  const prsOpened = deepAnalysis?.pullRequests?.totalOpened || 0;
  const prScore = Math.min(prsOpened / 20, 1) * 25;
  traits.push({
    name: 'Pull requests',
    value: prsOpened > 15 ? 'Prolific' : prsOpened > 5 ? 'Active' : 'Light',
    detail: `${prsOpened} PRs opened`,
  });

  // Team vs solo balance
  const teamProjects = deepAnalysis?.collaborationStyle?.teamProjects || 0;
  const soloProjects = deepAnalysis?.collaborationStyle?.soloProjects || repos.length;
  const teamRatio = (teamProjects + soloProjects) > 0
    ? teamProjects / (teamProjects + soloProjects) : 0;
  const teamScore = teamRatio * 25;
  traits.push({
    name: 'Team orientation',
    value: teamRatio > 0.5 ? 'Team player' : teamRatio > 0.2 ? 'Balanced' : 'Independent',
    detail: `${teamProjects} team / ${soloProjects} solo projects`,
  });

  // Followers & network
  const followerRatio = user.followers > 0 ? user.followers / Math.max(user.following, 1) : 0;
  const networkScore = Math.min(user.followers / 100, 1) * 15 +
    (followerRatio > 2 ? 10 : followerRatio > 1 ? 5 : 0);
  traits.push({
    name: 'Network influence',
    value: user.followers > 100 ? 'Influential' : user.followers > 30 ? 'Growing' : 'Emerging',
    detail: `${user.followers} followers, ${user.following} following`,
  });

  const score = clamp(reviewScore + prScore + teamScore + networkScore);

  let sublabel: string;
  if (score >= 70) sublabel = 'Strong collaborator — actively reviews, contributes, and engages';
  else if (score >= 45) sublabel = 'Cooperative — participates in team workflows when needed';
  else sublabel = 'Independent contributor — prefers solo execution';

  return { score, label: 'Collaboration', sublabel, icon: 'Users', traits };
}

// ─── 4. Technical Profile (Depth vs Breadth) ────────────────────────

function computeTechnicalProfile(input: PersonalityInput): PersonalityDimension {
  const { repos, deepAnalysis } = input;
  const traits: PersonalityTrait[] = [];

  // Language count & diversity
  const languages = deepAnalysis?.topLanguages || [];
  const langFromRepos = new Set(repos.map(r => r.language).filter(Boolean));
  const langCount = Math.max(languages.length, langFromRepos.size);
  const langScore = Math.min(langCount / 8, 1) * 25;

  // Determine specialization
  const topLangPct = languages[0]?.percentage || 0;
  const profileType = topLangPct > 70 ? 'Specialist' : topLangPct > 40 ? 'T-Shaped' : 'Polyglot';
  traits.push({
    name: 'Profile type',
    value: profileType,
    detail: `${langCount} languages, top at ${topLangPct}%`,
  });

  traits.push({
    name: 'Primary language',
    value: languages[0]?.name || Array.from(langFromRepos)[0] || 'Unknown',
    detail: languages[0] ? `Used in ${languages[0].repoCount} repos` : undefined,
  });

  // Topic diversity
  const allTopics = new Set(repos.flatMap(r => r.topics || []));
  const topicScore = Math.min(allTopics.size / 15, 1) * 20;
  traits.push({
    name: 'Domain breadth',
    value: allTopics.size > 10 ? 'Wide' : allTopics.size > 5 ? 'Moderate' : 'Focused',
    detail: `${allTopics.size} unique topics`,
  });

  // Repo size / complexity proxy
  const avgSize = repos.length > 0
    ? repos.reduce((s, r) => s + (r.size || 0), 0) / repos.length : 0;
  const sizeScore = Math.min(avgSize / 30000, 1) * 15;
  traits.push({
    name: 'Project scale',
    value: avgSize > 30000 ? 'Large-scale' : avgSize > 5000 ? 'Medium' : 'Small',
    detail: `Avg ${Math.round(avgSize / 1000)}KB per repo`,
  });

  // Star traction (quality signal)
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const starScore = Math.min(totalStars / 200, 1) * 15;
  traits.push({
    name: 'Community traction',
    value: totalStars > 100 ? 'High' : totalStars > 20 ? 'Growing' : 'Early',
    detail: `${totalStars} total stars`,
  });

  // Depth bonus: if specialist with high stars → extra
  const depthBonus = profileType === 'Specialist' && totalStars > 50 ? 10 :
    profileType === 'T-Shaped' ? 5 : 0;

  const score = clamp(langScore + topicScore + sizeScore + starScore + depthBonus);

  let sublabel: string;
  if (profileType === 'Specialist') sublabel = `Deep specialist — focused mastery in ${languages[0]?.name || 'core tech'}`;
  else if (profileType === 'T-Shaped') sublabel = 'T-shaped engineer — deep in one area, broad awareness';
  else sublabel = 'Polyglot builder — comfortable across multiple stacks';

  return { score, label: 'Technical Profile', sublabel, icon: 'Code', traits };
}

// ─── 5. Initiative ──────────────────────────────────────────────────

function computeInitiative(input: PersonalityInput): PersonalityDimension {
  const { repos, user, deepAnalysis } = input;
  const traits: PersonalityTrait[] = [];

  // Original repos created (not forks)
  const originalRepos = repos.filter(r => !r.fork);
  const origScore = Math.min(originalRepos.length / 30, 1) * 25;
  traits.push({
    name: 'Repos created',
    value: `${originalRepos.length}`,
    detail: `${repos.length - originalRepos.length} forks`,
  });

  // Open source contributions (forks = contributions to others)
  const forks = repos.filter(r => r.fork);
  const ossScore = Math.min(forks.length / 15, 1) * 20;
  const ossContribs = deepAnalysis?.collaborationStyle?.opensourceContributions || forks.length;
  traits.push({
    name: 'OSS contributions',
    value: ossContribs > 10 ? 'Active contributor' : ossContribs > 3 ? 'Occasional' : 'Light',
    detail: `${ossContribs} external contributions`,
  });

  // Recent activity (repos pushed in last 6 months)
  const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
  const recentRepos = repos.filter(r => r.pushed_at && new Date(r.pushed_at) > sixMonthsAgo);
  const recencyScore = Math.min(recentRepos.length / 10, 1) * 20;
  traits.push({
    name: 'Recent activity',
    value: recentRepos.length > 8 ? 'Very active' : recentRepos.length > 3 ? 'Active' : 'Quiet',
    detail: `${recentRepos.length} repos updated in 6 months`,
  });

  // Diversity of topics (shows curiosity)
  const allTopics = new Set(repos.flatMap(r => r.topics || []));
  const curiosityScore = Math.min(allTopics.size / 20, 1) * 15;
  traits.push({
    name: 'Curiosity breadth',
    value: allTopics.size > 12 ? 'Explorer' : allTopics.size > 5 ? 'Focused explorer' : 'Specialist',
    detail: `${allTopics.size} different domains`,
  });

  // Stars attracted (validation of initiative)
  const totalStars = repos.reduce((s, r) => s + r.stargazers_count, 0);
  const validationScore = Math.min(totalStars / 300, 1) * 20;
  traits.push({
    name: 'Impact validation',
    value: totalStars > 200 ? 'Proven' : totalStars > 30 ? 'Growing' : 'Building',
    detail: `${totalStars} stars on own projects`,
  });

  const score = clamp(origScore + ossScore + recencyScore + curiosityScore + validationScore);

  let sublabel: string;
  if (score >= 70) sublabel = 'Self-starter — proactively ships projects and contributes upstream';
  else if (score >= 45) sublabel = 'Steady initiator — regularly creates and maintains projects';
  else sublabel = 'Focused executor — delivers on existing projects';

  return { score, label: 'Initiative', sublabel, icon: 'Rocket', traits };
}

// ─── Summary generator ──────────────────────────────────────────────

function generateSummary(profile: Omit<PersonalityProfile, 'summary' | 'personaTag' | 'confidence' | 'generatedAt'>): { summary: string; personaTag: string } {
  const dims = [
    profile.communicationStyle,
    profile.workPattern,
    profile.collaborationScore,
    profile.technicalProfile,
    profile.initiative,
  ];

  // Highest and lowest dimensions
  const sorted = [...dims].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const second = sorted[1];

  // Build persona tag
  const tagParts: string[] = [];

  // Time pattern
  const peakHourTrait = profile.workPattern.traits.find(t => t.name === 'Peak hours');
  if (peakHourTrait?.value.includes('Night')) tagParts.push('Night-owl');
  else if (peakHourTrait?.value.includes('Early')) tagParts.push('Early-bird');

  // Technical type
  const profileType = profile.technicalProfile.traits.find(t => t.name === 'Profile type')?.value;
  if (profileType) tagParts.push(profileType.toLowerCase());

  // Collaboration style
  if (profile.collaborationScore.score >= 65) tagParts.push('team-builder');
  else if (profile.initiative.score >= 65) tagParts.push('self-starter');

  const personaTag = tagParts.length > 0 ? tagParts.join(' ') : 'developer';

  const summary = `Strongest in ${strongest.label.toLowerCase()} (${strongest.score}) and ${second.label.toLowerCase()} (${second.score}). ${strongest.sublabel}.`;

  return { summary, personaTag };
}

// ─── Confidence ──────────────────────────────────────────────────────

function computeConfidence(input: PersonalityInput): number {
  let conf = 30; // base

  if (input.repos.length > 5) conf += 10;
  if (input.repos.length > 20) conf += 10;
  if (input.user.bio) conf += 5;
  if (input.deepAnalysis) conf += 20;
  if (input.deepAnalysis?.commitActivity?.totalCommits) conf += 5;
  if (input.deepAnalysis?.pullRequests?.totalOpened) conf += 5;
  if (input.deepAnalysis?.codeReview?.reviewsGiven) conf += 5;
  if (input.deepAnalysis?.topLanguages?.length) conf += 5;
  if (input.user.followers > 10) conf += 5;

  return Math.min(conf, 95);
}

// ─── Main entry point ───────────────────────────────────────────────

export function computePersonalityProfile(input: PersonalityInput): PersonalityProfile {
  const communicationStyle = computeCommunicationStyle(input);
  const workPattern = computeWorkPattern(input);
  const collaborationScore = computeCollaboration(input);
  const technicalProfile = computeTechnicalProfile(input);
  const initiative = computeInitiative(input);

  const { summary, personaTag } = generateSummary({
    communicationStyle,
    workPattern,
    collaborationScore,
    technicalProfile,
    initiative,
  });

  return {
    communicationStyle,
    workPattern,
    collaborationScore,
    technicalProfile,
    initiative,
    summary,
    personaTag,
    confidence: computeConfidence(input),
    generatedAt: new Date().toISOString(),
  };
}
