import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { GoogleLogin } from '@react-oauth/google';
import { Stethoscope, ArrowLeft } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Show message from navigation state
  useEffect(() => {
    if (location.state?.message) {
      toast.info(location.state.message, { autoClose: 8000 });
    }
  }, [location.state]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const result = await loginWithGoogle(credentialResponse.credential);
      
      // Check if user needs to select role
      if (result.needsRoleSelection) {
        navigate('/role-selection', { 
          state: { googleUserData: result.googleUserData } 
        });
        return;
      }
      
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Google login failed');
    }
  };

  const handleGoogleError = () => {
    toast.error('Google login failed');
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
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Welcome Back</h1>
            <p className="text-secondary-600">Login to access your healthcare dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="form-input"
                required
              />
              <div className="text-right mt-2">
                <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                  Forgot Password?
                </Link>
              </div>
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
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
              text="signin_with"
              shape="rectangular"
              logo_alignment="left"
              auto_select={false}
              cancel_on_tap_outside={true}
              context="signin"
              ux_mode="popup"
              itp_support={true}
            />
          </div>

          <div className="text-center text-secondary-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
