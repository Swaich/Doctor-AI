import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { io } from 'socket.io-client';
import { FiMic, FiMicOff, FiVideo, FiVideoOff, FiPhoneOff } from 'react-icons/fi';


const VideoCall = () => {
  const { consultationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState(null);
  const [notes, setNotes] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [remoteTyping, setRemoteTyping] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState('connecting');

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    initializeCall();
    return () => cleanup();
  }, []);

  const initializeCall = async () => {
    try {
      // Create room
      const roomResponse = await api.post('/video/create-room', { consultationId });
      setRoomId(roomResponse.data.roomId);

      // Get ICE servers
      const iceResponse = await api.get('/video/ice-servers');
      const iceServers = iceResponse.data.iceServers;

      // Initialize Socket.IO
      socketRef.current = io(`${process.env.REACT_APP_API_URL}/video`, {
        transports: ['websocket']
      });

      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      peerConnectionRef.current = new RTCPeerConnection({ iceServers });

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            roomId: roomResponse.data.roomId,
            candidate: event.candidate
          });
        }
      };

      // Handle remote stream
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
          setCallStatus('connected');
        }
      };

      // Socket event handlers
      setupSocketHandlers(roomResponse.data.roomId, iceServers);

      // Join room
      socketRef.current.emit('join-room', {
        roomId: roomResponse.data.roomId,
        userId: user.id,
        role: user.role
      });

    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('Failed to initialize call. Please check camera/microphone permissions.');
      setCallStatus('error');
    }
  };

  const setupSocketHandlers = (roomId, iceServers) => {
    const socket = socketRef.current;

    socket.on('joined-room', async () => {
      console.log('✅ Joined room successfully');
      setCallStatus('waiting');
    });

    socket.on('user-joined', async ({ userId, role }) => {
      console.log('👤 User joined:', role);
      
      // If we're the first user, create and send offer
      if (user.role === 'doctor' || (user.role === 'patient' && role === 'doctor')) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        
        socket.emit('offer', { roomId, offer });
      }
    });

    socket.on('offer', async ({ offer }) => {
      console.log('📥 Received offer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('answer', { roomId, answer });
    });

    socket.on('answer', async ({ answer }) => {
      console.log('📥 Received answer');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    socket.on('ice-candidate', async ({ candidate }) => {
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    });

    socket.on('notes-update', ({ notes: updatedNotes }) => {
      setNotes(updatedNotes);
    });

    socket.on('user-typing', () => {
      setRemoteTyping(true);
    });

    socket.on('user-stop-typing', () => {
      setRemoteTyping(false);
    });

    socket.on('call-ended', () => {
      toast.info('Call ended by other participant');
      cleanup();
      navigate('/consultations');
    });

    socket.on('user-left', () => {
      toast.info('Other participant left the call');
    });

    socket.on('error', ({ message }) => {
      toast.error(message);
    });
  };

  const handleNotesChange = (e) => {
    const newNotes = e.target.value;
    setNotes(newNotes);

    // Emit typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socketRef.current?.emit('typing', { roomId });
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socketRef.current?.emit('stop-typing', { roomId });
    }, 1000);

    // Send notes update
    socketRef.current?.emit('notes-update', { roomId, notes: newNotes });
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    if (window.confirm('Are you sure you want to end the call?')) {
      socketRef.current?.emit('end-call', { roomId });
      cleanup();
      navigate('/consultations');
    }
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  if (callStatus === 'error') {
    return (
      <div className="video-call-container">
        <div className="error-message">
          <h2>Unable to start call</h2>
          <p>Please check your camera and microphone permissions</p>
          <button className="btn-primary" onClick={() => navigate('/consultations')}>
            Back to Consultations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-call-container">
      <div className="video-section">
        <div className="video-grid">
          <div className="video-wrapper">
            <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
            <div className="video-label">
              {user.role === 'doctor' ? 'Patient' : 'Doctor'}
            </div>
            {callStatus === 'waiting' && (
              <div className="waiting-overlay">
                <div className="spinner"></div>
                <p>Waiting for other participant...</p>
              </div>
            )}
          </div>

          <div className="video-wrapper local">
            <video ref={localVideoRef} autoPlay playsInline muted className="local-video" />
            <div className="video-label">You</div>
          </div>
        </div>

        <div className="call-controls">
          <button
            className={`control-btn ${!audioEnabled ? 'disabled' : ''}`}
            onClick={toggleAudio}
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? <FiMic /> : <FiMicOff />}
          </button>

          <button
            className={`control-btn ${!videoEnabled ? 'disabled' : ''}`}
            onClick={toggleVideo}
            title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? <FiVideo /> : <FiVideoOff />}
          </button>

          <button
            className="control-btn end-call"
            onClick={endCall}
            title="End call"
          >
            <FiPhoneOff />
          </button>
        </div>
      </div>

      <div className="notes-section">
        <div className="notes-header">
          <h3>Consultation Notes</h3>
          {remoteTyping && (
            <span className="typing-indicator">
              {user.role === 'doctor' ? 'Patient' : 'Doctor'} is typing...
            </span>
          )}
        </div>
        <textarea
          className="notes-editor"
          value={notes}
          onChange={handleNotesChange}
          placeholder="Type your notes here... Both doctor and patient can see and edit these notes in real-time."
        />
        <div className="notes-footer">
          <small>Notes are auto-saved and synced in real-time</small>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
