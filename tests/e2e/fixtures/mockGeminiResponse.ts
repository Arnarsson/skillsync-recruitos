/**
 * Mock responses for Gemini AI API endpoints.
 */

export const mockCalibrationResult = {
  title: 'Senior Full-Stack Engineer',
  company: 'FinTech Startup',
  location: 'Copenhagen, Denmark (Hybrid)',
  experienceLevel: '5+ years',
  requiredSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'AWS'],
  preferredSkills: ['Payment Systems', 'Python', 'Redis', 'Kubernetes'],
  summary: 'Seeking an experienced Senior Full-Stack Engineer to join our growing fintech team. You will build scalable payment infrastructure, lead technical architecture decisions, and mentor junior developers.',
};

export const mockProfileAnalysis = {
  alignmentScore: 82,
  scoreBreakdown: {
    skills: 90,
    experience: 85,
    industry: 75,
    seniority: 80,
    location: 80,
  },
  indicators: {
    strengths: [
      'Strong TypeScript and React expertise demonstrated across multiple projects',
      'Active open-source contributor with 500+ GitHub stars',
      'Experience leading technical teams at scale',
    ],
    concerns: [
      'Limited fintech domain experience based on public profile',
      'Most recent public activity is 3 months old',
    ],
    evidence: [
      'Maintained react-query-builder with 2.3k stars',
      'Contributed to Next.js core repository',
      'Built payment integration at previous company (per LinkedIn)',
    ],
  },
  interviewGuide: {
    technicalQuestions: [
      'Describe your approach to state management in large React applications',
      'How would you design a real-time payment notification system?',
      'Walk me through optimizing a slow PostgreSQL query',
    ],
    behavioralQuestions: [
      'Tell me about a time you had to make a difficult architectural decision',
      'How do you handle disagreements with team members on technical approaches?',
    ],
    redFlags: [
      'Ask about commitment to on-site vs remote work preferences',
      'Probe for reasons behind 18-month tenure at last role',
    ],
  },
};

export const mockOutreachMessage = {
  subject: 'Exciting opportunity at FinTech Startup',
  message: `Hi John,

I came across your work on react-query-builder and was impressed by your TypeScript expertise and the clean architecture patterns you've implemented.

We're building the next generation of payment infrastructure at FinTech Startup, and I think your background in React and Node.js, combined with your proven ability to lead open-source projects, would be a great fit.

We're tackling some interesting system design challenges around real-time payments and scalability that I think would resonate with your approach.

Would you be open to a quick 15-minute chat to learn more?

Best,
Recruiter`,
  tone: 'professional',
  personalizationPoints: [
    'Referenced specific open-source project',
    'Mentioned relevant technical skills',
    'Connected to role challenges',
  ],
};

export const mockDeepProfile = {
  persona: {
    archetype: 'The Architect',
    description: 'A systematic thinker who designs elegant, scalable solutions. Values clean abstractions and well-documented code.',
    traits: {
      technical: 85,
      leadership: 70,
      communication: 75,
      innovation: 80,
    },
  },
  riskAssessment: {
    attritionRisk: 'Medium',
    factors: [
      'Active job market presence (updated LinkedIn recently)',
      'High market demand for skillset',
      'Previous role tenure was 18 months',
    ],
    mitigations: [
      'Emphasize technical challenges and ownership opportunities',
      'Discuss clear growth path and mentorship',
    ],
  },
  companyMatch: {
    score: 78,
    cultureFit: 'Strong alignment with engineering-first culture',
    roleAlignment: 'Technical skills match; may need fintech domain onboarding',
  },
};
