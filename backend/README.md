# Food Analysis Backend

AI-native food analysis backend with Gemini API integration.

## Setup

1. Install dependencies: `npm install`
2. Copy .env.example to .env: `cp .env.example .env`
3. Configure your environment variables in .env
4. Start MongoDB
5. Run the server: `npm run dev`

## Testing

Run tests: `npm test`

See full documentation in the artifacts.

.env


# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/food-analysis
MONGODB_TEST_URI=mongodb://localhost:27017/food-analysis-test

# Session Configuration
SESSION_TTL_MINUTES=30

# Gemini API Configuration
GEMINI_API_KEY=khud nikal sale
GEMINI_MODEL=gemini-2.5-flash
GEMINI_VISION_MODEL=gemini-2.5-flash


# Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/jpg

# Chat Configuration
MAX_MESSAGES_PER_ITEM=20



# Rate Limiting
RATE_LIMIT_ENABLED=true
