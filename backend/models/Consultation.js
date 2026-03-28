const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema({
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
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true
  },
  type: {
    type: String,
    enum: ['online', 'physical'],
    required: true
  },
  consultationType: {
    type: String,
    enum: ['video', 'physical'],
    default: 'video'
  },
  creditsCharged: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['created', 'scheduled', 'ongoing', 'completed', 'cancelled'],
    default: 'created'
  },
  notes: {
    type: String,
    default: ''
  },
  prescription: String,
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  review: String,
  roomId: {
    type: String,
    unique: true,
    sparse: true
  },
  meetingLink: {
    type: String,
    default: null
  },
  videoCallCompleted: {
    type: Boolean,
    default: false
  },
  allowedChat: {
    type: Boolean,
    default: false
  },
  durationSec: {
    type: Number,
    default: 0
  },
  refunded: {
    type: Boolean,
    default: false
  },
  scheduledAt: Date,
  startedAt: Date,
  completedAt: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('Consultation', consultationSchema);
