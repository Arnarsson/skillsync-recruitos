/**
 * Mock responses for Social Matrix connection path API endpoints.
 */

export const mockDirectConnection = {
  degree: 1,
  path: [
    {
      username: 'recruiter',
      name: 'Recruiter Name',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      type: 'recruiter',
    },
    {
      username: 'johndoe',
      name: 'John Doe',
      avatar: 'https://avatars.githubusercontent.com/u/12345?v=4',
      type: 'candidate',
    },
  ],
  connectionType: 'direct',
  message: 'You both follow each other on GitHub',
};

export const mockSecondDegreeConnection = {
  degree: 2,
  path: [
    {
      username: 'recruiter',
      name: 'Recruiter Name',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      type: 'recruiter',
    },
    {
      username: 'mutual-friend',
      name: 'Mutual Friend',
      avatar: 'https://avatars.githubusercontent.com/u/5555?v=4',
      type: 'bridge',
    },
    {
      username: 'johndoe',
      name: 'John Doe',
      avatar: 'https://avatars.githubusercontent.com/u/12345?v=4',
      type: 'candidate',
    },
  ],
  connectionType: 'mutual',
  message: 'You both know Mutual Friend',
  bridgeConnections: [
    {
      name: 'Mutual Friend',
      username: 'mutual-friend',
      relationship: 'former colleague',
      canIntroduce: true,
    },
  ],
};

export const mockThirdDegreeConnection = {
  degree: 3,
  path: [
    {
      username: 'recruiter',
      name: 'Recruiter Name',
      avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
      type: 'recruiter',
    },
    {
      username: 'connection1',
      name: 'First Connection',
      avatar: 'https://avatars.githubusercontent.com/u/2222?v=4',
      type: 'bridge',
    },
    {
      username: 'connection2',
      name: 'Second Connection',
      avatar: 'https://avatars.githubusercontent.com/u/3333?v=4',
      type: 'bridge',
    },
    {
      username: 'johndoe',
      name: 'John Doe',
      avatar: 'https://avatars.githubusercontent.com/u/12345?v=4',
      type: 'candidate',
    },
  ],
  connectionType: 'extended',
  message: 'Connected through First Connection and Second Connection',
  bridgeConnections: [
    {
      name: 'First Connection',
      username: 'connection1',
      relationship: 'industry peer',
      canIntroduce: true,
    },
    {
      name: 'Second Connection',
      username: 'connection2',
      relationship: 'open source collaborator',
      canIntroduce: true,
    },
  ],
};

export const mockNoConnection = {
  degree: null,
  path: [],
  connectionType: 'none',
  message: 'No direct connection path found',
  suggestions: [
    'Check if you have mutual connections on LinkedIn',
    'Look for shared open source contributions',
    'Consider a cold outreach with strong personalization',
  ],
};

export const mockSocialMatrix = {
  nodes: [
    { id: 'recruiter', name: 'Recruiter', type: 'recruiter' },
    { id: 'johndoe', name: 'John Doe', type: 'candidate' },
    { id: 'mutual1', name: 'Mutual 1', type: 'bridge' },
    { id: 'mutual2', name: 'Mutual 2', type: 'bridge' },
  ],
  edges: [
    { from: 'recruiter', to: 'mutual1', type: 'follows' },
    { from: 'mutual1', to: 'johndoe', type: 'follows' },
    { from: 'recruiter', to: 'mutual2', type: 'follows' },
    { from: 'mutual2', to: 'johndoe', type: 'contributed' },
  ],
  bestPath: ['recruiter', 'mutual1', 'johndoe'],
  connectionDegree: 2,
  warmIntro: {
    available: true,
    through: 'mutual1',
    suggestion: 'Mutual 1 has worked with John Doe on open source projects and could make an introduction.',
  },
};

export const mockConnectionPathLoading = {
  status: 'loading',
  message: 'Analyzing connection paths...',
};

export const mockConnectionPathError = {
  status: 'error',
  error: 'Could not analyze connection path. Please try again.',
};

// Utility to create mock response based on connection degree
export function createMockConnectionPath(degree: 1 | 2 | 3 | null) {
  switch (degree) {
    case 1:
      return mockDirectConnection;
    case 2:
      return mockSecondDegreeConnection;
    case 3:
      return mockThirdDegreeConnection;
    default:
      return mockNoConnection;
  }
}
