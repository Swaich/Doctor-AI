import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiUser, FiMessageSquare, FiX, FiCheck, FiAlertCircle } from 'react-icons/fi';

const ConsultationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/consultation-requests/my-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch consultation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this request?')) return;

    try {
      await api.delete(`/consultation-requests/${requestId}`);
      toast.success('Request cancelled successfully');
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel request');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4 text-warning-500" />;
      case 'approved':
        return <FiCheck className="w-4 h-4 text-success-500" />;
      case 'declined':
        return <FiX className="w-4 h-4 text-danger-500" />;
      case 'scheduled':
        return <FiCalendar className="w-4 h-4 text-primary-500" />;
      default:
        return <FiAlertCircle className="w-4 h-4 text-secondary-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'approved':
        return 'bg-success-100 text-success-800 border-success-200';
      case 'declined':
        return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'scheduled':
        return 'bg-primary-100 text-primary-800 border-primary-200';
      default:
        return 'bg-secondary-100 text-secondary-800 border-secondary-200';
    }
  };

  const getUrgencyColor = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">My Consultation Requests</h1>
          <p className="text-secondary-600">Track your consultation requests and doctor responses</p>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-secondary-500 text-lg mb-4">No consultation requests yet</p>
            <Link to="/doctors" className="btn btn-primary">
              Browse Doctors
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.filter(request => request && request._id).map((request) => (
              <div key={request._id} className="card">
                <div className="card-body">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FiUser className="w-5 h-5 text-primary-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-secondary-900">
                              {request.doctorId?.userId?.name ? `Dr. ${request.doctorId.userId.name}` : 'Doctor (Unavailable)'}
                            </h3>
                            <p className="text-sm text-primary-600">
                              {request.doctorId?.specialization?.name || 'Specialization not available'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                            {getStatusIcon(request.status)}
                            <span className="ml-1 capitalize">{request.status}</span>
                          </span>
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getUrgencyColor(request.urgencyLevel)}`}>
                            {request.urgencyLevel} priority
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-medium text-secondary-500">Preferred Date</span>
                          <div className="text-secondary-900">
                            {new Date(request.preferredDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-secondary-500">Preferred Time</span>
                          <div className="text-secondary-900">{request.preferredTime}</div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-secondary-500">Type</span>
                          <div className="text-secondary-900 capitalize">
                            {request.consultationType === 'video' ? 'Video' : 'Physical'}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-secondary-500">Requested</span>
                          <div className="text-secondary-900">
                            {new Date(request.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-sm font-medium text-secondary-500">Reason for Consultation</span>
                        <p className="text-secondary-900 mt-1">{request.reasonForConsultation}</p>
                      </div>

                      {request.status === 'approved' && request.proposedSlot && (
                        <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-success-800 mb-2 flex items-center">
                            <FiCheck className="w-4 h-4 mr-2" />
                            Approved - Proposed Time Slot
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="font-medium text-success-700">Date:</span>
                              <div className="text-success-900">
                                {new Date(request.proposedSlot.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </div>
                            </div>
                            <div>
                              <span className="font-medium text-success-700">Time:</span>
                              <div className="text-success-900">
                                {request.proposedSlot.startTime} - {request.proposedSlot.endTime}
                              </div>
                            </div>
                            <div>
                              {request.doctorId?._id ? (
                                <Link to={`/book/${request.doctorId._id}`} className="btn btn-success btn-sm">
                                  Book This Slot
                                </Link>
                              ) : (
                                <span className="text-sm text-gray-500 italic">
                                  Doctor no longer available
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {request.status === 'declined' && request.doctorResponse && (
                        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-danger-800 mb-2 flex items-center">
                            <FiX className="w-4 h-4 mr-2" />
                            Request Declined
                          </h4>
                          <p className="text-danger-900 text-sm">{request.doctorResponse}</p>
                        </div>
                      )}

                      {request.doctorResponse && request.status !== 'declined' && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-primary-800 mb-2 flex items-center">
                            <FiMessageSquare className="w-4 h-4 mr-2" />
                            Doctor's Response
                          </h4>
                          <p className="text-primary-900 text-sm">{request.doctorResponse}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 lg:w-auto">
                      {request.status === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(request._id)}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel Request
                        </button>
                      )}
                      {request.doctorId?._id ? (
                        <Link to={`/doctors/${request.doctorId._id}`} className="btn btn-secondary btn-sm">
                          View Doctor Profile
                        </Link>
                      ) : (
                        <span className="text-sm text-gray-500 italic">
                          Doctor profile unavailable
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ConsultationRequests;