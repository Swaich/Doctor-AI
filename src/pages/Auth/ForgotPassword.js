import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      toast.success('OTP sent to your email');
      setStep(2);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post('/auth/verify-reset-otp', { email, otp });
      toast.success('OTP verified successfully');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      toast.success('Password reset successfully! Please login');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-purple-50 to-success-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-secondary-900 mb-2">Reset Password</h1>
          <p className="text-secondary-600">
            {step === 1 && 'Enter your email to receive OTP'}
            {step === 2 && 'Enter the OTP sent to your email'}
            {step === 3 && 'Create your new password'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-primary-500 text-white' : 'bg-secondary-200 text-secondary-500'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="text-xs mt-2 text-secondary-600">Email</span>
            </div>
            <div className={`flex-1 h-1 ${step >= 2 ? 'bg-primary-500' : 'bg-secondary-200'}`}></div>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-primary-500 text-white' : 'bg-secondary-200 text-secondary-500'}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className="text-xs mt-2 text-secondary-600">Verify</span>
            </div>
            <div className={`flex-1 h-1 ${step >= 3 ? 'bg-primary-500' : 'bg-secondary-200'}`}></div>
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 3 ? 'bg-primary-500 text-white' : 'bg-secondary-200 text-secondary-500'}`}>
                3
              </div>
              <span className="text-xs mt-2 text-secondary-600">Reset</span>
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-secondary-100">
          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-6">
              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your registered email"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending OTP...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Send OTP
                  </span>
                )}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-primary-800">
                  <span className="font-semibold">OTP sent to:</span> {email}
                </p>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  placeholder="Enter 6-digit OTP"
                  maxLength="6"
                  className="form-input text-center text-2xl tracking-widest font-bold"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>

              <button
                type="button"
                className="btn btn-secondary w-full"
                onClick={() => setStep(1)}
              >
                ← Change Email
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-success-800 flex items-center gap-2">
                  <span className="text-lg">✅</span>
                  <span><span className="font-semibold">OTP Verified!</span> Now create your new password</span>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  placeholder="Enter new password"
                  minLength="6"
                  className="form-input"
                />
                <p className="text-xs text-secondary-500 mt-1">Minimum 6 characters</p>
              </div>

              <div className="form-group">
                <label className="form-label flex items-center gap-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm new password"
                  minLength="6"
                  className="form-input"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full btn-lg" disabled={loading}>
                {loading ? 'Resetting...' : (
                  <span className="flex items-center justify-center gap-2">
                    Reset Password
                  </span>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-secondary-600">
            Remember your password?{' '}
            <button onClick={() => navigate('/login')} className="text-primary-600 hover:text-primary-700 font-semibold">
              Login here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
