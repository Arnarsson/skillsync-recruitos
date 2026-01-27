/**
 * Shared Profile Storage
 * 
 * Simple file-based storage for shared personality profiles.
 * For production, replace with Supabase/Prisma/Redis.
 * 
 * Profiles are stored as JSON files in /tmp/recruitos-profiles/
 * This works on localhost and Vercel serverless (short-lived cache).
 */

import { randomBytes } from "crypto";
import fs from "fs/promises";
import path from "path";

const STORAGE_DIR = path.join(process.cwd(), ".data", "shared-profiles");

// Ensure storage directory exists
async function ensureDir() {
  try {
    await fs.mkdir(STORAGE_DIR, { recursive: true });
  } catch {
    // Directory already exists
  }
}

function generateId(): string {
  // 8-byte random ID → 11-char base64url (short shareable URLs)
  return randomBytes(8)
    .toString("base64url")
    .replace(/[_-]/g, "")
    .slice(0, 10);
}

export interface SharedProfileData {
  // Candidate basics
  candidateId: string;
  name: string;
  currentRole?: string;
  company?: string;
  location?: string;
  avatar?: string;
  skills: string[];
  yearsExperience?: number;
  alignmentScore: number;

  // Personality
  persona?: {
    archetype: string;
    psychometric: {
      communicationStyle: string;
      primaryMotivator: string;
      riskTolerance: string;
      leadershipPotential: string;
      bigFive?: {
        openness: number;
        conscientiousness: number;
        extraversion: number;
        agreeableness: number;
        neuroticism: number;
      };
    };
    softSkills: string[];
    redFlags: string[];
    greenFlags: string[];
    reasoning: string;
    careerTrajectory?: {
      growthVelocity: string;
      promotionFrequency: string;
      roleProgression: string;
      averageTenure: string;
      tenurePattern: string;
    };
    skillProfile?: {
      coreSkills: Array<{ name: string; proficiency: string; yearsActive: number }>;
      depthVsBreadth: string;
    };
  };

  // Evidence
  keyEvidence?: Array<{ claim: string; source?: string }>;
  risks?: Array<{ claim: string; source?: string }>;

  // Score breakdown
  scoreBreakdown?: {
    skills?: { percentage: number };
    experience?: { percentage: number };
    industry?: { percentage: number };
    seniority?: { percentage: number };
    location?: { percentage: number };
  };
}

export interface SharedProfile {
  id: string;
  data: SharedProfileData;
  createdBy?: string;
  viewCount: number;
  createdAt: string;
  expiresAt?: string;
}

/**
 * Create a new shared profile and return its ID.
 */
export async function createSharedProfile(
  data: SharedProfileData,
  createdBy?: string
): Promise<string> {
  await ensureDir();

  const id = generateId();
  const profile: SharedProfile = {
    id,
    data,
    createdBy,
    viewCount: 0,
    createdAt: new Date().toISOString(),
    // Expire after 90 days
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  };

  const filePath = path.join(STORAGE_DIR, `${id}.json`);
  await fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8");

  return id;
}

/**
 * Get a shared profile by ID.
 */
export async function getSharedProfile(
  id: string
): Promise<SharedProfile | null> {
  await ensureDir();

  // Sanitize ID to prevent path traversal
  const safeId = id.replace(/[^a-zA-Z0-9]/g, "");
  const filePath = path.join(STORAGE_DIR, `${safeId}.json`);

  try {
    const raw = await fs.readFile(filePath, "utf-8");
    const profile: SharedProfile = JSON.parse(raw);

    // Check expiry
    if (profile.expiresAt && new Date(profile.expiresAt) < new Date()) {
      return null;
    }

    // Increment view count (fire-and-forget)
    profile.viewCount += 1;
    fs.writeFile(filePath, JSON.stringify(profile, null, 2), "utf-8").catch(() => {});

    return profile;
  } catch {
    return null;
  }
}
