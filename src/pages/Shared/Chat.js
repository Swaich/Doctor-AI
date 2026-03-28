import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { buildSocketUrl } from '../../config/api';
import { FiSend, FiArrowLeft } from 'react-icons/fi';


const Chat = () => {
  const { consultationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [consultation, setConsultation] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    console.log('Current user:', user);
    fetchConsultation();
    fetchMessages();
    markMessagesAsRead();
    
    // Connect to socket
    const token = localStorage.getItem('token');
    console.log('🔑 Connecting with token:', token ? 'Token exists' : 'No token');
    console.log('🌐 Socket URL:', buildSocketUrl());
    
    const socket = io(buildSocketUrl(), {
      auth: { token }
    });
    
    socketRef.current = socket;
    
    socket.on('connect', () => {
      console.log('✅ Socket connected for chat');
      setSocketConnected(true);
      // Join the consultation room for real-time messaging
      socket.emit('join-room', { 
        consultationId, 
        roomId: consultationId // Use consultationId as roomId for chat
      });
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Socket disconnected');
      setSocketConnected(false);
    });
    
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setSocketConnected(false);
      
      // Try to reconnect after 3 seconds
      setTimeout(() => {
        console.log('🔄 Attempting to reconnect...');
        socket.connect();
      }, 3000);
    });
    
    socket.on('joined-room', () => {
      console.log('✅ Joined chat room');
    });
    
    socket.on('chat-message', (message) => {
      console.log('📥 Received chat message:', message);
      setMessages(prev => {
        // Prevent duplicates
        const exists = prev.some(msg => 
          msg._id === message._id || 
          (msg.message === message.text && 
           msg.senderId === message.from._id && 
           Math.abs(new Date(msg.createdAt) - new Date(message.createdAt)) < 1000)
        );
        
        if (exists) {
          return prev;
        }
        
        // Convert socket message format to match API format
        const formattedMessage = {
          _id: message._id,
          message: message.text,
          senderId: message.from._id,
          receiverId: message.to._id,
          consultationId: message.consultation,
          createdAt: message.createdAt,
          from: message.from,
          to: message.to
        };
        
        return [...prev, formattedMessage];
      });
      scrollToBottom();
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.emit('leave-room', { roomId: consultationId });
      socket.disconnect();
    };
  }, [consultationId]);

  const fetchConsultation = async () => {
    try {
      const response = await api.get(`/consultations/${consultationId}`);
      setConsultation(response.data);
      
      // Determine other user
      const isPatient = user.role === 'patient';
      
      if (isPatient) {
        // Patient viewing doctor
        const doctorData = response.data.doctorId;
        setOtherUser({
          name: doctorData?.userId?.name || 'Doctor',
          specialization: doctorData?.specialization,
          profilePhoto: doctorData?.profilePhoto,
          profileImage: doctorData?.profileImage
        });
      } else {
        // Doctor viewing patient
        const patientData = response.data.patientId;
        setOtherUser({
          name: patientData?.name || 'Patient',
          profileImage: patientData?.profileImage
        });
      }
    } catch (error) {
      console.error('Error fetching consultation:', error);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      // Mark all messages in this consultation as read for current user
      await api.put(`/chat/consultation/${consultationId}/mark-read`);
      
      // Trigger notification refresh
      window.dispatchEvent(new CustomEvent('refreshNotifications'));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/chat/${consultationId}`);
      // Convert API response to match expected format
      const formattedMessages = response.data.map(msg => ({
        _id: msg._id,
        message: msg.text,
        senderId: msg.from._id,
        receiverId: msg.to._id,
        consultationId: msg.consultation,
        createdAt: msg.createdAt,
        from: msg.from,
        to: msg.to
      }));
      setMessages(formattedMessages);
      scrollToBottom();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    const messageText = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    try {
      if (socketRef.current && socketConnected) {
        // Try socket first for real-time delivery
        console.log('📤 Sending via socket');
        socketRef.current.emit('chat-message', {
          consultationId,
          text: messageText
        });
      } else {
        // Fallback to API if socket not connected
        console.log('📤 Sending via API (socket not connected)');
        
        const receiverId = user.role === 'patient' 
          ? consultation?.doctorId?._id || consultation?.doctorId
          : consultation?.patientId?._id || consultation?.patientId;

        const response = await api.post('/chat', {
          consultationId,
          receiverId,
          message: messageText
        });

        // Add message to UI immediately since socket won't broadcast it
        const newMsg = {
          _id: response.data._id,
          message: response.data.text,
          senderId: response.data.from._id,
          receiverId: response.data.to._id,
          consultationId: response.data.consultation,
          createdAt: response.data.createdAt,
          from: response.data.from,
          to: response.data.to
        };

        setMessages(prev => [...prev, newMsg]);
        scrollToBottom();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <Layout hideMedBot={true}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <span className="ml-3 text-secondary-600">Loading chat...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideMedBot={true}>
      <div className="flex flex-col h-full max-w-4xl mx-auto">
        {/* Fixed Header */}
        <div className="flex-shrink-0 bg-white border-b border-secondary-200 rounded-lg shadow-sm mb-4">
          <div className="p-4">
            <div className="flex items-center gap-4">
              <button 
                className="btn btn-ghost btn-sm btn-icon" 
                onClick={() => navigate(-1)}
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                {(otherUser?.profilePhoto && otherUser?.profilePhoto.data) || otherUser?.profileImage ? (
                  <img 
                    src={user.role === 'patient' && otherUser?.profilePhoto?.data ? 
                      `data:${otherUser.profilePhoto.contentType};base64,${otherUser.profilePhoto.data}` : 
                      `${process.env.REACT_APP_API_URL}/${otherUser.profileImage}`
                    } 
                    alt={otherUser.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-primary-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-600">
                    {otherUser?.name?.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary-900">
                    {user.role === 'patient' ? 'Dr. ' : ''}{otherUser?.name}
                  </h3>
                  <p className="text-sm text-secondary-600">
                    {user.role === 'patient' ? otherUser?.specialization?.name : 'Patient'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${socketConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <span className={`text-xs ${socketConnected ? 'text-green-600' : 'text-red-600'}`}>
                    {socketConnected ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Messages Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 scrollbar-hide">
            {messages.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-secondary-500">No messages yet. Start the conversation!</p>
                </div>
              </div>
            ) : (
              messages.map((msg, index) => {
                // Check if message is from current user - multiple ways to compare
                const currentUserId = user._id?.toString() || user._id;
                
                let isOwnMessage = false;
                
                // Method 1: Compare senderId
                if (msg.senderId) {
                  const msgSenderId = msg.senderId?.toString() || msg.senderId;
                  isOwnMessage = msgSenderId === currentUserId;
                }
                
                // Method 2: Compare from._id (for socket messages)
                if (!isOwnMessage && msg.from?._id) {
                  const msgFromId = msg.from._id?.toString() || msg.from._id;
                  isOwnMessage = msgFromId === currentUserId;
                }
                
                // Method 3: Compare from field directly (if it's just an ID)
                if (!isOwnMessage && msg.from && typeof msg.from === 'string') {
                  isOwnMessage = msg.from === currentUserId;
                }
                
                // BETTER APPROACH: Check if this message was sent by current user
                // We'll check multiple possible ID formats and also check message timestamp
                const userIdVariations = [
                  user._id,
                  user._id?.toString(),
                  user.id,
                  user.id?.toString()
                ].filter(Boolean);
                
                const messageIdVariations = [
                  msg.senderId,
                  msg.senderId?.toString(),
                  msg.from?._id,
                  msg.from?._id?.toString(),
                  msg.from,
                  msg.from?.toString()
                ].filter(Boolean);
                
                // Check if any user ID variation matches any message ID variation
                const hasIdMatch = userIdVariations.some(userId => 
                  messageIdVariations.some(msgId => userId === msgId)
                );
                
                // Also check if this is a very recent message (likely just sent by current user)
                const isRecentMessage = msg.createdAt && 
                  (new Date() - new Date(msg.createdAt)) < 5000; // Within 5 seconds
                
                // Final determination
                isOwnMessage = hasIdMatch || (isRecentMessage && !msg.from?.name);
                
                console.log('Message debug:', {
                  index,
                  messageText: msg.message,
                  currentUserId,
                  userRole: user.role,
                  userIdVariations,
                  messageIdVariations,
                  hasIdMatch,
                  isRecentMessage,
                  msgSenderId: msg.senderId,
                  msgFromId: msg.from?._id,
                  msgFrom: msg.from,
                  isOwnMessage,
                  msgCreatedAt: msg.createdAt
                });
                
                return (
                  <div 
                    key={index} 
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwnMessage 
                        ? 'bg-primary-500 text-white' 
                        : 'bg-secondary-100 text-secondary-900'
                    }`}>
                      <p className="text-sm">{msg.message}</p>
                      <span className={`text-xs mt-1 block ${
                        isOwnMessage ? 'text-primary-100' : 'text-secondary-500'
                      }`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area - Fixed at bottom */}
          <div className="flex-shrink-0 border-t border-secondary-200 p-4 bg-white">
            {!socketConnected && (
              <div className="mb-3 p-3 bg-red-100 border border-red-300 rounded-lg text-red-700 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Disconnected - trying to reconnect...</span>
                  </div>
                  <button 
                    onClick={() => {
                      console.log('🔄 Manual reconnect attempt');
                      socketRef.current?.connect();
                    }}
                    className="text-red-600 hover:text-red-800 underline text-xs"
                  >
                    Retry Now
                  </button>
                </div>
              </div>
            )}
            <form className="flex gap-3" onSubmit={handleSendMessage}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={socketConnected ? "Type a message..." : "Type a message (will use fallback)..."}
                className="form-input flex-1"
                disabled={sending}
              />
              <button 
                type="submit" 
                className="btn btn-primary btn-icon"
                disabled={!newMessage.trim() || sending}
              >
                <FiSend className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Chat;
