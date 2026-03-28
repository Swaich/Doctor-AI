const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  name: {
    type: String,
    required: true
  },
  age: Number,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female', 'other']
  },
  phone: String,
  location: {
    city: String,
    state: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  profileImage: String,
  // Medical Information
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
  },
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  medicalHistory: {
    allergies: [String],
    chronicConditions: [String],
    currentMedications: [String],
    previousSurgeries: [String]
  },
  // Profile completion tracking
  profileCompleted: {
    type: Boolean,
    default: false
  },
  credits: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: String,
  otpExpiry: Date,
  resetPasswordOTP: String,
  resetPasswordOTPExpiry: Date,
  blocked: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if profile is complete
userSchema.methods.isProfileComplete = function() {
  const requiredFields = [
    'name', 'age', 'gender', 'phone', 'location.city'
  ];
  
  const recommendedFields = [
    'dateOfBirth', 'bloodGroup', 'emergencyContact.name', 'emergencyContact.phone'
  ];
  
  // Check required fields
  const requiredComplete = requiredFields.every(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return this[parent] && this[parent][child];
    }
    return this[field];
  });
  
  // Check recommended fields (at least 2 should be filled)
  const recommendedComplete = recommendedFields.filter(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return this[parent] && this[parent][child];
    }
    return this[field];
  }).length >= 2;
  
  return requiredComplete && recommendedComplete;
};

// Method to get profile completion percentage
userSchema.methods.getProfileCompletionPercentage = function() {
  const allFields = [
    'name', 'age', 'gender', 'phone', 'location.city', 
    'dateOfBirth', 'bloodGroup', 'emergencyContact.name', 
    'emergencyContact.phone', 'emergencyContact.relationship'
  ];
  
  const completedFields = allFields.filter(field => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      return this[parent] && this[parent][child];
    }
    return this[field];
  }).length;
  
  return Math.round((completedFields / allFields.length) * 100);
};

module.exports = mongoose.model('User', userSchema);
