const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  consultation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true,
    index: true
  },
  author: {
    type: String,
    enum: ['patient', 'doctor'],
    required: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    maxlength: 5000
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for faster queries
noteSchema.index({ consultation: 1, timestamp: 1 });

module.exports = mongoose.model('Note', noteSchema);
