import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { Mail, Stethoscope } from 'lucide-react';


const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { verifyOTP } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, email } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) {
      toast.error('Invalid verification link');
      return;
    }

    setLoading(true);
    try {
      const user = await verifyOTP(userId, otp);
      toast.success('Account verified successfully!');
      
      // If doctor, redirect to complete registration
      if (user.role === 'doctor') {
        toast.info('Please complete your doctor registration');
        navigate('/doctor/register');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-secondary-50 to-secondary-100 p-4">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="card-body">
          <div className="flex items-center justify-center gap-3 mb-8">
            <Stethoscope className="w-8 h-8 text-primary-500" />
            <h2 className="text-xl font-bold text-secondary-900">MegaHealth</h2>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <Mail className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-secondary-900 mb-2">Verify OTP</h1>
            <p className="text-secondary-600">Enter the OTP sent to {email}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label">OTP Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="form-input text-center text-2xl tracking-widest font-mono"
                required
                maxLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary w-full" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>

          <div className="text-center mt-6 text-secondary-600">
            Didn't receive OTP?{' '}
            <button className="text-primary-600 hover:text-primary-700 font-semibold">
              Resend
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTP;
