import React, { useState } from 'react';
import { toast } from 'react-toastify';
import api from '../utils/api';
import { FiCalendar, FiClock, FiMessageSquare, FiAlertCircle } from 'react-icons/fi';

const RequestConsultationForm = ({ 
  doctorId, 
  doctorName, 
  onSuccess, 
  onCancel, 
  isModal = false 
}) => {
  const [showForm, setShowForm] = useState(!isModal); // If modal, show form immediately
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    consultationType: 'video',
    reasonForConsultation: '',
    urgencyLevel: 'medium'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/consultation-requests', {
        doctorId,
        ...formData
      });

      if (onSuccess) {
        onSuccess();
      } else {
        toast.success('Consultation request submitted successfully! The doctor will review and respond soon.');
        setShowForm(false);
        setFormData({
          preferredDate: '',
          preferredTime: '',
          consultationType: 'video',
          reasonForConsultation: '',
          urgencyLevel: 'medium'
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Get minimum date (today)
  const today = new Date().toISOString().split('T')[0];

  if (!showForm) {
    return (
      <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg text-center">
        <div className="mb-3">
          <FiCalendar className="w-8 h-8 text-warning-600 mx-auto mb-2" />
          <p className="text-secondary-700 font-medium mb-1">No upcoming slots available</p>
          <p className="text-secondary-600 text-sm">Request a future consultation with Dr. {doctorName}</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="btn btn-warning w-full"
        >
          Request Future Consultation
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-warning-800 flex items-center">
          <FiMessageSquare className="w-4 h-4 mr-2" />
          Request Consultation with Dr. {doctorName}
        </h4>
        <button 
          onClick={() => setShowForm(false)}
          className="text-warning-600 hover:text-warning-800"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              <FiCalendar className="inline w-4 h-4 mr-1" />
              Preferred Date
            </label>
            <input
              type="date"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleChange}
              min={today}
              required
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              <FiClock className="inline w-4 h-4 mr-1" />
              Preferred Time
            </label>
            <select
              name="preferredTime"
              value={formData.preferredTime}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent text-sm"
            >
              <option value="">Select time</option>
              <option value="09:00">9:00 AM</option>
              <option value="10:00">10:00 AM</option>
              <option value="11:00">11:00 AM</option>
              <option value="12:00">12:00 PM</option>
              <option value="14:00">2:00 PM</option>
              <option value="15:00">3:00 PM</option>
              <option value="16:00">4:00 PM</option>
              <option value="17:00">5:00 PM</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              Consultation Type
            </label>
            <select
              name="consultationType"
              value={formData.consultationType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent text-sm"
            >
              <option value="video">Video Consultation</option>
              <option value="physical">Physical Visit</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-secondary-700 mb-1">
              <FiAlertCircle className="inline w-4 h-4 mr-1" />
              Urgency Level
            </label>
            <select
              name="urgencyLevel"
              value={formData.urgencyLevel}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent text-sm"
            >
              <option value="low">🟢 Low - Routine checkup</option>
              <option value="medium">🟡 Medium - General concern</option>
              <option value="high">🔴 High - Urgent issue</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-1">
            Reason for Consultation
          </label>
          <textarea
            name="reasonForConsultation"
            value={formData.reasonForConsultation}
            onChange={handleChange}
            rows="3"
            placeholder="Please describe your symptoms or reason for consultation..."
            required
            className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-transparent text-sm"
          />
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-blue-800 text-sm">
            <FiMessageSquare className="inline w-4 h-4 mr-1" />
            Your request will be sent to Dr. {doctorName}. They will review it and either approve with a proposed time slot or provide alternative suggestions.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="btn btn-warning flex-1"
          >
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            onClick={() => {
              if (onCancel) {
                onCancel();
              } else {
                setShowForm(false);
              }
            }}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RequestConsultationForm;