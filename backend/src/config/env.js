const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

const requiredVars = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/groweasy_csv_importer',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  LLM_PROVIDER: process.env.LLM_PROVIDER || 'gemini',
  LLM_BATCH_SIZE: parseInt(process.env.LLM_BATCH_SIZE || '20', 10),
  LLM_MAX_RETRIES: parseInt(process.env.LLM_MAX_RETRIES || '3', 10),
  MAX_UPLOAD_SIZE_MB: parseInt(process.env.MAX_UPLOAD_SIZE_MB || '10', 10),
};

// Validate LLM provider specific keys
const provider = requiredVars.LLM_PROVIDER.toLowerCase();
if (provider === 'gemini') {
  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_key_here') {
    console.error('CRITICAL ERROR: GEMINI_API_KEY is not defined or is set to default placeholder in .env!');
    process.exit(1);
  }
  requiredVars.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
} else if (provider === 'openai') {
  if (!process.env.OPENAI_API_KEY) {
    console.error('CRITICAL ERROR: OPENAI_API_KEY is not defined in .env!');
    process.exit(1);
  }
  requiredVars.OPENAI_API_KEY = process.env.OPENAI_API_KEY;
} else if (provider === 'anthropic') {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('CRITICAL ERROR: ANTHROPIC_API_KEY is not defined in .env!');
    process.exit(1);
  }
  requiredVars.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
} else {
  console.error(`CRITICAL ERROR: Unsupported LLM_PROVIDER "${process.env.LLM_PROVIDER}". Must be "gemini", "openai", or "anthropic".`);
  process.exit(1);
}

module.exports = requiredVars;
