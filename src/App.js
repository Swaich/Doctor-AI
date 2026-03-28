import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import VerifyOTP from './pages/Auth/VerifyOTP';
import ForgotPassword from './pages/Auth/ForgotPassword';
import RoleSelection from './pages/Auth/RoleSelection';
import LandingPage from './pages/Landing/LandingPage';

import PatientDashboard from './pages/Patient/Dashboard';
import DoctorList from './pages/Patient/DoctorList';
import DoctorProfile from './pages/Patient/DoctorProfile';
import BookConsultation from './pages/Patient/BookConsultation';
import MyConsultations from './pages/Shared/MyConsultations';
import Credits from './pages/Patient/Credits';
import Profile from './pages/Patient/Profile';

import DoctorDashboard from './pages/Doctor/Dashboard';
import DoctorRegister from './pages/Doctor/Register';
import DoctorProfileEdit from './pages/Doctor/Profile';
import ManageSlots from './pages/Doctor/ManageSlots';

import AdminDashboard from './pages/Admin/Dashboard';
import DoctorApprovals from './pages/Admin/DoctorApprovals';
import Complaints from './pages/Admin/Complaints';
import PatientManagement from './pages/Admin/PatientManagement';
import DoctorManagement from './pages/Admin/DoctorManagement';
import Appointments from './pages/Admin/Appointments';
import Transactions from './pages/Admin/Transactions';
import Settings from './pages/Admin/Settings';

import MyComplaints from './pages/Shared/MyComplaints';
import FileComplaint from './pages/Shared/FileComplaint';
import VideoCall from './pages/Shared/VideoCall';
import VideoCallNew from './pages/Shared/VideoCallNew';
import ExternalMeeting from './pages/Shared/ExternalMeeting';
import Chat from './pages/Shared/Chat';

import ConsultationRequests from './pages/Patient/ConsultationRequests';
import DoctorConsultationRequests from './pages/Doctor/ConsultationRequests';
import Messages from './pages/Shared/Messages';

import LocationPrompt from './components/LocationPrompt';
import { requestLocationPermission, updateUserLocation } from './utils/location';
import api from './utils/api';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

function AppRoutes() {
  const { user, showLocationPrompt, hideLocationPrompt } = useAuth();

  const handleLocationAllow = async () => {
    try {
      const location = await requestLocationPermission();
      const cityData = await updateUserLocation(api, location);
      toast.success(`Location set to ${cityData.city}`);
      hideLocationPrompt();
    } catch (error) {
      toast.error(error.message || 'Failed to get location');
      hideLocationPrompt();
    }
  };

  const handleLocationDeny = () => {
    toast.info('You can enable location later in your profile');
    hideLocationPrompt();
  };

  return (
    <>
      <Routes>
        {/* Landing page as default route */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />
        <Route path="/role-selection" element={!user ? <RoleSelection /> : <Navigate to="/dashboard" />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to="/dashboard" />} />

        {/* Dashboard route for logged-in users */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            {user?.role === 'patient' && <PatientDashboard />}
            {user?.role === 'doctor' && <DoctorDashboard />}
            {user?.role === 'admin' && <AdminDashboard />}
          </PrivateRoute>
        } />

        <Route path="/doctors" element={<PrivateRoute allowedRoles={['patient']}><DoctorList /></PrivateRoute>} />
        <Route path="/doctors/:id" element={<PrivateRoute allowedRoles={['patient']}><DoctorProfile /></PrivateRoute>} />
        <Route path="/book/:doctorId" element={<PrivateRoute allowedRoles={['patient']}><BookConsultation /></PrivateRoute>} />
        <Route path="/consultations" element={
          <PrivateRoute>
            <MyConsultations />
          </PrivateRoute>
        } />
        <Route path="/credits" element={
          <PrivateRoute allowedRoles={['patient', 'doctor']}>
            <Credits />
          </PrivateRoute>
        } />
        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

        <Route path="/consultation-requests" element={<PrivateRoute allowedRoles={['patient']}><ConsultationRequests /></PrivateRoute>} />
        <Route path="/messages" element={<PrivateRoute allowedRoles={['patient', 'doctor']}><Messages /></PrivateRoute>} />

        <Route path="/doctor/register" element={<PrivateRoute><DoctorRegister /></PrivateRoute>} />
        <Route path="/doctor/profile" element={<PrivateRoute allowedRoles={['doctor']}><DoctorProfileEdit /></PrivateRoute>} />
        <Route path="/doctor/slots" element={<PrivateRoute allowedRoles={['doctor']}><ManageSlots /></PrivateRoute>} />
        <Route path="/doctor/consultation-requests" element={<PrivateRoute allowedRoles={['doctor']}><DoctorConsultationRequests /></PrivateRoute>} />

        <Route path="/admin/doctors" element={<PrivateRoute allowedRoles={['admin']}><DoctorManagement /></PrivateRoute>} />
        <Route path="/admin/patients" element={<PrivateRoute allowedRoles={['admin']}><PatientManagement /></PrivateRoute>} />
        <Route path="/admin/approvals" element={<PrivateRoute allowedRoles={['admin']}><DoctorApprovals /></PrivateRoute>} />
        <Route path="/admin/appointments" element={<PrivateRoute allowedRoles={['admin']}><Appointments /></PrivateRoute>} />
        <Route path="/admin/transactions" element={<PrivateRoute allowedRoles={['admin']}><Transactions /></PrivateRoute>} />
        <Route path="/admin/complaints" element={<PrivateRoute allowedRoles={['admin']}><Complaints /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute allowedRoles={['admin']}><Settings /></PrivateRoute>} />

        <Route path="/complaints" element={
          <PrivateRoute allowedRoles={['patient', 'doctor']}>
            <MyComplaints />
          </PrivateRoute>
        } />
        <Route path="/complaints/new" element={
          <PrivateRoute allowedRoles={['patient', 'doctor']}>
            <FileComplaint />
          </PrivateRoute>
        } />
        
        <Route path="/video-call/:consultationId" element={
          <PrivateRoute allowedRoles={['patient', 'doctor']}>
            <ExternalMeeting />
          </PrivateRoute>
        } />
        <Route path="/video-call-webrtc/:consultationId" element={
          <PrivateRoute allowedRoles={['patient', 'doctor']}>
            <VideoCallNew />
          </PrivateRoute>
        } />
        <Route path="/video-call-old/:consultationId" element={
          <PrivateRoute allowedRoles={['patient', 'doctor']}>
            <VideoCall />
          </PrivateRoute>
        } />
        <Route path="/chat/:consultationId" element={
          <PrivateRoute allowedRoles={['patient', 'doctor']}>
            <Chat />
          </PrivateRoute>
        } />
      </Routes>

      {showLocationPrompt && (
        <LocationPrompt 
          onAllow={handleLocationAllow}
          onDeny={handleLocationDeny}
        />
      )}


    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
        <ToastContainer position="top-right" autoClose={3000} />
      </Router>
    </AuthProvider>
  );
}

export default App;
