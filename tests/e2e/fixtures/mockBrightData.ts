/**
 * Mock responses for BrightData API endpoints (LinkedIn).
 */

export const mockLinkedInProfile = {
  name: 'John Doe',
  headline: 'Senior Software Engineer at TechStartup',
  location: 'Copenhagen, Capital Region, Denmark',
  profileUrl: 'https://www.linkedin.com/in/johndoe',
  imageUrl: 'https://media.licdn.com/dms/image/v2/profile.jpg',
  connectionCount: 500,
  currentCompany: 'TechStartup',
  positions: [
    {
      title: 'Senior Software Engineer',
      company: 'TechStartup',
      location: 'Copenhagen, Denmark',
      startDate: '2022-06',
      endDate: null,
      description: 'Leading the development of payment infrastructure using TypeScript, React, and Node.js.',
    },
    {
      title: 'Software Engineer',
      company: 'PreviousCorp',
      location: 'Stockholm, Sweden',
      startDate: '2020-01',
      endDate: '2022-05',
      description: 'Built and maintained e-commerce platform serving 1M+ users.',
    },
    {
      title: 'Junior Developer',
      company: 'StartupAB',
      location: 'Malmo, Sweden',
      startDate: '2018-03',
      endDate: '2019-12',
      description: 'Full-stack development using React and Python.',
    },
  ],
  education: [
    {
      school: 'Technical University of Denmark',
      degree: 'MSc Computer Science',
      field: 'Software Engineering',
      startYear: 2016,
      endYear: 2018,
    },
    {
      school: 'Lund University',
      degree: 'BSc Computer Science',
      field: 'Computer Science',
      startYear: 2013,
      endYear: 2016,
    },
  ],
  skills: [
    'TypeScript',
    'React',
    'Node.js',
    'PostgreSQL',
    'AWS',
    'Docker',
    'Kubernetes',
    'Python',
    'GraphQL',
    'Redis',
  ],
  summary: 'Experienced software engineer with a passion for building scalable web applications. Specialized in TypeScript and React ecosystem.',
};

export const mockLinkedInSearchResults = {
  status: 'ready',
  profiles: [
    mockLinkedInProfile,
    {
      name: 'Jane Smith',
      headline: 'Full-Stack Developer at ScaleUp Inc',
      location: 'Stockholm, Sweden',
      profileUrl: 'https://www.linkedin.com/in/janesmith',
      connectionCount: 350,
      currentCompany: 'ScaleUp Inc',
    },
    {
      name: 'Bob Johnson',
      headline: 'Backend Engineer at Performance Labs',
      location: 'Berlin, Germany',
      profileUrl: 'https://www.linkedin.com/in/bobjohnson',
      connectionCount: 420,
      currentCompany: 'Performance Labs',
    },
  ],
};

export const mockLinkedInSearchPending = {
  status: 'pending',
  snapshotId: 'snapshot-123456',
};

export const mockLinkedInSearchError = {
  status: 'error',
  error: 'Failed to scrape LinkedIn profile. The profile may be private.',
};

export const mockGoogleSerpResults = {
  results: [
    {
      title: 'John Doe - Senior Software Engineer - LinkedIn',
      link: 'https://www.linkedin.com/in/johndoe',
      snippet: 'John Doe is a Senior Software Engineer at TechStartup based in Copenhagen, Denmark. Experience with TypeScript, React, and Node.js.',
      position: 1,
    },
    {
      title: 'johndoe (John Doe) - GitHub',
      link: 'https://github.com/johndoe',
      snippet: 'Senior Software Engineer. Building scalable web applications. Open source enthusiast. johndoe has 42 repositories available.',
      position: 2,
    },
    {
      title: 'John Doe - Personal Website',
      link: 'https://johndoe.dev',
      snippet: 'Personal blog and portfolio of John Doe, software engineer specializing in TypeScript and React.',
      position: 3,
    },
  ],
};
