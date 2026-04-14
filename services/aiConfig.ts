
/**
 * Utility to get the Gemini API key from the environment.
 * In AI Studio, the key can be provided as GEMINI_API_KEY or API_KEY.
 */
export const getGeminiApiKey = (): string => {
  const key = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  return key;
};

/**
 * Checks if the Gemini API key is configured.
 */
export const isGeminiConfigured = (): boolean => {
  return getGeminiApiKey().length > 0;
};
