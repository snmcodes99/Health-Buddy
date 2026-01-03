const mongoose = require('mongoose');
const { MESSAGE_ROLES, MAX_MESSAGES_PER_ITEM } = require('../config/constants');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: Object.values(MESSAGE_ROLES),
    required: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  at: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const itemSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  sessionId: {
    type: String,
    required: true,
    index: true,
    ref: 'Session'
  },
  ingredients: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  rawText: {
    type: String,
    default: '',
    maxlength: 50000
  },
  imageType: {
    type: String,
    enum: ['ocr', 'qr', 'unknown'],
    default: 'unknown'
  },
  messages: {
    type: [messageSchema],
    default: [],
    validate: {
      validator: arr => arr.length <= MAX_MESSAGES_PER_ITEM,
      message: 'Messages array exceeds maximum length'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound index for session queries
itemSchema.index({ sessionId: 1, createdAt: -1 });

// Add message and maintain max length
itemSchema.methods.addMessage = function(role, content) {
  this.messages.push({ role, content, at: new Date() });

  if (this.messages.length > MAX_MESSAGES_PER_ITEM) {
    this.messages = this.messages.slice(-MAX_MESSAGES_PER_ITEM);
  }

  return this;
};

// Get conversation context
itemSchema.methods.getConversationContext = function() {
  return {
    ingredients: this.ingredients,
    messages: this.messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  };
};

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
