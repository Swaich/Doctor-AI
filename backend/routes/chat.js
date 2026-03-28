const express = require('express');
const router = express.Router();
const ChatMessage = require('../models/ChatMessage');
const Consultation = require('../models/Consultation');
const { protect } = require('../middleware/auth');
const { upload } = require('../utils/upload');

// Send message
router.post('/', protect, upload.array('attachments', 5), async (req, res) => {
  try {
    const { consultationId, receiverId, message } = req.body;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation.allowedChat) {
      return res.status(400).json({ message: 'Chat only available after completing the first video consultation' });
    }

    const chatMessage = await ChatMessage.create({
      consultation: consultationId,
      from: req.user._id,
      to: receiverId,
      text: message
    });

    const populatedMessage = await ChatMessage.findById(chatMessage._id)
      .populate('from', 'name')
      .populate('to', 'name');

    const io = req.app.get('io');
    io.to(consultationId).emit('chat-message', populatedMessage);

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get chat history
router.get('/:consultationId', protect, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ consultation: req.params.consultationId })
      .populate('from', 'name')
      .populate('to', 'name')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    await ChatMessage.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if messaging is allowed with a doctor
router.get('/check-access/:doctorId', protect, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Check if there's a completed consultation with video call between patient and doctor
    const completedConsultation = await Consultation.findOne({
      patientId: req.user._id,
      doctorId: doctorId,
      status: 'completed',
      consultationType: 'video',
      videoCallCompleted: true
    });

    res.json({ 
      canMessage: !!completedConsultation,
      consultationId: completedConsultation?._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread message count
router.get('/notifications/unread-count', protect, async (req, res) => {
  try {
    const unreadCount = await ChatMessage.countDocuments({
      to: req.user._id,
      read: false
    });

    res.json({ count: unreadCount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unread messages by consultation
router.get('/notifications/unread-by-consultation', protect, async (req, res) => {
  try {
    const unreadMessages = await ChatMessage.aggregate([
      {
        $match: {
          to: req.user._id,
          read: false
        }
      },
      {
        $group: {
          _id: '$consultation',
          count: { $sum: 1 },
          lastMessage: { $last: '$text' },
          lastMessageTime: { $last: '$createdAt' }
        }
      },
      {
        $lookup: {
          from: 'consultations',
          localField: '_id',
          foreignField: '_id',
          as: 'consultation'
        }
      },
      {
        $unwind: '$consultation'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'consultation.patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'consultation.doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.userId',
          foreignField: '_id',
          as: 'doctorUser'
        }
      },
      {
        $project: {
          consultationId: '$_id',
          count: 1,
          lastMessage: 1,
          lastMessageTime: 1,
          patientName: { $arrayElemAt: ['$patient.name', 0] },
          doctorName: { $arrayElemAt: ['$doctorUser.name', 0] }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json(unreadMessages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Mark all messages in a consultation as read
router.put('/consultation/:consultationId/mark-read', protect, async (req, res) => {
  try {
    const { consultationId } = req.params;
    
    // Mark all messages in this consultation as read for the current user
    await ChatMessage.updateMany(
      {
        consultation: consultationId,
        to: req.user._id,
        read: false
      },
      {
        read: true
      }
    );

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all conversations (both read and unread)
router.get('/conversations/all', protect, async (req, res) => {
  try {
    const allConversations = await ChatMessage.aggregate([
      {
        $match: {
          $or: [
            { from: req.user._id },
            { to: req.user._id }
          ]
        }
      },
      {
        $group: {
          _id: '$consultation',
          lastMessage: { $last: '$text' },
          lastMessageTime: { $last: '$createdAt' },
          unreadCount: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $eq: ['$to', req.user._id] },
                    { $eq: ['$read', false] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'consultations',
          localField: '_id',
          foreignField: '_id',
          as: 'consultation'
        }
      },
      {
        $unwind: '$consultation'
      },
      {
        $lookup: {
          from: 'users',
          localField: 'consultation.patientId',
          foreignField: '_id',
          as: 'patient'
        }
      },
      {
        $lookup: {
          from: 'doctors',
          localField: 'consultation.doctorId',
          foreignField: '_id',
          as: 'doctor'
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'doctor.userId',
          foreignField: '_id',
          as: 'doctorUser'
        }
      },
      {
        $project: {
          consultationId: '$_id',
          count: '$unreadCount',
          lastMessage: 1,
          lastMessageTime: 1,
          patientName: { $arrayElemAt: ['$patient.name', 0] },
          doctorName: { $arrayElemAt: ['$doctorUser.name', 0] }
        }
      },
      {
        $sort: { lastMessageTime: -1 }
      }
    ]);

    res.json(allConversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
