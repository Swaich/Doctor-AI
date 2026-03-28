import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, RefreshCw, Clock, Trash2, Bot } from 'lucide-react';
import api from '../utils/api';

const MedBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentView, setCurrentView] = useState('chat'); // 'chat' or 'history'
  const [sessionId, setSessionId] = useState(null);
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      content: "👋 Hi! I'm MedBot, your AI health assistant. I can help you with:\n\n• General health questions\n• Medication information\n• Platform guidance\n• Booking appointments\n\nHow can I assist you today?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchSuggestions();
      scrollToBottom();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await api.get('/medbot/suggestions');
      setSuggestions(response.data.suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const response = await api.get('/medbot/history');
      setChatHistory(response.data.sessions);
    } catch (error) {
      console.error('Error fetching chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const loadChatSession = async (sessionId) => {
    try {
      const response = await api.get(`/medbot/history/${sessionId}`);
      setMessages(response.data.messages);
      setSessionId(sessionId);
      setCurrentView('chat');
      scrollToBottom();
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  const deleteChatSession = async (sessionId) => {
    try {
      await api.delete(`/medbot/history/${sessionId}`);
      setChatHistory(prev => prev.filter(session => session.sessionId !== sessionId));
      
      // If current session is deleted, start new chat
      if (sessionId === sessionId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Error deleting chat session:', error);
    }
  };

  const handleSendMessage = async (messageText = null) => {
    const message = messageText || inputMessage.trim();
    
    if (!message) return;

    // Validate message length
    if (message.length > 1000) {
      const errorMessage = {
        role: 'bot',
        content: "⚠️ Your message is too long. Please keep it under 1000 characters for better responses.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Add user message
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare conversation history (last 6 messages for better context)
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role === 'bot' ? 'assistant' : 'user',
        content: msg.content
      }));

      const response = await api.post('/medbot/chat', {
        message,
        conversationHistory,
        sessionId
      });

      // Update session ID if new session was created
      if (response.data.sessionId && !sessionId) {
        setSessionId(response.data.sessionId);
      }

      // Add bot response
      const botMessage = {
        role: 'bot',
        content: response.data.reply,
        timestamp: new Date(response.data.timestamp)
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorContent = "I'm sorry, I encountered an error. Please try again.";
      
      // Handle specific error types
      if (error.response?.status === 429) {
        errorContent = "⏳ I'm currently busy helping other users. Please wait a moment and try again.";
      } else if (error.response?.status === 400) {
        errorContent = error.response.data.message || "⚠️ There was an issue with your message. Please try rephrasing it.";
      } else if (error.response?.data?.message) {
        errorContent = error.response.data.message;
      } else if (!navigator.onLine) {
        errorContent = "🔌 You appear to be offline. Please check your internet connection and try again.";
      }

      const errorMessage = {
        role: 'bot',
        content: errorContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    handleSendMessage(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = () => {
    setMessages([
      {
        role: 'bot',
        content: "Chat cleared! How can I help you?",
        timestamp: new Date()
      }
    ]);
    setSessionId(null);
    setCurrentView('chat');
  };

  const handleViewHistory = () => {
    setCurrentView('history');
    fetchChatHistory();
  };

  // Function to format markdown text
  const formatMessage = (text) => {
    if (!text) return '';
    
    // Convert markdown formatting to HTML
    let formatted = text
      // Bold text: **text** -> <strong>text</strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic text: *text* -> <em>text</em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Code: `text` -> <code>text</code>
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // Bullet points: • text -> <li>text</li>
      .replace(/^•\s(.+)$/gm, '<li>$1</li>')
      // Numbered lists: 1. text -> <li>text</li>
      .replace(/^\d+\.\s(.+)$/gm, '<li>$1</li>')
      // Wrap consecutive <li> elements in <ul>
      .replace(/(<li>.*<\/li>)/gs, (match) => {
        return '<ul>' + match + '</ul>';
      })
      // Line breaks
      .replace(/\n/g, '<br/>');
    
    return formatted;
  };

  // Component to render formatted message
  const FormattedMessage = ({ content }) => {
    const formattedContent = formatMessage(content);
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: formattedContent }}
      />
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className={`fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-large hover:shadow-xl transition-all duration-300 hover:-translate-y-1 z-40 ${isOpen ? 'hidden' : 'flex'} items-center justify-center group touch-target`}
        onClick={() => setIsOpen(true)}
        title="Chat with MedBot AI Assistant"
      >
        <Bot className="w-6 h-6 group-hover:scale-110 transition-transform" />
        <span className="absolute -top-1 -right-1 bg-indigo-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full animate-pulse">
          AI
        </span>
      </button>

      {/* Chat Window - Complete Full Screen */}
      {isOpen && (
        <div className="fixed inset-0 bg-white flex flex-col z-50 animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-secondary-200 bg-gradient-to-r from-blue-50 to-indigo-50 min-h-[70px]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-secondary-900 text-lg">MedBot</h3>
                  <span className="px-2 py-0.5 bg-indigo-500 text-white text-xs font-bold rounded-full">AI</span>
                </div>
                <p className="text-sm text-secondary-600">AI Health Assistant</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {currentView === 'chat' ? (
                <>
                  <button
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                    onClick={handleViewHistory}
                    title="View chat history"
                  >
                    <Clock className="w-5 h-5 text-secondary-600" />
                  </button>
                  <button
                    className="p-2 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                    onClick={handleNewChat}
                    title="New chat"
                  >
                    <RefreshCw className="w-5 h-5 text-secondary-600" />
                  </button>
                </>
              ) : (
                <button
                  className="p-2 hover:bg-blue-100 rounded-lg transition-colors touch-target"
                  onClick={() => setCurrentView('chat')}
                  title="Back to chat"
                >
                  <MessageCircle className="w-5 h-5 text-secondary-600" />
                </button>
              )}
              <button
                className="p-2 hover:bg-red-100 rounded-lg transition-colors touch-target ml-1 bg-red-50"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                <X className="w-5 h-5 text-red-600" />
              </button>
            </div>
          </div>

          {/* Messages or History */}
          {currentView === 'chat' ? (
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100 p-6 space-y-6 medbot-messages">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-secondary-900 border border-blue-100'} rounded-2xl px-4 py-3`}>
                    <div className="text-sm leading-relaxed">
                      <FormattedMessage content={msg.content} />
                    </div>
                    <div className={`text-xs mt-2 ${msg.role === 'user' ? 'text-blue-100' : 'text-secondary-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-5">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100 p-6">
              <div className="mb-8">
                <h4 className="font-semibold text-secondary-900 mb-2 text-2xl">Chat History</h4>
                <p className="text-lg text-secondary-600">Your previous conversations with MedBot</p>
              </div>
              
              {isLoadingHistory ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="flex space-x-2 mb-6">
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce"></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-3 h-3 bg-blue-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <p className="text-secondary-600 text-lg">Loading chat history...</p>
                </div>
              ) : chatHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <MessageCircle className="w-16 h-16 text-secondary-300 mb-6" />
                  <p className="text-secondary-600 mb-3 text-xl">No chat history yet</p>
                  <p className="text-secondary-500 text-lg">Start a conversation to see your history here</p>
                </div>
              ) : (
                <div className="space-y-4 max-w-4xl mx-auto">
                  {chatHistory.map((session) => (
                    <div key={session.sessionId} className="flex items-center gap-4 p-5 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors border border-blue-100">
                      <div 
                        className="flex-1 cursor-pointer touch-target"
                        onClick={() => loadChatSession(session.sessionId)}
                      >
                        <div className="text-base text-secondary-900 mb-2 font-medium">
                          {session.messages.length > 0 && session.messages[1] ? 
                            session.messages[1].content.substring(0, 80) + '...' : 
                            'New conversation'
                          }
                        </div>
                        <div className="flex items-center gap-4 text-sm text-secondary-500">
                          <span>{new Date(session.lastActivity).toLocaleDateString()}</span>
                          <span>{Math.floor(session.messages.length / 2)} messages</span>
                        </div>
                      </div>
                      <button
                        className="p-3 hover:bg-danger-100 rounded-lg transition-colors touch-target"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteChatSession(session.sessionId);
                        }}
                        title="Delete conversation"
                      >
                        <Trash2 className="w-5 h-5 text-danger-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Suggestions - only show in chat view */}
          {currentView === 'chat' && messages.length <= 2 && suggestions.length > 0 && (
            <div className="px-4 pb-3">
              <p className="text-sm text-secondary-600 mb-3 font-medium">Quick questions:</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {suggestions.slice(0, 4).map((suggestion, index) => (
                  <button
                    key={index}
                    className="text-sm p-3 bg-blue-50 hover:bg-blue-100 text-secondary-700 hover:text-blue-700 rounded-lg transition-colors text-left border border-blue-100 touch-target min-h-[48px]"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input - only show in chat view */}
          {currentView === 'chat' && (
            <div className="p-4 border-t border-secondary-200 bg-white">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    rows="1"
                    className="w-full p-3 pr-16 border border-blue-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:ring-opacity-20 text-sm bg-blue-50/30 resize-none min-h-[48px] max-h-[120px]"
                    placeholder="Ask me anything about health..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isLoading}
                    maxLength={1000}
                    style={{ height: 'auto' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                    }}
                  />
                  {inputMessage.length > 0 && (
                    <span className={`absolute right-3 bottom-2 text-xs ${inputMessage.length > 900 ? 'text-warning-500' : 'text-secondary-400'}`}>
                      {inputMessage.length}/1000
                    </span>
                  )}
                </div>
                <button
                  className="flex-shrink-0 p-3 bg-blue-500 hover:bg-blue-600 disabled:bg-secondary-300 text-white rounded-xl transition-colors touch-target min-w-[48px] min-h-[48px]"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isLoading}
                  title="Send message"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          {currentView === 'chat' && (
            <div className="px-4 pb-3">
              <div className="text-xs text-secondary-600 bg-blue-50 border border-blue-200 rounded-lg p-3">
                ⚠️ MedBot is an AI assistant. For medical emergencies, call emergency services.
                Always consult a doctor for personalized advice.
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default MedBot;
