import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { buildSocketUrl } from '../../config/api';
import { 
  FiVideo, FiExternalLink, FiCopy, FiEdit3, FiSave, FiX,
  FiMessageSquare, FiPhone, FiSend 
} from 'react-icons/fi';

const ExternalMeeting = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [meetingLink, setMeetingLink] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [tempLink, setTempLink] = useState('');
  
  // Chat states
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [socketRef, setSocketRef] = useState(null);
  const [chatConnected, setChatConnected] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const messagesEndRef = React.useRef(null);

  useEffect(() => {
    loadConsultation();
    initializeSocket();
    
    return () => {
      if (socketRef) {
        socketRef.disconnect();
      }
    };
  }, [consultationId]);

  const loadConsultation = async () => {
    try {
      const response = await api.get(`/consultations/${consultationId}`);
      setConsultation(response.data);
      setMeetingLink(response.data.meetingLink || '');
      setLoading(false);
      
      // Load existing chat messages
      if (response.data.allowedChat) {
        loadMessages();
      }
    } catch (error) {
      console.error('Error loading consultation:', error);
      toast.error('Failed to load consultation');
      setLoading(false);
    }
  };

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    const socket = io(buildSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('✅ Socket connected for chat, ID:', socket.id);
      setChatConnected(true);
      socket.emit('join-room', { 
        consultationId, 
        roomId: consultationId // Use consultationId as room for chat
      });
    });

    socket.on('joined-room', (data) => {
      console.log('✅ Joined chat room:', data);
    });

    socket.on('chat-message', (message) => {
      console.log('📨 Received chat message:', message);
      
      // Safety check for message structure
      if (!message || !message.from || !message.text) {
        console.warn('Invalid message received:', message);
        return;
      }
      
      console.log('Message from:', message.from._id, 'Current user:', user?._id);
      
      // Add all messages (including our own) to avoid duplicates
      setMessages(prev => {
        // Check if message already exists to prevent duplicates
        const exists = prev.some(msg => 
          msg._id === message._id || 
          (msg.text === message.text && 
           msg.from?._id === message.from?._id && 
           msg.createdAt && message.createdAt &&
           Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
        );
        
        if (exists) {
          console.log('Message already exists, skipping');
          return prev;
        }
        
        return [...prev, message];
      });
      
      // Reset sending state when message is received
      setSendingMessage(false);
      
      // Scroll to bottom for new messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      toast.error('Failed to connect to chat server');
    });

    socket.on('error', (error) => {
      console.error('❌ Socket error:', error);
      toast.error(error.message || 'Chat connection error');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
      setChatConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    setSocketRef(socket);
  };

  const loadMessages = async () => {
    try {
      const response = await api.get(`/consultations/${consultationId}/chat`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const saveMeetingLink = async () => {
    try {
      await api.put(`/consultations/${consultationId}/meeting-link`, {
        meetingLink: tempLink
      });
      setMeetingLink(tempLink);
      setIsEditing(false);
      toast.success('Meeting link saved successfully');
    } catch (error) {
      console.error('Error saving meeting link:', error);
      toast.error('Failed to save meeting link');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Link copied to clipboard');
  };

  const joinMeeting = () => {
    if (meetingLink) {
      window.open(meetingLink, '_blank');
    }
  };

  const sendMessage = () => {
    if (!messageText.trim() || sendingMessage) return;

    console.log('📤 Attempting to send message:', messageText);
    console.log('Socket connected:', socketRef?.connected);
    console.log('Consultation ID:', consultationId);

    if (!socketRef || !socketRef.connected) {
      console.error('❌ Socket not connected');
      toast.error('Connection lost. Please refresh the page.');
      return;
    }

    const messageToSend = messageText;
    setMessageText(''); // Clear input immediately
    setSendingMessage(true);

    // Send to server - don't add to local state, let it come back from server
    socketRef.emit('chat-message', {
      consultationId,
      text: messageToSend
    });

    // Reset sending state after a timeout
    setTimeout(() => {
      setSendingMessage(false);
    }, 2000);
  };

  // Debug function to test chat
  const testChat = () => {
    console.log('🧪 Testing chat connection...');
    console.log('Socket state:', {
      connected: socketRef?.connected,
      id: socketRef?.id,
      consultationId,
      userId: user._id,
      allowedChat: consultation?.allowedChat
    });
    
    if (socketRef?.connected) {
      socketRef.emit('test-connection', { 
        timestamp: Date.now(),
        consultationId 
      });
    }
  };

  // Make test function available globally for debugging
  if (typeof window !== 'undefined') {
    window.testChat = testChat;
  }

  const endConsultation = async () => {
    try {
      await api.post(`/consultations/${consultationId}/end`);
      toast.success('Consultation ended successfully');
      navigate('/consultations');
    } catch (error) {
      console.error('Error ending consultation:', error);
      toast.error('Failed to end consultation');
    }
  };

  const generateMeetingLinks = () => {
    const meetingOptions = [
      {
        name: 'Google Meet',
        url: 'https://meet.google.com/new',
        description: 'Create a new Google Meet room'
      },
      {
        name: 'Zoom',
        url: 'https://zoom.us/start/videomeeting',
        description: 'Start an instant Zoom meeting'
      },
      {
        name: 'Microsoft Teams',
        url: 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_generated',
        description: 'Create a Teams meeting'
      }
    ];

    return meetingOptions;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-gray-700">Loading consultation...</p>
        </div>
      </div>
    );
  }

  const isDoctor = user.role === 'doctor';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Video Consultation
              </h1>
              <p className="text-gray-600">
                {consultation?.patientId?.name} with Dr. {consultation?.doctorId?.name}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowChat(!showChat)}
                className={`p-3 rounded-lg transition-colors ${
                  showChat ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <FiMessageSquare size={20} />
              </button>
              <button
                onClick={endConsultation}
                className="p-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                <FiPhone size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Meeting Link Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiVideo className="text-blue-500" />
            Video Meeting
          </h2>

          {isDoctor ? (
            <div>
              {!isEditing ? (
                <div>
                  {meetingLink ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <FiVideo className="text-green-600" size={24} />
                        <div className="flex-1">
                          <p className="font-medium text-green-800">Meeting Link Set</p>
                          <p className="text-sm text-green-600 break-all">{meetingLink}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => copyToClipboard(meetingLink)}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Copy link"
                          >
                            <FiCopy size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setTempLink(meetingLink);
                              setIsEditing(true);
                            }}
                            className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            title="Edit link"
                          >
                            <FiEdit3 size={16} />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={joinMeeting}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                        <FiExternalLink size={20} />
                        Join Meeting
                      </button>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <FiVideo className="mx-auto text-gray-400 mb-4" size={48} />
                      <p className="text-gray-600 mb-4">No meeting link set yet</p>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Set Meeting Link
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Meeting Link
                    </label>
                    <input
                      type="url"
                      value={tempLink}
                      onChange={(e) => setTempLink(e.target.value)}
                      placeholder="https://meet.google.com/xxx-xxxx-xxx"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  {/* Quick Meeting Options */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-3">Quick Options:</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {generateMeetingLinks().map((option, index) => (
                        <button
                          key={index}
                          onClick={() => window.open(option.url, '_blank')}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left transition-colors"
                        >
                          <p className="font-medium text-gray-900">{option.name}</p>
                          <p className="text-xs text-gray-600">{option.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={saveMeetingLink}
                      disabled={!tempLink.trim()}
                      className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white py-2 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                    >
                      <FiSave size={16} />
                      Save Link
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setTempLink('');
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <FiX size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Patient View
            <div>
              {meetingLink ? (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-800 mb-2">
                      Dr. {consultation?.doctorId?.name} has set up the meeting
                    </p>
                    <p className="text-sm text-blue-600">
                      Click the button below to join the video consultation
                    </p>
                  </div>
                  <button
                    onClick={joinMeeting}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-lg font-medium flex items-center justify-center gap-3 transition-colors text-lg"
                  >
                    <FiExternalLink size={24} />
                    Join Video Consultation
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FiVideo className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-600 mb-2">Waiting for doctor to set up the meeting</p>
                  <p className="text-sm text-gray-500">
                    Dr. {consultation?.doctorId?.name} will provide the meeting link shortly
                  </p>
                </div>
              )}
            </div>
          )}
        </div>



        {/* Chat Panel */}
        {showChat && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Chat</h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${chatConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <span className="text-xs text-gray-500">
                  {chatConnected ? 'Connected' : 'Disconnected'}
                </span>
                {!chatConnected && (
                  <button
                    onClick={() => {
                      if (socketRef) {
                        socketRef.connect();
                      } else {
                        initializeSocket();
                      }
                    }}
                    className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>
            <div className="mb-4 max-h-80 overflow-y-auto scrollbar-hide" style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}>
              <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              
              {!consultation?.allowedChat ? (
                <div className="text-center text-gray-500 py-8">
                  <p className="mb-3">Chat will be available after the first video consultation.</p>
                  <button
                    onClick={async () => {
                      try {
                        await api.post(`/consultations/${consultationId}/enable-chat`);
                        setConsultation(prev => ({ ...prev, allowedChat: true }));
                        toast.success('Chat enabled');
                      } catch (error) {
                        console.error('Error enabling chat:', error);
                        toast.error('Failed to enable chat');
                      }
                    }}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    Enable Chat
                  </button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <div className="text-4xl mb-3">💬</div>
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4 p-2">
                  {messages.map((msg, index) => {
                    // Safety checks for undefined values
                    if (!msg || !msg.from || !user) {
                      console.warn('Invalid message or user data:', { msg, user });
                      return null;
                    }

                    const msgFromId = msg.from._id?.toString() || '';
                    const currentUserId = user._id?.toString() || '';
                    const isMyMessage = msgFromId === currentUserId;
                    
                    // Enhanced debugging
                    console.log('🔍 Message alignment debug:', { 
                      text: msg.text?.substring(0, 20) + '...', 
                      fromId: msgFromId, 
                      userId: currentUserId, 
                      isMyMessage,
                      fromName: msg.from?.name,
                      userName: user?.name
                    });
                    
                    return (
                      <div
                        key={msg._id || `msg-${index}`}
                        className={`flex mb-4 ${
                          isMyMessage ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div className={`max-w-sm ${isMyMessage ? 'ml-auto' : 'mr-auto'}`}>
                          <div
                            className={`rounded-2xl px-4 py-2 shadow-sm ${
                              isMyMessage
                                ? 'bg-blue-500 text-white rounded-br-md'
                                : 'bg-gray-100 text-gray-900 rounded-bl-md'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.text || ''}</p>
                          </div>
                          <div className={`flex items-center mt-1 text-xs text-gray-500 ${
                            isMyMessage ? 'justify-end' : 'justify-start'
                          }`}>
                            <span className="font-medium">{msg.from?.name || 'Unknown'}</span>
                            <span className="mx-1">•</span>
                            <span>{msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            }) : 'Now'}</span>
                            {/* Debug indicator */}
                            {/* <span className="ml-1 text-xs">
                              {isMyMessage ? '(Me)' : '(Other)'}
                            </span> */}
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <div className="flex gap-3 items-center">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message..."
                className="flex-1 p-3 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={!chatConnected}
              />
              <button
                onClick={sendMessage}
                disabled={!messageText.trim() || !chatConnected || sendingMessage}
                className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-3 rounded-2xl transition-colors flex items-center justify-center min-w-[48px] h-12"
                title="Send message"
              >
                {sendingMessage ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <FiSend size={18} />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExternalMeeting;