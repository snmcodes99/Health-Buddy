const sessionService = require('../services/session.service');
const { SESSION_TTL_MINUTES } = require('../config/constants');

class SessionController {
  async createSession(req, res, next) {
    try {
      const session = await sessionService.createSession();

      res.status(201).json({
        success: true,
        data: {
          sessionId: session._id,
          createdAt: session.createdAt,
          expiresIn: `${SESSION_TTL_MINUTES} minutes`
        }
      });
    } catch (error) {
      next(error);
    }
  }

  async getSession(req, res, next) {
    try {
      const { sessionId } = req.params;
      const session = await sessionService.getSession(sessionId);

      res.status(200).json({
        success: true,
        data: {
          sessionId: session._id,
          createdAt: session.createdAt,
          lastActive: session.lastActive,
          activeItemId: session.activeItemId
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SessionController();