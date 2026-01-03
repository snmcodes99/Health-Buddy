const Session = require('../models/Session.model');
const { NotFoundError } = require('../utils/errors');
const { SESSION_TTL_MINUTES } = require('../config/constants');

class SessionService {
  async createSession() {
    const session = new Session();
    await session.save();
    return session;
  }

  async getSession(sessionId) {
    if (!sessionId) {
      throw new NotFoundError('Session ID is required');
    }

    const session = await Session.findById(sessionId);
    if (!session) {
      throw new NotFoundError('Session not found or expired');
    }

    await session.updateActivity();
    return session;
  }

  async updateActiveItem(sessionId, itemId) {
    const session = await this.getSession(sessionId);
    session.activeItemId = itemId;
    await session.save();
    return session;
  }

  async deleteSession(sessionId) {
    const result = await Session.findByIdAndDelete(sessionId);
    if (!result) {
      throw new NotFoundError('Session not found');
    }
    return result;
  }

  async cleanupExpiredSessions() {
    const ttlMs = SESSION_TTL_MINUTES * 60 * 1000;
    const cutoffTime = new Date(Date.now() - ttlMs);

    const result = await Session.deleteMany({
      lastActive: { $lt: cutoffTime }
    });

    return result.deletedCount;
  }
}

module.exports = new SessionService();
