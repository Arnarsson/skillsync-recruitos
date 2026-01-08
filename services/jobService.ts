
import { GoogleGenAI } from "@google/genai";
import { scrapeUrlContent } from "./scrapingService";
import { AI_MODELS } from '../constants';

// Helper to safely get env vars
const getEnv = (key: string) => {
  try {
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// Initialize with localStorage key if available, otherwise env
const getAiClient = () => {
  const apiKey = getEnv('VITE_GEMINI_API_KEY') || localStorage.getItem('GEMINI_API_KEY') || '';
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const fetchJobContextFromUrl = async (url: string): Promise<string> => {
  try {
    const rawMarkdown = await scrapeUrlContent(url);
    const ai = getAiClient();

    if (!ai) throw new Error("Missing Gemini API Key");

    const prompt = `
      You are an expert Data Extractor for a Recruitment OS.
      
      Task: Extract structured job data from the following raw Markdown scraped from a job board.
      
      Output Format (Strict Text):
      Role: [Job Title]
      Location: [Location, Remote/Hybrid status]
      Source: ${url}
      
      Job Summary:
      [2-3 sentence summary of the role's core purpose]
      
      Requirements:
      - [Requirement 1]
      - [Requirement 2]
      - [Requirement 3]
      ... (Extract up to 8 key hard/soft requirements)
      
      Raw Input Markdown:
      ${rawMarkdown.substring(0, 15000)}
    `;

    const result = await ai.models.generateContent({
      model: AI_MODELS.JOB_PARSING,
      contents: prompt
    });

    return result.text || "Failed to parse job content.";

  } catch (error) {
    console.error("Job Fetch Error:", error);
    throw error;
  }
};
