/**
 * Typed environment configuration for optional client-side API keys.
 * 
 * SECURITY NOTE:
 * Environment variables prefixed with VITE_ are embedded into the client bundle
 * during build and are publicly visible to users inspecting browser assets.
 * Only use keys intended for public access or personal client-side testing.
 */

export interface EnvConfig {
  alphaVantageApiKey?: string;
  guardianApiKey?: string;
  isDevMode: boolean;
}

export const env: EnvConfig = {
  alphaVantageApiKey: import.meta.env.VITE_ALPHA_VANTAGE_API_KEY || undefined,
  guardianApiKey: import.meta.env.VITE_GUARDIAN_API_KEY || undefined,
  isDevMode: import.meta.env.DEV ?? false,
};

export const hasApiKey = (keyName: keyof Omit<EnvConfig, 'isDevMode'>): boolean => {
  const value = env[keyName];
  return typeof value === 'string' && value.trim().length > 0;
};
