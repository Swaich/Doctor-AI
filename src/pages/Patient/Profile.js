import React, { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';
import { toast } from 'react-toastify';


const Profile = () => {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    location: { city: '', state: '', country: '' },
    bloodGroup: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    medicalHistory: {
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
      previousSurgeries: []
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  // Phone number validation function
  const validatePhoneNumber = (phone) => {
    if (!phone) return true; // Phone is optional in some cases
    const cleanPhone = phone.replace(/[^\d]/g, ''); // Remove all non-digits
    return cleanPhone.length >= 7 && cleanPhone.length <= 15; // International standard
  };

  // Age validation function
  const validateAge = (age) => {
    const numAge = parseInt(age);
    return !isNaN(numAge) && numAge >= 1 && numAge <= 120;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate age
    if (profile.age && !validateAge(profile.age)) {
      toast.error('Please enter a valid age between 1 and 120 years');
      return;
    }
    
    // Validate main phone number
    if (profile.phone && !validatePhoneNumber(profile.phone)) {
      toast.error('Please enter a valid phone number (7-15 digits)');
      return;
    }
    
    // Validate emergency contact phone number
    if (profile.emergencyContact?.phone && !validatePhoneNumber(profile.emergencyContact.phone)) {
      toast.error('Please enter a valid emergency contact phone number (7-15 digits)');
      return;
    }
    
    // Validate date of birth
    if (profile.dateOfBirth) {
      const selectedDate = new Date(profile.dateOfBirth);
      const today = new Date();
      
      if (selectedDate > today) {
        toast.error('Date of birth cannot be in the future');
        return;
      }
    }
    
    try {
      await api.put('/users/profile', profile);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  if (loading) return (
    <Layout>
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        <span className="ml-3 text-secondary-600">Loading...</span>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-secondary-900 mb-2">My Profile</h1>
          <p className="text-sm sm:text-base text-secondary-600">Manage your personal information and preferences</p>
        </div>

        <div className="card">
          <div className="card-header p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-secondary-900">Personal Information</h2>
          </div>
          <div className="card-body p-4 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  required
                  className="form-input"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">Age *</label>
                  <input
                    type="number"
                    value={profile.age || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers and limit to reasonable age range
                      if (value === '' || (parseInt(value) >= 1 && parseInt(value) <= 120)) {
                        setProfile({ ...profile, age: value });
                      }
                    }}
                    onBlur={(e) => {
                      const age = e.target.value;
                      if (age && !validateAge(age)) {
                        toast.error('Please enter a valid age between 1 and 120 years');
                      }
                    }}
                    className="form-input text-sm sm:text-base"
                    placeholder="Enter your age"
                    min="1"
                    max="120"
                    required
                  />
                  {/* <p className="text-xs text-gray-500 mt-1">
                    Age must be between 1 and 120 years
                  </p> */}
                </div>

                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">Date of Birth</label>
                  <input
                    type="date"
                    value={profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''}
                    onChange={(e) => {
                      const selectedDate = new Date(e.target.value);
                      const today = new Date();
                      
                      if (selectedDate > today) {
                        toast.error('Date of birth cannot be in the future');
                        return;
                      }
                      setProfile({ ...profile, dateOfBirth: e.target.value });
                    }}
                    max={new Date().toISOString().split('T')[0]} // Prevent future dates
                    min={new Date(new Date().getFullYear() - 120, 0, 1).toISOString().split('T')[0]} // Max 120 years old
                    className="form-input text-sm sm:text-base"
                  />
                  {/* <p className="text-xs text-gray-500 mt-1">
                    Cannot select future dates
                  </p> */}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">Gender *</label>
                  <select
                    value={profile.gender || ''}
                    onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                    className="form-input text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">Blood Group</label>
                  <select
                    value={profile.bloodGroup || ''}
                    onChange={(e) => setProfile({ ...profile, bloodGroup: e.target.value })}
                    className="form-input text-sm sm:text-base"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">Phone Number *</label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => {
                      // Only allow numbers, +, -, (, ), and spaces
                      const value = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                      setProfile({ ...profile, phone: value });
                    }}
                    onBlur={(e) => {
                      // Basic phone number validation (at least 7 digits)
                      const phone = e.target.value.replace(/[^\d]/g, ''); // Remove all non-digits
                      if (phone && phone.length < 7) {
                        toast.error('Please enter a valid phone number with at least 7 digits');
                      }
                    }}
                    className="form-input text-sm sm:text-base"
                    placeholder="+92 300 1234567"
                    maxLength="20"
                    required
                  />
                  {/* <p className="text-xs text-gray-500 mt-1">
                    Enter your phone number
                  </p> */}
                </div>

                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">City *</label>
                  <input
                    type="text"
                    value={profile.location?.city || ''}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      location: { ...profile.location, city: e.target.value }
                    })}
                    className="form-input text-sm sm:text-base"
                    placeholder="Enter your city"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">State</label>
                  <input
                    type="text"
                    value={profile.location?.state || ''}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      location: { ...profile.location, state: e.target.value }
                    })}
                    className="form-input text-sm sm:text-base"
                    placeholder="Enter your state"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">Country</label>
                  <input
                    type="text"
                    value={profile.location?.country || ''}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      location: { ...profile.location, country: e.target.value }
                    })}
                    className="form-input text-sm sm:text-base"
                    placeholder="Enter your country"
                  />
                </div>
              </div>

              {/* Emergency Contact Section */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold text-secondary-900 mb-4">Emergency Contact</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">Contact Name</label>
                    <input
                      type="text"
                      value={profile.emergencyContact?.name || ''}
                      onChange={(e) => setProfile({ 
                        ...profile, 
                        emergencyContact: { ...profile.emergencyContact, name: e.target.value }
                      })}
                      className="form-input text-sm sm:text-base"
                      placeholder="Emergency contact name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label text-sm sm:text-base">Contact Phone</label>
                    <input
                      type="tel"
                      value={profile.emergencyContact?.phone || ''}
                      onChange={(e) => {
                        // Only allow numbers, +, -, (, ), and spaces
                        const value = e.target.value.replace(/[^0-9+\-\s()]/g, '');
                        setProfile({ 
                          ...profile, 
                          emergencyContact: { ...profile.emergencyContact, phone: value }
                        });
                      }}
                      onBlur={(e) => {
                        // Basic phone number validation (at least 7 digits)
                        const phone = e.target.value.replace(/[^\d]/g, ''); // Remove all non-digits
                        if (phone && phone.length < 7) {
                          toast.error('Please enter a valid emergency contact phone number with at least 7 digits');
                        }
                      }}
                      className="form-input text-sm sm:text-base"
                      placeholder="+92 300 1234567 "
                      maxLength="20"
                    />
                    {/* <p className="text-xs text-gray-500 mt-1">
                      Enter emergency contact phone number (any country format accepted)
                    </p> */}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label text-sm sm:text-base">Relationship</label>
                  <input
                    type="text"
                    value={profile.emergencyContact?.relationship || ''}
                    onChange={(e) => setProfile({ 
                      ...profile, 
                      emergencyContact: { ...profile.emergencyContact, relationship: e.target.value }
                    })}
                    className="form-input text-sm sm:text-base"
                    placeholder="Relationship (e.g., Spouse, Parent, Sibling)"
                  />
                </div>
              </div>

              <div className="pt-4">
                <button type="submit" className="btn btn-primary w-full sm:w-auto text-sm sm:text-base">
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
