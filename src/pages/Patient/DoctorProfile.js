import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import RequestConsultationForm from '../../components/RequestConsultationForm';
import api from '../../utils/api';
import { FiStar, FiCalendar, FiMessageCircle, FiArrowLeft, FiMonitor } from 'react-icons/fi';


const DoctorProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canMessage, setCanMessage] = useState(false);
  const [consultationId, setConsultationId] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    fetchDoctor();
    checkMessageAccess();
    fetchAvailableSlots();
  }, [id]);

  const fetchDoctor = async () => {
    try {
      const response = await api.get(`/doctors/${id}`);
      setDoctor(response.data);
    } catch (error) {
      console.error('Error fetching doctor:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkMessageAccess = async () => {
    try {
      const response = await api.get(`/chat/check-access/${id}`);
      setCanMessage(response.data.canMessage);
      setConsultationId(response.data.consultationId);
    } catch (error) {
      console.error('Error checking message access:', error);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      const response = await api.get(`/slots/doctor/${id}`);
      // Get next 3 available slots
      const nextSlots = response.data.slice(0, 3);
      setAvailableSlots(nextSlots);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setAvailableSlots([]);
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
  
  if (!doctor) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-6xl mb-4">👨‍⚕️</div>
          <p className="text-secondary-500 text-lg">Doctor not found</p>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Button */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-secondary-600 hover:text-secondary-900 transition-colors"
          >
            <FiArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
        
        {/* Profile Header */}
        <div className="card">
          <div className="card-body">
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-shrink-0">
                {doctor.profilePhoto && doctor.profilePhoto.data ? (
                  <img 
                    src={`data:${doctor.profilePhoto.contentType};base64,${doctor.profilePhoto.data}`} 
                    alt={doctor.name} 
                    className="w-32 h-32 rounded-full object-cover border-4 border-primary-200" 
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-primary-100 flex items-center justify-center text-4xl font-bold text-primary-600 border-4 border-primary-200">
                    {doctor.name?.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-secondary-900 mb-2">Dr. {doctor.name}</h1>
                <p className="text-xl text-primary-600 font-semibold mb-2">{doctor.specialization?.name}</p>
                <p className="text-secondary-600 mb-3">{doctor.qualification}</p>
                {/* <div className="flex items-center gap-2">
                  <FiStar className="w-5 h-5 text-warning-500" />
                  <span className="font-medium text-secondary-900">
                    {doctor.rating?.toFixed(1) || 'New'} ({doctor.totalRatings || 0} reviews)
                  </span>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* About Section */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900">About Dr. {doctor.name}</h2>
          </div>
          <div className="card-body">
            <p className="text-secondary-700 leading-relaxed">
              {doctor.about || 'No description available yet.'}
            </p>
          </div>
        </div>

        {/* Professional Details */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900">Professional Details</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <span className="text-sm font-medium text-secondary-500">Qualification</span>
                <p className="text-secondary-900 font-semibold">{doctor.qualification}</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-secondary-500">Specialization</span>
                <p className="text-secondary-900 font-semibold">{doctor.specialization?.name}</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-secondary-500">Experience</span>
                <p className="text-secondary-900 font-semibold">{doctor.experience} years</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-secondary-500">Current Practice</span>
                <p className="text-secondary-900 font-semibold">{doctor.currentHospitalClinic}</p>
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium text-secondary-500">City</span>
                <p className="text-secondary-900 font-semibold">{doctor.currentWorkingCity}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Languages */}
        {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Languages Spoken</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                {doctor.languagesSpoken.map((lang, index) => (
                  <span key={index} className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 text-secondary-700">
                    {lang}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Consultation Options */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-secondary-900">Consultation Options</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctor.consultationModes?.video && (
                <div className="p-4 border border-primary-200 rounded-lg bg-primary-50">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl"><FiMonitor className="w-8 h-8 text-primary-600" /></div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 mb-1">Video Consultation</h3>
                      <p className="text-lg font-bold text-success-600 mb-2">{doctor.consultationFee?.video} Credits</p>
                      <p className="text-sm text-secondary-600">Consult from anywhere via video call</p>
                    </div>
                  </div>
                </div>
              )}
              {doctor.consultationModes?.physical && (
                <div className="p-4 border border-success-200 rounded-lg bg-success-50">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🏥</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 mb-1">Physical Visit</h3>
                      <p className="text-lg font-bold text-success-600 mb-2">{doctor.consultationFee?.physical} Credits</p>
                      <p className="text-sm text-secondary-600">Visit clinic at {doctor.currentHospitalClinic}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Available Days */}
        {doctor.availableDays && doctor.availableDays.length > 0 && (
          <div className="card">
            <div className="card-header">
              <h2 className="text-xl font-semibold text-secondary-900">Available Days</h2>
            </div>
            <div className="card-body">
              <div className="flex flex-wrap gap-2">
                {doctor.availableDays.map((day, index) => (
                  <span key={index} className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="card">
          <div className="card-body space-y-4">
            {doctor.isAvailable ? (
              <Link to={`/book/${doctor._id}`} className="block">
                <button className="btn btn-primary w-full">
                  <FiCalendar className="w-5 h-5" />
                  Book Consultation
                </button>
              </Link>
            ) : (
              <div className="space-y-4">
                <button className="btn btn-secondary w-full" disabled>
                  Currently Unavailable
                </button>
                
                {/* Show future consultation options */}
                {availableSlots.length > 0 ? (
                  <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                    <h4 className="font-semibold text-primary-800 mb-3 flex items-center">
                      <FiCalendar className="w-4 h-4 mr-2" />
                      Upcoming Available Slots
                    </h4>
                    <div className="space-y-2">
                      {availableSlots.map((slot, index) => (
                        <div key={slot._id} className="flex items-center justify-between p-2 bg-white rounded border">
                          <div className="text-sm">
                            <span className="font-medium text-secondary-900">
                              {new Date(slot.date).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                            <span className="text-secondary-600 ml-2">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link to={`/book/${doctor._id}`} className="block mt-3">
                      <button className="btn btn-primary w-full text-sm">
                        View All Available Times
                      </button>
                    </Link>
                  </div>
                ) : (
                  <RequestConsultationForm doctorId={doctor._id} doctorName={doctor.name} />
                )}
              </div>
            )}
            
            {canMessage && consultationId && (
              <Link to={`/chat/${consultationId}`} className="block">
                <button className="btn btn-secondary w-full">
                  <FiMessageCircle className="w-5 h-5" />
                  Message Doctor
                </button>
              </Link>
            )}
            
            {!canMessage && (
              <div className="p-4 bg-secondary-50 border border-secondary-200 rounded-lg text-center">
                <p className="text-secondary-600 text-sm">
                  💬 Complete a video consultation to unlock messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorProfile;
