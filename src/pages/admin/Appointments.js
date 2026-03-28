import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Appointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    date: '',
    doctor: '',
    patient: ''
  });
  const [loading, setLoading] = useState(true);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, [filters]);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/admin/appointments', { params: filters });
      setAppointments(response.data);
    } catch (error) {
      console.error('API Error:', error);
      toast.error('Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to process refund?')) return;
    
    try {
      await api.post(`/admin/appointments/${appointmentId}/refund`);
      toast.success('Refund processed successfully');
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to process refund');
    }
  };

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    const confirmMessage = newStatus === 'completed' 
      ? 'Are you sure you want to mark this appointment as completed?'
      : 'Are you sure you want to cancel this appointment?';
    
    if (!window.confirm(confirmMessage)) return;
    
    try {
      await api.put(`/admin/appointments/${appointmentId}/status`, { status: newStatus });
      toast.success(`Appointment ${newStatus} successfully`);
      fetchAppointments();
    } catch (error) {
      toast.error(`Failed to update appointment status`);
    }
  };

  const handleViewDetails = (appointmentId) => {
    const appointment = appointments.find(apt => apt._id === appointmentId);
    if (appointment) {
      setSelectedAppointment(appointment);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedAppointment(null);
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
      <div className="h-full overflow-hidden flex flex-col">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Appointments Management</h1>
          <p className="text-secondary-600">Monitor and manage all appointments</p>
        </div>

        <div className="card mb-6">
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="form-input"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="no-show">No Show</option>
              </select>

              <input
                type="date"
                value={filters.date}
                onChange={(e) => setFilters({ ...filters, date: e.target.value })}
                className="form-input"
              />

              <button 
                className=" btn-secondary"
                onClick={() => setFilters({ status: 'all', date: '', doctor: '', patient: '' })}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <div className="card flex-1 overflow-hidden">
          <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin scrollbar-thumb-secondary-300 scrollbar-track-secondary-100">
            <table className="w-full">
              <thead className="bg-secondary-50 border-b border-secondary-200 sticky top-0">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">Date & Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">Patient</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">Doctor</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">Fee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-secondary-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-200">
                {appointments.map((appointment) => (
                  <tr key={appointment._id} className="hover:bg-secondary-50 transition-colors duration-200">
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-secondary-900">
                        {(() => {
                          try {
                            if (!appointment.date) return 'No Date';
                            // Handle different date formats
                            let date;
                            if (typeof appointment.date === 'string') {
                              // Try parsing ISO string or other formats
                              date = new Date(appointment.date);
                            } else {
                              date = new Date(appointment.date);
                            }
                            
                            if (isNaN(date.getTime())) {
                              // Try alternative parsing if direct parsing fails
                              const dateStr = appointment.date.toString();
                              date = new Date(dateStr);
                              if (isNaN(date.getTime())) {
                                return 'Invalid Date';
                              }
                            }
                            
                            return date.toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            });
                          } catch (error) {
                            console.error('Date parsing error:', error, appointment.date);
                            return 'Invalid Date';
                          }
                        })()}
                      </div>
                      <div className="text-xs text-secondary-500">
                        {appointment.slotId?.startTime && appointment.slotId?.endTime 
                          ? `${appointment.slotId.startTime} - ${appointment.slotId.endTime}`
                          : 'Time not available'
                        }
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-secondary-900">
                      {appointment.patientId?.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-secondary-900">
                      {appointment.doctorId?.userId?.name 
                        ? `Dr. ${appointment.doctorId.userId.name}`
                        : appointment.doctorId?.name 
                          ? `Dr. ${appointment.doctorId.name}`
                          : 'Doctor not assigned'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-success-600">
                      {appointment.consultationFee ? `${appointment.consultationFee} Points` : 'Fee not set'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.status === 'scheduled' 
                          ? 'bg-primary-100 text-primary-700'
                          : appointment.status === 'completed'
                            ? 'bg-success-100 text-success-700'
                            : appointment.status === 'cancelled'
                              ? 'bg-danger-100 text-danger-700'
                              : 'bg-warning-100 text-warning-700'
                      }`}>
                        {appointment.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {appointment.status === 'scheduled' && (
                          <>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleStatusUpdate(appointment._id, 'completed')}
                            >
                              Complete
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {appointment.status === 'cancelled' && !appointment.refunded && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleRefund(appointment._id)}
                          >
                            Process Refund
                          </button>
                        )}
                        {appointment.refunded && (
                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                            Refunded
                          </span>
                        )}
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetails(appointment._id)}
                        >
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Appointment Details Modal */}
        {showModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-secondary-900">Appointment Details</h3>
                <button
                  onClick={closeModal}
                  className="text-secondary-400 hover:text-secondary-600 text-xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Patient</label>
                  <p className="text-sm text-secondary-900">{selectedAppointment.patientId?.name || 'N/A'}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Doctor</label>
                  <p className="text-sm text-secondary-900">
                    {selectedAppointment.doctorId?.userId?.name 
                      ? `Dr. ${selectedAppointment.doctorId.userId.name}`
                      : selectedAppointment.doctorId?.name 
                        ? `Dr. ${selectedAppointment.doctorId.name}`
                        : 'Doctor not assigned'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Date</label>
                  <p className="text-sm text-secondary-900">
                    {(() => {
                      try {
                        if (!selectedAppointment.date) return 'No Date';
                        const date = new Date(selectedAppointment.date);
                        if (isNaN(date.getTime())) return 'Invalid Date';
                        return date.toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        });
                      } catch (error) {
                        return 'Invalid Date';
                      }
                    })()}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Time</label>
                  <p className="text-sm text-secondary-900">
                    {selectedAppointment.slotId?.startTime && selectedAppointment.slotId?.endTime 
                      ? `${selectedAppointment.slotId.startTime} - ${selectedAppointment.slotId.endTime}`
                      : 'Time not available'
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Consultation Fee</label>
                  <p className="text-sm text-success-600 font-semibold">
                    {selectedAppointment.consultationFee ? `${selectedAppointment.consultationFee} Points` : 'Fee not set'}
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-secondary-700 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                    selectedAppointment.status === 'scheduled' 
                      ? 'bg-primary-100 text-primary-700'
                      : selectedAppointment.status === 'completed'
                        ? 'bg-success-100 text-success-700'
                        : selectedAppointment.status === 'cancelled'
                          ? 'bg-danger-100 text-danger-700'
                          : 'bg-warning-100 text-warning-700'
                  }`}>
                    {selectedAppointment.status.replace('-', ' ')}
                  </span>
                </div>
                
                {selectedAppointment.refunded && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Refund Status</label>
                    <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-success-100 text-success-700">
                      Refunded
                    </span>
                  </div>
                )}
                
                {selectedAppointment.patientId?.phone && (
                  <div>
                    <label className="block text-sm font-medium text-secondary-700 mb-1">Patient Contact</label>
                    <p className="text-sm text-secondary-900">{selectedAppointment.patientId.phone}</p>
                  </div>
                )}
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeModal}
                  className="btn btn-secondary"
                >
                  Close
                </button>
                {selectedAppointment.status === 'scheduled' && (
                  <>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment._id, 'completed');
                        closeModal();
                      }}
                      className="btn btn-success"
                    >
                      Mark Complete
                    </button>
                    <button
                      onClick={() => {
                        handleStatusUpdate(selectedAppointment._id, 'cancelled');
                        closeModal();
                      }}
                      className="btn btn-danger"
                    >
                      Cancel Appointment
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Appointments;
