import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiMessageCircle, FiUser, FiClock } from 'react-icons/fi';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConversations();
    
    // Listen for refresh events (when messages are marked as read)
    const handleRefresh = () => {
      fetchConversations();
    };
    
    window.addEventListener('refreshNotifications', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, []);

  const fetchConversations = async () => {
    try {
      // Get all conversations (both read and unread)
      const response = await api.get('/chat/conversations/all');
      setConversations(response.data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      toast.error('Failed to fetch conversations');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-secondary-600">Loading...</span>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Messages</h1>
          <p className="text-secondary-600">Your conversations with doctors and patients</p>
        </div>

        {conversations.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-secondary-500 text-lg mb-4">No messages yet</p>
            <p className="text-secondary-400 text-sm">
              Complete a video consultation to start messaging with doctors
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {conversations.map((conversation) => (
              <Link
                key={conversation.consultationId}
                to={`/chat/${conversation.consultationId}`}
                className="block"
              >
                <div className={`card card-hover ${conversation.count > 0 ? 'border-l-4 border-l-red-500 bg-red-50' : ''}`}>
                  <div className="card-body">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="relative">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                            <FiUser className="w-6 h-6 text-primary-600" />
                          </div>
                          {conversation.count > 0 && (
                            <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                              {conversation.count > 99 ? '99+' : conversation.count}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-secondary-900 truncate">
                              {conversation.doctorName || conversation.patientName}
                            </h3>
                            <span className="text-xs text-secondary-500 flex items-center gap-1">
                              <FiClock className="w-3 h-3" />
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-secondary-600 truncate">
                            {conversation.lastMessage}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {conversation.count > 0 ? (
                          <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                            {conversation.count} new
                          </span>
                        ) : (
                          <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded-full">
                            Read
                          </span>
                        )}
                        <FiMessageCircle className="w-5 h-5 text-secondary-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Info Card */}
        <div className="card bg-blue-50 border-blue-200">
          <div className="card-body">
            <div className="flex items-start gap-3">
              <FiMessageCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">About Messaging</h3>
                <p className="text-blue-800 text-sm">
                  You can message doctors after completing a video consultation. 
                  Messages are secure and HIPAA-compliant for your privacy.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Messages;