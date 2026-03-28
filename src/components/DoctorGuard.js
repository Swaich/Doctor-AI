import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import Layout from './Layout';


const DoctorGuard = ({ children }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [doctorProfile, setDoctorProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDoctorStatus();
  }, []);

  const checkDoctorStatus = async () => {
    try {
      const response = await api.get('/doctors/my-profile');
      setDoctorProfile(response.data);
    } catch (error) {
      setDoctorProfile(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </Layout>
    );
  }

  // If no doctor profile exists, show registration prompt
  if (!doctorProfile) {
    return (
      <Layout>
        <div className="doctor-guard-block">
          <div className="block-icon">🔒</div>
          <h1>Complete Your Registration</h1>
          <p>You need to complete your doctor registration before accessing this feature.</p>
          
          <div className="steps-container">
            <h3>Registration Steps:</h3>
            <div className="step">
              <span className="step-number">1</span>
              <div className="step-content">
                <h4>Complete Registration Form</h4>
                <p>Fill in your professional details and upload required documents</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">2</span>
              <div className="step-content">
                <h4>Wait for Admin Approval</h4>
                <p>Our team will review your application</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">3</span>
              <div className="step-content">
                <h4>Receive Email Notification</h4>
                <p>You'll get an email when your application is approved</p>
              </div>
            </div>
            <div className="step">
              <span className="step-number">4</span>
              <div className="step-content">
                <h4>Access All Features</h4>
                <p>Start managing slots and accepting consultations</p>
              </div>
            </div>
          </div>

          <button 
            onClick={() => navigate('/doctor/register')}
            className="btn-register"
          >
            Complete Registration Now
          </button>
        </div>
      </Layout>
    );
  }

  // If profile exists but not approved, show pending message
  if (doctorProfile.status !== 'approved' || !doctorProfile.isApproved) {
    const isPending = doctorProfile.status === 'pending';
    const isRejected = doctorProfile.status === 'rejected';

    return (
      <Layout>
        <div className="doctor-guard-block">
          {isPending && (
            <>
              <div className="block-icon pending">⏳</div>
              <h1>Registration Under Review</h1>
              <p>Your registration is currently being reviewed by our admin team.</p>
              
              <div className="status-card pending">
                <h3>Current Status: Pending</h3>
                <p>We're reviewing your application and documents. This usually takes 24-48 hours.</p>
                <p>You'll receive an email notification once your application is reviewed.</p>
              </div>

              <div className="info-box">
                <h4>What happens next?</h4>
                <ul>
                  <li>Admin reviews your professional credentials</li>
                  <li>Documents are verified</li>
                  <li>You receive an email with the decision</li>
                  <li>If approved, you can immediately access all features</li>
                </ul>
              </div>

              <p className="help-text">
                Need help? Contact support at <a href={`mailto:${process.env.REACT_APP_SUPPORT_EMAIL || 'support@MegaHealth.com'}`}>support@MegaHealth.com</a>
              </p>
            </>
          )}

          {isRejected && (
            <>
              <div className="block-icon rejected">❌</div>
              <h1>Registration Not Approved</h1>
              <p>Unfortunately, your registration was not approved.</p>
              
              <div className="status-card rejected">
                <h3>Current Status: Rejected</h3>
                {doctorProfile.rejectionReason && (
                  <div className="rejection-reason">
                    <strong>Reason:</strong>
                    <p>{doctorProfile.rejectionReason}</p>
                  </div>
                )}
              </div>

              <div className="info-box">
                <h4>What can you do?</h4>
                <ul>
                  <li>Review the rejection reason above</li>
                  <li>Contact support for clarification</li>
                  <li>Correct any issues mentioned</li>
                  <li>Reapply with updated information</li>
                </ul>
              </div>

              <div className="action-buttons">
                <a 
                  href={`mailto:${process.env.REACT_APP_SUPPORT_EMAIL || 'support@MegaHealth.com'}`}
                  className="btn-contact"
                >
                  Contact Support
                </a>
                <button 
                  onClick={() => navigate('/doctor/register')}
                  className="btn-reapply"
                >
                  Update & Reapply
                </button>
              </div>
            </>
          )}
        </div>
      </Layout>
    );
  }

  // If approved, render the protected content
  return <>{children}</>;
};

export default DoctorGuard;
