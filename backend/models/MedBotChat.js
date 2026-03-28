const mongoose = require('mongoose');

const medBotChatSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'bot'],
      required: true
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
medBotChatSchema.index({ userId: 1, createdAt: -1 });
medBotChatSchema.index({ userId: 1, sessionId: 1 });
medBotChatSchema.index({ lastActivity: -1 });

// Update lastActivity on save
medBotChatSchema.pre('save', function(next) {
  this.lastActivity = new Date();
  next();
});

module.exports = mongoose.model('MedBotChat', medBotChatSchema);