import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiCheckCircle } from 'react-icons/fi';
import api from '../utils/api';

const ProfileCompletionWidget = () => {
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletionStatus();
  }, []);

  const fetchCompletionStatus = async () => {
    try {
      const response = await api.get('/users/profile/completion');
      setCompletionData(response.data);
    } catch (error) {
      console.error('Error fetching completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !completionData) {
    return null;
  }

  const { percentage, isComplete } = completionData;

  if (isComplete) {
    return (
      <div className="flex items-center space-x-2 text-success-600">
        <FiCheckCircle className="w-4 h-4" />
        <span className="text-sm font-medium">Profile Complete</span>
      </div>
    );
  }

  return (
    <Link 
      to="/profile" 
      className="flex items-center space-x-2 text-warning-600 hover:text-warning-700 transition-colors"
    >
      <FiUser className="w-4 h-4" />
      <span className="text-sm font-medium">{percentage}% Complete</span>
    </Link>
  );
};

export default ProfileCompletionWidget;