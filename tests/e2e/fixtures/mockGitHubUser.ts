/**
 * Mock responses for GitHub User API endpoints.
 */

export const mockDeveloperProfile = {
  login: 'johndoe',
  name: 'John Doe',
  avatar_url: 'https://avatars.githubusercontent.com/u/12345?v=4',
  bio: 'Senior Software Engineer. Building scalable web applications. Open source enthusiast.',
  location: 'Copenhagen, Denmark',
  company: '@techstartup',
  public_repos: 42,
  followers: 350,
  following: 120,
  created_at: '2015-03-15T00:00:00Z',
  blog: 'https://johndoe.dev',
  twitter_username: 'johndoe_dev',
};

export const mockRepoList = [
  {
    name: 'react-query-builder',
    description: 'A flexible and customizable query builder component for React',
    stargazers_count: 2300,
    forks_count: 180,
    language: 'TypeScript',
    topics: ['react', 'query-builder', 'typescript', 'ui-components'],
  },
  {
    name: 'node-payment-gateway',
    description: 'A modular payment gateway integration library for Node.js',
    stargazers_count: 890,
    forks_count: 120,
    language: 'TypeScript',
    topics: ['nodejs', 'payments', 'stripe', 'fintech'],
  },
  {
    name: 'postgres-optimizer',
    description: 'CLI tool for analyzing and optimizing PostgreSQL queries',
    stargazers_count: 450,
    forks_count: 45,
    language: 'Go',
    topics: ['postgresql', 'database', 'optimization', 'cli'],
  },
  {
    name: 'dotfiles',
    description: 'My personal development environment configuration',
    stargazers_count: 120,
    forks_count: 15,
    language: 'Shell',
    topics: ['dotfiles', 'vim', 'zsh', 'configuration'],
  },
  {
    name: 'advent-of-code-2024',
    description: 'Solutions for Advent of Code 2024',
    stargazers_count: 35,
    forks_count: 5,
    language: 'Rust',
    topics: ['advent-of-code', 'rust', 'algorithms'],
  },
];

export const mockDeveloperWithSkills = {
  username: 'johndoe',
  name: 'John Doe',
  avatar: 'https://avatars.githubusercontent.com/u/12345?v=4',
  bio: 'Senior Software Engineer. Building scalable web applications. Open source enthusiast.',
  location: 'Copenhagen, Denmark',
  company: '@techstartup',
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Go', 'Rust'],
  repos: 42,
  stars: 3795,
  followers: 350,
  score: 82,
};

export const mockDeveloperApiResponse = {
  user: mockDeveloperProfile,
  repos: mockRepoList,
  totalStars: 3795,
  skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Go', 'Rust', 'Shell'],
  contributions: 1523,
  deep: false,
};

export const mockDeveloperDeepApiResponse = {
  ...mockDeveloperApiResponse,
  deep: true,
  contact: {
    email: 'john@example.com',
    twitter: 'johndoe_dev',
    website: 'https://johndoe.dev',
  },
};

// Additional mock developers for search results
export const mockDeveloper2 = {
  username: 'janedoe',
  name: 'Jane Doe',
  avatar: 'https://avatars.githubusercontent.com/u/23456?v=4',
  bio: 'Full-stack developer passionate about React and GraphQL',
  location: 'Stockholm, Sweden',
  company: 'ScaleUp Inc',
  skills: ['JavaScript', 'React', 'GraphQL', 'AWS', 'Docker'],
  repos: 28,
  stars: 1250,
  followers: 180,
  score: 75,
};

export const mockDeveloper3 = {
  username: 'bobsmith',
  name: 'Bob Smith',
  avatar: 'https://avatars.githubusercontent.com/u/34567?v=4',
  bio: 'Backend engineer. Rust and Go enthusiast. Building performant systems.',
  location: 'Berlin, Germany',
  company: 'Performance Labs',
  skills: ['Rust', 'Go', 'PostgreSQL', 'Redis', 'Kubernetes'],
  repos: 35,
  stars: 2100,
  followers: 420,
  score: 68,
};
