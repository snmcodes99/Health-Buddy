const itemService = require('./item.service');
const geminiService = require('./gemini.service');
const compareService = require('./compare.service');
const { buildChatPrompt } = require('../utils/prompts');
const { MESSAGE_ROLES } = require('../config/constants');
const { ValidationError } = require('../utils/errors');

class ChatService {

  async chat(itemId, sessionId, userMessage) {
    if (!userMessage || !userMessage.trim()) {
      throw new ValidationError('Message cannot be empty');
    }

    const msg = userMessage.toLowerCase();

    const isCompare =
      msg.includes('compare') ||
      msg.includes('vs') ||
      msg.includes('better than') ||
      msg.includes('difference') ||
      msg.includes('previous');

    if (isCompare) {
      return this.handleComparison(itemId, sessionId);
    }

    return this.handleNormalChat(itemId, sessionId, userMessage);
  }

  async handleNormalChat(itemId, sessionId, userMessage) {
    const item = await itemService.getItemWithSessionCheck(itemId, sessionId);

    const prompt = buildChatPrompt(
      item.ingredients,
      item.messages,
      userMessage.trim()
    );

    let assistantResponse = '';

    try {
      assistantResponse = await geminiService.chat(prompt);
    } catch (err) {
      console.warn('Gemini chat failed:', err.message);
      assistantResponse = "I'm currently unable to reach the AI service, but I’ve saved your question. You can try again in a moment.";
    }

    if (!assistantResponse || typeof assistantResponse !== 'string') {
      assistantResponse = "I couldn't generate a response right now. Please try again.";
    }

    item.addMessage(MESSAGE_ROLES.USER, userMessage.trim());
    item.addMessage(MESSAGE_ROLES.ASSISTANT, assistantResponse);
    await item.save();

    return {
      item: {
        id: item._id,
        ingredients: item.ingredients,
        messageCount: item.messages.length
      },
      message: {
        role: MESSAGE_ROLES.ASSISTANT,
        content: assistantResponse,
        at: new Date()
      }
    };
  }

  async handleComparison(itemId, sessionId) {
    const items = await itemService.getItemsBySession(sessionId);

    if (items.length < 2) {
      return {
        message: {
          role: MESSAGE_ROLES.ASSISTANT,
          content: "I need at least two products to compare. Please upload another product first."
        }
      };
    }

    const ids = items.slice(0, 2).map(i => i._id.toString());

    let comparison;

    try {
      const result = await compareService.compareItems(ids, sessionId);
      comparison = this.formatComparison(result.comparison);
    } catch (err) {
      console.warn('Comparison failed:', err.message);
      comparison = "I couldn't compare the products right now. Please try again later.";
    }

    return {
      message: {
        role: MESSAGE_ROLES.ASSISTANT,
        content: comparison
      }
    };
  }

  formatComparison(comp) {
    let text = `🆚 Comparison Summary:\n${comp.summary}\n\n`;

    comp.items.forEach(i => {
      text += `• Product ${i.itemId}\n  Risk: ${i.risk}\n  Notes: ${i.notes}\n\n`;
    });

    text += `Best for diabetics: ${comp.bestFor.diabetic}\n`;
    text += `Best for kids: ${comp.bestFor.kids}\n`;
    text += `Overall: ${comp.bestFor.general}\n\n`;
    text += `⚠️ ${comp.uncertainty}`;

    return text;
  }

  async getConversationHistory(itemId, sessionId) {
    const item = await itemService.getItemWithSessionCheck(itemId, sessionId);

    return {
      itemId: item._id,
      ingredients: item.ingredients,
      messages: item.messages,
      createdAt: item.createdAt
    };
  }

  async clearConversation(itemId, sessionId) {
    const item = await itemService.getItemWithSessionCheck(itemId, sessionId);

    item.messages = [];
    await item.save();

    return {
      itemId: item._id,
      cleared: true
    };
  }
}

module.exports = new ChatService();
