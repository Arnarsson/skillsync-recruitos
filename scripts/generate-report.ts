#!/usr/bin/env tsx
/**
 * CLI Script: Generate BigFive + Team Fit Report
 *
 * Genererer en delt kandidat-rapport direkte fra terminalen.
 * Omgår frontend/login og kalder AI-services direkte.
 *
 * Brug: npx tsx scripts/generate-report.ts <github-username>
 * Output: Shareable URL til rapporten
 */

import { Octokit } from "@octokit/rest";
import * as dotenv from "dotenv";
import { generatePersona } from "../lib/services/gemini/index";
import { createSharedProfile, type SharedProfileData } from "../lib/shared-profiles";

// Load environment variables
dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GITHUB_ACCESS_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("❌ GITHUB_TOKEN eller GITHUB_ACCESS_TOKEN mangler i .env");
  console.error("   Tilføj: GITHUB_TOKEN=your_github_pat");
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

async function generateReport(username: string, jobContext?: string) {
  console.log(`\n🔍 Henter data for @${username}...`);

  try {
    // 1. Hent GitHub bruger data
    const { data: user } = await octokit.users.getByUsername({ username });

    // 2. Hent repos (for at udlede skills)
    const { data: repos } = await octokit.repos.listForUser({
      username,
      sort: "pushed",
      per_page: 100,
      type: "owner",
    });

    // 3. Byg skills liste fra sprog
    const languageCount = repos.reduce((acc, repo) => {
      if (repo.language) {
        acc[repo.language] = (acc[repo.language] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const skills = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([lang]) => lang);

    console.log(`   📊 Fundet ${repos.length} repos, ${skills.length} sprog`);

    // 4. Byg profil tekst til AI
    const profileText = `
GitHub Profil: @${username}
Navn: ${user.name || username}
Bio: ${user.bio || "Ingen bio angivet"}
Company: ${user.company || "Unknown"}
Location: ${user.location || "Unknown"}
Public Repos: ${user.public_repos}
Followers: ${user.followers}
Following: ${user.following}
Created: ${user.created_at}
Top Languages: ${skills.join(", ")}

Seneste repos:
${repos.slice(0, 10).map(r => `- ${r.name}: ${r.description || "No description"} (${r.language || "N/A"})`).join("\n")}
    `.trim();

    console.log("🧠 Analyserer personlighed med AI (BigFive + Team Fit)...");

    // 5. Kør AI persona analyse
    const persona = await generatePersona(profileText).catch(err => {
      console.error("❌ Persona generation fejlede:", err.message);
      console.error("   Check at OPENROUTER_API_KEY eller GEMINI_API_KEY er sat i .env");
      process.exit(1);
    });

    console.log("✅ AI analyse færdig");

    // 6. Sammensæt rapport data
    const profileData: SharedProfileData = {
      candidateId: username,
      name: user.name || username,
      currentRole: user.bio?.split(" at ")[0] || user.bio || "Developer",
      company: user.company || undefined,
      location: user.location || undefined,
      avatar: user.avatar_url,
      skills: skills,
      yearsExperience: Math.floor((Date.now() - new Date(user.created_at).getTime()) / (365 * 24 * 60 * 60 * 1000)),
      alignmentScore: 75, // Placeholder - could be enhanced
      persona: persona,
      keyEvidence: [],
      risks: [],
      scoreBreakdown: {
        skills: { percentage: 80 },
        experience: { percentage: 75 },
        industry: { percentage: 70 },
        seniority: { percentage: 80 },
        location: { percentage: 100 }
      }
    };

    // 7. Gem profil
    console.log("💾 Gemmer rapport...");
    const reportId = await createSharedProfile(profileData, "CLI-Script");

    // 8. Generer URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000";
    const reportUrl = `${baseUrl}/report/${reportId}`;

    // Success output
    console.log("\n✅ Rapport genereret succesfuldt!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📊 Kandidat: ${user.name || username}`);
    console.log(`🔗 Share Link: ${reportUrl}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("\n💡 Tip: Send linket direkte til Thomas (ingen login påkrævet)");

    if (persona) {
      console.log(`\n🎭 Archetype: ${persona.archetype}`);
      console.log(`📈 BigFive Scores:`);
      console.log(`   Openness: ${persona.bigFive.openness}/10`);
      console.log(`   Conscientiousness: ${persona.bigFive.conscientiousness}/10`);
      console.log(`   Extraversion: ${persona.bigFive.extraversion}/10`);
      console.log(`   Agreeableness: ${persona.bigFive.agreeableness}/10`);
      console.log(`   Neuroticism: ${persona.bigFive.neuroticism}/10`);
    }


    console.log("\n");
    return reportUrl;

  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Not Found")) {
        console.error(`❌ GitHub bruger @${username} findes ikke`);
      } else {
        console.error("❌ Fejl:", error.message);
      }
    } else {
      console.error("❌ Ukendt fejl:", error);
    }
    process.exit(1);
  }
}

// Main execution
const args = process.argv.slice(2);
const username = args[0];
const jobContext = args[1];

if (!username) {
  console.log(`
Brug: npx tsx scripts/generate-report.ts <github-username> [job-context]

Eksempler:
  npx tsx scripts/generate-report.ts ecederstrand
  npx tsx scripts/generate-report.ts ecederstrand "Senior Backend Engineer hos fintech startup"

Krav:
  - .env skal have GITHUB_TOKEN
  - .env skal have OPENROUTER_API_KEY eller GEMINI_API_KEY
  `);
  process.exit(1);
}

console.log("🚀 RecruitOS CLI - Kandidat Rapport Generator");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

generateReport(username, jobContext).catch(err => {
  console.error("\n💥 Fatal fejl:", err);
  process.exit(1);
});
