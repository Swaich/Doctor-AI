import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { buildSocketUrl } from '../../config/api';
import { 
  FiVideo, FiVideoOff, FiMic, FiMicOff, FiPhone, 
  FiMessageSquare, FiFileText, FiX, FiSend 
} from 'react-icons/fi';


const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    },
    {
      urls: 'turn:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10
};

const VideoCall = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);

  // State
  const [consultation, setConsultation] = useState(null);
  const [roomId, setRoomId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [remoteConnected, setRemoteConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [offerInProgress, setOfferInProgress] = useState(false);
  
  // Media controls
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  
  // Notes
  const [notes, setNotes] = useState([]);
  const [noteText, setNoteText] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  
  // Chat
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [chatAllowed, setChatAllowed] = useState(false);

  // Initialize consultation and socket
  useEffect(() => {
    initializeCall();
    return () => cleanup();
  }, [consultationId]);

  const initializeCall = async () => {
    try {
      // Get current user
      const userRes = await api.get('/users/profile');
      const userId = userRes.data._id;
      setCurrentUserId(userId);
      console.log('👤 Current user ID set:', userId);

      // Get consultation details
      const consultationRes = await api.get(`/consultations/${consultationId}`);
      setConsultation(consultationRes.data);
      setChatAllowed(consultationRes.data.allowedChat);

      // Start consultation and get room ID
      const startRes = await api.post(`/consultations/${consultationId}/start`);
      setRoomId(startRes.data.roomId);

      // Initialize socket connection
      const token = localStorage.getItem('token');
      console.log('🔑 Initializing socket with token:', token ? 'present' : 'missing');
      
      const socket = io(buildSocketUrl(), {
        auth: { token },
        transports: ['websocket', 'polling']
      });

      socketRef.current = socket;

      // Socket event listeners
      socket.on('connect', () => {
        console.log('✅ Socket connected, ID:', socket.id);
        setConnected(true);
        socket.emit('join-room', { 
          consultationId, 
          roomId: startRes.data.roomId 
        });
      });

      socket.on('joined-room', async (data) => {
        console.log('✅ Joined room:', data);
        try {
          await initializeMedia();
          await loadNotes();
          if (chatAllowed) {
            await loadMessages();
          }
          console.log('✅ Room initialization complete');
        } catch (error) {
          console.error('❌ Error during room initialization:', error);
          toast.error('Failed to initialize video call');
        }
      });

      socket.on('user-joined', (data) => {
        console.log('👤 User joined:', data);
        toast.info(`${data.name} joined the call`);
        
        // Store remote user ID for retry logic
        window.lastRemoteUserId = data.userId;
        
        // Always create offer when someone joins (the second person to join will create the offer)
        if (peerConnectionRef.current && !offerInProgress) {
          console.log('🚀 Creating offer for new participant');
          setOfferInProgress(true);
          setTimeout(() => createOffer(), 2000);
        } else {
          console.log('❌ Cannot create offer:', {
            hasPeerConnection: !!peerConnectionRef.current,
            offerInProgress
          });
        }
      });

      socket.on('user-left', (data) => {
        console.log('👤 User left:', data);
        toast.info(`${data.name} left the call`);
        setRemoteConnected(false);
      });

      socket.on('signal-offer', handleReceiveOffer);
      socket.on('signal-answer', handleReceiveAnswer);
      socket.on('signal-ice', handleReceiveIceCandidate);
      socket.on('note-added', handleNoteAdded);
      socket.on('notes-loaded', (loadedNotes) => setNotes(loadedNotes));
      socket.on('chat-message', handleChatMessage);
      socket.on('call-ended', handleCallEnded);
      
      // Debug event handlers
      socket.on('test-response', (data) => {
        console.log('🧪 Test response received:', data);
        toast.success(`Connection test successful: ${data.message}`);
      });
      
      socket.on('error', (error) => {
        console.error('Socket error:', error);
        toast.error(error.message || 'Socket connection error');
      });

      socket.on('connect_error', (error) => {
        console.error('❌ Socket connection error:', error);
        toast.error(`Failed to connect to server: ${error.message}`);
        setLoading(false);
      });

      socket.on('disconnect', (reason) => {
        console.log('🔌 Socket disconnected:', reason);
        setConnected(false);
        if (reason === 'io server disconnect') {
          // Server disconnected, try to reconnect
          toast.warning('Server disconnected, reconnecting...');
          socket.connect();
        } else if (reason === 'transport close' || reason === 'transport error') {
          toast.warning('Connection lost, reconnecting...');
        }
      });

      setLoading(false);
    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error(error.response?.data?.message || 'Failed to initialize call');
      setLoading(false);
      // Navigate back if initialization fails
      setTimeout(() => navigate('/consultations'), 3000);
    }
  };

  const initializeMedia = async () => {
    try {
      console.log('🎥 Requesting media access...');
      
      // Check if media devices are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Media devices not supported');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { min: 15, ideal: 30, max: 30 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        }
      });

      console.log('✅ Media access granted:', {
        videoTracks: stream.getVideoTracks().length,
        audioTracks: stream.getAudioTracks().length
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        console.log('✅ Local video stream set');
      }

      // Create peer connection
      createPeerConnection(stream);
    } catch (error) {
      console.error('❌ Error accessing media devices:', error);
      
      let errorMessage = 'Failed to access camera/microphone';
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera/microphone access denied. Please allow access and refresh.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera/microphone found. Please connect devices and refresh.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera/microphone is being used by another application.';
      }
      
      toast.error(errorMessage);
    }
  };

  const createPeerConnection = (stream) => {
    console.log('🔗 Creating peer connection with ICE servers:', ICE_SERVERS);
    const peerConnection = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = peerConnection;

    // Add local stream tracks to peer connection
    stream.getTracks().forEach(track => {
      console.log('➕ Adding track to peer connection:', track.kind, track.enabled);
      peerConnection.addTrack(track, stream);
    });

    // Handle incoming tracks
    peerConnection.ontrack = (event) => {
      console.log('📥 Received remote track:', event.streams[0]);
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setRemoteConnected(true);
        console.log('✅ Remote video stream set');
      }
    };

    // Handle ICE candidates
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && socketRef.current.connected) {
        console.log('🧊 Sending ICE candidate:', event.candidate.type);
        socketRef.current.emit('signal-ice', {
          roomId,
          candidate: event.candidate
        });
      } else if (!event.candidate) {
        console.log('🧊 ICE gathering complete');
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log('🔗 Connection state:', peerConnection.connectionState);
      if (peerConnection.connectionState === 'connected') {
        console.log('✅ WebRTC connection established');
        setRemoteConnected(true);
        toast.success('Connected to remote participant');
      } else if (peerConnection.connectionState === 'disconnected') {
        console.log('⚠️ WebRTC connection disconnected');
        setRemoteConnected(false);
        toast.warning('Connection lost, trying to reconnect...');
      } else if (peerConnection.connectionState === 'failed') {
        console.log('❌ WebRTC connection failed');
        setRemoteConnected(false);
        toast.error('Connection failed');
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log('🧊 ICE connection state:', peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'connected' || peerConnection.iceConnectionState === 'completed') {
        console.log('✅ ICE connection established');
        setRemoteConnected(true);
      } else if (peerConnection.iceConnectionState === 'disconnected') {
        console.log('⚠️ ICE connection disconnected');
        setRemoteConnected(false);
      } else if (peerConnection.iceConnectionState === 'failed') {
        console.log('❌ ICE connection failed, attempting restart');
        setRemoteConnected(false);
        toast.warning('Connection failed, retrying...');
        
        // Attempt ICE restart
        try {
          peerConnection.restartIce();
          
          // If restart doesn't work, try recreating the connection
          setTimeout(() => {
            if (peerConnection.iceConnectionState === 'failed') {
              console.log('🔄 ICE restart failed, recreating peer connection');
              if (localStreamRef.current) {
                createPeerConnection(localStreamRef.current);
                // Re-initiate offer after connection recreation
                setTimeout(() => {
                  if (!offerInProgress) {
                    setOfferInProgress(true);
                    createOffer();
                  }
                }, 1000);
              }
            }
          }, 5000);
        } catch (error) {
          console.error('❌ Error during ICE restart:', error);
        }
      }
    };

    // Handle ICE gathering state changes
    peerConnection.onicegatheringstatechange = () => {
      console.log('🧊 ICE gathering state:', peerConnection.iceGatheringState);
    };
  };

  const createOffer = async () => {
    try {
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection available');
        return;
      }

      console.log('🚀 Creating WebRTC offer...');
      const offer = await peerConnectionRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      console.log('📝 Setting local description...');
      await peerConnectionRef.current.setLocalDescription(offer);
      
      console.log('📤 Sending offer to room:', roomId);
      socketRef.current.emit('signal-offer', {
        roomId,
        offer: offer
      });
      
      // Reset offer flag after sending
      setTimeout(() => setOfferInProgress(false), 5000);
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      toast.error('Failed to create call offer');
      setOfferInProgress(false);
    }
  };

  const handleReceiveOffer = async ({ offer, from, fromName }) => {
    try {
      console.log('📥 Received offer from:', fromName);
      
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection available');
        return;
      }
      
      if (peerConnectionRef.current.signalingState !== 'stable') {
        console.log('⚠️ Peer connection not in stable state:', peerConnectionRef.current.signalingState);
        // Reset connection if needed
        if (peerConnectionRef.current.signalingState === 'have-local-offer') {
          console.log('🔄 Resetting peer connection due to signaling collision');
          return;
        }
      }
      
      console.log('📝 Setting remote description...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Process any queued ICE candidates
      if (window.pendingIceCandidates && window.pendingIceCandidates.length > 0) {
        console.log('🧊 Processing queued ICE candidates:', window.pendingIceCandidates.length);
        for (const candidate of window.pendingIceCandidates) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('❌ Error adding queued ICE candidate:', error);
          }
        }
        window.pendingIceCandidates = [];
      }
      
      console.log('🚀 Creating answer...');
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      console.log('📤 Sending answer to room:', roomId);
      socketRef.current.emit('signal-answer', {
        roomId,
        answer: answer
      });
    } catch (error) {
      console.error('❌ Error handling offer:', error);
      toast.error('Failed to handle call offer');
    }
  };

  const handleReceiveAnswer = async ({ answer, from, fromName }) => {
    try {
      console.log('📥 Received answer from:', fromName);
      
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection available');
        return;
      }
      
      if (peerConnectionRef.current.signalingState !== 'have-local-offer') {
        console.log('⚠️ Peer connection not expecting answer, current state:', peerConnectionRef.current.signalingState);
        return;
      }
      
      console.log('📝 Setting remote description with answer...');
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('✅ Answer processed successfully');
      
      // Process any queued ICE candidates
      if (window.pendingIceCandidates && window.pendingIceCandidates.length > 0) {
        console.log('🧊 Processing queued ICE candidates:', window.pendingIceCandidates.length);
        for (const candidate of window.pendingIceCandidates) {
          try {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (error) {
            console.error('❌ Error adding queued ICE candidate:', error);
          }
        }
        window.pendingIceCandidates = [];
      }
    } catch (error) {
      console.error('❌ Error handling answer:', error);
      toast.error('Failed to handle call answer');
    }
  };

  const handleReceiveIceCandidate = async ({ candidate, from }) => {
    try {
      if (!peerConnectionRef.current) {
        console.error('❌ No peer connection available for ICE candidate');
        return;
      }

      if (peerConnectionRef.current.remoteDescription) {
        console.log('🧊 Adding ICE candidate:', candidate.type);
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('✅ ICE candidate added successfully');
      } else {
        console.log('⚠️ Queuing ICE candidate - no remote description set yet');
        // Store candidate for later if needed
        if (!window.pendingIceCandidates) {
          window.pendingIceCandidates = [];
        }
        window.pendingIceCandidates.push(candidate);
      }
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
    }
  };

  // Media controls
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setVideoEnabled(videoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setAudioEnabled(audioTrack.enabled);
    }
  };

  const endCall = async () => {
    try {
      await api.post(`/consultations/${consultationId}/end`);
      socketRef.current.emit('call-ended', { consultationId, roomId });
      cleanup();
      toast.success('Call ended successfully');
      navigate('/consultations');
    } catch (error) {
      console.error('Error ending call:', error);
      toast.error('Failed to end call');
    }
  };

  const cleanup = () => {
    console.log('🧹 Cleaning up video call resources...');
    
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('🛑 Stopped track:', track.kind);
      });
    }

    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      console.log('🔒 Closed peer connection');
    }

    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
      console.log('🔌 Disconnected socket');
    }
  };

  // Debug function to check connection status
  const debugConnection = () => {
    console.log('🔍 Connection Debug Info:');
    console.log('Socket connected:', socketRef.current?.connected);
    console.log('Room ID:', roomId);
    console.log('Current user ID:', currentUserId);
    console.log('Local stream:', !!localStreamRef.current);
    console.log('Peer connection state:', peerConnectionRef.current?.connectionState);
    console.log('Signaling state:', peerConnectionRef.current?.signalingState);
    console.log('ICE connection state:', peerConnectionRef.current?.iceConnectionState);
    console.log('Remote connected:', remoteConnected);
  };

  // Add debug functions (temporary)
  window.debugVideoCall = debugConnection;
  
  // Test WebRTC connectivity
  const testWebRTCConnectivity = async () => {
    try {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      const dc = pc.createDataChannel('test');
      
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 Test ICE candidate:', event.candidate.type, event.candidate.candidate);
        }
      };
      
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      console.log('✅ WebRTC test successful - can create offers and gather ICE candidates');
      
      setTimeout(() => {
        pc.close();
      }, 5000);
      
    } catch (error) {
      console.error('❌ WebRTC test failed:', error);
    }
  };
  
  window.testWebRTC = testWebRTCConnectivity;

  const handleCallEnded = () => {
    toast.info('Call has ended');
    cleanup();
    navigate('/consultations');
  };

  // Notes functions
  const loadNotes = async () => {
    try {
      const response = await api.get(`/consultations/${consultationId}/notes`);
      setNotes(response.data);
    } catch (error) {
      console.error('Error loading notes:', error);
    }
  };

  const addNote = () => {
    if (!noteText.trim()) return;
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error('Not connected to server');
      return;
    }

    socketRef.current.emit('add-note', {
      consultationId,
      text: noteText
    });

    setNoteText('');
  };

  const handleNoteAdded = (note) => {
    setNotes(prev => [...prev, note]);
  };

  // Chat functions
  const loadMessages = async () => {
    try {
      const response = await api.get(`/consultations/${consultationId}/chat`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const sendMessage = () => {
    if (!messageText.trim()) return;
    if (!socketRef.current || !socketRef.current.connected) {
      toast.error('Not connected to server');
      return;
    }

    socketRef.current.emit('chat-message', {
      consultationId,
      text: messageText
    });

    setMessageText('');
  };

  const handleChatMessage = (message) => {
    setMessages(prev => [...prev, message]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl font-medium">Loading consultation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Video Grid */}
      <div className="flex-1 relative">
        {/* Remote Video (Large) */}
        <div className="absolute inset-0 bg-gray-800">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            muted={false}
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log('✅ Remote video metadata loaded')}
            onCanPlay={() => console.log('✅ Remote video can play')}
            onError={(e) => console.error('❌ Remote video error:', e)}
          />
          {!remoteConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p className="text-lg font-medium">Waiting for other participant...</p>
                <p className="text-sm text-gray-300 mt-2">
                  {connected ? 'Connected to server' : 'Connecting to server...'}
                </p>
                {peerConnectionRef.current && (
                  <div className="text-xs text-gray-400 mt-1">
                    <p>Connection: {peerConnectionRef.current.connectionState} | 
                    ICE: {peerConnectionRef.current.iceConnectionState}</p>
                    {connected && !offerInProgress && (
                      <button 
                        onClick={() => {
                          console.log('🔄 Manual connection attempt');
                          setOfferInProgress(true);
                          createOffer();
                        }}
                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                      >
                        Connect Manually
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Local Video (Small, Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg border-2 border-gray-600">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log('✅ Local video metadata loaded')}
            onCanPlay={() => console.log('✅ Local video can play')}
            onError={(e) => console.error('❌ Local video error:', e)}
          />
          {!videoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-700">
              <FiVideoOff size={32} className="text-gray-300" />
            </div>
          )}
          <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
            You {!connected && '(Connecting...)'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4">
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all duration-200 ${
              videoEnabled 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {videoEnabled ? <FiVideo size={24} /> : <FiVideoOff size={24} />}
          </button>

          <button
            onClick={toggleAudio}
            className={`p-4 rounded-full transition-all duration-200 ${
              audioEnabled 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
            title={audioEnabled ? 'Mute' : 'Unmute'}
          >
            {audioEnabled ? <FiMic size={24} /> : <FiMicOff size={24} />}
          </button>

          <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-4 rounded-full transition-all duration-200 ${
              showNotes 
                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                : 'bg-gray-600 hover:bg-gray-500 text-white'
            }`}
            title="Notes"
          >
            <FiFileText size={24} />
          </button>

          {chatAllowed && (
            <button
              onClick={() => setShowChat(!showChat)}
              className={`p-4 rounded-full transition-all duration-200 ${
                showChat 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                  : 'bg-gray-600 hover:bg-gray-500 text-white'
              }`}
              title="Chat"
            >
              <FiMessageSquare size={24} />
            </button>
          )}

          <button
            onClick={endCall}
            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-200"
            title="End call"
          >
            <FiPhone size={24} />
          </button>
        </div>
      </div>

      {/* Notes Panel */}
      {showNotes && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiFileText /> Notes
            </h3>
            <button 
              onClick={() => setShowNotes(false)} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {notes.map((note, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {note.authorId?.name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(note.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700">{note.text}</div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                placeholder="Add a note..."
                rows="3"
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                onClick={addNote} 
                className="mt-2 w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <FiSend size={16} /> Add Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {showChat && chatAllowed && (
        <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FiMessageSquare /> Chat
            </h3>
            <button 
              onClick={() => setShowChat(false)} 
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <FiX size={20} />
            </button>
          </div>
          <div className="flex-1 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${
                    msg.from._id === currentUserId ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-xs rounded-lg p-3 ${
                      msg.from._id === currentUserId
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium opacity-75">
                        {msg.from.name}
                      </span>
                      <span className="text-xs opacity-75">
                        {new Date(msg.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm">{msg.text}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-gray-200">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button 
                  onClick={sendMessage} 
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <FiSend size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
