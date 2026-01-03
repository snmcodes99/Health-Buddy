const buildChatPrompt = (ingredients, messages, newQuestion) => {
  const ingredientsList = ingredients.length > 0
    ? ingredients.join(', ')
    : 'No ingredients detected';

  let prompt = `You are a food analysis AI assistant helping users understand food products.

CURRENT PRODUCT:
Ingredients: ${ingredientsList}

Your task:
- Answer questions ONLY about the current product unless the user explicitly asks for a comparison.
- If the user asks follow-up questions like "why", "is it safe", "what about kids", refer to previous answers.
- Be honest if information is missing.

`;

  if (messages.length > 0) {
    prompt += `CONVERSATION HISTORY:\n`;
    messages.forEach(msg => {
      const label = msg.role === 'user' ? 'User' : 'Assistant';
      prompt += `${label}: ${msg.content}\n`;
    });
    prompt += `\n`;
  }

  prompt += `USER QUESTION:
${newQuestion}

Respond clearly, concisely, and in a friendly tone. Avoid medical diagnosis but provide practical guidance.`;

  return prompt;
};

const buildComparisonPrompt = (items, userQuestion) => {
  let prompt = `You are a food analysis expert. The user wants to compare multiple food products.

Compare ONLY the products listed below.

`;

  items.forEach((item, index) => {
    const ingredientsList = item.ingredients.length > 0
      ? item.ingredients.join(', ')
      : 'No ingredients detected';

    prompt += `PRODUCT ${index + 1} (ID: ${item._id}):
Ingredients: ${ingredientsList}

`;
  });

  prompt += `
USER QUESTION:
${userQuestion}

Now return a comparison in this EXACT JSON format (no markdown, no explanation outside JSON):

{
  "summary": "Short 2-3 sentence comparison",
  "items": [
    {
      "itemId": "ID of product",
      "risk": "low|medium|high",
      "notes": "Key health notes"
    }
  ],
  "bestFor": {
    "diabetic": "Which is better and why",
    "kids": "Which is better and why",
    "general": "Overall best option"
  },
  "uncertainty": "Limitations or missing data"
}

Rules:
- Use only given ingredients.
- Base risk on sugar, additives, preservatives, allergens, and processing.
- Be neutral and factual.
- Return ONLY valid JSON.
`;

  return prompt;
};

const buildIngredientsParsingPrompt = (rawText) => {
  return `Extract ingredients from this food label text.

TEXT:
${rawText}

Return ONLY a JSON array of ingredient names like:
["Sugar", "Milk", "Cocoa Butter"]

Rules:
- Remove quantities, percentages, and formatting artifacts
- Normalize names ("Cane Sugar" → "Sugar")
- Ignore nutritional facts, marketing text, and instructions
- If nothing is found return []

Return ONLY the JSON array.`;
};

module.exports = {
  buildChatPrompt,
  buildComparisonPrompt,
  buildIngredientsParsingPrompt
};
