/**
 * Mock responses for GitHub Search API endpoints.
 */

import { mockDeveloperWithSkills, mockDeveloper2, mockDeveloper3 } from './mockGitHubUser';

export const mockSearchResults = {
  users: [
    mockDeveloperWithSkills,
    mockDeveloper2,
    mockDeveloper3,
    {
      username: 'alicedev',
      name: 'Alice Developer',
      avatar: 'https://avatars.githubusercontent.com/u/45678?v=4',
      bio: 'Senior TypeScript developer. React Native specialist.',
      location: 'Copenhagen, Denmark',
      company: 'Mobile First',
      skills: ['TypeScript', 'React Native', 'React', 'Node.js', 'Firebase'],
      repos: 22,
      stars: 890,
      followers: 210,
      score: 88,
    },
    {
      username: 'charlieeng',
      name: 'Charlie Engineer',
      avatar: 'https://avatars.githubusercontent.com/u/56789?v=4',
      bio: 'Platform engineer. Kubernetes and infrastructure automation.',
      location: 'Amsterdam, Netherlands',
      company: 'CloudOps',
      skills: ['Go', 'Kubernetes', 'Terraform', 'AWS', 'Python'],
      repos: 18,
      stars: 560,
      followers: 150,
      score: 72,
    },
  ],
  total: 5,
  interpretation: {
    language: 'TypeScript',
    location: 'Copenhagen',
    keywords: ['React', 'developers'],
    githubQuery: 'language:TypeScript location:Copenhagen React',
  },
};

export const mockEmptySearchResults = {
  users: [],
  total: 0,
  interpretation: {
    language: null,
    location: null,
    keywords: ['nonexistent', 'query'],
    githubQuery: 'nonexistent query',
  },
};

export const mockReactSearchResults = {
  users: [
    mockDeveloperWithSkills,
    mockDeveloper2,
    {
      username: 'reactmaster',
      name: 'React Master',
      avatar: 'https://avatars.githubusercontent.com/u/67890?v=4',
      bio: 'React core team contributor. Teaching React to thousands.',
      location: 'San Francisco, USA',
      company: 'Meta',
      skills: ['React', 'JavaScript', 'TypeScript', 'Redux', 'Next.js'],
      repos: 45,
      stars: 8500,
      followers: 5000,
      score: 95,
    },
  ],
  total: 3,
  interpretation: {
    language: 'JavaScript',
    location: null,
    keywords: ['React', 'TypeScript'],
    githubQuery: 'language:JavaScript React TypeScript',
  },
};

export const mockLocationSearchResults = {
  users: [
    mockDeveloperWithSkills,
    {
      username: 'copenhagendev',
      name: 'Copenhagen Developer',
      avatar: 'https://avatars.githubusercontent.com/u/78901?v=4',
      bio: 'Local Copenhagen developer. Python and Django specialist.',
      location: 'Copenhagen, Denmark',
      company: 'Danish Startup',
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
      repos: 30,
      stars: 450,
      followers: 120,
      score: 70,
    },
  ],
  total: 2,
  interpretation: {
    language: null,
    location: 'Copenhagen',
    keywords: ['developers'],
    githubQuery: 'location:Copenhagen',
  },
};

// Utility function to create a mock search response
export function createMockSearchResponse(query: string) {
  const lowerQuery = query.toLowerCase();

  // Determine interpretation based on query
  const hasReact = lowerQuery.includes('react');
  const hasTypeScript = lowerQuery.includes('typescript');
  const hasCopenhagen = lowerQuery.includes('copenhagen');

  return {
    users: mockSearchResults.users.filter((user) => {
      if (hasReact && !user.skills.some((s) => s.toLowerCase().includes('react'))) {
        return false;
      }
      if (hasTypeScript && !user.skills.some((s) => s.toLowerCase().includes('typescript'))) {
        return false;
      }
      if (hasCopenhagen && !user.location?.toLowerCase().includes('copenhagen')) {
        return false;
      }
      return true;
    }),
    total: 5,
    interpretation: {
      language: hasTypeScript ? 'TypeScript' : hasReact ? 'JavaScript' : null,
      location: hasCopenhagen ? 'Copenhagen' : null,
      keywords: query.split(' ').filter((w) => w.length > 2),
      githubQuery: query,
    },
  };
}
