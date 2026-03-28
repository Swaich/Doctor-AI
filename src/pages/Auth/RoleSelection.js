import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Stethoscope, User, UserCheck, ArrowLeft } from 'lucide-react';

const RoleSelection = () => {
  const [selectedRole, setSelectedRole] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { completeGoogleRegistration } = useAuth();

  // Get Google user data from navigation state
  const googleUserData = location.state?.googleUserData;

  // Redirect if no Google user data
  React.useEffect(() => {
    if (!googleUserData || !googleUserData.email) {
      toast.error('Invalid access. Please try signing in again.');
      navigate('/login');
    }
  }, [googleUserData, navigate]);

  const handleRoleSelect = (role) => {
    setSelectedRole(role);
  };

  const handleContinue = async () => {
    if (!selectedRole) {
      toast.error('Please select your role');
      return;
    }

    setLoading(true);
    try {
      await completeGoogleRegistration(googleUserData, selectedRole);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  if (!googleUserData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100 p-4 relative">
      <button 
        onClick={() => navigate('/login')}
        className="absolute top-4 left-4 flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg border border-secondary-200 hover:border-primary-300"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Login</span>
      </button>

      <div className="card w-full max-w-lg animate-fade-in">
        <div className="card-body">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Stethoscope className="w-8 h-8 text-primary-500" />
            <h2 className="text-xl font-bold text-secondary-900">MegaHealth</h2>
          </div>

          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center mx-auto mb-4">
              {googleUserData.picture ? (
              <User className="w-8 h-8 text-primary-600" />

              ) : (
                <User className="w-8 h-8 text-primary-600" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Welcome, {googleUserData.name}!</h1>
            <p className="text-secondary-600">Please select your role to continue</p>
          </div>

          <div className="space-y-4 mb-8">
            <div 
              onClick={() => handleRoleSelect('patient')}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRole === 'patient' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedRole === 'patient' ? 'bg-primary-500' : 'bg-secondary-100'
                }`}>
                  <User className={`w-6 h-6 ${
                    selectedRole === 'patient' ? 'text-white' : 'text-secondary-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">I'm a Patient</h3>
                  <p className="text-sm text-secondary-600">
                    Book appointments, consult with doctors, and manage your health records
                  </p>
                </div>
                {selectedRole === 'patient' && (
                  <UserCheck className="w-6 h-6 text-primary-500" />
                )}
              </div>
            </div>

            <div 
              onClick={() => handleRoleSelect('doctor')}
              className={`p-6 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                selectedRole === 'doctor' 
                  ? 'border-primary-500 bg-primary-50' 
                  : 'border-secondary-200 hover:border-primary-300 hover:bg-primary-50/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  selectedRole === 'doctor' ? 'bg-primary-500' : 'bg-secondary-100'
                }`}>
                  <Stethoscope className={`w-6 h-6 ${
                    selectedRole === 'doctor' ? 'text-white' : 'text-secondary-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-secondary-900 mb-1">I'm a Doctor</h3>
                  <p className="text-sm text-secondary-600">
                    Provide consultations, manage appointments, and help patients with their health
                  </p>
                </div>
                {selectedRole === 'doctor' && (
                  <UserCheck className="w-6 h-6 text-primary-500" />
                )}
              </div>
            </div>
          </div>

          <button 
            onClick={handleContinue}
            disabled={!selectedRole || loading}
            className="btn btn-primary w-full"
          >
            {loading ? 'Creating Account...' : 'Continue'}
          </button>

          <div className="text-center mt-6 text-sm text-secondary-600">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;