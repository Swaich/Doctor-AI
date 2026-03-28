const CallSession = require('../models/CallSession');
const Consultation = require('../models/Consultation');

module.exports = (io) => {
  const videoNamespace = io.of('/video');

  videoNamespace.on('connection', (socket) => {
    console.log('🎥 User connected to video:', socket.id);

    // Join a video room
    socket.on('join-room', async ({ roomId, userId, role }) => {
      try {
        console.log(`👤 ${role} ${userId} joining room ${roomId}`);
        
        socket.join(roomId);
        socket.roomId = roomId;
        socket.userId = userId;
        socket.role = role;

        // Update call session
        const session = await CallSession.findOne({ roomId });
        if (session) {
          if (session.status === 'waiting') {
            session.status = 'active';
            session.startedAt = new Date();
          }
          
          session.participants.push({
            userId,
            joinedAt: new Date()
          });
          
          await session.save();
        }

        // Notify others in room
        socket.to(roomId).emit('user-joined', { userId, role });

        // Send current notes to joining user
        if (session) {
          socket.emit('notes-update', { notes: session.notes });
        }

        socket.emit('joined-room', { roomId, userId });
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });

    // WebRTC Signaling
    socket.on('offer', ({ roomId, offer }) => {
      console.log('📤 Sending offer to room:', roomId);
      socket.to(roomId).emit('offer', { offer, from: socket.id });
    });

    socket.on('answer', ({ roomId, answer }) => {
      console.log('📤 Sending answer to room:', roomId);
      socket.to(roomId).emit('answer', { answer, from: socket.id });
    });

    socket.on('ice-candidate', ({ roomId, candidate }) => {
      socket.to(roomId).emit('ice-candidate', { candidate, from: socket.id });
    });

    // Notes synchronization
    socket.on('notes-update', async ({ roomId, notes }) => {
      try {
        // Update in database
        await CallSession.findOneAndUpdate(
          { roomId },
          { 
            notes,
            lastNoteUpdate: new Date()
          }
        );

        // Broadcast to others in room
        socket.to(roomId).emit('notes-update', { notes });
      } catch (error) {
        console.error('Error updating notes:', error);
      }
    });

    // Typing indicator
    socket.on('typing', ({ roomId }) => {
      socket.to(roomId).emit('user-typing', { userId: socket.userId, role: socket.role });
    });

    socket.on('stop-typing', ({ roomId }) => {
      socket.to(roomId).emit('user-stop-typing', { userId: socket.userId });
    });

    // End call
    socket.on('end-call', async ({ roomId }) => {
      try {
        const session = await CallSession.findOne({ roomId });
        if (session && session.status === 'active') {
          session.status = 'ended';
          session.endedAt = new Date();
          session.duration = Math.floor((session.endedAt - session.startedAt) / 1000);
          await session.save();

          // Update consultation - mark video call as completed
          await Consultation.findByIdAndUpdate(session.consultationId, {
            status: 'completed',
            completedAt: new Date(),
            notes: session.notes,
            videoCallCompleted: true
          });
        }

        // Notify all in room
        videoNamespace.to(roomId).emit('call-ended', { roomId });
      } catch (error) {
        console.error('Error ending call:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log('🔌 User disconnected:', socket.id);
      
      if (socket.roomId) {
        socket.to(socket.roomId).emit('user-left', { userId: socket.userId });
        
        // Update participant left time
        try {
          await CallSession.findOneAndUpdate(
            { roomId: socket.roomId, 'participants.userId': socket.userId },
            { $set: { 'participants.$.leftAt': new Date() } }
          );
        } catch (error) {
          console.error('Error updating participant:', error);
        }
      }
    });
  });

  return videoNamespace;
};
