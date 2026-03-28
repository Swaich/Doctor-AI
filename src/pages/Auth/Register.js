import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { Stethoscope, ArrowLeft, User, UserCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'patient'
  });
  const [loading, setLoading] = useState(false);
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await register(formData);
      toast.success('Registration successful! Check your email for OTP');
      navigate('/verify-otp', { state: { userId: response.userId, email: formData.email } });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      
      // Check if user needs to select role (new user)
      if (result.needsRoleSelection) {
        navigate('/role-selection', { 
          state: { googleUserData: result.googleUserData } 
        });
        return;
      }
      
      // Existing user - redirect to dashboard
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google authentication failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google authentication failed');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100 p-4 relative">
      <button 
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center gap-2 text-secondary-600 hover:text-primary-600 transition-colors bg-white px-4 py-2 rounded-lg border border-secondary-200 hover:border-primary-300"
      >
        <ArrowLeft size={18} />
        <span className="text-sm font-medium">Back to Home</span>
      </button>

      <div className="card w-full max-w-md animate-fade-in">
        <div className="card-body">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Stethoscope className="w-8 h-8 text-primary-500" />
            <h2 className="text-xl font-bold text-secondary-900">MegaHealth</h2>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Create Account</h1>
            <p className="text-secondary-600">Join our MegaHealth platform today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                placeholder="Create a strong password (min 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label className="form-label">I want to register as</label>
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div 
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                    formData.role === 'patient' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-secondary-200 bg-secondary-50 hover:border-primary-300 hover:bg-white'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'patient' })}
                >
                  <User className={`w-6 h-6 flex-shrink-0 ${formData.role === 'patient' ? 'text-primary-600' : 'text-secondary-400'}`} />
                  <div>
                    <h4 className={`text-sm font-semibold ${formData.role === 'patient' ? 'text-primary-700' : 'text-secondary-900'}`}>Patient</h4>
                    <p className="text-xs text-secondary-600">Book consultations</p>
                  </div>
                </div>
                <div 
                  className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 hover:-translate-y-0.5 ${
                    formData.role === 'doctor' 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-secondary-200 bg-secondary-50 hover:border-primary-300 hover:bg-white'
                  }`}
                  onClick={() => setFormData({ ...formData, role: 'doctor' })}
                >
                  <UserCheck className={`w-6 h-6 flex-shrink-0 ${formData.role === 'doctor' ? 'text-primary-600' : 'text-secondary-400'}`} />
                  <div>
                    <h4 className={`text-sm font-semibold ${formData.role === 'doctor' ? 'text-primary-700' : 'text-secondary-900'}`}>Doctor</h4>
                    <p className="text-xs text-secondary-600">Provide healthcare</p>
                  </div>
                </div>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-secondary-200"></div>
            <span className="px-4 text-sm font-semibold text-secondary-400">OR</span>
            <div className="flex-1 border-t border-secondary-200"></div>
          </div>

          <div className="flex justify-center mb-6">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signup_with"
              shape="rectangular"
              logo_alignment="left"
              auto_select={false}
              cancel_on_tap_outside={true}
              context="signup"
              ux_mode="popup"
              itp_support={true}
            />
          </div>

          <div className="text-center text-secondary-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
              Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
