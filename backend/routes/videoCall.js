const express = require('express');
const router = express.Router();
const CallSession = require('../models/CallSession');
const Consultation = require('../models/Consultation');
const { protect } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

// Create video room for consultation
router.post('/create-room', protect, async (req, res) => {
  try {
    const { consultationId } = req.body;

    const consultation = await Consultation.findById(consultationId)
      .populate('doctorId')
      .populate('patientId');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Check if user is part of this consultation
    const isDoctorUser = consultation.doctorId.userId.toString() === req.user._id.toString();
    const isPatient = consultation.patientId._id.toString() === req.user._id.toString();

    if (!isDoctorUser && !isPatient) {
      return res.status(403).json({ message: 'Not authorized for this consultation' });
    }

    // Check if room already exists
    let session = await CallSession.findOne({ consultationId });
    
    if (!session) {
      const roomId = uuidv4();
      
      session = await CallSession.create({
        consultationId,
        roomId,
        doctorId: consultation.doctorId.userId,
        patientId: consultation.patientId._id,
        status: 'waiting'
      });

      // Update consultation with room ID
      consultation.videoRoomId = roomId;
      consultation.status = 'ongoing';
      await consultation.save();
    }

    res.json({
      roomId: session.roomId,
      sessionId: session._id,
      status: session.status
    });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get room details
router.get('/room/:roomId', protect, async (req, res) => {
  try {
    const session = await CallSession.findOne({ roomId: req.params.roomId })
      .populate('doctorId', 'name email')
      .populate('patientId', 'name email')
      .populate('consultationId');

    if (!session) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Check authorization
    const isDoctor = session.doctorId._id.toString() === req.user._id.toString();
    const isPatient = session.patientId._id.toString() === req.user._id.toString();

    if (!isDoctor && !isPatient) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get call history
router.get('/history', protect, async (req, res) => {
  try {
    const query = {
      $or: [
        { doctorId: req.user._id },
        { patientId: req.user._id }
      ],
      status: 'ended'
    };

    const sessions = await CallSession.find(query)
      .populate('doctorId', 'name')
      .populate('patientId', 'name')
      .populate('consultationId')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save notes manually
router.put('/notes/:roomId', protect, async (req, res) => {
  try {
    const { notes } = req.body;
    
    const session = await CallSession.findOneAndUpdate(
      { roomId: req.params.roomId },
      { notes, lastNoteUpdate: new Date() },
      { new: true }
    );

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    res.json({ message: 'Notes saved', notes: session.notes });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get TURN/STUN configuration
router.get('/ice-servers', protect, (req, res) => {
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ];

  res.json({ iceServers });
});

module.exports = router;
