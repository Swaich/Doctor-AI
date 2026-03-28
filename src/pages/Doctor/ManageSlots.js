import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const ManageSlots = () => {
  const [slots, setSlots] = useState([]);
  const [availabilityStatus, setAvailabilityStatus] = useState(null);
  const [newSlot, setNewSlot] = useState({
    date: '',
    startTime: '',
    endTime: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSlots();
    fetchAvailabilityStatus();
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const response = await api.get('/slots/my-slots');
      // Filter out any null or invalid slots
      const validSlots = (response.data || []).filter(slot => slot && slot._id);
      setSlots(validSlots);
      console.log('Fetched slots:', validSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
      // Don't show error toast if it's just a 404 (no slots yet)
      if (error.response?.status !== 404) {
        toast.error(error.response?.data?.message || 'Failed to fetch slots');
      }
      setSlots([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailabilityStatus = async () => {
    try {
      const response = await api.get('/slots/my-availability');
      setAvailabilityStatus(response.data);
    } catch (error) {
      console.error('Error fetching availability status:', error);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    
    // Validate times
    if (newSlot.startTime >= newSlot.endTime) {
      toast.error('End time must be after start time');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/slots', newSlot);
      console.log('Slot created:', response.data);
      toast.success('Slot added successfully!');
      setNewSlot({ date: '', startTime: '', endTime: '' });
      fetchSlots();
      fetchAvailabilityStatus();
    } catch (error) {
      console.error('Error adding slot:', error);
      toast.error(error.response?.data?.message || 'Failed to add slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this slot?')) return;

    try {
      await api.delete(`/slots/${slotId}`);
      toast.success('Slot deleted successfully!');
      fetchSlots();
      fetchAvailabilityStatus();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete slot');
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
      <div className="space-y-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Manage Availability</h1>
          <p className="text-secondary-600">Set your available time slots for patient consultations</p>
        </div>

        {/* Availability Status */}
        {availabilityStatus && (
          <div className={`card border-2 ${
            availabilityStatus.isAvailable 
              ? 'border-success-200 bg-success-50' 
              : 'border-warning-200 bg-warning-50'
          }`}>
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full ${
                    availabilityStatus.isAvailable ? 'bg-success-500' : 'bg-warning-500'
                  }`}></div>
                  <h3 className="text-lg font-semibold text-secondary-900">
                    {availabilityStatus.isAvailable ? 'You are Available' : 'You are Currently Unavailable'}
                  </h3>
                </div>
                <div className="text-sm text-secondary-600">
                  {availabilityStatus.availableSlots} of {availabilityStatus.totalSlots} slots available
                </div>
              </div>
              <p className="text-secondary-700 mb-2">
                {availabilityStatus.recommendation}
              </p>
              {!availabilityStatus.isAvailable && availabilityStatus.hasSlots && (
                <p className="text-sm text-warning-700">
                  💡 Patients will see you as "Currently Unavailable" until you have open time slots.
                </p>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900">Add New Slot</h2>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddSlot} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-group">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  value={newSlot.date}
                  onChange={(e) => setNewSlot({ ...newSlot, date: e.target.value })}
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Start Time</label>
                <input
                  type="time"
                  value={newSlot.startTime}
                  onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">End Time</label>
                <input
                  type="time"
                  value={newSlot.endTime}
                  onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                  required
                  className="form-input"
                />
              </div>

              <div className="md:col-span-3">
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900">Your Slots</h2>
          </div>
          <div className="card-body">
            {slots.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📅</div>
                <p className="text-secondary-500">No slots created yet. Add your first slot above to start accepting appointments.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-secondary-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-secondary-900">{slots.length}</div>
                    <div className="text-sm text-secondary-600">Total Slots</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-success-600">{slots.filter(s => !s.isBooked).length}</div>
                    <div className="text-sm text-secondary-600">Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-danger-600">{slots.filter(s => s.isBooked).length}</div>
                    <div className="text-sm text-secondary-600">Booked</div>
                  </div>
                </div>
                <div className="space-y-4">
                  {slots.map((slot) => {
                    // Safety check for null slot
                    if (!slot || !slot._id) return null;
                    
                    const slotDate = new Date(slot.date);
                    const isPast = slotDate < new Date(new Date().setHours(0, 0, 0, 0));
                    
                    return (
                      <div key={slot._id} className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                        isPast 
                          ? 'bg-secondary-100 border-secondary-200 opacity-60' 
                          : slot.isBooked 
                            ? 'bg-danger-50 border-danger-200' 
                            : 'bg-success-50 border-success-200 hover:shadow-md'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
                            <div>
                              <span className="text-sm font-medium text-secondary-500">Date</span>
                              <div className="font-semibold text-secondary-900">
                                {slotDate.toLocaleDateString('en-US', { 
                                  weekday: 'short', 
                                  year: 'numeric', 
                                  month: 'short', 
                                  day: 'numeric' 
                                })}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-secondary-500">Time</span>
                              <div className="font-semibold text-secondary-900">
                                {slot.startTime || 'N/A'} - {slot.endTime || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-secondary-500">Status</span>
                              <div className={`font-semibold ${
                                slot.isBooked ? 'text-danger-600' : 'text-success-600'
                              }`}>
                                {slot.isBooked ? '🔴 Booked' : '🟢 Available'}
                              </div>
                            </div>
                          </div>
                          {!slot.isBooked && !isPast && (
                            <button 
                              onClick={() => handleDeleteSlot(slot._id)}
                              className="btn btn-danger btn-sm ml-4"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ManageSlots;
