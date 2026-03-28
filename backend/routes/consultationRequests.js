const express = require('express');
const router = express.Router();
const ConsultationRequest = require('../models/ConsultationRequest');
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const Slot = require('../models/Slot');
const { protect, authorize } = require('../middleware/auth');

// Submit consultation request (Patient)
router.post('/', protect, async (req, res) => {
  try {
    const { 
      doctorId, 
      preferredDate, 
      preferredTime, 
      consultationType, 
      reasonForConsultation, 
      urgencyLevel 
    } = req.body;

    // Validate doctor exists and is approved
    const doctor = await Doctor.findById(doctorId);
    if (!doctor || doctor.status !== 'approved') {
      return res.status(400).json({ message: 'Doctor not available' });
    }

    // Check if patient already has a pending request for this doctor
    const existingRequest = await ConsultationRequest.findOne({
      patientId: req.user._id,
      doctorId,
      status: 'pending'
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: 'You already have a pending request with this doctor' 
      });
    }

    const consultationRequest = await ConsultationRequest.create({
      patientId: req.user._id,
      doctorId,
      preferredDate,
      preferredTime,
      consultationType,
      reasonForConsultation,
      urgencyLevel
    });

    const populatedRequest = await ConsultationRequest.findById(consultationRequest._id)
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'specialization', select: 'name' }
        ]
      });

    res.status(201).json({
      message: 'Consultation request submitted successfully',
      request: populatedRequest
    });
  } catch (error) {
    console.error('Error submitting consultation request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get my consultation requests (Patient)
router.get('/my-requests', protect, async (req, res) => {
  try {
    const requests = await ConsultationRequest.find({ patientId: req.user._id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'specialization', select: 'name' }
        ]
      })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get consultation requests for doctor (Doctor)
router.get('/doctor-requests', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const requests = await ConsultationRequest.find({ doctorId: doctor._id })
      .populate('patientId', 'name email')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Respond to consultation request (Doctor)
router.put('/:id/respond', protect, authorize('doctor'), async (req, res) => {
  try {
    const { status, doctorResponse, proposedSlot } = req.body;
    
    const request = await ConsultationRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify doctor owns this request
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (request.doctorId.toString() !== doctor._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    request.status = status;
    request.doctorResponse = doctorResponse;
    request.respondedAt = new Date();

    if (status === 'approved' && proposedSlot) {
      request.proposedSlot = proposedSlot;
      
      // Create a slot for the approved request
      await Slot.create({
        doctorId: doctor._id,
        date: proposedSlot.date,
        startTime: proposedSlot.startTime,
        endTime: proposedSlot.endTime
      });

      // Set doctor as available if they weren't already
      if (!doctor.isAvailable) {
        await Doctor.findByIdAndUpdate(doctor._id, { isAvailable: true });
      }
    }

    await request.save();

    const populatedRequest = await ConsultationRequest.findById(request._id)
      .populate('patientId', 'name email')
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name' },
          { path: 'specialization', select: 'name' }
        ]
      });

    res.json({
      message: `Request ${status} successfully`,
      request: populatedRequest
    });
  } catch (error) {
    console.error('Error responding to request:', error);
    res.status(500).json({ message: error.message });
  }
});

// Cancel consultation request (Patient)
router.delete('/:id', protect, async (req, res) => {
  try {
    const request = await ConsultationRequest.findById(req.params.id);
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }

    // Verify patient owns this request
    if (request.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: 'Can only cancel pending requests' });
    }

    await request.deleteOne();
    res.json({ message: 'Request cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get notification counts
router.get('/notifications/count', protect, async (req, res) => {
  try {
    let count = 0;

    if (req.user.role === 'patient') {
      // Count requests with new responses
      const lastSeen = req.query.lastSeen || new Date(0);
      count = await ConsultationRequest.countDocuments({
        patientId: req.user._id,
        status: { $ne: 'pending' },
        respondedAt: { $gt: new Date(lastSeen) }
      });
    } else if (req.user.role === 'doctor') {
      // Count pending requests for doctor
      const doctor = await Doctor.findOne({ userId: req.user._id });
      if (doctor) {
        count = await ConsultationRequest.countDocuments({
          doctorId: doctor._id,
          status: 'pending'
        });
      }
    }

    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;