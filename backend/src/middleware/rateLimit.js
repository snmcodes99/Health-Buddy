// src/middleware/rateLimit.js

class RateLimitStore {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = null;
  }

  startCleanup() {
    if (this.cleanupInterval) return;

    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, data] of this.store.entries()) {
        if (now > data.resetTime) {
          this.store.delete(key);
        }
      }
    }, 60000);
  }

  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  get(key) {
    return this.store.get(key);
  }

  set(key, value) {
    this.store.set(key, value);
  }

  delete(key) {
    this.store.delete(key);
  }

  clear() {
    this.store.clear();
  }
}

const store = new RateLimitStore();

// Only start cleanup in non-test environment
if (process.env.NODE_ENV !== 'test') {
  store.startCleanup();
}

const RATE_LIMITS = {
  api: { windowMs: 15 * 60 * 1000, max: 100, message: 'Too many requests from this IP, please try again later' },
  upload: { windowMs: 60 * 1000, max: 5, message: 'Too many upload attempts, please try again later' },
  chat: { windowMs: 60 * 1000, max: 20, message: 'Too many chat messages, please slow down' },
  compare: { windowMs: 60 * 1000, max: 10, message: 'Too many comparison requests, please try again later' },
  session: { windowMs: 60 * 1000, max: 10, message: 'Too many session creation attempts, please try again later' }
};

const createRateLimiter = (config) => {
  return function rateLimiter(req, res, next) {
    const identifier = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${config.name}:${identifier}`;
    const now = Date.now();

    let record = store.get(key);

    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + config.windowMs
      };
    }

    record.count++;
    store.set(key, record);

    const remaining = Math.max(0, config.max - record.count);

    res.setHeader('X-RateLimit-Limit', config.max);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > config.max) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfter);
      return res.status(429).json({ success: false, error: config.message, retryAfter });
    }

    next();
  };
};

const rateLimiters = {
  api: createRateLimiter({ ...RATE_LIMITS.api, name: 'api' }),
  upload: createRateLimiter({ ...RATE_LIMITS.upload, name: 'upload' }),
  chat: createRateLimiter({ ...RATE_LIMITS.chat, name: 'chat' }),
  compare: createRateLimiter({ ...RATE_LIMITS.compare, name: 'compare' }),
  session: createRateLimiter({ ...RATE_LIMITS.session, name: 'session' })
};

const clearRateLimit = (identifier, limitType = 'api') => {
  const key = `${limitType}:${identifier}`;
  store.delete(key);
};

const clearAllRateLimits = () => store.clear();

const shutdown = () => store.stopCleanup();

module.exports = {
  rateLimiters,
  clearRateLimit,
  clearAllRateLimits,
  shutdown,
  RATE_LIMITS,
  _store: store
};
