import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { FiCalendar, FiClock, FiUser, FiMessageSquare, FiCheck, FiX, FiAlertCircle } from 'react-icons/fi';

const DoctorConsultationRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseForm, setResponseForm] = useState({
    status: '',
    doctorResponse: '',
    proposedSlot: {
      date: '',
      startTime: '',
      endTime: ''
    }
  });

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await api.get('/consultation-requests/doctor-requests');
      setRequests(response.data);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch consultation requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    
    try {
      await api.put(`/consultation-requests/${respondingTo}/respond`, responseForm);
      toast.success(`Request ${responseForm.status} successfully`);
      setRespondingTo(null);
      setResponseForm({
        status: '',
        doctorResponse: '',
        proposedSlot: { date: '', startTime: '', endTime: '' }
      });
      fetchRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to respond to request');
    }
  };

  const startResponse = (requestId, status) => {
    setRespondingTo(requestId);
    setResponseForm({
      ...responseForm,
      status
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <FiClock className="w-4 h-4 text-warning-500" />;
      case 'approved':
        return <FiCheck className="w-4 h-4 text-success-500" />;
      case 'declined':
        return <FiX className="w-4 h-4 text-danger-500" />;
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

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

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
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Consultation Requests</h1>
          <p className="text-secondary-600">Review and respond to patient consultation requests</p>
        </div>

        {requests.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-secondary-500 text-lg">No consultation requests yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request._id} className="card">
                <div className="card-body">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <FiUser className="w-5 h-5 text-primary-600" />
                          <div>
                            <h3 className="text-lg font-semibold text-secondary-900">
                              {request.patientId?.name}
                            </h3>
                            <p className="text-sm text-secondary-600">
                              {request.patientId?.email}
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
                        <p className="text-secondary-900 mt-1 p-3 bg-secondary-50 rounded-lg">
                          {request.reasonForConsultation}
                        </p>
                      </div>

                      {request.status !== 'pending' && request.doctorResponse && (
                        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                          <h4 className="font-semibold text-primary-800 mb-2 flex items-center">
                            <FiMessageSquare className="w-4 h-4 mr-2" />
                            Your Response
                          </h4>
                          <p className="text-primary-900 text-sm">{request.doctorResponse}</p>
                          {request.proposedSlot && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Proposed Slot: </span>
                              {new Date(request.proposedSlot.date).toLocaleDateString()} 
                              {' '}{request.proposedSlot.startTime} - {request.proposedSlot.endTime}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 lg:w-auto">
                      {request.status === 'pending' && (
                        <>
                          <button
                            onClick={() => startResponse(request._id, 'approved')}
                            className="btn btn-success btn-sm"
                          >
                            <FiCheck className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => startResponse(request._id, 'declined')}
                            className="btn btn-danger btn-sm"
                          >
                            <FiX className="w-4 h-4 mr-1" />
                            Decline
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Response Form */}
                  {respondingTo === request._id && (
                    <div className="mt-6 p-4 bg-secondary-50 border border-secondary-200 rounded-lg">
                      <h4 className="font-semibold text-secondary-900 mb-4">
                        {responseForm.status === 'approved' ? 'Approve Request' : 'Decline Request'}
                      </h4>
                      
                      <form onSubmit={handleRespond} className="space-y-4">
                        {responseForm.status === 'approved' && (
                          <div>
                            <label className="block text-sm font-medium text-secondary-700 mb-2">
                              Propose Time Slot
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <label className="block text-xs text-secondary-600 mb-1">Date</label>
                                <input
                                  type="date"
                                  value={responseForm.proposedSlot.date}
                                  onChange={(e) => setResponseForm({
                                    ...responseForm,
                                    proposedSlot: { ...responseForm.proposedSlot, date: e.target.value }
                                  })}
                                  min={today}
                                  required
                                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-secondary-600 mb-1">Start Time</label>
                                <input
                                  type="time"
                                  value={responseForm.proposedSlot.startTime}
                                  onChange={(e) => setResponseForm({
                                    ...responseForm,
                                    proposedSlot: { ...responseForm.proposedSlot, startTime: e.target.value }
                                  })}
                                  required
                                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm"
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-secondary-600 mb-1">End Time</label>
                                <input
                                  type="time"
                                  value={responseForm.proposedSlot.endTime}
                                  onChange={(e) => setResponseForm({
                                    ...responseForm,
                                    proposedSlot: { ...responseForm.proposedSlot, endTime: e.target.value }
                                  })}
                                  required
                                  className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-secondary-700 mb-1">
                            Response Message
                          </label>
                          <textarea
                            value={responseForm.doctorResponse}
                            onChange={(e) => setResponseForm({ ...responseForm, doctorResponse: e.target.value })}
                            rows="3"
                            placeholder={responseForm.status === 'approved' 
                              ? "I can accommodate your consultation request. Please book the proposed time slot."
                              : "I'm sorry, I cannot accommodate this request at this time. Please consider..."
                            }
                            required
                            className="w-full px-3 py-2 border border-secondary-300 rounded-lg text-sm"
                          />
                        </div>

                        <div className="flex gap-3">
                          <button type="submit" className="btn btn-primary">
                            Send Response
                          </button>
                          <button 
                            type="button" 
                            onClick={() => setRespondingTo(null)}
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default DoctorConsultationRequests;