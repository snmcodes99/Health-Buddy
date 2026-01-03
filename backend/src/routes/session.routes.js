const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { sessionValidation } = require('../middleware/validation');
const { rateLimiters } = require('../middleware/rateLimit');

router.post(
  '/',
  rateLimiters.session,
  sessionValidation.createSession,
  sessionController.createSession
);

router.get(
  '/:sessionId',
  rateLimiters.api,
  sessionValidation.getSession,
  sessionController.getSession
);

module.exports = router;
