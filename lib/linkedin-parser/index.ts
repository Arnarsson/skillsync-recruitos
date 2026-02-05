/**
 * LinkedIn Export Parser
 * Parses LinkedIn data export files to extract network intelligence
 * 
 * Expected files from LinkedIn export:
 * - Connections.csv: Your network connections
 * - messages.csv: All DM history
 * - Endorsement_Received.csv: Skills endorsed by others
 * - Endorsement_Given.csv: Skills you endorsed for others
 * - Recommendations_Received.csv: Recommendations written for you
 * - Recommendations_Given.csv: Recommendations you wrote
 * - Positions.csv: Your job history
 */

export interface LinkedInConnection {
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  company?: string;
  position?: string;
  connectedOn: Date;
  profileUrl?: string;
}

export interface LinkedInMessage {
  conversationId: string;
  senderName: string;
  recipientName: string;
  date: Date;
  content: string;
  isFromMe: boolean;
}

export interface LinkedInEndorsement {
  skill: string;
  endorserName: string;
  date?: Date;
}

export interface LinkedInRecommendation {
  recommenderName: string;
  recommenderTitle?: string;
  date: Date;
  content: string;
}

export interface ParsedLinkedInData {
  connections: LinkedInConnection[];
  messages: LinkedInMessage[];
  endorsementsReceived: LinkedInEndorsement[];
  endorsementsGiven: LinkedInEndorsement[];
  recommendationsReceived: LinkedInRecommendation[];
  recommendationsGiven: LinkedInRecommendation[];
  parseDate: Date;
}

/**
 * Parse CSV content into rows
 */
function parseCSV(content: string): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header row
  const headers = parseCSVLine(lines[0]);
  
  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  
  return result;
}

/**
 * Parse Connections.csv
 */
export function parseConnections(content: string): LinkedInConnection[] {
  const rows = parseCSV(content);
  
  return rows.map(row => ({
    firstName: row['First Name'] || '',
    lastName: row['Last Name'] || '',
    fullName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
    email: row['Email Address'] || undefined,
    company: row['Company'] || undefined,
    position: row['Position'] || undefined,
    connectedOn: new Date(row['Connected On'] || Date.now()),
    profileUrl: row['URL'] || undefined,
  }));
}

/**
 * Parse messages.csv
 */
export function parseMessages(content: string, myName: string): LinkedInMessage[] {
  const rows = parseCSV(content);
  
  return rows.map(row => ({
    conversationId: row['CONVERSATION ID'] || '',
    senderName: row['FROM'] || '',
    recipientName: row['TO'] || '',
    date: new Date(row['DATE'] || Date.now()),
    content: row['CONTENT'] || '',
    isFromMe: (row['FROM'] || '').toLowerCase().includes(myName.toLowerCase()),
  }));
}

/**
 * Parse endorsements CSV
 */
export function parseEndorsements(content: string): LinkedInEndorsement[] {
  const rows = parseCSV(content);
  
  return rows.map(row => ({
    skill: row['Skill'] || row['Skill Name'] || '',
    endorserName: row['Endorser'] || row['Endorser Name'] || row['Name'] || '',
    date: row['Date'] ? new Date(row['Date']) : undefined,
  }));
}

/**
 * Parse recommendations CSV
 */
export function parseRecommendations(content: string): LinkedInRecommendation[] {
  const rows = parseCSV(content);
  
  return rows.map(row => ({
    recommenderName: row['Recommender'] || row['First Name'] + ' ' + row['Last Name'] || '',
    recommenderTitle: row['Title'] || row['Job Title'] || undefined,
    date: new Date(row['Date'] || row['Creation Date'] || Date.now()),
    content: row['Recommendation'] || row['Text'] || '',
  }));
}

/**
 * Parse entire LinkedIn export from file contents
 */
export async function parseLinkedInExport(files: {
  connections?: string;
  messages?: string;
  endorsementsReceived?: string;
  endorsementsGiven?: string;
  recommendationsReceived?: string;
  recommendationsGiven?: string;
}, myName: string = ''): Promise<ParsedLinkedInData> {
  return {
    connections: files.connections ? parseConnections(files.connections) : [],
    messages: files.messages ? parseMessages(files.messages, myName) : [],
    endorsementsReceived: files.endorsementsReceived ? parseEndorsements(files.endorsementsReceived) : [],
    endorsementsGiven: files.endorsementsGiven ? parseEndorsements(files.endorsementsGiven) : [],
    recommendationsReceived: files.recommendationsReceived ? parseRecommendations(files.recommendationsReceived) : [],
    recommendationsGiven: files.recommendationsGiven ? parseRecommendations(files.recommendationsGiven) : [],
    parseDate: new Date(),
  };
}
