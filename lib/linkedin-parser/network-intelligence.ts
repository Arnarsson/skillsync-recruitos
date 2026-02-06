/**
 * Network Intelligence Analyzer
 * Implements Nate B Jones' 6 analyses for LinkedIn network intelligence
 * 
 * 1. Relationship Half-Life (decay model)
 * 2. Vouch Score (advocacy prediction)
 * 3. Reciprocity Ledger (social capital balance)
 * 4. Conversation Resurrection (dormant threads)
 * 5. Network Archetype (networking style)
 * 6. Warm Path Discovery (bridge to any target)
 */

import { 
  ParsedLinkedInData, 
  LinkedInConnection, 
  LinkedInMessage,
  LinkedInEndorsement,
  LinkedInRecommendation,
  LinkedInPosition,
  LinkedInInvitation,
  LinkedInReaction
} from './index';

// ============================================================================
// 1. RELATIONSHIP HALF-LIFE MODEL
// ============================================================================

export interface RelationshipHealth {
  connection: LinkedInConnection;
  daysSinceContact: number;
  adjustedHalfLife: number;
  currentStrength: number; // 0-100
  status: 'strong' | 'cooling' | 'cold' | 'dormant';
  lastInteraction?: Date;
  messageCount: number;
  avgMessageDepth: number; // average chars per message
  modifiers?: string[]; // Half-life modifiers applied (e.g., "substantive_messages ×1.3")
}

/**
 * Calculate relationship strength using half-life decay model
 * Base half-life: 180 days (relationship loses 50% strength without contact)
 */
/**
 * Match a connection to messages by name (case-insensitive, handles partial matches)
 */
function matchesPerson(personName: string, connection: LinkedInConnection): boolean {
  const nameLower = personName.toLowerCase();
  const fullNameLower = connection.fullName.toLowerCase();
  const firstNameLower = connection.firstName.toLowerCase();
  const lastNameLower = connection.lastName.toLowerCase();
  
  // Exact full name match
  if (nameLower === fullNameLower) return true;
  
  // First + Last name present
  if (nameLower.includes(firstNameLower) && nameLower.includes(lastNameLower)) return true;
  
  // Handle "First Last" format with different spacing
  if (fullNameLower && nameLower.includes(fullNameLower)) return true;
  
  return false;
}

export function calculateRelationshipHealth(
  data: ParsedLinkedInData
): RelationshipHealth[] {
  const BASE_HALF_LIFE = 180; // days
  const now = new Date();
  
  // Build set of your companies from Positions.csv with date ranges
  const myPositions = data.positions || [];
  const myCompanies = new Set<string>(
    myPositions.map(p => p.companyName.toLowerCase()).filter(c => c.length > 0)
  );
  
  // Build invitation lookup for "who initiated" signal
  const invitationsByPerson = new Map<string, LinkedInInvitation>();
  (data.invitations || []).forEach(inv => {
    const personName = inv.direction === 'OUTGOING' ? inv.to : inv.from;
    invitationsByPerson.set(personName.toLowerCase(), inv);
  });
  
  return data.connections.map(connection => {
    // Find messages with this connection (from or to)
    const messages = data.messages.filter(m => 
      matchesPerson(m.from, connection) || matchesPerson(m.to, connection)
    );
    
    // Find endorsements
    const endorsementsReceived = data.endorsementsReceived.filter(e =>
      matchesPerson(e.endorserFullName, connection)
    );
    const endorsementsGiven = data.endorsementsGiven.filter(e =>
      matchesPerson(e.endorserFullName, connection)
    );
    
    // Find recommendations
    const recsReceived = data.recommendationsReceived.filter(r =>
      matchesPerson(r.fullName, connection)
    );
    const recsGiven = data.recommendationsGiven.filter(r =>
      matchesPerson(r.fullName, connection)
    );
    
    // Calculate last interaction
    const lastMessage = messages.length > 0 
      ? new Date(Math.max(...messages.map(m => m.date.getTime())))
      : connection.connectedOn;
    
    const daysSinceContact = Math.floor(
      (now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Calculate message depth (average chars)
    const avgMessageDepth = messages.length > 0
      ? messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
      : 0;
    
    // Check for substantive vs shallow messages
    const hasSubstantive = messages.some(m => m.content.length >= 200 || (m.content.includes('?') && m.content.length >= 80));
    const hasShallowOnly = messages.length > 0 && !hasSubstantive && avgMessageDepth < 50;
    
    // Adjust half-life based on relationship signals with EXPLAINABILITY
    let adjustedHalfLife = BASE_HALF_LIFE;
    const modifiers: string[] = [];
    
    // Real shared company detection with position overlap
    const connectionCompany = (connection.company || '').toLowerCase();
    const sharedCompany = myCompanies.has(connectionCompany);
    
    // Check for actual work overlap using positions
    let workOverlapYears = 0;
    if (sharedCompany && myPositions.length > 0) {
      const myPositionAtCompany = myPositions.find(p => 
        p.companyName.toLowerCase() === connectionCompany
      );
      if (myPositionAtCompany) {
        // Calculate potential overlap (connection's start date vs my tenure)
        const myStart = myPositionAtCompany.startedOn?.getTime() || 0;
        const myEnd = myPositionAtCompany.finishedOn?.getTime() || now.getTime();
        const connectedOn = connection.connectedOn.getTime();
        
        // If they connected during my tenure, calculate overlap
        if (connectedOn >= myStart && connectedOn <= myEnd) {
          workOverlapYears = Math.max(0, (Math.min(myEnd, now.getTime()) - connectedOn) / (1000 * 60 * 60 * 24 * 365));
        }
      }
    }
    
    if (workOverlapYears >= 2) {
      adjustedHalfLife *= 1.8; // Strong shared history
      modifiers.push(`shared_company_${Math.round(workOverlapYears)}yr_overlap ×1.8`);
    } else if (sharedCompany) {
      adjustedHalfLife *= 1.5;
      modifiers.push('shared_company ×1.5');
    }
    
    // Check if they initiated the connection (stronger signal)
    const invitation = invitationsByPerson.get(connection.fullName.toLowerCase());
    if (invitation && invitation.direction === 'INCOMING') {
      adjustedHalfLife *= 1.2;
      modifiers.push('they_initiated_connection ×1.2');
    }
    
    // Deep/substantive messages = slower decay
    if (hasSubstantive) {
      adjustedHalfLife *= 1.3;
      modifiers.push('substantive_messages ×1.3');
    }
    // Shallow messages only = faster decay
    else if (hasShallowOnly) {
      adjustedHalfLife *= 0.9;
      modifiers.push('shallow_only ×0.9');
    }
    
    // Multiple touchpoints (messages + endorsements/recs) = slower decay
    const hasMultipleTouchpoints = messages.length > 0 && 
      (endorsementsReceived.length > 0 || endorsementsGiven.length > 0 || recsReceived.length > 0 || recsGiven.length > 0);
    if (hasMultipleTouchpoints) {
      adjustedHalfLife *= 1.4;
      modifiers.push('multiple_touchpoints ×1.4');
    }
    
    // Never messaged = faster decay
    if (messages.length === 0) {
      adjustedHalfLife *= 0.7;
      modifiers.push('never_messaged ×0.7');
    }
    
    // Calculate current strength using decay formula
    const currentStrength = Math.round(
      100 * Math.pow(0.5, daysSinceContact / adjustedHalfLife)
    );
    
    // Determine status
    let status: 'strong' | 'cooling' | 'cold' | 'dormant';
    if (currentStrength >= 70) status = 'strong';
    else if (currentStrength >= 40) status = 'cooling';
    else if (currentStrength >= 20) status = 'cold';
    else status = 'dormant';
    
    return {
      connection,
      daysSinceContact,
      adjustedHalfLife: Math.round(adjustedHalfLife),
      currentStrength,
      status,
      lastInteraction: lastMessage,
      messageCount: messages.length,
      avgMessageDepth: Math.round(avgMessageDepth),
      modifiers, // NEW: Explainability
    };
  }).sort((a, b) => b.currentStrength - a.currentStrength);
}

// ============================================================================
// 2. VOUCH SCORE (Advocacy Prediction)
// ============================================================================

export interface VouchScore {
  connection: LinkedInConnection;
  score: number; // 0-100
  level: 'strong_advocate' | 'reliable' | 'positive' | 'lukewarm' | 'weak';
  factors: {
    recommendationReceived: number; // +35
    endorsementsReceived: number;   // count × 3, max 15
    messageRecency: number;         // max 20
    messageDepth: number;           // max 15
    sharedHistory: number;          // max 15
  };
}

/**
 * Calculate vouch score - predicts who would advocate for you
 */
export function calculateVouchScores(
  data: ParsedLinkedInData
): VouchScore[] {
  const now = new Date();
  
  // Build positions lookup
  const myPositions = data.positions || [];
  const myCompanies = new Set<string>(
    myPositions.map(p => p.companyName.toLowerCase()).filter(c => c.length > 0)
  );
  
  return data.connections.map(connection => {
    // Find recommendation from this person
    const hasRecommendation = data.recommendationsReceived.some(r =>
      matchesPerson(r.fullName, connection)
    );
    
    // Count endorsements from this person
    const endorsementCount = data.endorsementsReceived.filter(e =>
      matchesPerson(e.endorserFullName, connection)
    ).length;
    
    // Find messages
    const messages = data.messages.filter(m => 
      matchesPerson(m.from, connection) || matchesPerson(m.to, connection)
    );
    
    const lastMessage = messages.length > 0 
      ? new Date(Math.max(...messages.map(m => m.date.getTime())))
      : null;
    
    const daysSinceMessage = lastMessage
      ? Math.floor((now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    const avgMessageLength = messages.length > 0
      ? messages.reduce((sum, m) => sum + m.content.length, 0) / messages.length
      : 0;
    
    // Calculate shared history score using positions
    let sharedHistoryScore = 0;
    const connectionCompany = (connection.company || '').toLowerCase();
    if (myCompanies.has(connectionCompany)) {
      const myPositionAtCompany = myPositions.find(p => 
        p.companyName.toLowerCase() === connectionCompany
      );
      if (myPositionAtCompany) {
        const myStart = myPositionAtCompany.startedOn?.getTime() || 0;
        const myEnd = myPositionAtCompany.finishedOn?.getTime() || now.getTime();
        const connectedOn = connection.connectedOn.getTime();
        
        // Calculate overlap years
        if (connectedOn >= myStart && connectedOn <= myEnd) {
          const overlapYears = (Math.min(myEnd, now.getTime()) - connectedOn) / (1000 * 60 * 60 * 24 * 365);
          sharedHistoryScore = Math.min(15, overlapYears * 5); // 5 points per year, max 15
        } else if (myCompanies.has(connectionCompany)) {
          sharedHistoryScore = 5; // Worked at same company but maybe different times
        }
      }
    }
    
    // Calculate factor scores
    const factors = {
      recommendationReceived: hasRecommendation ? 35 : 0,
      endorsementsReceived: Math.min(endorsementCount * 3, 15),
      messageRecency: Math.max(0, Math.min(20, 100 - daysSinceMessage) / 5),
      messageDepth: Math.min(15, avgMessageLength / 10),
      sharedHistory: sharedHistoryScore,
    };
    
    const score = Math.round(
      factors.recommendationReceived +
      factors.endorsementsReceived +
      factors.messageRecency +
      factors.messageDepth +
      factors.sharedHistory
    );
    
    // Determine level
    let level: VouchScore['level'];
    if (score >= 80) level = 'strong_advocate';
    else if (score >= 60) level = 'reliable';
    else if (score >= 40) level = 'positive';
    else if (score >= 20) level = 'lukewarm';
    else level = 'weak';
    
    return {
      connection,
      score,
      level,
      factors,
    };
  }).sort((a, b) => b.score - a.score);
}

// ============================================================================
// 3. RECIPROCITY LEDGER
// ============================================================================

export interface ReciprocityEntry {
  connection: LinkedInConnection;
  pointsInvested: number;  // What I gave
  pointsReceived: number;  // What they gave
  netBalance: number;      // Positive = they owe me
  status: 'they_owe_me' | 'i_owe_them' | 'balanced';
  breakdown: {
    recommendationsGiven: number;
    recommendationsReceived: number;
    endorsementsGiven: number;
    endorsementsReceived: number;
    messagesInitiated: number;
    messagesReceived: number;
  };
}

/**
 * Calculate reciprocity ledger - tracks social capital balance
 */
export function calculateReciprocityLedger(
  data: ParsedLinkedInData,
  myName: string
): ReciprocityEntry[] {
  return data.connections.map(connection => {
    // Recommendations I gave to this person
    const recommendationsGiven = data.recommendationsGiven.filter(r =>
      matchesPerson(r.fullName, connection)
    ).length;
    // Recommendations I received from this person
    const recommendationsReceived = data.recommendationsReceived.filter(r =>
      matchesPerson(r.fullName, connection)
    ).length;
    
    // Endorsements I gave to this person
    const endorsementsGiven = data.endorsementsGiven.filter(e =>
      matchesPerson(e.endorserFullName, connection)
    ).length;
    // Endorsements I received from this person
    const endorsementsReceived = data.endorsementsReceived.filter(e =>
      matchesPerson(e.endorserFullName, connection)
    ).length;
    
    // Messages with this person
    const messages = data.messages.filter(m => 
      matchesPerson(m.from, connection) || matchesPerson(m.to, connection)
    );
    const messagesInitiated = messages.filter(m => m.isFromMe).length;
    const messagesReceived = messages.filter(m => !m.isFromMe).length;
    
    // Calculate points (positive = I invested, negative = they invested in me)
    const pointsInvested = 
      (recommendationsGiven * 10) +
      (endorsementsGiven * 2) +
      (messagesInitiated * 1);
    
    const pointsReceived = 
      (recommendationsReceived * 10) +
      (endorsementsReceived * 2) +
      (messagesReceived * 1);
    
    const netBalance = pointsInvested - pointsReceived;
    
    let status: ReciprocityEntry['status'];
    if (netBalance > 3) status = 'they_owe_me';
    else if (netBalance < -3) status = 'i_owe_them';
    else status = 'balanced';
    
    return {
      connection,
      pointsInvested,
      pointsReceived,
      netBalance,
      status,
      breakdown: {
        recommendationsGiven,
        recommendationsReceived,
        endorsementsGiven,
        endorsementsReceived,
        messagesInitiated,
        messagesReceived,
      },
    };
  }).sort((a, b) => b.netBalance - a.netBalance);
}

// ============================================================================
// 4. CONVERSATION RESURRECTION (Enhanced with hook detection)
// ============================================================================

export interface ResurrectionOpportunity {
  connection: LinkedInConnection;
  daysDormant: number;
  hook: string;
  hookType: 'unfollowed_plan' | 'unanswered_help' | 'intro_opportunity' | 'meet_never_scheduled' | 'ended_mid_topic' | 'thanks_only' | 'generic';
  hookSnippet?: string; // The actual message snippet that triggered the hook
  lastMessage: string;
  suggestedOpener: string;
  priority: 'high' | 'medium' | 'low';
}

// Hook detection patterns (from 6degrees Python script)
const HOOK_PATTERNS: Array<{
  type: ResurrectionOpportunity['hookType'];
  pattern: RegExp;
  hook: string;
  priority: ResurrectionOpportunity['priority'];
  opener: (name: string) => string;
}> = [
  {
    type: 'unfollowed_plan',
    pattern: /\b(let's catch up|we should (connect|sync|chat|talk)|let me know|circle back|follow up|get together|grab (coffee|lunch|drinks))\b/i,
    hook: 'You mentioned plans but never followed through',
    priority: 'high',
    opener: (name) => `Hey ${name}, I was looking back at our thread and realized we mentioned catching up but never made it happen. Want to grab a quick 15-min call next week?`,
  },
  {
    type: 'unanswered_help',
    pattern: /\b(can you|could you|would you|any chance|do you know|advice|help|recommend|suggest|thoughts on)\b.*\?/i,
    hook: 'They asked for help/advice you may not have answered',
    priority: 'high',
    opener: (name) => `Hey ${name}, I was going through old messages and realized I didn't fully reply to your question. If it's still relevant, happy to help!`,
  },
  {
    type: 'intro_opportunity',
    pattern: /\b(intro|introduction|connect you|put you in touch|warm intro|know someone|introduce you to)\b/i,
    hook: 'An introduction was mentioned',
    priority: 'high',
    opener: (name) => `Hey ${name}, you mentioned an intro/connection opportunity a while back. If it's still on the table, I'd love to pick it up!`,
  },
  {
    type: 'meet_never_scheduled',
    pattern: /\b(coffee|lunch|dinner|drinks|meet|meeting|call|zoom|sync)\b/i,
    hook: 'Meeting was discussed but never scheduled',
    priority: 'medium',
    opener: (name) => `Hey ${name}, we talked about meeting up but it never happened. Are you around for a quick coffee sometime soon?`,
  },
  {
    type: 'ended_mid_topic',
    pattern: /\b(as discussed|following up|continuing|next steps|moving forward|circling back|regarding|about the)\b/i,
    hook: 'Conversation ended mid-topic',
    priority: 'medium',
    opener: (name) => `Hey ${name}, we left our conversation mid-topic last time. Want to continue where we left off?`,
  },
  {
    type: 'thanks_only',
    pattern: /^(thanks|thank you|thx|appreciate it|cheers|great|awesome|nice|👍|🙏)\s*[.!]?$/i,
    hook: 'Last message was just a thank you',
    priority: 'low',
    opener: (name) => `Hey ${name}, appreciate that note back then! Would love to hear what you're working on these days.`,
  },
];

/**
 * Find dormant conversations with natural re-engagement hooks
 * Enhanced with 6degrees-style hook detection
 */
export function findResurrectionOpportunities(
  data: ParsedLinkedInData
): ResurrectionOpportunity[] {
  const now = new Date();
  const DORMANT_THRESHOLD = 90; // days
  
  const opportunities: ResurrectionOpportunity[] = [];
  
  data.connections.forEach(connection => {
    const messages = data.messages.filter(m =>
      matchesPerson(m.from, connection) || matchesPerson(m.to, connection)
    ).sort((a, b) => b.date.getTime() - a.date.getTime());
    
    if (messages.length === 0) return;
    
    const lastMessage = messages[0];
    const daysDormant = Math.floor(
      (now.getTime() - lastMessage.date.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDormant < DORMANT_THRESHOLD) return;
    
    // Scan entire thread for hook patterns
    const allContent = messages.map(m => m.content).join(' ');
    const firstName = connection.firstName || connection.fullName.split(' ')[0];
    
    let foundHook: typeof HOOK_PATTERNS[0] | null = null;
    let hookSnippet: string | undefined;
    
    for (const hookDef of HOOK_PATTERNS) {
      const match = hookDef.pattern.exec(allContent);
      if (match) {
        foundHook = hookDef;
        // Extract snippet around the match
        const start = Math.max(0, match.index - 30);
        const end = Math.min(allContent.length, match.index + match[0].length + 30);
        hookSnippet = '...' + allContent.slice(start, end).trim() + '...';
        break;
      }
    }
    
    // Default to generic if no pattern found
    if (!foundHook) {
      foundHook = {
        type: 'generic',
        pattern: /.*/,
        hook: 'Conversation went dormant',
        priority: 'low',
        opener: (name) => `Hey ${name}, it's been a while! Hope you're doing well. What have you been up to?`,
      };
    }
    
    opportunities.push({
      connection,
      daysDormant,
      hook: foundHook.hook,
      hookType: foundHook.type,
      hookSnippet,
      lastMessage: lastMessage.content.substring(0, 150) + (lastMessage.content.length > 150 ? '...' : ''),
      suggestedOpener: foundHook.opener(firstName),
      priority: foundHook.priority,
    });
  });
  
  // Sort by priority (high first) then by days dormant (more recent first)
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return opportunities
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.daysDormant - b.daysDormant)
    .slice(0, 25); // Top 25 opportunities
}

// ============================================================================
// 5. NETWORK ARCHETYPE
// ============================================================================

export interface NetworkArchetype {
  primary: 'thought_leader' | 'connector' | 'deep_networker' | 'industry_insider' | 'career_climber' | 'opportunist' | 'dormant';
  secondary?: string;
  scores: {
    breadthVsDepth: number;     // -1 to 1 (negative = deep, positive = broad)
    initiationRatio: number;    // -1 to 1 (negative = receive, positive = initiate)
    reciprocityBalance: number; // -1 to 1 (negative = taker, positive = giver)
    engagementLevel: number;    // 0 to 1
  };
  recommendation: string;
}

/**
 * Classify your networking archetype
 */
export function classifyNetworkArchetype(
  data: ParsedLinkedInData
): NetworkArchetype {
  const totalConnections = data.connections.length;
  const totalMessages = data.messages.length;
  const messagesInitiated = data.messages.filter(m => m.isFromMe).length;
  const endorsementsGiven = data.endorsementsGiven.length;
  const endorsementsReceived = data.endorsementsReceived.length;
  
  // Calculate scores
  const avgMessagesPerConnection = totalMessages / Math.max(totalConnections, 1);
  const breadthVsDepth = avgMessagesPerConnection < 2 ? 0.5 : 
                         avgMessagesPerConnection < 5 ? 0 : -0.5;
  
  const initiationRatio = totalMessages > 0
    ? (messagesInitiated / totalMessages) * 2 - 1
    : 0;
  
  const totalEndorsements = endorsementsGiven + endorsementsReceived;
  const reciprocityBalance = totalEndorsements > 0
    ? (endorsementsGiven / totalEndorsements) * 2 - 1
    : 0;
  
  const engagementLevel = Math.min(1, (totalMessages + totalEndorsements) / (totalConnections * 2));
  
  // Determine archetype
  let primary: NetworkArchetype['primary'];
  let recommendation: string;
  
  if (engagementLevel < 0.1) {
    primary = 'dormant';
    recommendation = 'Your network is underutilized. Start by re-engaging your top 10 connections this week.';
  } else if (initiationRatio < -0.3) {
    primary = 'thought_leader';
    recommendation = 'People seek you out. Leverage this by being more selective and creating content that attracts your ideal connections.';
  } else if (breadthVsDepth > 0.3 && engagementLevel > 0.3) {
    primary = 'connector';
    recommendation = 'You have wide reach. Focus on making valuable introductions between your connections.';
  } else if (breadthVsDepth < -0.3) {
    primary = 'deep_networker';
    recommendation = 'You build strong relationships. Consider expanding to adjacent networks while maintaining depth.';
  } else if (reciprocityBalance > 0.3) {
    primary = 'career_climber';
    recommendation = 'You invest heavily in others. Make sure to occasionally ask for help - people want to reciprocate.';
  } else if (reciprocityBalance < -0.3) {
    primary = 'opportunist';
    recommendation = 'You receive more than you give. Balance this by proactively helping 3 connections this week.';
  } else {
    primary = 'industry_insider';
    recommendation = 'You have a balanced network. Consider specializing or expanding into adjacent industries.';
  }
  
  return {
    primary,
    scores: {
      breadthVsDepth,
      initiationRatio,
      reciprocityBalance,
      engagementLevel,
    },
    recommendation,
  };
}

// ============================================================================
// 6. WARM PATH DISCOVERY (6degrees-Enhanced)
// Evidence-based scoring from 6degrees pathfinder
// ============================================================================

export interface WarmPath {
  targetName: string;
  targetCompany?: string;
  bridgePerson: LinkedInConnection;
  pathStrength: number; // 0-100
  score: number; // Evidence-based score (0-15)
  evidence: string[]; // Why this person is a good path
  reasoning: string; // Human-readable explanation
  relationshipHealth: RelationshipHealth;
  vouchScore: VouchScore;
  suggestedApproach: string;
}

// Known executives → companies mapping (from 6degrees)
const KNOWN_EXECUTIVES: Record<string, string[]> = {
  'satya nadella': ['microsoft'],
  'elon musk': ['tesla', 'spacex', 'twitter', 'x corp', 'x', 'boring company', 'neuralink', 'xai'],
  'sundar pichai': ['google', 'alphabet'],
  'tim cook': ['apple'],
  'mark zuckerberg': ['meta', 'facebook'],
  'jensen huang': ['nvidia'],
  'sam altman': ['openai'],
  'bill gates': ['microsoft', 'bill & melinda gates foundation'],
  'dara khosrowshahi': ['uber'],
  'brian chesky': ['airbnb'],
  'daniel ek': ['spotify'],
  'reed hastings': ['netflix'],
  'andy jassy': ['amazon', 'aws'],
  'arvind krishna': ['ibm'],
  'pat gelsinger': ['intel'],
  'lisa su': ['amd'],
};

// Senior title patterns
const SENIOR_TITLES = [
  'CEO', 'CTO', 'CFO', 'COO', 'CMO', 'CRO', 'CPO', 'CHRO',
  'VP', 'Vice President', 'SVP', 'EVP',
  'Director', 'Head of', 'Chief', 'President', 'Partner',
  'Principal', 'Senior Director', 'Managing Director'
];

/**
 * Resolve target name to company using known executives or pattern matching
 */
function resolveTargetCompany(targetInput: string): { name?: string; companies: string[] } {
  const lower = targetInput.toLowerCase().trim();
  
  // Check known executives
  for (const [exec, companies] of Object.entries(KNOWN_EXECUTIVES)) {
    if (lower.includes(exec)) {
      return { name: targetInput, companies };
    }
  }
  
  // Extract company from pattern like "CEO at Company" or "CTO @ Stripe"
  const companyMatch = targetInput.match(/(?:CEO|CTO|CFO|CMO|COO|President|Founder|Director|VP|Head).*?(?:at|@|of)\s+(.+)/i);
  if (companyMatch) {
    return { name: targetInput, companies: [companyMatch[1].trim()] };
  }
  
  // Treat as company name directly
  return { companies: [targetInput] };
}

/**
 * Score a connection based on EVIDENCE (6degrees pattern)
 */
function scoreConnection(
  connection: LinkedInConnection,
  targetCompanies: string[],
  targetName?: string
): { score: number; evidence: string[]; reasoning: string } {
  let score = 0;
  const evidence: string[] = [];
  
  const company = (connection.company || '').toLowerCase();
  const position = (connection.position || '').toLowerCase();
  
  // Evidence 1: Works at target company (+10 pts)
  const worksAtTarget = targetCompanies.some(tc => company.includes(tc.toLowerCase()));
  if (worksAtTarget) {
    score += 10;
    evidence.push(`Works at ${connection.company} (verified 1st-degree connection)`);
  }
  
  // Evidence 2: Senior role (+3 pts)
  const isSenior = SENIOR_TITLES.some(title => position.includes(title.toLowerCase()));
  if (isSenior) {
    score += 3;
    evidence.push(`Senior role: ${connection.position} (more likely to know executives)`);
  }
  
  // Evidence 3: Relevant department (+2 pts)
  if (targetName) {
    const deptKeywords = ['engineering', 'product', 'marketing', 'sales', 'operations', 'finance', 'design'];
    for (const dept of deptKeywords) {
      if (targetName.toLowerCase().includes(dept) && position.includes(dept)) {
        score += 2;
        evidence.push(`Same department: ${dept} (works in same area)`);
        break;
      }
    }
  }
  
  // Build reasoning
  let reasoning: string;
  if (score >= 13) {
    reasoning = `EXCELLENT - Senior at ${connection.company}, very likely knows target`;
  } else if (score >= 10) {
    reasoning = `GOOD - Works at ${connection.company}, can likely facilitate intro`;
  } else if (score >= 5) {
    reasoning = `POSSIBLE - Related role, worth exploring`;
  } else {
    reasoning = `WEAK - Tangential connection`;
  }
  
  return { score, evidence, reasoning };
}

/**
 * Find warm paths to a target candidate or company
 * Enhanced with 6degrees evidence-based scoring
 */
export function findWarmPaths(
  data: ParsedLinkedInData,
  targetName?: string,
  targetCompany?: string
): WarmPath[] {
  // Resolve target to companies
  const targetInput = targetName || targetCompany || '';
  if (!targetInput) return [];
  
  const { name: resolvedName, companies: targetCompanies } = resolveTargetCompany(targetInput);
  const displayName = resolvedName || targetInput;
  const displayCompany = targetCompanies[0] || targetCompany;
  
  const healthScores = calculateRelationshipHealth(data);
  const vouchScores = calculateVouchScores(data);
  
  const paths: WarmPath[] = [];
  
  // Find and score connections
  data.connections.forEach(connection => {
    // Check if connection works at or relates to target companies
    const company = (connection.company || '').toLowerCase();
    const matchesTarget = targetCompanies.some(tc => company.includes(tc.toLowerCase()));
    
    if (!matchesTarget) return;
    
    const { score, evidence, reasoning } = scoreConnection(connection, targetCompanies, displayName);
    
    if (score === 0) return;
    
    const health = healthScores.find(h => h.connection.fullName === connection.fullName);
    const vouch = vouchScores.find(v => v.connection.fullName === connection.fullName);
    
    if (!health || !vouch) return;
    
    // Combine evidence score with relationship health
    const pathStrength = Math.round(
      (score * 5) + // Evidence score weighted heavily
      (health.currentStrength * 0.3) + 
      (vouch.score * 0.2)
    );
    
    paths.push({
      targetName: displayName,
      targetCompany: displayCompany,
      bridgePerson: connection,
      pathStrength: Math.min(100, pathStrength),
      score,
      evidence,
      reasoning,
      relationshipHealth: health,
      vouchScore: vouch,
      suggestedApproach: generateApproachMessage(connection, displayName, displayCompany, score, vouch.score),
    });
  });
  
  return paths.sort((a, b) => b.score - a.score || b.pathStrength - a.pathStrength).slice(0, 10);
}

function generateApproachMessage(
  bridge: LinkedInConnection,
  targetName?: string,
  targetCompany?: string,
  evidenceScore?: number,
  vouchScore?: number
): string {
  const target = targetName || `someone at ${targetCompany}`;
  const firstName = bridge.firstName || bridge.fullName.split(' ')[0];
  
  // High evidence score = direct ask
  if (evidenceScore && evidenceScore >= 13) {
    return `Hey ${firstName}! I see you're a ${bridge.position} at ${bridge.company}. I'm trying to connect with ${target} - would you be open to making an introduction?`;
  }
  
  // Good evidence = warm approach
  if (evidenceScore && evidenceScore >= 10) {
    return `Hi ${firstName}, hope you're well! I noticed you work at ${bridge.company}. I'm trying to reach ${target} - could you help connect me with someone who might know them?`;
  }
  
  // Lower evidence = exploratory
  return `Hi ${firstName}, I'm exploring connections to ${targetCompany || 'the company'}. Any chance you could point me in the right direction to reach ${target}?`;
}

// ============================================================================
// MASTER ANALYSIS FUNCTION
// ============================================================================

export interface NetworkIntelligenceReport {
  summary: {
    totalConnections: number;
    strongRelationships: number;
    coolingRelationships: number;
    dormantRelationships: number;
    topAdvocates: number;
    resurrectionOpportunities: number;
  };
  archetype: NetworkArchetype;
  relationshipHealth: RelationshipHealth[];
  vouchScores: VouchScore[];
  reciprocityLedger: ReciprocityEntry[];
  resurrectionOpportunities: ResurrectionOpportunity[];
  analyzedAt: Date;
}

/**
 * Generate complete network intelligence report
 */
export function generateNetworkIntelligenceReport(
  data: ParsedLinkedInData,
  myName: string = ''
): NetworkIntelligenceReport {
  const relationshipHealth = calculateRelationshipHealth(data);
  const vouchScores = calculateVouchScores(data);
  const reciprocityLedger = calculateReciprocityLedger(data, myName);
  const resurrectionOpportunities = findResurrectionOpportunities(data);
  const archetype = classifyNetworkArchetype(data);
  
  return {
    summary: {
      totalConnections: data.connections.length,
      strongRelationships: relationshipHealth.filter(r => r.status === 'strong').length,
      coolingRelationships: relationshipHealth.filter(r => r.status === 'cooling').length,
      dormantRelationships: relationshipHealth.filter(r => r.status === 'dormant').length,
      topAdvocates: vouchScores.filter(v => v.score >= 60).length,
      resurrectionOpportunities: resurrectionOpportunities.length,
    },
    archetype,
    relationshipHealth,
    vouchScores,
    reciprocityLedger,
    resurrectionOpportunities,
    analyzedAt: new Date(),
  };
}
