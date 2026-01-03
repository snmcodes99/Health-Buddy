const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const sessionRoutes = require('./routes/session.routes');
const itemRoutes = require('./routes/item.routes');
const chatRoutes = require('./routes/chat.routes');
const compareRoutes = require('./routes/compare.routes');
const errorHandler = require('./middleware/errorHandler');
const rateLimitModule = require('./middleware/rateLimit');

const app = express();

// Trust proxy (important if deployed behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, origin);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));


// Logging (disable during tests)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Health check (no rate limiting)
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Food Analysis API is running',
    timestamp: new Date().toISOString()
  });
});

// Apply global rate limiter ONLY if defined
if (rateLimitModule?.rateLimiters?.api) {
  app.use('/api', rateLimitModule.rateLimiters.api);
}

// API routes
app.use('/api/session', sessionRoutes);
app.use('/api/item', itemRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/compare', compareRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

module.exports = app;
