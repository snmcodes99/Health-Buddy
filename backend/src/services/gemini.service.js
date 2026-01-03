require('dotenv').config();
const { GoogleGenAI } = require('@google/genai');
const { ExternalServiceError } = require('../utils/errors');
const { GEMINI_MODEL } = require('../config/constants');

class GeminiService {
  constructor() {
    this.ai = null;
  }

  init() {
    if (this.ai) return;

    if (!process.env.GEMINI_API_KEY) {
      if (process.env.NODE_ENV === 'test') return;
      throw new ExternalServiceError('GEMINI_API_KEY is not configured');
    }

    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  async generateResponse(prompt) {
    try {
      this.init();

      const result = await this.ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });

      return result.text || '';
    } catch (error) {
      console.error('Gemini chat failed:', error.message);
      return 'I’m currently unable to reach the AI service. Please try again shortly.';
    }
  }

  async generateJSONResponse(prompt) {
    const text = await this.generateResponse(prompt);

    try {
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch {
      throw new ExternalServiceError('Gemini returned invalid JSON');
    }
  }

  chat(prompt) {
    return this.generateResponse(prompt);
  }

  compare(prompt) {
    return this.generateJSONResponse(prompt);
  }

  parseIngredients(text) {
    return this.generateJSONResponse(text).catch(() => []);
  }

  parseIngredientsFromImage() {
    return [];
  }

  extractTextFromImage() {
    return { text: '', confidence: 0 };
  }
}

module.exports = new GeminiService();
