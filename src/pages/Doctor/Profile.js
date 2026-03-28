import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import MyDocuments from '../../components/MyDocuments';
import api from '../../utils/api';
import { toast } from 'react-toastify';
import { 
  FiEdit3, 
  FiSave, 
  FiX, 
  FiUser, 
  FiMail, 
  FiPhone, 
  FiMapPin, 
  FiCalendar, 
  FiAward, 
  FiBook,
  FiCamera,
  FiCheck,
  FiClock
} from 'react-icons/fi';

const DoctorProfile = () => {
  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingPersonal, setEditingPersonal] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  
  const [formData, setFormData] = useState({
    consultationModes: { video: true, physical: false },
    consultationFee: { video: 10, physical: 15 },
    about: '',
    availableDays: [],
    maxPatientsPerDay: 10,
    followUpPolicy: '',
    isAvailable: true
  });
  
  const [personalData, setPersonalData] = useState({
    name: '',
    email: '',
    phone: '',
    currentHospitalClinic: '',
    currentWorkingCity: '',
    languagesSpoken: [],
    about: ''
  });

  const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchDoctorProfile();
  }, []);

  const fetchDoctorProfile = async () => {
    try {
      const response = await api.get('/doctors/me/profile');
      setDoctor(response.data);
      
      setFormData({
        consultationModes: response.data.consultationModes || { video: true, physical: false },
        consultationFee: response.data.consultationFee || { video: 10, physical: 15 },
        about: response.data.about || '',
        availableDays: response.data.availableDays || [],
        maxPatientsPerDay: response.data.maxPatientsPerDay || 10,
        followUpPolicy: response.data.followUpPolicy || '',
        isAvailable: response.data.isAvailable !== undefined ? response.data.isAvailable : true
      });
      
      setPersonalData({
        name: response.data.userId?.name || '',
        email: response.data.userId?.email || '',
        phone: response.data.phone || '',
        currentHospitalClinic: response.data.currentHospitalClinic || '',
        currentWorkingCity: response.data.currentWorkingCity || '',
        languagesSpoken: response.data.languagesSpoken || [],
        about: response.data.about || ''
      });
    } catch (error) {
      toast.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDayToggle = (day) => {
    const days = formData.availableDays.includes(day)
      ? formData.availableDays.filter(d => d !== day)
      : [...formData.availableDays, day];
    setFormData({ ...formData, availableDays: days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/doctors/me/consultation-details', formData);
      toast.success('Consultation details updated successfully');
      setEditing(false);
      fetchDoctorProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  };

  const handlePersonalSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put('/doctors/me/personal-info', personalData);
      toast.success('Personal information updated successfully');
      setEditingPersonal(false);
      fetchDoctorProfile();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update personal information');
    }
  };

  const handleLanguageAdd = (language) => {
    if (language && !personalData.languagesSpoken.includes(language)) {
      setPersonalData({
        ...personalData,
        languagesSpoken: [...personalData.languagesSpoken, language]
      });
    }
  };

  const handleLanguageRemove = (language) => {
    setPersonalData({
      ...personalData,
      languagesSpoken: personalData.languagesSpoken.filter(lang => lang !== language)
    });
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (!profilePhoto) {
      toast.error('Please select a photo');
      return;
    }

    const data = new FormData();
    data.append('profilePhoto', profilePhoto);

    try {
      await api.put('/doctors/me/profile-photo', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Profile photo updated successfully');
      setProfilePhoto(null);
      fetchDoctorProfile();
    } catch (error) {
      toast.error('Failed to update profile photo');
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600">Loading profile...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (!doctor) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <p className="text-gray-600">Profile not found</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!doctor.isApproved) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">⏳</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Pending Approval</h2>
            <p className="text-gray-600 mb-2">Your doctor profile is currently under review by our admin team.</p>
            <p className="text-gray-600 mb-4">You will receive an email notification once your profile is approved.</p>
            <p className="text-sm">
              <span className="font-semibold">Status:</span> 
              <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {doctor.status}
              </span>
            </p>
            {doctor.rejectionReason && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <h4 className="font-semibold text-red-800 mb-2">Rejection Reason:</h4>
                <p className="text-red-700">{doctor.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-1">Manage your professional profile and consultation settings</p>
          </div>
          {!editing && (
            <button 
              onClick={() => setEditing(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FiEdit3 className="w-4 h-4" />
              <span>Edit Consultation Details</span>
            </button>
          )}
        </div>

        {/* Profile Photo Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Photo</h2>
          <div className="flex items-start space-x-6">
            <div className="flex-shrink-0">
              {doctor.profilePhoto && doctor.profilePhoto.data ? (
                <img 
                  src={`data:${doctor.profilePhoto.contentType};base64,${doctor.profilePhoto.data}`}
                  alt="Profile" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-blue-200"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-2xl font-bold text-blue-600 border-4 border-blue-200">
                  {doctor.userId?.name?.charAt(0) || 'D'}
                </div>
              )}
            </div>
            <div className="flex-1">
              <div className="mb-4">
                {doctor.profilePhoto && doctor.profilePhoto.data ? (
                  <div className="space-y-1">
                    <p className="text-green-600 font-medium flex items-center">
                      <FiCheck className="w-4 h-4 mr-1" />
                      Photo Uploaded
                    </p>
                    <p className="text-sm text-gray-500">File: {doctor.profilePhoto.originalName}</p>
                    <p className="text-sm text-gray-500">Size: {(doctor.profilePhoto.size / 1024).toFixed(1)} KB</p>
                  </div>
                ) : (
                  <p className="text-yellow-600 font-medium flex items-center">
                    <FiCamera className="w-4 h-4 mr-1" />
                    No photo uploaded
                  </p>
                )}
              </div>
              
              <form onSubmit={handlePhotoUpload} className="space-y-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProfilePhoto(e.target.files[0])}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {profilePhoto && (
                  <button 
                    type="submit" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    {doctor.profilePhoto && doctor.profilePhoto.data ? 'Update Photo' : 'Upload Photo'}
                  </button>
                )}
              </form>
            </div>
          </div>
        </div> 
       {/* Personal Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Personal Information</h2>
            {doctor.isApproved && !editingPersonal && (
              <button 
                onClick={() => setEditingPersonal(true)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
              >
                <FiEdit3 className="w-4 h-4" />
                <span>Edit</span>
              </button>
            )}
          </div>

          {editingPersonal ? (
            <form onSubmit={handlePersonalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiUser className="inline w-4 h-4 mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={personalData.name}
                    onChange={(e) => setPersonalData({ ...personalData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiMail className="inline w-4 h-4 mr-1" />
                    Email
                  </label>
                  <input
                    type="email"
                    value={personalData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    title="Email cannot be changed"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiPhone className="inline w-4 h-4 mr-1" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={personalData.phone}
                    onChange={(e) => setPersonalData({ ...personalData, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FiMapPin className="inline w-4 h-4 mr-1" />
                    Current Hospital/Clinic
                  </label>
                  <input
                    type="text"
                    value={personalData.currentHospitalClinic}
                    onChange={(e) => setPersonalData({ ...personalData, currentHospitalClinic: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <FiMapPin className="inline w-4 h-4 mr-1" />
                  Current Working City
                </label>
                <input
                  type="text"
                  value={personalData.currentWorkingCity}
                  onChange={(e) => setPersonalData({ ...personalData, currentWorkingCity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Languages Spoken</label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {personalData.languagesSpoken.map((lang, index) => (
                      <span key={index} className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                        {lang}
                        <button
                          type="button"
                          onClick={() => handleLanguageRemove(lang)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Add language and press Enter"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleLanguageAdd(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About / Bio</label>
                <textarea
                  rows="4"
                  value={personalData.about}
                  onChange={(e) => setPersonalData({ ...personalData, about: e.target.value })}
                  placeholder="Tell patients about yourself, your approach to treatment, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setEditingPersonal(false);
                    setPersonalData({
                      name: doctor.userId?.name || '',
                      email: doctor.userId?.email || '',
                      phone: doctor.phone || '',
                      currentHospitalClinic: doctor.currentHospitalClinic || '',
                      currentWorkingCity: doctor.currentWorkingCity || '',
                      languagesSpoken: doctor.languagesSpoken || [],
                      about: doctor.about || ''
                    });
                  }}
                  className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3">
                <FiUser className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{doctor.userId?.name}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiMail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium text-gray-900">{doctor.userId?.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiPhone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-medium text-gray-900">{doctor.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiUser className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900 capitalize">{doctor.gender}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiCalendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900">
                    {doctor.dateOfBirth ? new Date(doctor.dateOfBirth).toLocaleDateString() : 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiMapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Hospital/Clinic</p>
                  <p className="font-medium text-gray-900">{doctor.currentHospitalClinic}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FiMapPin className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Working City</p>
                  <p className="font-medium text-gray-900">{doctor.currentWorkingCity}</p>
                </div>
              </div>
              <div className="md:col-span-2 lg:col-span-3">
                <p className="text-sm text-gray-500 mb-2">Languages Spoken</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.languagesSpoken && doctor.languagesSpoken.length > 0 ? (
                    doctor.languagesSpoken.map((lang, index) => (
                      <span key={index} className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">
                        {lang}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">Not specified</p>
                  )}
                </div>
              </div>
              {doctor.about && (
                <div className="md:col-span-2 lg:col-span-3">
                  <p className="text-sm text-gray-500 mb-2">About</p>
                  <p className="text-gray-900">{doctor.about}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Professional Information Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Professional Details</h2>
          <p className="text-sm text-gray-500 mb-4">Verified information from your registration. Contact admin for changes.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <FiAward className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Qualification</p>
                <p className="font-medium text-gray-900">{doctor.qualification}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FiBook className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Specialization</p>
                <p className="font-medium text-gray-900">{doctor.specialization?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FiCalendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Experience</p>
                <p className="font-medium text-gray-900">{doctor.experience} years</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FiUser className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Registration Number</p>
                <p className="font-medium text-gray-900">{doctor.medicalRegistrationNumber}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FiAward className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Medical Council</p>
                <p className="font-medium text-gray-900">{doctor.issuingMedicalCouncil}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FiCalendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-500">Registration Date</p>
                <p className="font-medium text-gray-900">{new Date(doctor.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Education Details */}
        {doctor.education && doctor.education.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Education</h2>
            <div className="space-y-4">
              {doctor.education.map((edu, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
                  <p className="text-gray-600">{edu.institution}</p>
                  <p className="text-sm text-gray-500">{edu.year}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Account Status & Statistics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Status & Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Approval Status</p>
              {doctor.isApproved ? (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  <FiCheck className="w-4 h-4 mr-1" />
                  Approved
                </span>
              ) : doctor.status === 'rejected' ? (
                <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  <FiX className="w-4 h-4 mr-1" />
                  Rejected
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  <FiClock className="w-4 h-4 mr-1" />
                  Pending
                </span>
              )}
            </div>
            
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Account Status</p>
              {doctor.suspended ? (
                <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  Suspended
                </span>
              ) : doctor.status === 'approved' ? (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Under Review
                </span>
              )}
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Platform Fee</p>
              {doctor.platformFeePaid ? (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Paid (${doctor.registrationFee || 10})
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                  Pending (${doctor.registrationFee || 10})
                </span>
              )}
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Availability</p>
              {doctor.isAvailable ? (
                <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  Available
                </span>
              ) : (
                <span className="inline-flex items-center px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  Unavailable
                </span>
              )}
            </div>

            {doctor.rating > 0 && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Patient Rating</p>
                <p className="font-semibold text-gray-900">⭐ {doctor.rating.toFixed(1)} ({doctor.totalRatings} reviews)</p>
              </div>
            )}

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Total Consultations</p>
              <p className="font-semibold text-gray-900">{doctor.totalConsultations || 0}</p>
            </div>

            {doctor.approvedAt && (
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500 mb-1">Approved Date</p>
                <p className="font-semibold text-gray-900">{new Date(doctor.approvedAt).toLocaleDateString()}</p>
              </div>
            )}

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500 mb-1">Member Since</p>
              <p className="font-semibold text-gray-900">{new Date(doctor.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
          
          {doctor.rejectionReason && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Rejection Reason</h4>
              <p className="text-red-700">{doctor.rejectionReason}</p>
            </div>
          )}
        </div> 
       {/* Consultation Details */}
        {editing ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Consultation Details</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Consultation Modes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Consultation Modes</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.consultationModes.video}
                      onChange={(e) => setFormData({
                        ...formData,
                        consultationModes: { ...formData.consultationModes, video: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">📹 Video Consultation</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.consultationModes.physical}
                      onChange={(e) => setFormData({
                        ...formData,
                        consultationModes: { ...formData.consultationModes, physical: e.target.checked }
                      })}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-900">🏥 Physical Visit</span>
                  </label>
                </div>
              </div>

              {/* Consultation Fees */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Video Consultation Fee (Credits)</label>
                  <input
                    type="number"
                    value={formData.consultationFee.video}
                    onChange={(e) => setFormData({
                      ...formData,
                      consultationFee: { ...formData.consultationFee, video: parseInt(e.target.value) }
                    })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Physical Visit Fee (Credits)</label>
                  <input
                    type="number"
                    value={formData.consultationFee.physical}
                    onChange={(e) => setFormData({
                      ...formData,
                      consultationFee: { ...formData.consultationFee, physical: parseInt(e.target.value) }
                    })}
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* About */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">About / Bio</label>
                <textarea
                  rows="4"
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                  placeholder="Tell patients about yourself, your approach to treatment, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Available Days */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Available Days</label>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                  {weekDays.map(day => (
                    <label key={day} className="flex items-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      <input
                        type="checkbox"
                        checked={formData.availableDays.includes(day)}
                        onChange={() => handleDayToggle(day)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-900">{day.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Max Patients Per Day */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Patients Per Day</label>
                <input
                  type="number"
                  value={formData.maxPatientsPerDay}
                  onChange={(e) => setFormData({ ...formData, maxPatientsPerDay: parseInt(e.target.value) })}
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Follow-up Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Policy (Optional)</label>
                <textarea
                  rows="3"
                  value={formData.followUpPolicy}
                  onChange={(e) => setFormData({ ...formData, followUpPolicy: e.target.value })}
                  placeholder="e.g., Free follow-up within 7 days"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Availability Toggle */}
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isAvailable}
                    onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-900">Currently Available for Consultations</span>
                </label>
              </div>

              {/* Form Actions */}
              <div className="flex space-x-3">
                <button 
                  type="submit" 
                  className="flex items-center space-x-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                >
                  <FiSave className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button 
                  type="button" 
                  onClick={() => setEditing(false)}
                  className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <FiX className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Consultation Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-gray-500">Consultation Modes</p>
                  <p className="font-medium text-gray-900">
                    {doctor.consultationModes?.video && '📹 Video'}
                    {doctor.consultationModes?.video && doctor.consultationModes?.physical && ', '}
                    {doctor.consultationModes?.physical && '🏥 Physical'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-gray-500">Video Fee</p>
                  <p className="font-medium text-gray-900">{doctor.consultationFee?.video} credits</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-gray-500">Physical Fee</p>
                  <p className="font-medium text-gray-900">{doctor.consultationFee?.physical} credits</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-gray-500">Max Patients/Day</p>
                  <p className="font-medium text-gray-900">{doctor.maxPatientsPerDay}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium text-gray-900">
                    {doctor.isAvailable ? '✅ Available' : '❌ Unavailable'}
                  </p>
                </div>
              </div>
            </div>
            
            {doctor.about && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">About</p>
                <p className="text-gray-900">{doctor.about}</p>
              </div>
            )}

            {doctor.availableDays && doctor.availableDays.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-2">Available Days</p>
                <div className="flex flex-wrap gap-2">
                  {doctor.availableDays.map(day => (
                    <span key={day} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {doctor.followUpPolicy && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Follow-up Policy</p>
                <p className="text-gray-900">{doctor.followUpPolicy}</p>
              </div>
            )}
          </div>
        )}

        {/* Documents Section */}
        <MyDocuments 
          doctorId={doctor._id} 
          doctorData={doctor} 
          onDocumentUpdate={fetchDoctorProfile}
        />
      </div>
    </Layout>
  );
};

export default DoctorProfile;