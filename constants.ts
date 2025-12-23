import { Candidate, FunnelStage, ConfidenceLevel } from './types';

export const INITIAL_CREDITS = 5000; 
export const PILOT_CREDITS = 5000;
export const PILOT_PRICE_DKK = 20000;

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'soren-a',
    name: 'Søren A.',
    currentRole: 'Senior Frontend Engineer',
    company: 'Danske Bank',
    location: 'Copenhagen Area',
    yearsExperience: 7,
    avatar: 'https://i.pravatar.cc/150?u=soren',
    linkedinUrl: 'https://linkedin.com/in/soren-a-demo',
    matchScore: 94, // Renamed from alignmentScore
    confidence: ConfidenceLevel.HIGH,
    scoreBreakdown: {
        skills: { value: 32, max: 35, percentage: 91 },
        experience: { value: 24, max: 25, percentage: 96 },
        industry: { value: 15, max: 15, percentage: 100 },
        seniority: { value: 14, max: 15, percentage: 93 },
        location: { value: 9, max: 10, percentage: 90 }
    },
    shortlistSummary: 'Top tier match. Next.js expert with Fintech compliance experience.',
    keyEvidence: [
        'Specific experience with Next.js 14+ matching job requirement.',
        'Previously worked in heavily regulated Fintech environment (Danske Bank).',
        'Lead a team of 5 developers (matches leadership requirement).'
    ],
    risks: [
        'Salary expectation likely top of band based on current employer.'
    ],
    unlockedSteps: [FunnelStage.SHORTLIST, FunnelStage.EVIDENCE_REPORT],
    avgTenure: '3.5 Years',
    progressionPace: 'Fast',
    cultureFit: 'High Corporate Fit. Accustomed to regulated environments (Danske Bank) and matrix organizations. Likely to navigate our compliance processes well.',
    deepAnalysis: 'Søren represents a low-risk, high-competence hire. His trajectory shows loyalty (promoted internally) and steady progression within a similar corporate structure. The transition to our team would be culturally seamless given his background in banking compliance and legacy migration. His communication style suggests he can bridge the gap between technical and business stakeholders.',
    trajectoryEvidence: 'Promoted from Junior to Senior in 4 years at previous role. Consistently takes higher responsibility.',
    indicators: [
      {
        category: 'COMMUNICATION',
        label: 'Structured & Technical',
        observation: 'Uses precise technical language.',
        evidence: { text: 'LinkedIn recommendations highlight code review detail and mentoring junior devs. Public blog posts show clear technical writing.', source: 'Public Activity', confidence: ConfidenceLevel.HIGH }
      },
      {
        category: 'COLLABORATION',
        label: 'Mentorship-focused',
        observation: 'Active in team growth.',
        evidence: { text: 'Multiple endorsements for "Teaching" and "Code Reviews".', source: 'Skills & Endorsements', confidence: ConfidenceLevel.HIGH }
      },
      {
        category: 'TRAJECTORY',
        label: 'Upward Mobility',
        observation: 'Consistent promotions within company.',
        evidence: { text: 'Junior → Mid → Senior in 4 years at Danske Bank.', source: 'Experience Timeline', confidence: ConfidenceLevel.HIGH }
      },
      {
        category: 'SKILLS',
        label: 'Modern Stack Alignment',
        observation: 'Tech stack matches requirements.',
        evidence: { text: 'Listed: React, Next.js, TypeScript, Node.js. Matches 4/5 hard requirements.', source: 'Skills Section', confidence: ConfidenceLevel.HIGH }
      }
    ],
    interviewGuide: [
      { topic: 'Leadership', question: 'Ask about the transition from IC to Team Lead in 2022.', reason: 'Verify leadership depth.' },
      { topic: 'Tech Stack', question: 'Verify deep knowledge of Server Actions vs API Routes (alignment check).', reason: 'Validate Next.js 14 expertise.' },
      { topic: 'Retention', question: 'Validate "Fast Progression" - was it due to turnover or merit?', reason: 'Check stability.' }
    ],
    connectionPath: 'Lars Jensen (VP Eng)',
    sharedContext: ['Shared connection: Lars Jensen', 'Both worked at Danske Bank', 'Same university (DTU)'],
    outreachHook: 'Lars mentioned your work on the MobilePay migration project.',
    outreachConfidence: ConfidenceLevel.HIGH
  },
  {
    id: 'mette-k',
    name: 'Mette K.',
    currentRole: 'Full Stack Developer',
    company: 'Lunar',
    location: 'Aarhus (Remote)',
    yearsExperience: 4,
    avatar: 'https://i.pravatar.cc/150?u=mette',
    linkedinUrl: 'https://linkedin.com/in/mette-k-demo',
    matchScore: 88,
    confidence: ConfidenceLevel.HIGH,
    scoreBreakdown: {
        skills: { value: 30, max: 35, percentage: 85 },
        experience: { value: 20, max: 25, percentage: 80 },
        industry: { value: 15, max: 15, percentage: 100 },
        seniority: { value: 13, max: 15, percentage: 86 },
        location: { value: 10, max: 10, percentage: 100 }
    },
    shortlistSummary: 'Strong generalist. Good cultural fit, but less specific legacy experience.',
    keyEvidence: [
        '4 years of React experience in a modern fintech setup.',
        'Open source contributor to relevant UI libraries.'
    ],
    risks: [
        'Remote-only preference might conflict with hybrid policy.',
        'Less experience with legacy migration.'
    ],
    unlockedSteps: [FunnelStage.SHORTLIST],
  },
  {
    id: 'jens-p',
    name: 'Jens P.',
    currentRole: 'DevOps Engineer',
    company: 'Netcompany',
    location: 'Copenhagen',
    yearsExperience: 8,
    avatar: 'https://i.pravatar.cc/150?u=jens',
    linkedinUrl: 'https://linkedin.com/in/jens-p-demo',
    matchScore: 72,
    confidence: ConfidenceLevel.MEDIUM,
    scoreBreakdown: {
        skills: { value: 20, max: 35, percentage: 57 },
        experience: { value: 25, max: 25, percentage: 100 },
        industry: { value: 5, max: 15, percentage: 33 },
        seniority: { value: 15, max: 15, percentage: 100 },
        location: { value: 7, max: 10, percentage: 70 }
    },
    shortlistSummary: 'Technically solid but role mismatch (more Ops than Frontend).',
    keyEvidence: ['Azure Certified', 'Strong CI/CD background'],
    risks: ['Limited recent frontend framework experience.', 'Salary expectations likely high (Consultancy rates).'],
    unlockedSteps: [FunnelStage.SHORTLIST],
  },
  {
    id: 'thomas-l',
    name: 'Thomas L.',
    currentRole: 'Frontend Architect',
    company: 'SimCorp',
    location: 'Copenhagen',
    yearsExperience: 12,
    avatar: 'https://i.pravatar.cc/150?u=thomas',
    linkedinUrl: 'https://linkedin.com/in/thomas-l-demo',
    matchScore: 65,
    confidence: ConfidenceLevel.LOW,
    scoreBreakdown: {
        skills: { value: 35, max: 35, percentage: 100 },
        experience: { value: 10, max: 25, percentage: 40 },
        industry: { value: 15, max: 15, percentage: 100 },
        seniority: { value: 5, max: 15, percentage: 33 },
        location: { value: 0, max: 10, percentage: 0 }
    },
    shortlistSummary: 'Technically overqualified. Might get bored with current scope.',
    keyEvidence: ['Architecture ownership experience', '12+ years tenure'],
    risks: ['Flight risk due to role scope mismatch.', 'Potential cost prohibitor.'],
    unlockedSteps: [FunnelStage.SHORTLIST],
  }
];

// Spec 12.2 - Algorithm weights for score explanation
export const SCORE_WEIGHTS = {
  skills: { weight: 35, label: 'Hard Skills Match', description: 'Required skills from job description' },
  experience: { weight: 25, label: 'Experience Relevance', description: 'Years + domain match' },
  industry: { weight: 15, label: 'Industry Alignment', description: 'Same/adjacent industry experience' },
  seniority: { weight: 15, label: 'Seniority Fit', description: 'Title level appropriate for role' },
  location: { weight: 10, label: 'Location Match', description: 'Geography compatibility' }
};
