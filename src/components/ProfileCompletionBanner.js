import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiUser, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import api from '../utils/api';

const ProfileCompletionBanner = () => {
  const [completionData, setCompletionData] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompletionStatus();
  }, []);

  const fetchCompletionStatus = async () => {
    try {
      const response = await api.get('/users/profile/completion');
      setCompletionData(response.data);
      
      // Check if user has dismissed this banner for this session
      const dismissedKey = `profile-banner-dismissed-${response.data.percentage}`;
      setDismissed(localStorage.getItem(dismissedKey) === 'true');
    } catch (error) {
      console.error('Error fetching completion status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    // Store dismissal in localStorage for this session
    const dismissedKey = `profile-banner-dismissed-${completionData.percentage}`;
    localStorage.setItem(dismissedKey, 'true');
  };

  if (loading || !completionData || completionData.isComplete || dismissed) {
    return null;
  }

  const { percentage, missingRequired, missingRecommended } = completionData;
  const isUrgent = missingRequired.length > 0;

  return (
    <div className={`rounded-xl border-l-4 p-4 mb-6 ${
      isUrgent 
        ? 'bg-warning-50 border-warning-400' 
        : 'bg-blue-50 border-blue-400'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-lg ${
            isUrgent ? 'bg-warning-100' : 'bg-blue-100'
          }`}>
            {isUrgent ? (
              <FiAlertCircle className={`w-5 h-5 ${
                isUrgent ? 'text-warning-600' : 'text-blue-600'
              }`} />
            ) : (
              <FiUser className="w-5 h-5 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className={`font-semibold ${
                isUrgent ? 'text-warning-900' : 'text-blue-900'
              }`}>
                {isUrgent ? 'Complete Your Profile' : 'Enhance Your Profile'}
              </h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                isUrgent 
                  ? 'bg-warning-200 text-warning-800' 
                  : 'bg-blue-200 text-blue-800'
              }`}>
                {percentage}% Complete
              </span>
            </div>
            
            <p className={`text-sm mb-3 ${
              isUrgent ? 'text-warning-700' : 'text-blue-700'
            }`}>
              {isUrgent 
                ? 'Please complete the required fields to book consultations and get better medical care.'
                : 'Add more details to help doctors provide better personalized care.'
              }
            </p>

            {/* Progress Bar */}
            <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isUrgent ? 'bg-warning-500' : 'bg-blue-500'
                }`}
                style={{ width: `${percentage}%` }}
              ></div>
            </div>

            {/* Missing Fields */}
            {missingRequired.length > 0 && (
              <div className="mb-3">
                <p className="text-xs font-medium text-warning-800 mb-1">Required Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {missingRequired.map((field, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-warning-200 text-warning-800 rounded"
                    >
                      {field.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {missingRecommended.length > 0 && !isUrgent && (
              <div className="mb-3">
                <p className="text-xs font-medium text-blue-800 mb-1">Recommended Fields:</p>
                <div className="flex flex-wrap gap-1">
                  {missingRecommended.map((field, index) => (
                    <span 
                      key={index}
                      className="px-2 py-1 text-xs bg-blue-200 text-blue-800 rounded"
                    >
                      {field.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Link 
              to="/profile" 
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                isUrgent
                  ? 'bg-warning-600 text-white hover:bg-warning-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              <FiUser className="w-4 h-4 mr-2" />
              Complete Profile
            </Link>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className={`p-1 rounded-lg transition-colors ${
            isUrgent 
              ? 'text-warning-400 hover:text-warning-600 hover:bg-warning-100' 
              : 'text-blue-400 hover:text-blue-600 hover:bg-blue-100'
          }`}
        >
          <FiX className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default ProfileCompletionBanner;