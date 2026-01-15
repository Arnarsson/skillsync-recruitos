/**
 * Global type declarations for RecruitOS
 */

/**
 * Google AI Studio integration interface
 * Used when the app is embedded in AI Studio
 */
interface AIStudioAPI {
  hasSelectedApiKey(): Promise<boolean>;
  openSelectKey(): Promise<void>;
}

/**
 * Extended Window interface with custom properties
 */
declare global {
  interface Window {
    aistudio?: AIStudioAPI;
  }
}

export {};
