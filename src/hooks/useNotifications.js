import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState({
    consultationRequests: 0,
    consultations: 0,
    chats: 0,
    complaints: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const promises = [];

      // Get consultation requests notifications
      const lastSeenRequests = localStorage.getItem(`lastSeen_requests_${user._id}`) || new Date(0).toISOString();
      promises.push(
        api.get(`/consultation-requests/notifications/count?lastSeen=${lastSeenRequests}`).then(res => {
          return { consultationRequests: res.data.count };
        }).catch(() => ({ consultationRequests: 0 }))
      );

      // Get chat notifications (unread messages)
      promises.push(
        api.get('/chat/notifications/unread-count').then(res => {
          return { chats: res.data.count };
        }).catch(() => ({ chats: 0 }))
      );

      if (user.role === 'patient') {
        // For patients: count upcoming consultations
        promises.push(
          api.get('/consultations/my-consultations').then(res => {
            const upcomingConsultations = res.data.filter(consultation => 
              consultation.status === 'scheduled' && 
              new Date(consultation.scheduledAt) > new Date()
            ).length;
            return { consultations: upcomingConsultations };
          }).catch(() => ({ consultations: 0 }))
        );
      } else if (user.role === 'doctor') {
        // For doctors: count today's consultations
        promises.push(
          api.get('/consultations/my-consultations').then(res => {
            const today = new Date().toDateString();
            const todayConsultations = res.data.filter(consultation => 
              consultation.status === 'scheduled' && 
              new Date(consultation.scheduledAt).toDateString() === today
            ).length;
            return { consultations: todayConsultations };
          }).catch(() => ({ consultations: 0 }))
        );
      }

      const results = await Promise.all(promises);
      const newNotifications = results.reduce((acc, result) => ({ ...acc, ...result }), {
        consultationRequests: 0,
        consultations: 0,
        chats: 0,
        complaints: 0
      });

      setNotifications(newNotifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markRequestsAsSeen = () => {
    if (user) {
      localStorage.setItem(`lastSeen_requests_${user._id}`, new Date().toISOString());
      setNotifications(prev => ({ ...prev, consultationRequests: 0 }));
    }
  };

  const markConsultationsAsSeen = () => {
    if (user) {
      localStorage.setItem(`lastSeen_consultations_${user._id}`, new Date().toISOString());
      setNotifications(prev => ({ ...prev, consultations: 0 }));
    }
  };

  const markChatsAsSeen = async () => {
    if (user) {
      localStorage.setItem(`lastSeen_chats_${user._id}`, new Date().toISOString());
      // Immediately refresh chat notifications to get accurate count
      try {
        const response = await api.get('/chat/notifications/unread-count');
        setNotifications(prev => ({ ...prev, chats: response.data.count }));
      } catch (error) {
        console.error('Error refreshing chat notifications:', error);
        setNotifications(prev => ({ ...prev, chats: 0 }));
      }
    }
  };

  useEffect(() => {
    fetchNotifications();
    
    // Refresh notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    // Listen for manual refresh events
    const handleRefresh = () => {
      fetchNotifications();
    };
    
    window.addEventListener('refreshNotifications', handleRefresh);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, [user]);

  return {
    notifications,
    loading,
    refetch: fetchNotifications,
    markRequestsAsSeen,
    markConsultationsAsSeen,
    markChatsAsSeen
  };
};