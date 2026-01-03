const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const { chatValidation } = require('../middleware/validation');
const { rateLimiters } = require('../middleware/rateLimit');

router.post(
  '/',
  rateLimiters.chat,
  chatValidation.chat,
  chatController.chat
);

router.get(
  '/:itemId/history',
  rateLimiters.chat,
  chatValidation.getHistory,
  chatController.getHistory
);

router.delete(
  '/:itemId/history',
  rateLimiters.chat,
  chatValidation.getHistory,
  chatController.clearHistory
);

module.exports = router;
