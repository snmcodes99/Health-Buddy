const { body, param, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map(e => e.msg).join(', ');
    return next(new ValidationError(message));
  }
  next();
};

const sessionValidation = {
  createSession: [validate],

  getSession: [
    param('sessionId').isString().trim().notEmpty().withMessage('Session ID is required'),
    validate
  ]
};

const itemValidation = {
  createItem: [
    body('sessionId').isString().trim().notEmpty().withMessage('Session ID is required'),
    validate
  ],

  getItem: [
    param('itemId').isString().trim().notEmpty().withMessage('Item ID is required'),
    validate
  ]
};

const chatValidation = {
  chat: [
    body('itemId').isString().trim().notEmpty().withMessage('Item ID is required'),
    body('sessionId').isString().trim().notEmpty().withMessage('Session ID is required'),
    body('message')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Message is required')
      .isLength({ max: 5000 })
      .withMessage('Message too long (max 5000 characters)'),
    validate
  ],

  getHistory: [
    param('itemId').isString().trim().notEmpty().withMessage('Item ID is required'),
    body('sessionId').isString().trim().notEmpty().withMessage('Session ID is required'),
    validate
  ]
};

const compareValidation = {
  compare: [
    body('itemIds')
      .isArray({ min: 2, max: 10 })
      .withMessage('Item IDs must be an array with 2-10 items'),
    body('itemIds.*').isString().trim().notEmpty().withMessage('Each item ID must be a string'),
    body('sessionId').isString().trim().notEmpty().withMessage('Session ID is required'),
    validate
  ]
};

module.exports = {
  validate,
  sessionValidation,
  itemValidation,
  chatValidation,
  compareValidation
};
