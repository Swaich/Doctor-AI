import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { toast } from 'react-toastify';

const DoctorRegisterForm = ({ basicInfo, onComplete }) => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    phone: '',
    gender: '',
    dateOfBirth: '',
    qualification: '',
    specialization: '',
    experience: '',
    medicalRegistrationNumber: '',
    issuingMedicalCouncil: '',
    currentHospitalClinic: '',
    currentWorkingCity: '',
    languagesSpoken: []
  });
  const [files, setFiles] = useState({
    profilePhoto: null,
    degreeDocument: null,
    licenseDocument: null,
    idProof: null
  });
  const [languageInput, setLanguageInput] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories...');
      const response = await api.get('/categories');
      console.log('Categories response:', response.data);
      setCategories(response.data);
      
      if (response.data.length === 0) {
        console.warn('No categories found in database');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      console.error('Error details:', error.response?.data);
      
      // Set some default categories as fallback
      const fallbackCategories = [
        { _id: 'temp1', name: 'General Physician' },
        { _id: 'temp2', name: 'Cardiologist' },
        { _id: 'temp3', name: 'Dermatologist' },
        { _id: 'temp4', name: 'Pediatrician' },
        { _id: 'temp5', name: 'Gynecologist' }
      ];
      setCategories(fallbackCategories);
    }
  };

  const handleAddLanguage = () => {
    if (languageInput.trim()) {
      setFormData({
        ...formData,
        languagesSpoken: [...formData.languagesSpoken, languageInput.trim()]
      });
      setLanguageInput('');
    }
  };

  const handleRemoveLanguage = (index) => {
    setFormData({
      ...formData,
      languagesSpoken: formData.languagesSpoken.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required files
    if (!files.idProof || !files.degreeDocument || !files.licenseDocument) {
      toast.error('Please upload all required documents');
      return;
    }

    setLoading(true);

    const data = new FormData();
    
    // Add basic info
    data.append('name', basicInfo.name);
    data.append('email', basicInfo.email);
    data.append('password', basicInfo.password);
    data.append('role', 'doctor');
    
    // Add doctor details
    Object.keys(formData).forEach(key => {
      if (key === 'languagesSpoken') {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });

    // Add files
    if (files.profilePhoto) data.append('profilePhoto', files.profilePhoto);
    data.append('idProof', files.idProof);
    data.append('degreeDocument', files.degreeDocument);
    data.append('licenseDocument', files.licenseDocument);

    try {
      // Call combined registration endpoint
      const response = await api.post('/auth/register-doctor', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Registration submitted! Check your email for OTP');
      onComplete(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="doctor-register-form">
      <h2 className="form-section-title">Complete your profile to start practicing</h2>
      
      {/* Personal Information */}
      <div className="form-section">
        <h3>Personal Information</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
              placeholder="+1234567890"
            />
          </div>

          <div className="form-group">
            <label>Gender *</label>
            <select
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              required
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Date of Birth *</label>
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Profile Photo</label>
            <input
              type="file"
              onChange={(e) => setFiles({ ...files, profilePhoto: e.target.files[0] })}
              accept="image/*"
              className="file-input"
            />
          </div>
        </div>
      </div>

      {/* Professional Details */}
      <div className="form-section">
        <h3>Professional Details (Required for Verification)</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Qualification *</label>
            <input
              type="text"
              value={formData.qualification}
              onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
              required
              placeholder="MBBS, MD, MS, BDS, etc."
            />
          </div>

          <div className="form-group">
            <label>Specialization *</label>
            <select
              value={formData.specialization}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              required
            >
              <option value="">Select Specialization</option>
              {categories.map((cat) => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Years of Experience *</label>
            <input
              type="number"
              value={formData.experience}
              onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
              required
              min="0"
              placeholder="5"
            />
          </div>

          <div className="form-group">
            <label>Medical Registration Number (MCI/SMC) *</label>
            <input
              type="text"
              value={formData.medicalRegistrationNumber}
              onChange={(e) => setFormData({ ...formData, medicalRegistrationNumber: e.target.value })}
              required
              placeholder="MED12345"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Issuing Medical Council Name *</label>
          <input
            type="text"
            value={formData.issuingMedicalCouncil}
            onChange={(e) => setFormData({ ...formData, issuingMedicalCouncil: e.target.value })}
            required
            placeholder="e.g., Medical Council"
          />
        </div>
      </div>

      {/* Required Documents */}
      <div className="form-section">
        <h3>Required Documents (Must Upload at Registration)</h3>
        <p className="form-note">All documents are required for verification. Accepted formats: PDF, JPG, PNG</p>
        
        <div className="form-group">
          <label>Government ID *</label>
          <input
            type="file"
            onChange={(e) => setFiles({ ...files, idProof: e.target.files[0] })}
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="file-input"
          />
          <small>Upload your any government-issued ID</small>
        </div>

        <div className="form-group">
          <label>Degree Certificate *</label>
          <input
            type="file"
            onChange={(e) => setFiles({ ...files, degreeDocument: e.target.files[0] })}
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="file-input"
          />
          <small>Upload your medical degree certificate (MBBS, MD, etc.)</small>
        </div>

        <div className="form-group">
          <label>Medical License Certificate *</label>
          <input
            type="file"
            onChange={(e) => setFiles({ ...files, licenseDocument: e.target.files[0] })}
            accept=".pdf,.jpg,.jpeg,.png"
            required
            className="file-input"
          />
          <small>Upload your medical council registration/license certificate</small>
        </div>
      </div>

      {/* Current Practice */}
      <div className="form-section">
        <h3>Current Practice</h3>
        
        <div className="form-row">
          <div className="form-group">
            <label>Current Hospital/Clinic Name *</label>
            <input
              type="text"
              value={formData.currentHospitalClinic}
              onChange={(e) => setFormData({ ...formData, currentHospitalClinic: e.target.value })}
              required
              placeholder="Hospital/Clinic Name"
            />
          </div>

          <div className="form-group">
            <label>Current Working City *</label>
            <input
              type="text"
              value={formData.currentWorkingCity}
              onChange={(e) => setFormData({ ...formData, currentWorkingCity: e.target.value })}
              required
              placeholder="New York"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Languages Spoken *</label>
          <div className="language-input">
            <input
              type="text"
              value={languageInput}
              onChange={(e) => setLanguageInput(e.target.value)}
              placeholder="Enter language and click Add"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
            />
            <button type="button" onClick={handleAddLanguage} className="btn-add">
              Add
            </button>
          </div>
          <div className="language-tags">
            {formData.languagesSpoken.map((lang, index) => (
              <span key={index} className="language-tag">
                {lang}
                <button type="button" onClick={() => handleRemoveLanguage(index)}>×</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Important Information */}
      <div className="form-section">
        <div className="info-box">
          <h3>📋 Important Information</h3>
          <ul>
            <li>✅ All fields marked with * are mandatory</li>
            <li>✅ Your registration will be reviewed by our admin team</li>
            <li>✅ You will receive an email once your profile is approved</li>
            <li>✅ You cannot login until admin approves your registration</li>
            <li>✅ After approval, you can update consultation details, fees, and slots</li>
          </ul>
        </div>
      </div>

      <button type="submit" className="btn-auth-primary btn-large" disabled={loading}>
        {loading ? 'Submitting Registration...' : 'Submit Registration for Approval'}
      </button>
    </form>
  );
};

export default DoctorRegisterForm;
