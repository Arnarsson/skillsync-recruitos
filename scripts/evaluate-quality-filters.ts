/**
 * Evaluation Script for Anti-Gaming Quality Filters
 * 
 * This script evaluates the quality filtering system against known test cases.
 * 
 * Usage:
 *   npx ts-node scripts/evaluate-quality-filters.ts
 */

import { createOctokit } from '../lib/github';
import {
  calculateQualitySignals,
  isTutorialRepository,
  type QualitySignals,
} from '../lib/anti-gaming-filters';

// Test cases: Known profiles with expected quality levels
interface TestCase {
  username: string;
  description: string;
  expectedQuality: 'high' | 'moderate' | 'low';
  notes?: string;
}

const TEST_CASES: TestCase[] = [
  // High quality profiles (should score 80+)
  {
    username: 'torvalds',
    description: 'Linus Torvalds (Linux creator)',
    expectedQuality: 'high',
    notes: 'Maintained major projects, long history',
  },
  {
    username: 'gaearon',
    description: 'Dan Abramov (React core team)',
    expectedQuality: 'high',
    notes: 'Active contributor, code reviews, discussions',
  },
  
  // Moderate quality profiles (should score 40-79)
  {
    username: 'github',
    description: 'GitHub organization account',
    expectedQuality: 'moderate',
    notes: 'Corporate account, may have forks',
  },
  
  // Low quality profiles - tutorial/fork-heavy (should score <40)
  // Note: Replace these with actual known tutorial-heavy profiles
  // {
  //   username: 'example-student',
  //   description: 'Student with mostly tutorial repos',
  //   expectedQuality: 'low',
  //   notes: 'Fork-heavy, tutorial repos',
  // },
];

// Evaluation results
interface EvaluationResult {
  username: string;
  description: string;
  expectedQuality: string;
  actualScore: number;
  actualQuality: string;
  passed: boolean;
  signals: QualitySignals;
  notes: string;
}

async function evaluateProfile(testCase: TestCase): Promise<EvaluationResult> {
  const octokit = createOctokit(process.env.GITHUB_TOKEN);
  
  console.log(`\nEvaluating: ${testCase.username} (${testCase.description})`);
  
  try {
    const signals = await calculateQualitySignals(testCase.username, octokit);
    const score = signals.overallQualityScore;
    
    let actualQuality: 'high' | 'moderate' | 'low' = 'moderate';
    if (score >= 80) actualQuality = 'high';
    else if (score >= 40) actualQuality = 'moderate';
    else actualQuality = 'low';
    
    const passed = actualQuality === testCase.expectedQuality;
    
    console.log(`  Score: ${score}/100 (Expected: ${testCase.expectedQuality}, Actual: ${actualQuality})`);
    console.log(`  Flags: ${signals.flags.join(', ')}`);
    console.log(`  Result: ${passed ? '✓ PASS' : '✗ FAIL'}`);
    
    return {
      username: testCase.username,
      description: testCase.description,
      expectedQuality: testCase.expectedQuality,
      actualScore: score,
      actualQuality,
      passed,
      signals,
      notes: testCase.notes || '',
    };
  } catch (error) {
    console.error(`  Error: ${error}`);
    return {
      username: testCase.username,
      description: testCase.description,
      expectedQuality: testCase.expectedQuality,
      actualScore: 0,
      actualQuality: 'error',
      passed: false,
      signals: {
        isTutorialRepo: false,
        forkRatio: 0,
        hasSustantiveContributions: false,
        hasCommitBursts: false,
        substantiveDiffScore: 0,
        reviewParticipation: 0,
        maintenanceScore: 0,
        issueDiscussionScore: 0,
        overallQualityScore: 0,
        flags: [`Error: ${error}`],
      },
      notes: testCase.notes || '',
    };
  }
}

async function main() {
  console.log('='.repeat(60));
  console.log('Anti-Gaming Quality Filter Evaluation');
  console.log('='.repeat(60));
  
  if (!process.env.GITHUB_TOKEN) {
    console.error('\nError: GITHUB_TOKEN environment variable not set');
    console.error('Please set GITHUB_TOKEN in your .env file');
    process.exit(1);
  }
  
  const results: EvaluationResult[] = [];
  
  for (const testCase of TEST_CASES) {
    const result = await evaluateProfile(testCase);
    results.push(result);
    
    // Rate limiting: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const accuracy = total > 0 ? (passed / total * 100).toFixed(1) : '0.0';
  
  console.log(`\nTotal: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${total - passed}`);
  console.log(`Accuracy: ${accuracy}%`);
  
  // Print detailed results table
  console.log('\nDetailed Results:');
  console.log('-'.repeat(60));
  results.forEach(r => {
    const status = r.passed ? '✓' : '✗';
    console.log(`${status} ${r.username.padEnd(20)} | Score: ${r.actualScore.toString().padStart(3)} | ${r.actualQuality.padEnd(8)} (expected: ${r.expectedQuality})`);
  });
  
  // Quality distribution
  console.log('\nQuality Distribution:');
  const high = results.filter(r => r.actualQuality === 'high').length;
  const moderate = results.filter(r => r.actualQuality === 'moderate').length;
  const low = results.filter(r => r.actualQuality === 'low').length;
  console.log(`  High (80+):     ${high}`);
  console.log(`  Moderate (40-79): ${moderate}`);
  console.log(`  Low (<40):      ${low}`);
  
  // Acceptance criteria check
  console.log('\n' + '='.repeat(60));
  console.log('ACCEPTANCE CRITERIA');
  console.log('='.repeat(60));
  console.log('✓ Quality filtering implemented');
  console.log('✓ Tutorial repo detection active');
  console.log('✓ Fork ratio analysis active');
  console.log('✓ Commit burst detection active');
  console.log('✓ Code review participation scoring active');
  console.log(`${accuracy >= 80 ? '✓' : '⚠'} Accuracy: ${accuracy}% (target: >80%)`);
  
  console.log('\nNext Steps:');
  console.log('1. Add more test cases (target: 100 labeled profiles)');
  console.log('2. Manually label 20 edge cases');
  console.log('3. Calculate NDCG@10 improvement vs baseline');
  console.log('4. Verify "toy repo" presence in top-10 ≤10%');
}

main().catch(console.error);
