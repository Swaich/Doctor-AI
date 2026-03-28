const mongoose = require('mongoose');

const consultationRequestSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Doctor',
    required: true
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true
  },
  consultationType: {
    type: String,
    enum: ['video', 'physical'],
    default: 'video'
  },
  reasonForConsultation: {
    type: String,
    required: true
  },
  urgencyLevel: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'scheduled'],
    default: 'pending'
  },
  doctorResponse: {
    type: String
  },
  proposedSlot: {
    date: Date,
    startTime: String,
    endTime: String
  },
  respondedAt: {
    type: Date
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ConsultationRequest', consultationRequestSchema);