const mongoose = require('mongoose');
const { SESSION_TTL_MINUTES } = require('../config/constants');

const sessionSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  lastActive: {
    type: Date,
    default: Date.now
  },
  activeItemId: {
    type: String,
    default: null
  }
});

// TTL index — auto delete inactive sessions
sessionSchema.index(
  { lastActive: 1 },
  { expireAfterSeconds: SESSION_TTL_MINUTES * 60 }
);

// Update lastActive on any access
sessionSchema.methods.updateActivity = async function() {
  this.lastActive = new Date();
  return this.save();
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;
