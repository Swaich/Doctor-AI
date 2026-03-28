import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { FiCalendar, FiCreditCard, FiUsers, FiVideo, FiMessageCircle, FiAlertCircle } from 'react-icons/fi';


const DoctorDashboard = () => {
  const [stats, setStats] = useState({
    consultations: 0,
    credits: 0,
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [profileError, setProfileError] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Check if doctor profile exists
      let profileExists = false;
      try {
        const profileRes = await api.get('/doctors/me/profile');
        setDoctorProfile(profileRes.data);
        profileExists = true;
      } catch (error) {
        if (error.response?.status === 404) {
          setProfileError(true);
        }
      }

      // Only fetch other data if profile exists
      if (profileExists) {
        const [consultationsRes, creditsRes] = await Promise.all([
          api.get('/consultations/my-consultations'),
          api.get('/users/credits')
        ]);
        
        const upcoming = consultationsRes.data.filter(c => c.status === 'scheduled');
        
        setStats({
          consultations: consultationsRes.data.length,
          credits: creditsRes.data.credits,
          upcomingAppointments: upcoming
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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
      <div className="space-y-4 sm:space-y-6">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">Doctor Dashboard</h1>
          <p className="text-sm sm:text-base text-secondary-600">Manage your consultations and patient care</p>
        </div>

        {/* Show Complete Registration Alert if profile doesn't exist */}
        {profileError && (
          <div className="bg-gradient-to-r from-primary-500 to-purple-600 text-white p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <FiAlertCircle size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Complete Your Doctor Registration
              </h3>
              <p className="text-sm sm:text-base opacity-90">
                You need to complete your doctor profile with all required documents before you can start practicing on our platform.
              </p>
            </div>
            <button 
              onClick={() => navigate('/doctor/register')}
              className="w-full sm:w-auto bg-white text-primary-600 px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-opacity-90 transition-all duration-200 whitespace-nowrap text-sm sm:text-base"
            >
              Complete Registration →
            </button>
          </div>
        )}

        {/* Show approval pending message if profile exists but not approved */}
        {doctorProfile && !doctorProfile.isApproved && (
          <div className="bg-gradient-to-r from-warning-500 to-danger-500 text-white p-4 sm:p-6 rounded-xl mb-4 sm:mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-lg">
            <div className="p-2 bg-white bg-opacity-20 rounded-lg">
              <FiAlertCircle size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                Registration Pending Approval
              </h3>
              <p className="text-sm sm:text-base opacity-90">
                Your doctor registration is under review by our admin team. You will receive an email once approved.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="card card-hover">
            <div className="card-body flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-primary-100 rounded-lg flex-shrink-0">
                <FiCalendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">{stats.consultations}</h3>
                <p className="text-xs sm:text-sm text-secondary-600">Total Consultations</p>
              </div>
            </div>
          </div>

          <div className="card card-hover">
            <div className="card-body flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-success-100 rounded-lg flex-shrink-0">
                <FiCreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-success-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">{stats.credits}</h3>
                <p className="text-xs sm:text-sm text-secondary-600">Available Credits</p>
              </div>
            </div>
          </div>

          <div className="card card-hover sm:col-span-2 lg:col-span-1">
            <div className="card-body flex items-center gap-3 sm:gap-4 p-4 sm:p-6">
              <div className="p-2 sm:p-3 bg-warning-100 rounded-lg flex-shrink-0">
                <FiUsers className="w-5 h-5 sm:w-6 sm:h-6 text-warning-600" />
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-secondary-900">{stats.upcomingAppointments.length}</h3>
                <p className="text-xs sm:text-sm text-secondary-600">Upcoming Appointments</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Upcoming Appointments</h2>
          </div>
          <div className="card-body p-4 sm:p-6">
            {stats.upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-500 text-sm sm:text-base">No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {stats.upcomingAppointments.map((appointment) => (
                  <div key={appointment._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-secondary-50 rounded-lg border border-secondary-200 hover:shadow-md transition-shadow duration-200 gap-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-secondary-900 mb-1 text-sm sm:text-base">{appointment.patientId?.name}</h3>
                      <p className="text-secondary-600 text-xs sm:text-sm mb-2">{new Date(appointment.scheduledAt).toLocaleString()}</p>
                      <span className={`inline-block px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                        appointment.type === 'online' 
                          ? 'bg-primary-100 text-primary-700' 
                          : 'bg-success-100 text-success-700'
                      }`}>
                        {appointment.type}
                      </span>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      {appointment.type === 'online' && (
                        <Link to={`/video-call/${appointment._id}`} className="flex-1 sm:flex-none">
                          <button className="btn btn-primary btn-sm w-full sm:w-auto text-xs">
                            <FiVideo className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Join Call</span>
                            <span className="sm:hidden">Join</span>
                          </button>
                        </Link>
                      )}
                      {appointment.videoCallCompleted && (
                        <Link to={`/chat/${appointment._id}`} className="flex-1 sm:flex-none">
                          <button className="btn btn-secondary btn-sm w-full sm:w-auto text-xs">
                            <FiMessageCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                            Chat
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DoctorDashboard;
