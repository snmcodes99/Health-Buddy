const chatService = require('../services/chat.service');

class ChatController {
  async chat(req, res, next) {
    try {
      const { itemId, sessionId, message } = req.body;

      const result = await chatService.chat(itemId, sessionId, message);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
  console.error('Chat error:', error);
  next(error);
}

  }

  async getHistory(req, res, next) {
    try {
      const { itemId } = req.params;
      const { sessionId } = req.body;

      const history = await chatService.getConversationHistory(itemId, sessionId);

      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  async clearHistory(req, res, next) {
    try {
      const { itemId } = req.params;
      const { sessionId } = req.body;

      const result = await chatService.clearConversation(itemId, sessionId);

      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ChatController();
