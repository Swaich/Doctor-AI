import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { FiVideo, FiMessageCircle } from 'react-icons/fi';


const MyConsultations = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConsultations();
  }, []);

  const fetchConsultations = async () => {
    try {
      const response = await api.get('/consultations/my-consultations');
      setConsultations(response.data);
    } catch (error) {
      console.error('Error fetching consultations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: '#3b82f6',
      ongoing: '#f59e0b',
      completed: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#64748b';
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
      <div className="h-full flex flex-col">
        <div className="mb-4 sm:mb-6 flex-shrink-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">
            {user.role === 'patient' ? 'My Consultations' : 'My Patients'}
          </h1>
          <p className="text-sm sm:text-base text-secondary-600">
            {user.role === 'patient' 
              ? 'View and manage your medical consultations' 
              : 'View and manage your patient consultations'
            }
          </p>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
          {consultations.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-4xl sm:text-6xl mb-4">
                  {user.role === 'patient' ? '👨‍⚕️' : '👥'}
                </div>
                <p className="text-secondary-500 text-base sm:text-lg">
                  {user.role === 'patient' ? 'No consultations found' : 'No patient consultations found'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4 pr-2">
              {consultations.map((consultation) => (
                <div key={consultation._id} className="card card-hover">
                  <div className="card-body p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="flex-1 min-w-0">
                        {user.role === 'patient' ? (
                          <>
                            <h3 className="text-base sm:text-lg font-semibold text-secondary-900 mb-1 truncate">
                              Dr. {consultation.doctorId?.userId?.name}
                            </h3>
                            <p className="text-sm sm:text-base text-primary-600 font-medium mb-2 truncate">
                              {consultation.doctorId?.specialization?.name}
                            </p>
                          </>
                        ) : (
                          <>
                            <h3 className="text-base sm:text-lg font-semibold text-secondary-900 mb-1 truncate">
                              {consultation.patientId?.name}
                            </h3>
                            <p className="text-sm sm:text-base text-primary-600 font-medium mb-2">
                              Patient
                            </p>
                          </>
                        )}
                      </div>
                      <span className={`inline-flex px-2 sm:px-3 py-1 rounded-full text-xs font-medium capitalize whitespace-nowrap ${
                        consultation.status === 'scheduled' 
                          ? 'bg-primary-100 text-primary-700'
                          : consultation.status === 'ongoing'
                            ? 'bg-warning-100 text-warning-700'
                            : consultation.status === 'completed'
                              ? 'bg-success-100 text-success-700'
                              : consultation.status === 'cancelled'
                                ? 'bg-danger-100 text-danger-700'
                                : 'bg-secondary-100 text-secondary-700'
                      }`}>
                        {consultation.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-medium text-secondary-500">Type</span>
                        <p className="text-sm sm:text-base text-secondary-900 capitalize">{consultation.type}</p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-medium text-secondary-500">
                          {(() => {
                            if (consultation.status === 'completed') return 'Completed At';
                            if (consultation.status === 'ongoing') return 'Started At';
                            if (consultation.status === 'scheduled') return 'Scheduled For';
                            return 'Created At';
                          })()}
                        </span>
                        <p className="text-xs sm:text-sm text-secondary-900">
                          {(() => {
                            // Show different dates based on consultation status
                            if (consultation.status === 'completed' && consultation.completedAt) {
                              return new Date(consultation.completedAt).toLocaleString();
                            } else if (consultation.status === 'ongoing' && consultation.startedAt) {
                              return new Date(consultation.startedAt).toLocaleString();
                            } else if (consultation.scheduledAt) {
                              return new Date(consultation.scheduledAt).toLocaleString();
                            } else {
                              return new Date(consultation.createdAt).toLocaleString();
                            }
                          })()}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs sm:text-sm font-medium text-secondary-500">Credits Charged</span>
                        <p className="text-sm sm:text-base text-secondary-900 font-semibold">{consultation.creditsCharged}</p>
                      </div>
                    </div>

                    {consultation.notes && (
                      <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4">
                        <h4 className="text-sm sm:text-base font-semibold text-secondary-800 mb-2">Consultation Notes:</h4>
                        <p className="text-xs sm:text-sm text-secondary-700">{consultation.notes}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-secondary-200">
                      {(consultation.status === 'scheduled' || consultation.status === 'ongoing') && consultation.type === 'online' && (
                        <Link to={`/video-call/${consultation._id}`} className="flex-1 sm:flex-none">
                          <button className="btn btn-primary w-full sm:w-auto text-sm">
                            <FiVideo className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{consultation.status === 'ongoing' ? 'Rejoin' : 'Join'} Video Call</span>
                            <span className="sm:hidden">{consultation.status === 'ongoing' ? 'Rejoin' : 'Join'}</span>
                          </button>
                        </Link>
                      )}
                      
                      {consultation.videoCallCompleted && (
                        <Link to={`/chat/${consultation._id}`} className="flex-1 sm:flex-none">
                          <button className="btn btn-secondary w-full sm:w-auto text-sm">
                            <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">{user.role === 'patient' ? 'Message Doctor' : 'Message Patient'}</span>
                            <span className="sm:hidden">Message</span>
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MyConsultations;
