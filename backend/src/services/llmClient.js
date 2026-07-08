const { GoogleGenerativeAI } = require('@google/generative-ai');
const env = require('../config/env');

/**
 * Call the Google Gemini API with system instructions and user message content.
 * 
 * @param {string} systemPrompt 
 * @param {string} userPayload 
 * @returns {Promise<string>} Raw output text
 */
const callGemini = async (systemPrompt, userPayload) => {
  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  
  // We can use gemini-1.5-flash as it is fast and supports systemInstruction and JSON mode
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
  });

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPayload }] }],
    generationConfig: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.response.text();
  if (!text) {
    throw new Error('Gemini API returned an empty response.');
  }

  return text;
};

/**
 * Call OpenAI API stub.
 */
const callOpenAI = async (systemPrompt, userPayload) => {
  throw new Error('OpenAI adapter is not fully implemented. Please configure Gemini instead.');
};

/**
 * Call Anthropic API stub.
 */
const callAnthropic = async (systemPrompt, userPayload) => {
  throw new Error('Anthropic adapter is not fully implemented. Please configure Gemini instead.');
};

/**
 * Provider-agnostic client to execute LLM calls.
 * Strips code fences and performs a JSON validation check.
 * 
 * @param {Object} params
 * @param {string} [params.provider] - Can override env.LLM_PROVIDER
 * @param {string} params.systemPrompt
 * @param {string} params.userPayload
 * @returns {Promise<string>} The parsed/cleaned JSON string from the model
 */
const getLlmResponse = async ({ provider, systemPrompt, userPayload }) => {
  const activeProvider = (provider || env.LLM_PROVIDER).toLowerCase();
  
  let rawText = '';
  
  if (activeProvider === 'gemini') {
    rawText = await callGemini(systemPrompt, userPayload);
  } else if (activeProvider === 'openai') {
    rawText = await callOpenAI(systemPrompt, userPayload);
  } else if (activeProvider === 'anthropic') {
    rawText = await callAnthropic(systemPrompt, userPayload);
  } else {
    throw new Error(`Unsupported LLM provider: ${activeProvider}`);
  }

  // Strip code fences if present
  let cleanText = rawText.trim();
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
  }

  // Validate that the output is indeed JSON
  try {
    JSON.parse(cleanText);
  } catch (error) {
    throw new TypeError(`Malformed JSON returned from LLM: ${error.message}. Raw output: ${cleanText}`);
  }

  return cleanText;
};

module.exports = {
  getLlmResponse,
};
