const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complainantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  againstId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation'
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  evidence: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['pending', 'in_review', 'resolved'],
    default: 'pending'
  },
  adminResponse: String,
  resolvedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Complaint', complaintSchema);
