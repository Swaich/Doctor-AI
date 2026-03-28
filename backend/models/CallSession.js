const mongoose = require('mongoose');

const callSessionSchema = new mongoose.Schema({
  consultationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Consultation',
    required: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting'
  },
  startedAt: Date,
  endedAt: Date,
  duration: Number, // in seconds
  notes: {
    type: String,
    default: ''
  },
  lastNoteUpdate: Date,
  participants: [{
    userId: mongoose.Schema.Types.ObjectId,
    joinedAt: Date,
    leftAt: Date
  }]
}, {
  timestamps: true
});

module.exports = mongoose.model('CallSession', callSessionSchema);
