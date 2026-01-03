const { ValidationError, NotFoundError } = require('../utils/errors');

module.exports = (err, req, res, next) => {
  console.error(err);

  if (err instanceof ValidationError) {
    return res.status(400).json({ success: false, error: err.message });
  }

  if (err instanceof NotFoundError) {
    return res.status(404).json({ success: false, error: err.message });
  }

  res.status(500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
};
