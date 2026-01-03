module.exports = {
  SESSION_TTL_MINUTES: parseInt(process.env.SESSION_TTL_MINUTES) || 30,
  MAX_MESSAGES_PER_ITEM: parseInt(process.env.MAX_MESSAGES_PER_ITEM) || 20,
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 10485760, // 10MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'image/jpeg,image/png,image/jpg').split(','),
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
  GEMINI_VISION_MODEL: process.env.GEMINI_VISION_MODEL || 'gemini-pro-vision',
  
  RISK_LEVELS: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high'
  },
  
  MESSAGE_ROLES: {
    USER: 'user',
    ASSISTANT: 'assistant'
  },

  // Rate limit configurations
  RATE_LIMIT_ENABLED: process.env.RATE_LIMIT_ENABLED !== 'false' // Enabled by default
};