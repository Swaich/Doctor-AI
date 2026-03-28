import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const DoctorRegister = () => {
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    phone: '',
    gender: '',
    dateOfBirth: '',
    medicalRegistrationNumber: '',
    issuingMedicalCouncil: '',
    qualification: '',
    specialization: '',
    experience: '',
    currentHospitalClinic: '',
    currentWorkingCity: '',
    languagesSpoken: [],
    about: '',
    registrationType: 'online',
    education: [{ degree: '', institution: '', year: '' }]
  });
  const [files, setFiles] = useState({
    profilePhoto: null,
    degreeDocument: null,
    licenseDocument: null,
    idProof: null
  });
  const [filePreviews, setFilePreviews] = useState({
    profilePhoto: null,
    degreeDocument: null,
    licenseDocument: null,
    idProof: null
  });
  const [languageInput, setLanguageInput] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchCategories();
  }, []);

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      Object.values(filePreviews).forEach(url => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [filePreviews]);

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

  const handleFileChange = (fileType, file) => {
    setFiles({ ...files, [fileType]: file });
    
    if (file) {
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const previewUrl = URL.createObjectURL(file);
        setFilePreviews({ ...filePreviews, [fileType]: previewUrl });
      } else {
        setFilePreviews({ ...filePreviews, [fileType]: null });
      }
    } else {
      setFilePreviews({ ...filePreviews, [fileType]: null });
    }
  };

  const removeFile = (fileType) => {
    setFiles({ ...files, [fileType]: null });
    if (filePreviews[fileType]) {
      URL.revokeObjectURL(filePreviews[fileType]);
    }
    setFilePreviews({ ...filePreviews, [fileType]: null });
  };

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    const cleanPhone = phone.replace(/[^\d]/g, ''); // Remove all non-digits
    return cleanPhone.length >= 7 && cleanPhone.length <= 15; // International standard
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate phone number before submission
    if (!validatePhoneNumber(formData.phone)) {
      toast.error('Please enter a valid phone number (7-15 digits)');
      return;
    }

    // Validate date of birth
    const selectedDate = new Date(formData.dateOfBirth);
    const today = new Date();
    const minAge = new Date();
    minAge.setFullYear(today.getFullYear() - 18);
    
    if (selectedDate > today) {
      toast.error('Date of birth cannot be in the future');
      return;
    }
    if (selectedDate > minAge) {
      toast.error('You must be at least 18 years old to register as a doctor');
      return;
    }

    // Validate languages
    if (formData.languagesSpoken.length === 0) {
      toast.error('Please add at least one language you can communicate in');
      return;
    }

    const data = new FormData();
    
    // Add all form fields
    Object.keys(formData).forEach(key => {
      if (key === 'education' || key === 'languagesSpoken') {
        data.append(key, JSON.stringify(formData[key]));
      } else {
        data.append(key, formData[key]);
      }
    });

    // Add files
    if (files.profilePhoto) data.append('profilePhoto', files.profilePhoto);
    if (files.degreeDocument) data.append('degreeDocument', files.degreeDocument);
    if (files.licenseDocument) data.append('licenseDocument', files.licenseDocument);
    if (files.idProof) data.append('idProof', files.idProof);

    try {
      await api.post('/doctors/register', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success('Registration submitted successfully!', { autoClose: 5000 });
      toast.info('Your registration is pending admin approval. You will receive an email once approved.', { autoClose: 8000 });
      toast.warning('You cannot login until your registration is approved by admin.', { autoClose: 8000 });
      
      // Logout user
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Your doctor registration is pending approval. You will receive an email once approved. You cannot login until then.' 
          }
        });
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <Layout>
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Header Section */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mb-4">
            <span className="text-white font-bold text-lg sm:text-xl">MD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Doctor Registration</h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            Complete your profile to start practicing on our platform. All information will be verified by our admin team.
          </p>
        </div>

        {/* Progress Indicator */}
        <div className="card bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200">
          <div className="card-body p-4 sm:p-6">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
                <span className="font-medium text-gray-900 hidden sm:inline">Personal Info</span>
              </div>
              <div className="flex-1 h-1 bg-blue-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">2</div>
                <span className="font-medium text-gray-900 hidden sm:inline">Professional</span>
              </div>
              <div className="flex-1 h-1 bg-blue-200 mx-2"></div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">3</div>
                <span className="font-medium text-gray-900 hidden sm:inline">Documents</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Personal Information */}
            <div className="card border-l-4 border-l-blue-500 shadow-lg">
              <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-base">01</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Personal Information</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Basic details about yourself</p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4 sm:p-6 space-y-4 sm:space-y-6">
              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Phone Number <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => {
                        // Only allow numbers, +, -, (, ), and spaces
                        const value = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                        setFormData({ ...formData, phone: value });
                      }}
                      onBlur={(e) => {
                        // Basic phone number validation (at least 7 digits)
                        const phone = e.target.value.replace(/[^\d]/g, ''); // Remove all non-digits
                        if (phone && phone.length < 7) {
                          toast.error('Please enter a valid phone number with at least 7 digits');
                        }
                      }}
                      required
                      placeholder="+92 300 1234567"
                      className="form-input text-sm sm:text-base"
                      maxLength="20"
                    />
                  
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Gender <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.gender}
                        onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                        required
                        className="w-full px-4 py-3 text-sm sm:text-base text-gray-700 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Date of Birth <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => {
                        const selectedDate = new Date(e.target.value);
                        const today = new Date();
                        const minAge = new Date();
                        minAge.setFullYear(today.getFullYear() - 18); // Minimum 18 years old
                        
                        if (selectedDate > today) {
                          toast.error('Date of birth cannot be in the future');
                          return;
                        }
                        if (selectedDate > minAge) {
                          toast.error('You must be at least 18 years old to register as a doctor');
                          return;
                        }
                        setFormData({ ...formData, dateOfBirth: e.target.value });
                      }}
                      required
                      max={new Date().toISOString().split('T')[0]} // Prevent future dates
                      min={new Date(new Date().getFullYear() - 80, 0, 1).toISOString().split('T')[0]} // Max 80 years old
                      className="form-input text-sm sm:text-base"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      You must be at least 18 years old to register as a doctor
                    </p>
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Profile Photo <span className="text-gray-400 text-xs">(Optional)</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="profilePhoto"
                        onChange={(e) => handleFileChange('profilePhoto', e.target.files[0])}
                        accept="image/*"
                        className="hidden"
                      />
                      <label
                        htmlFor="profilePhoto"
                        className="flex items-center justify-center w-full px-4 py-3 text-sm sm:text-base text-gray-700 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 cursor-pointer transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {files.profilePhoto ? files.profilePhoto.name : 'Choose Profile Photo'}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload your profile photo (Max 2MB)</p>
                    {files.profilePhoto && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-medium text-green-700 truncate">{files.profilePhoto.name}</p>
                            <p className="text-xs text-green-600">Size: {(files.profilePhoto.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('profilePhoto')}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        {filePreviews.profilePhoto && (
                          <div className="mt-3">
                            <img
                              src={filePreviews.profilePhoto}
                              alt="Profile Preview"
                              className="w-32 h-32 object-cover rounded-lg border-2 border-blue-200"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Professional Details */}
            <div className="card border-l-4 border-l-blue-600 shadow-lg">
              <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-base">02</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Professional Details</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Required for verification</p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4 sm:p-6 space-y-4 sm:space-y-6">
              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Qualification <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.qualification}
                      onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                      required
                      placeholder="MBBS, MD, MS, BDS, etc."
                      className="form-input text-sm sm:text-base"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Specialization <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        required
                        className="w-full px-4 py-3 text-sm sm:text-base text-gray-700 bg-white border-2 border-blue-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 appearance-none cursor-pointer"
                      >
                        <option value="">Select Specialization</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Years of Experience <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="number"
                      value={formData.experience}
                      onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                      required
                      min="0"
                      placeholder="5"
                      className="form-input text-sm sm:text-base"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Medical Registration Number <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.medicalRegistrationNumber}
                      onChange={(e) => setFormData({ ...formData, medicalRegistrationNumber: e.target.value })}
                      required
                      placeholder="MED12345"
                      className="form-input text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">
                    <span className="flex items-center gap-2">
                      Issuing Medical Council Name <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    value={formData.issuingMedicalCouncil}
                    onChange={(e) => setFormData({ ...formData, issuingMedicalCouncil: e.target.value })}
                    required
                    placeholder="e.g., Medical Council"
                    className="form-input text-sm sm:text-base"
                  />
                </div>
              </div>
            </div>

            {/* Required Documents */}
            <div className="card border-l-4 border-l-blue-700 shadow-lg">
              <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-700 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-base">03</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Required Documents</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Must upload at registration</p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg">
                  <p className="text-xs sm:text-sm text-blue-800 font-medium">
                    Important: All documents are required for verification. Accepted formats: PDF, JPG, PNG (Max 5MB each)
                  </p>
                </div>
              
                <div className="space-y-4 sm:space-y-5">
                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Government ID <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="idProof"
                        onChange={(e) => handleFileChange('idProof', e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        className="hidden"
                      />
                      <label
                        htmlFor="idProof"
                        className="flex items-center justify-center w-full px-4 py-3 text-sm sm:text-base text-gray-700 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 cursor-pointer transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {files.idProof ? files.idProof.name : 'Choose Government ID Document'}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload any government-issued ID (Max 5MB)</p>
                    {files.idProof && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-medium text-green-700 truncate">{files.idProof.name}</p>
                            <p className="text-xs text-green-600">Size: {(files.idProof.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p className="text-xs text-blue-600 mt-1">Type: {files.idProof.type.includes('pdf') ? 'PDF Document' : 'Image File'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('idProof')}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        {filePreviews.idProof && (
                          <div className="mt-3">
                            <img
                              src={filePreviews.idProof}
                              alt="ID Document Preview"
                              className="max-w-full h-48 object-contain rounded-lg border-2 border-blue-200 bg-white"
                            />
                          </div>
                        )}
                        {files.idProof && files.idProof.type.includes('pdf') && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                            <p className="text-sm text-blue-700">PDF Preview not available - File ready for upload</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Degree Certificate <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="degreeDocument"
                        onChange={(e) => handleFileChange('degreeDocument', e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        className="hidden"
                      />
                      <label
                        htmlFor="degreeDocument"
                        className="flex items-center justify-center w-full px-4 py-3 text-sm sm:text-base text-gray-700 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 cursor-pointer transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        {files.degreeDocument ? files.degreeDocument.name : 'Choose Degree Certificate'}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload your medical degree certificate (MBBS, MD, etc.) (Max 5MB)</p>
                    {files.degreeDocument && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-medium text-green-700 truncate">{files.degreeDocument.name}</p>
                            <p className="text-xs text-green-600">Size: {(files.degreeDocument.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p className="text-xs text-blue-600 mt-1">Type: {files.degreeDocument.type.includes('pdf') ? 'PDF Document' : 'Image File'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('degreeDocument')}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        {filePreviews.degreeDocument && (
                          <div className="mt-3">
                            <img
                              src={filePreviews.degreeDocument}
                              alt="Degree Certificate Preview"
                              className="max-w-full h-48 object-contain rounded-lg border-2 border-blue-200 bg-white"
                            />
                          </div>
                        )}
                        {files.degreeDocument && files.degreeDocument.type.includes('pdf') && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                            <p className="text-sm text-blue-700">PDF Preview not available - File ready for upload</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Medical License Certificate <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        id="licenseDocument"
                        onChange={(e) => handleFileChange('licenseDocument', e.target.files[0])}
                        accept=".pdf,.jpg,.jpeg,.png"
                        required
                        className="hidden"
                      />
                      <label
                        htmlFor="licenseDocument"
                        className="flex items-center justify-center w-full px-4 py-3 text-sm sm:text-base text-gray-700 bg-white border-2 border-blue-200 rounded-lg hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-200 cursor-pointer transition-all duration-200"
                      >
                        <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        {files.licenseDocument ? files.licenseDocument.name : 'Choose Medical License Certificate'}
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Upload your medical council registration/license certificate (Max 5MB)</p>
                    {files.licenseDocument && (
                      <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className="flex-1">
                            <p className="text-xs sm:text-sm font-medium text-green-700 truncate">{files.licenseDocument.name}</p>
                            <p className="text-xs text-green-600">Size: {(files.licenseDocument.size / 1024 / 1024).toFixed(2)} MB</p>
                            <p className="text-xs text-blue-600 mt-1">Type: {files.licenseDocument.type.includes('pdf') ? 'PDF Document' : 'Image File'}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile('licenseDocument')}
                            className="text-red-500 hover:text-red-700 text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                        {filePreviews.licenseDocument && (
                          <div className="mt-3">
                            <img
                              src={filePreviews.licenseDocument}
                              alt="License Certificate Preview"
                              className="max-w-full h-48 object-contain rounded-lg border-2 border-blue-200 bg-white"
                            />
                          </div>
                        )}
                        {files.licenseDocument && files.licenseDocument.type.includes('pdf') && (
                          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                            <p className="text-sm text-blue-700">PDF Preview not available - File ready for upload</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Practice */}
            <div className="card border-l-4 border-l-blue-800 shadow-lg">
              <div className="card-header bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-blue-800 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-base">04</span>
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Current Practice</h2>
                    <p className="text-xs sm:text-sm text-gray-600">Where you currently work</p>
                  </div>
                </div>
              </div>
              <div className="card-body p-4 sm:p-6 space-y-4 sm:space-y-6">
              
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Current Hospital/Clinic Name <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.currentHospitalClinic}
                      onChange={(e) => setFormData({ ...formData, currentHospitalClinic: e.target.value })}
                      required
                      placeholder="Hospital/Clinic Name"
                      className="form-input text-sm sm:text-base"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">
                      <span className="flex items-center gap-2">
                        Current Working City <span className="text-red-500">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      value={formData.currentWorkingCity}
                      onChange={(e) => setFormData({ ...formData, currentWorkingCity: e.target.value })}
                      required
                      placeholder="City Name"
                      className="form-input text-sm sm:text-base"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">
                    <span className="flex items-center gap-2">
                      Languages Spoken <span className="text-red-500">*</span>
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={languageInput}
                      onChange={(e) => setLanguageInput(e.target.value)}
                      placeholder="Enter language and press Enter or click Add"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLanguage())}
                      className="form-input flex-1 text-sm sm:text-base"
                    />
                    <button type="button" onClick={handleAddLanguage} className="btn bg-blue-500 hover:bg-blue-600 text-white whitespace-nowrap text-sm">
                      + Add
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.languagesSpoken.map((lang, index) => (
                      <span key={index} className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                        {lang}
                        <button 
                          type="button" 
                          onClick={() => handleRemoveLanguage(index)}
                          className="hover:bg-blue-200 rounded-full w-5 h-5 flex items-center justify-center transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {formData.languagesSpoken.length === 0 && (
                    <p className="text-xs text-gray-500 mt-2">Add at least one language you can communicate in</p>
                  )}
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="card border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg">
              <div className="card-body p-4 sm:p-6">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-sm sm:text-base">INFO</span>
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">Important Information</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Please read carefully before submitting</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Required:</span>
                    <p className="text-xs sm:text-sm text-gray-700">All fields marked with <span className="text-red-500 font-bold">*</span> are mandatory</p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Review:</span>
                    <p className="text-xs sm:text-sm text-gray-700">Your registration will be reviewed by our admin team</p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Email:</span>
                    <p className="text-xs sm:text-sm text-gray-700">You will receive an email once your profile is approved</p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Access:</span>
                    <p className="text-xs sm:text-sm text-gray-700">You cannot login until admin approves your registration</p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Settings:</span>
                    <p className="text-xs sm:text-sm text-gray-700">After approval, you can update consultation details, fees, and slots</p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Security:</span>
                    <p className="text-xs sm:text-sm text-gray-700">All documents are securely stored and encrypted in our database</p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-blue-200">
                    <span className="text-blue-600 text-sm font-medium flex-shrink-0">Formats:</span>
                    <p className="text-xs sm:text-sm text-gray-700">Supported formats: PDF, JPG, PNG (Max 5MB per file)</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center pt-4 pb-24">
              <button 
                type="submit" 
                className="relative w-full sm:w-auto bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold text-base sm:text-lg px-8 sm:px-12 py-4 sm:py-5 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-2 border-blue-700"
              >
                <span className="flex items-center justify-center gap-3">
                  <span>Submit Registration for Approval</span>
                </span>
                <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 rounded-xl transition-opacity duration-300"></div>
              </button>
            </div>
            
            {/* Bottom spacing to avoid MedBot overlap */}
            <div className="h-8"></div>
          </form>
        </div>
    </Layout>
  );
};

export default DoctorRegister;
