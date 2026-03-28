const jwt = require('jsonwebtoken');
const Consultation = require('../models/Consultation');
const Note = require('../models/Note');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/User');
const Doctor = require('../models/Doctor');

module.exports = (io) => {
  // JWT Authentication Middleware for Socket.io
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      console.log('🔑 Socket auth attempt:', {
        hasToken: !!token,
        tokenStart: token ? token.substring(0, 20) + '...' : 'none',
        hasJwtSecret: !!process.env.JWT_SECRET,
        socketId: socket.id,
        authHeaders: socket.handshake.headers.authorization ? 'present' : 'missing',
        authToken: socket.handshake.auth.token ? 'present' : 'missing'
      });
      
      if (!token) {
        console.log('❌ No token provided for socket:', socket.id);
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('🔓 Token decoded successfully for user ID:', decoded.id);
      
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        console.log('❌ User not found for ID:', decoded.id);
        return next(new Error('Authentication error: User not found'));
      }

      console.log('✅ Socket authenticated for user:', user.name, 'Role:', user.role);
      socket.user = user;
      next();
    } catch (error) {
      console.error('❌ Socket authentication error:', error.message);
      console.error('❌ Full error:', error);
      next(new Error('Authentication error: ' + error.message));
    }
  });

  io.on('connection', (socket) => {
    console.log(`✅ User connected: ${socket.user.name} (${socket.user.role}) - Socket ID: ${socket.id}`);

    // ==================== VIDEO CONSULTATION EVENTS ====================

    // Join consultation room
    socket.on('join-room', async ({ consultationId, roomId }) => {
      try {
        console.log(`🚪 ${socket.user.name} attempting to join room ${roomId}`);

        const consultation = await Consultation.findById(consultationId)
          .populate('patientId', 'name email')
          .populate('doctorId');

        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Verify user belongs to this consultation
        const isPatient = consultation.patientId._id.toString() === socket.user._id.toString();
        const doctor = await Doctor.findOne({ userId: socket.user._id });
        const isDoctor = doctor && consultation.doctorId._id.toString() === doctor._id.toString();

        if (!isPatient && !isDoctor) {
          socket.emit('error', { message: 'Not authorized to join this consultation' });
          return;
        }

        // Check if patient has paid
        if (isPatient && consultation.creditsCharged > 0) {
          const patient = await User.findById(socket.user._id);
          if (patient.credits < 0) {
            socket.emit('error', { message: 'Payment required to join consultation' });
            return;
          }
        }

        // Join the room
        socket.join(roomId);
        socket.consultationId = consultationId;
        socket.roomId = roomId;

        console.log(`✅ ${socket.user.name} joined room ${roomId}`);

        // Notify others in the room
        const roomSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        console.log(`📊 Room ${roomId} now has ${roomSize} participants`);
        
        // Get list of all users in room for debugging
        const socketsInRoom = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        console.log(`👥 Sockets in room ${roomId}:`, socketsInRoom.length);
        
        socket.to(roomId).emit('user-joined', {
          userId: socket.user._id,
          name: socket.user.name,
          role: socket.user.role,
          roomSize: roomSize
        });

        // Send confirmation to the user
        socket.emit('joined-room', {
          roomId,
          consultationId,
          user: {
            id: socket.user._id,
            name: socket.user.name,
            role: socket.user.role
          }
        });

        // Send existing notes to the joining user
        const notes = await Note.find({ consultation: consultationId })
          .populate('authorId', 'name')
          .sort({ timestamp: 1 });
        socket.emit('notes-loaded', notes);

      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // Leave room
    socket.on('leave-room', ({ roomId }) => {
      console.log(`🚪 ${socket.user.name} leaving room ${roomId}`);
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', {
        userId: socket.user._id,
        name: socket.user.name
      });
    });

    // ==================== WEBRTC SIGNALING EVENTS ====================

    // Send offer
    socket.on('signal-offer', ({ roomId, offer, to }) => {
      console.log(`📤 Sending offer from ${socket.user.name} to room ${roomId}`);
      console.log(`📊 Room ${roomId} has ${io.sockets.adapter.rooms.get(roomId)?.size || 0} participants`);
      socket.to(roomId).emit('signal-offer', {
        offer,
        from: socket.user._id,
        fromName: socket.user.name
      });
    });

    // Send answer
    socket.on('signal-answer', ({ roomId, answer, to }) => {
      console.log(`📤 Sending answer from ${socket.user.name} to room ${roomId}`);
      console.log(`📊 Room ${roomId} has ${io.sockets.adapter.rooms.get(roomId)?.size || 0} participants`);
      socket.to(roomId).emit('signal-answer', {
        answer,
        from: socket.user._id,
        fromName: socket.user.name
      });
    });

    // Send ICE candidate
    socket.on('signal-ice', ({ roomId, candidate }) => {
      console.log(`🧊 Relaying ICE candidate from ${socket.user.name} to room ${roomId}`);
      console.log(`🧊 Candidate type: ${candidate.type}, protocol: ${candidate.protocol}`);
      socket.to(roomId).emit('signal-ice', {
        candidate,
        from: socket.user._id,
        fromName: socket.user.name
      });
    });

    // ==================== NOTES EVENTS ====================

    // Add note
    socket.on('add-note', async ({ consultationId, text }) => {
      try {
        const consultation = await Consultation.findById(consultationId);
        
        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Verify user belongs to this consultation
        const isPatient = consultation.patientId.toString() === socket.user._id.toString();
        const doctor = await Doctor.findOne({ userId: socket.user._id });
        const isDoctor = doctor && consultation.doctorId.toString() === doctor._id.toString();

        if (!isPatient && !isDoctor) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        const note = await Note.create({
          consultation: consultationId,
          author: socket.user.role,
          authorId: socket.user._id,
          text
        });

        const populatedNote = await Note.findById(note._id)
          .populate('authorId', 'name');

        // Broadcast to all in the room
        io.to(socket.roomId).emit('note-added', populatedNote);

        console.log(`📝 Note added by ${socket.user.name} in consultation ${consultationId}`);

      } catch (error) {
        console.error('Error adding note:', error);
        socket.emit('error', { message: 'Failed to add note' });
      }
    });

    // ==================== CHAT EVENTS ====================

    // Send chat message
    socket.on('chat-message', async ({ consultationId, text, to }) => {
      try {
        const consultation = await Consultation.findById(consultationId);
        
        if (!consultation) {
          socket.emit('error', { message: 'Consultation not found' });
          return;
        }

        // Check if chat is allowed
        if (!consultation.allowedChat) {
          socket.emit('error', { 
            message: 'Chat is only available after completing the first video consultation' 
          });
          return;
        }

        // Verify user belongs to this consultation
        const isPatient = consultation.patientId.toString() === socket.user._id.toString();
        const doctor = await Doctor.findOne({ userId: socket.user._id });
        const isDoctor = doctor && consultation.doctorId.toString() === doctor._id.toString();

        if (!isPatient && !isDoctor) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Determine recipient
        let recipientId;
        if (isPatient) {
          // Patient sending to doctor - need to get doctor's userId
          const doctorProfile = await Doctor.findById(consultation.doctorId).populate('userId');
          recipientId = doctorProfile.userId._id;
        } else {
          // Doctor sending to patient
          recipientId = consultation.patientId;
        }

        const message = await ChatMessage.create({
          consultation: consultationId,
          from: socket.user._id,
          to: recipientId,
          text
        });

        const populatedMessage = await ChatMessage.findById(message._id)
          .populate('from', 'name')
          .populate('to', 'name');

        // Broadcast to all in the consultation room (use consultationId as room)
        const roomId = socket.roomId || consultationId;
        io.to(roomId).emit('chat-message', populatedMessage);
        
        // Also broadcast to the specific consultation room
        io.to(consultationId).emit('chat-message', populatedMessage);

        console.log(`💬 Chat message from ${socket.user.name} in consultation ${consultationId}, room: ${roomId}`);

      } catch (error) {
        console.error('Error sending chat message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark messages as read
    socket.on('mark-read', async ({ consultationId }) => {
      try {
        await ChatMessage.updateMany(
          { consultation: consultationId, to: socket.user._id, read: false },
          { read: true }
        );
      } catch (error) {
        console.error('Error marking messages as read:', error);
      }
    });

    // ==================== CALL CONTROL EVENTS ====================

    // End call
    socket.on('call-ended', async ({ consultationId, roomId }) => {
      try {
        const consultation = await Consultation.findById(consultationId);
        
        if (consultation) {
          consultation.status = 'completed';
          consultation.completedAt = new Date();
          consultation.videoCallCompleted = true;
          consultation.allowedChat = true;

          if (consultation.startedAt) {
            const durationMs = consultation.completedAt - consultation.startedAt;
            consultation.durationSec = Math.floor(durationMs / 1000);
          }

          await consultation.save();
        }

        // Notify all in the room
        io.to(roomId).emit('call-ended', {
          consultationId,
          message: 'Call has ended'
        });

        console.log(`📞 Call ended for consultation ${consultationId}`);

      } catch (error) {
        console.error('Error ending call:', error);
      }
    });

    // ==================== DEBUG/TEST EVENTS ====================

    // Test connection
    socket.on('test-connection', (data) => {
      console.log(`🧪 Test connection from ${socket.user.name}:`, data);
      socket.emit('test-response', { 
        message: 'Connection test successful',
        timestamp: Date.now(),
        userId: socket.user._id,
        userName: socket.user.name
      });
    });

    // ==================== DISCONNECT ====================

    socket.on('disconnect', () => {
      console.log(`❌ User disconnected: ${socket.user.name} - Socket ID: ${socket.id}`);
      
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-left', {
          userId: socket.user._id,
          name: socket.user.name
        });
      }
    });
  });

  console.log('🔌 Socket.io server initialized with WebRTC signaling, notes, and chat');
};
