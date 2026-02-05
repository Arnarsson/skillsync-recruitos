/**
 * LinkedIn Export Parser
 * Parses REAL LinkedIn data export files
 * 
 * Actual files from LinkedIn export:
 * - Connections.csv (has 3 skip lines at top!)
 * - messages.csv
 * - Endorsement_Received_Info.csv
 * - Endorsement_Given_Info.csv
 * - Recommendations_Received.csv
 * - Recommendations_Given.csv
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
  conversationTitle: string;
  from: string;
  senderProfileUrl: string;
  to: string;
  recipientProfileUrls: string;
  date: Date;
  subject: string;
  content: string;
  folder: string;
  isFromMe: boolean;
}

export interface LinkedInEndorsement {
  date: Date;
  skillName: string;
  endorserFirstName: string;
  endorserLastName: string;
  endorserFullName: string;
  endorserUrl: string;
}

export interface LinkedInRecommendation {
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  jobTitle: string;
  text: string;
  creationDate: Date;
  status: string;
}

export interface ParsedLinkedInData {
  connections: LinkedInConnection[];
  messages: LinkedInMessage[];
  endorsementsReceived: LinkedInEndorsement[];
  endorsementsGiven: LinkedInEndorsement[];
  recommendationsReceived: LinkedInRecommendation[];
  recommendationsGiven: LinkedInRecommendation[];
  parseDate: Date;
  myName: string;
}

/**
 * Parse CSV content into rows, handling quoted fields
 */
function parseCSV(content: string, skipLines: number = 0): Record<string, string>[] {
  const lines = content.trim().split('\n');
  if (lines.length < skipLines + 2) return [];
  
  // Skip initial lines (LinkedIn adds notes at top of some files)
  const dataLines = lines.slice(skipLines);
  
  // Parse header row
  const headers = parseCSVLine(dataLines[0]);
  
  // Parse data rows
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < dataLines.length; i++) {
    if (!dataLines[i].trim()) continue; // Skip empty lines
    const values = parseCSVLine(dataLines[i]);
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header.trim()] = values[index]?.trim() || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Parse a single CSV line, handling quoted fields with commas and newlines
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
 * Parse date from various LinkedIn formats
 */
function parseLinkedInDate(dateStr: string): Date {
  if (!dateStr) return new Date();
  
  // Try various formats
  // "21 Nov 2025", "2025-11-20 20:01:54 UTC", "08/27/20, 03:28 PM", "2024/03/27 08:25:46 UTC"
  
  // Format: "21 Nov 2025"
  const dayMonthYear = dateStr.match(/^(\d{1,2})\s+(\w+)\s+(\d{4})$/);
  if (dayMonthYear) {
    return new Date(`${dayMonthYear[2]} ${dayMonthYear[1]}, ${dayMonthYear[3]}`);
  }
  
  // Format: "2025-11-20 20:01:54 UTC"
  if (dateStr.includes(' UTC')) {
    return new Date(dateStr.replace(' UTC', 'Z'));
  }
  
  // Format: "2024/03/27 08:25:46 UTC"
  if (dateStr.match(/^\d{4}\/\d{2}\/\d{2}/)) {
    return new Date(dateStr.replace(/\//g, '-').replace(' UTC', 'Z'));
  }
  
  // Format: "08/27/20, 03:28 PM"
  const usFormat = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{2}),?\s+(.+)$/);
  if (usFormat) {
    const year = parseInt(usFormat[3]) + 2000;
    return new Date(`${usFormat[1]}/${usFormat[2]}/${year} ${usFormat[4]}`);
  }
  
  // Fallback
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? new Date() : parsed;
}

/**
 * Parse Connections.csv
 * NOTE: LinkedIn adds 3 lines of notes at the top!
 */
export function parseConnections(content: string): LinkedInConnection[] {
  // Check if file starts with "Notes:" and skip those lines
  const lines = content.split('\n');
  let skipLines = 0;
  
  // Find where the actual header row starts
  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    if (lines[i].toLowerCase().startsWith('first name,')) {
      skipLines = i;
      break;
    }
    if (lines[i].toLowerCase().includes('notes:') || 
        lines[i].toLowerCase().includes('when exporting') ||
        lines[i].trim() === '') {
      skipLines = i + 1;
    }
  }
  
  const rows = parseCSV(content, skipLines);
  
  return rows.map(row => ({
    firstName: row['First Name'] || '',
    lastName: row['Last Name'] || '',
    fullName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
    email: row['Email Address'] || undefined,
    company: row['Company'] || undefined,
    position: row['Position'] || undefined,
    connectedOn: parseLinkedInDate(row['Connected On'] || ''),
    profileUrl: row['URL'] || undefined,
  })).filter(c => c.fullName.length > 0);
}

/**
 * Parse messages.csv
 */
export function parseMessages(content: string, myName: string): LinkedInMessage[] {
  const rows = parseCSV(content);
  const myNameLower = myName.toLowerCase();
  
  return rows.map(row => {
    const from = row['FROM'] || '';
    const isFromMe = myNameLower ? from.toLowerCase().includes(myNameLower) : false;
    
    return {
      conversationId: row['CONVERSATION ID'] || '',
      conversationTitle: row['CONVERSATION TITLE'] || '',
      from,
      senderProfileUrl: row['SENDER PROFILE URL'] || '',
      to: row['TO'] || '',
      recipientProfileUrls: row['RECIPIENT PROFILE URLS'] || '',
      date: parseLinkedInDate(row['DATE'] || ''),
      subject: row['SUBJECT'] || '',
      content: row['CONTENT'] || '',
      folder: row['FOLDER'] || '',
      isFromMe,
    };
  }).filter(m => m.content.length > 0);
}

/**
 * Parse Endorsement_Received_Info.csv or Endorsement_Given_Info.csv
 */
export function parseEndorsements(content: string, isReceived: boolean = true): LinkedInEndorsement[] {
  const rows = parseCSV(content);
  
  const firstNameCol = isReceived ? 'Endorser First Name' : 'Endorsee First Name';
  const lastNameCol = isReceived ? 'Endorser Last Name' : 'Endorsee Last Name';
  const urlCol = isReceived ? 'Endorser Public Url' : 'Endorsee Public Url';
  
  return rows.map(row => ({
    date: parseLinkedInDate(row['Endorsement Date'] || ''),
    skillName: row['Skill Name'] || '',
    endorserFirstName: row[firstNameCol] || '',
    endorserLastName: row[lastNameCol] || '',
    endorserFullName: `${row[firstNameCol] || ''} ${row[lastNameCol] || ''}`.trim(),
    endorserUrl: row[urlCol] || '',
  })).filter(e => e.skillName.length > 0);
}

/**
 * Parse Recommendations_Received.csv or Recommendations_Given.csv
 */
export function parseRecommendations(content: string): LinkedInRecommendation[] {
  const rows = parseCSV(content);
  
  return rows.map(row => ({
    firstName: row['First Name'] || '',
    lastName: row['Last Name'] || '',
    fullName: `${row['First Name'] || ''} ${row['Last Name'] || ''}`.trim(),
    company: row['Company'] || '',
    jobTitle: row['Job Title'] || '',
    text: row['Text'] || '',
    creationDate: parseLinkedInDate(row['Creation Date'] || ''),
    status: row['Status'] || '',
  })).filter(r => r.fullName.length > 0);
}

/**
 * Detect user's name from messages (they appear in TO field most often)
 */
function detectMyName(messages: LinkedInMessage[]): string {
  const toCounts: Record<string, number> = {};
  
  messages.forEach(msg => {
    const to = msg.to.trim();
    if (to) {
      toCounts[to] = (toCounts[to] || 0) + 1;
    }
  });
  
  // Return the most common TO recipient (that's you)
  let maxCount = 0;
  let myName = '';
  for (const [name, count] of Object.entries(toCounts)) {
    if (count > maxCount) {
      maxCount = count;
      myName = name;
    }
  }
  
  return myName;
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
}): Promise<ParsedLinkedInData> {
  // Parse messages first to detect user name
  const messages = files.messages ? parseMessages(files.messages, '') : [];
  const myName = detectMyName(messages);
  
  // Re-parse messages with detected name
  const messagesWithMe = files.messages ? parseMessages(files.messages, myName) : [];
  
  return {
    connections: files.connections ? parseConnections(files.connections) : [],
    messages: messagesWithMe,
    endorsementsReceived: files.endorsementsReceived ? parseEndorsements(files.endorsementsReceived, true) : [],
    endorsementsGiven: files.endorsementsGiven ? parseEndorsements(files.endorsementsGiven, false) : [],
    recommendationsReceived: files.recommendationsReceived ? parseRecommendations(files.recommendationsReceived) : [],
    recommendationsGiven: files.recommendationsGiven ? parseRecommendations(files.recommendationsGiven) : [],
    parseDate: new Date(),
    myName,
  };
}
