const getEnv = (key: string, fallback: string) => {
  // @ts-expect-error: import.meta is not available in Node.js
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-expect-error: import.meta is not available in Node.js
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

export const AI_MODELS = {
  // Text & Chat Models
  GEMINI_FLASH: getEnv('VITE_AI_MODEL_FLASH', 'gemini-3-flash-preview'),
  GEMINI_PRO: getEnv('VITE_AI_MODEL_PRO', 'gemini-3.1-pro-preview'),
  GEMINI_LITE: getEnv('VITE_AI_MODEL_LITE', 'gemini-3.1-flash-lite-preview'),

  // Image Generation Models
  IMAGE_GEN: getEnv('VITE_AI_MODEL_IMAGE', 'gemini-2.5-flash-image'),
  IMAGE_GEN_PRO: 'gemini-3-pro-image-preview', // Requires paid key selection

  // Video Generation Models
  VIDEO_GEN: getEnv('VITE_AI_MODEL_VIDEO', 'veo-3.1-fast-generate-preview'), // Requires paid key selection

  // Audio/Speech Models
  TTS: getEnv('VITE_AI_MODEL_TTS', 'gemini-2.5-flash-preview-tts'),
};

export const AI_CONFIG = {
  // Default configuration for text generation
  TEXT_CONFIG: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
  },
  
  // Configuration for image generation
  IMAGE_CONFIG: {
    aspectRatio: '1:1',
    imageSize: '1K',
  },

  // Configuration for video generation
  VIDEO_CONFIG: {
    resolution: '720p',
    aspectRatio: '16:9',
  }
};
