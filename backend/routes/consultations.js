const express = require('express');
const router = express.Router();
const Consultation = require('../models/Consultation');
const Slot = require('../models/Slot');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Transaction = require('../models/Transaction');
const Note = require('../models/Note');
const ChatMessage = require('../models/ChatMessage');
const { protect } = require('../middleware/auth');
const crypto = require('crypto');

// Book consultation
router.post('/book', protect, async (req, res) => {
  try {
    const { doctorId, slotId, type } = req.body;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== 'approved') {
      return res.status(400).json({ message: 'Doctor not available' });
    }

    const slot = await Slot.findById(slotId);
    if (!slot || slot.isBooked) {
      return res.status(400).json({ message: 'Slot not available' });
    }

    // Determine credits required based on consultation type
    let creditsRequired;
    if (type === 'online') {
      creditsRequired = doctor.consultationFee?.video || 0;
    } else {
      creditsRequired = doctor.consultationFee?.physical || 0;
    }

    if (!creditsRequired || creditsRequired <= 0) {
      return res.status(400).json({ message: 'Invalid consultation fee configuration' });
    }

    const user = await User.findById(req.user._id);
    
    // Ensure user has credits field
    if (typeof user.credits !== 'number') {
      user.credits = 0;
    }
    
    if (user.credits < creditsRequired) {
      return res.status(400).json({ 
        message: `Insufficient credits. Required: ${creditsRequired}, Available: ${user.credits}` 
      });
    }

    user.credits -= creditsRequired;
    await user.save();

    slot.isBooked = true;
    slot.consultationId = null; // Will be set after consultation is created
    await slot.save();

    // Check if doctor has any remaining available slots
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const remainingSlots = await Slot.countDocuments({
      doctorId: doctorId,
      date: { $gte: today },
      isBooked: false
    });

    // If no available slots remain, set doctor as unavailable
    if (remainingSlots === 0) {
      await Doctor.findByIdAndUpdate(doctorId, { isAvailable: false });
      console.log('Doctor automatically set as unavailable - all slots are now booked');
    }

    const consultation = await Consultation.create({
      patientId: req.user._id,
      doctorId,
      slotId,
      type,
      consultationType: type === 'online' ? 'video' : 'physical',
      creditsCharged: creditsRequired,
      scheduledAt: slot.date,
      status: 'scheduled'
    });

    // Update slot with consultation ID
    slot.consultationId = consultation._id;
    await slot.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'consultation_payment',
      amount: creditsRequired,
      credits: -creditsRequired,
      status: 'completed',
      description: `Consultation booked with Dr. ${doctor.userId?.name || 'Doctor'}`
    });

    res.status(201).json({
      message: 'Consultation booked successfully',
      consultation
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get my consultations
router.get('/my-consultations', protect, async (req, res) => {
  try {
    let consultations;

    if (req.user.role === 'patient') {
      consultations = await Consultation.find({ patientId: req.user._id })
        .populate({
          path: 'doctorId',
          populate: [
            { path: 'userId', select: 'name email' },
            { path: 'specialization', select: 'name' }
          ]
        })
        .populate('slotId')
        .sort({ createdAt: -1 });
    } else if (req.user.role === 'doctor') {
      const doctor = await Doctor.findOne({ userId: req.user._id });
      consultations = await Consultation.find({ doctorId: doctor._id })
        .populate('patientId', 'name email profileImage')
        .populate('slotId')
        .sort({ createdAt: -1 });
    }

    res.json(consultations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update consultation status
router.put('/:id/status', protect, async (req, res) => {
  try {
    const { status } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    consultation.status = status;
    if (status === 'ongoing') consultation.startedAt = new Date();
    if (status === 'completed') consultation.completedAt = new Date();

    await consultation.save();
    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Save notes
router.put('/:id/notes', protect, async (req, res) => {
  try {
    const { notes } = req.body;
    const consultation = await Consultation.findByIdAndUpdate(
      req.params.id,
      { notes },
      { new: true }
    );

    res.json(consultation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add rating
router.put('/:id/rating', protect, async (req, res) => {
  try {
    const { rating, review } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (consultation.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    consultation.rating = rating;
    consultation.review = review;
    await consultation.save();

    const doctor = await Doctor.findById(consultation.doctorId);
    const totalRating = doctor.rating.average * doctor.rating.count + rating;
    doctor.rating.count += 1;
    doctor.rating.average = totalRating / doctor.rating.count;
    await doctor.save();

    res.json({ message: 'Rating submitted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Start video consultation
router.post('/:id/start', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patientId', 'name email credits')
      .populate('doctorId');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user belongs to this consultation
    const isPatient = consultation.patientId._id.toString() === req.user._id.toString();
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && consultation.doctorId._id.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized to access this consultation' });
    }

    // Check if patient has paid (credits were deducted during booking)
    if (isPatient && consultation.patientId.credits < 0) {
      return res.status(403).json({ message: 'Payment required to join consultation' });
    }

    // Generate room ID if not exists
    if (!consultation.roomId) {
      consultation.roomId = `room_${crypto.randomBytes(16).toString('hex')}`;
    }

    // Update status to ongoing if not already
    if (consultation.status === 'created' || consultation.status === 'scheduled') {
      consultation.status = 'ongoing';
      consultation.startedAt = new Date();
    }

    await consultation.save();

    res.json({
      roomId: consultation.roomId,
      consultation: {
        _id: consultation._id,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        status: consultation.status,
        type: consultation.type,
        startedAt: consultation.startedAt
      }
    });
  } catch (error) {
    console.error('Start consultation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// End video consultation
router.post('/:id/end', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user belongs to this consultation
    const isPatient = consultation.patientId.toString() === req.user._id.toString();
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && consultation.doctorId.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update consultation
    consultation.status = 'completed';
    consultation.completedAt = new Date();
    consultation.videoCallCompleted = true;
    consultation.allowedChat = true; // Unlock chat after first call

    // Calculate duration
    if (consultation.startedAt) {
      const durationMs = consultation.completedAt - consultation.startedAt;
      consultation.durationSec = Math.floor(durationMs / 1000);
    }

    await consultation.save();

    res.json({
      message: 'Consultation ended successfully',
      consultation: {
        _id: consultation._id,
        status: consultation.status,
        completedAt: consultation.completedAt,
        durationSec: consultation.durationSec,
        allowedChat: consultation.allowedChat
      }
    });
  } catch (error) {
    console.error('End consultation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add note during consultation
router.post('/:id/notes', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user belongs to this consultation
    const isPatient = consultation.patientId.toString() === req.user._id.toString();
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && consultation.doctorId.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const note = await Note.create({
      consultation: consultation._id,
      author: req.user.role,
      authorId: req.user._id,
      text
    });

    const populatedNote = await Note.findById(note._id)
      .populate('authorId', 'name');

    res.status(201).json(populatedNote);
  } catch (error) {
    console.error('Add note error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get notes for consultation
router.get('/:id/notes', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user belongs to this consultation
    const isPatient = consultation.patientId.toString() === req.user._id.toString();
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && consultation.doctorId.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const notes = await Note.find({ consultation: req.params.id })
      .populate('authorId', 'name')
      .sort({ timestamp: 1 });

    res.json(notes);
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get chat messages for consultation
router.get('/:id/chat', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user belongs to this consultation
    const isPatient = consultation.patientId.toString() === req.user._id.toString();
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && consultation.doctorId.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Check if chat is allowed (only after first completed consultation)
    if (!consultation.allowedChat) {
      return res.status(403).json({ 
        message: 'Chat is only available after completing the first video consultation' 
      });
    }

    const messages = await ChatMessage.find({ consultation: req.params.id })
      .populate('from', 'name')
      .populate('to', 'name')
      .sort({ createdAt: 1 });

    // Mark messages as read if they're for the current user
    await ChatMessage.updateMany(
      { consultation: req.params.id, to: req.user._id, read: false },
      { read: true }
    );

    res.json(messages);
  } catch (error) {
    console.error('Get chat error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Enable chat for consultation (debug endpoint)
router.post('/:id/enable-chat', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id);
    
    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    consultation.allowedChat = true;
    await consultation.save();

    res.json({ message: 'Chat enabled successfully' });
  } catch (error) {
    console.error('Enable chat error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update meeting link
router.put('/:id/meeting-link', protect, async (req, res) => {
  try {
    const { meetingLink } = req.body;
    
    const consultation = await Consultation.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate('doctorId');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user is the doctor for this consultation
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor || consultation.doctorId._id.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Only the assigned doctor can set meeting link' });
    }

    consultation.meetingLink = meetingLink;
    await consultation.save();

    res.json({
      message: 'Meeting link updated successfully',
      meetingLink: consultation.meetingLink
    });
  } catch (error) {
    console.error('Update meeting link error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get consultation by ID (for video call page)
router.get('/:id', protect, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'specialization', select: 'name' }
        ]
      })
      .populate('slotId');

    if (!consultation) {
      return res.status(404).json({ message: 'Consultation not found' });
    }

    // Verify user belongs to this consultation
    const isPatient = consultation.patientId._id.toString() === req.user._id.toString();
    const doctor = await Doctor.findOne({ userId: req.user._id });
    const isDoctor = doctor && consultation.doctorId._id.toString() === doctor._id.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(consultation);
  } catch (error) {
    console.error('Get consultation error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
