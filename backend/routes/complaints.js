const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/upload');

// Create complaint
router.post('/', protect, upload.array('evidence', 5), async (req, res) => {
  try {
    const { againstId, consultationId, subject, description } = req.body;

    const evidence = req.files?.map(file => file.path) || [];

    // Build complaint data object
    const complaintData = {
      complainantId: req.user._id,
      subject,
      description,
      evidence
    };

    // Only add againstId if it's provided and valid
    if (againstId && againstId.trim() !== '') {
      complaintData.againstId = againstId;
    }

    // Only add consultationId if it's provided and valid
    if (consultationId && consultationId.trim() !== '') {
      complaintData.consultationId = consultationId;
    }

    const complaint = await Complaint.create(complaintData);

    res.status(201).json({
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    console.error('Complaint creation error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get my complaints
router.get('/my-complaints', protect, async (req, res) => {
  try {
    const complaints = await Complaint.find({ complainantId: req.user._id })
      .populate('againstId', 'name email')
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get complaint by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('complainantId', 'name email')
      .populate('againstId', 'name email');

    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
