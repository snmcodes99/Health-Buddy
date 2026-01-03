const itemService = require('./item.service');
const sessionService = require('./session.service');
const geminiService = require('./gemini.service');
const { buildComparisonPrompt } = require('../utils/prompts');
const { ValidationError } = require('../utils/errors');

class CompareService {
  async compareItems(itemIds, sessionId, userQuestion = '') {
    if (!Array.isArray(itemIds)) {
      throw new ValidationError('itemIds must be an array');
    }

    if (itemIds.length < 2 || itemIds.length > 10) {
      throw new ValidationError('Item IDs must contain between 2 and 10 items');
    }

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    await sessionService.getSession(sessionId);

    const items = await itemService.validateItemsInSession(itemIds, sessionId);

    if (!items || items.length !== itemIds.length) {
      throw new ValidationError('Some items could not be found or do not belong to the session');
    }

    const finalQuestion = userQuestion && userQuestion.trim().length
      ? userQuestion.trim()
      : 'Compare these products for health, safety, and suitability.';

    const prompt = buildComparisonPrompt(items, finalQuestion);

    const comparisonResult = await geminiService.compare(prompt);

    this.validateComparisonResult(comparisonResult);

    return {
      comparedAt: new Date(),
      itemCount: items.length,
      question: finalQuestion,
      comparison: comparisonResult
    };
  }

  validateComparisonResult(result) {
    if (!result || typeof result !== 'object') {
      throw new ValidationError('Invalid comparison result format');
    }

    const requiredFields = ['summary', 'items', 'bestFor', 'uncertainty'];
    const missing = requiredFields.filter(f => !(f in result));

    if (missing.length) {
      throw new ValidationError(`Comparison result missing fields: ${missing.join(', ')}`);
    }

    if (!Array.isArray(result.items)) {
      throw new ValidationError('Comparison "items" must be an array');
    }

    const validRiskLevels = ['low', 'medium', 'high'];

    result.items.forEach((item, index) => {
      if (!item || typeof item !== 'object') {
        throw new ValidationError(`Item ${index} is invalid`);
      }

      const { itemId, risk, notes } = item;

      if (!itemId || !risk || !notes) {
        throw new ValidationError(`Item ${index} missing required fields`);
      }

      if (!validRiskLevels.includes(risk)) {
        throw new ValidationError(`Item ${index} has invalid risk level: ${risk}`);
      }
    });

    if (!result.bestFor || typeof result.bestFor !== 'object') {
      throw new ValidationError('bestFor must be an object');
    }

    if (typeof result.uncertainty !== 'string') {
      throw new ValidationError('uncertainty must be a string');
    }

    return true;
  }

  async getItemsForComparison(itemIds, sessionId) {
    if (!Array.isArray(itemIds) || itemIds.length < 2) {
      throw new ValidationError('At least 2 items are required');
    }

    if (!sessionId) {
      throw new ValidationError('Session ID is required');
    }

    const items = await itemService.validateItemsInSession(itemIds, sessionId);

    return items.map(item => ({
      id: item._id,
      ingredients: item.ingredients,
      ingredientCount: item.ingredients.length,
      createdAt: item.createdAt
    }));
  }
}

module.exports = new CompareService();
