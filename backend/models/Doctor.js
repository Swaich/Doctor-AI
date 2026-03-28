const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // PERSONAL DETAILS (Private - Only for Admin)
  phone: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  dateOfBirth: {
    type: Date,
    required: true
  },
  
  // PROFESSIONAL DETAILS (Required for Verification)
  qualification: {
    type: String,
    required: true
  },
  specialization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  experience: {
    type: Number,
    required: true,
    min: 0
  },
  medicalRegistrationNumber: {
    type: String,
    required: true,
    unique: true
  },
  issuingMedicalCouncil: {
    type: String,
    required: true
  },
  currentHospitalClinic: {
    type: String,
    required: true
  },
  currentWorkingCity: {
    type: String,
    required: true
  },
  languagesSpoken: [{
    type: String
  }],
  
  // REQUIRED DOCUMENTS (Private - Only for Admin) - Stored as Base64
  degreeDocument: {
    data: String, // Base64 encoded file
    contentType: String,
    originalName: String,
    size: Number
  },
  licenseDocument: {
    data: String, // Base64 encoded file
    contentType: String,
    originalName: String,
    size: Number
  },
  idProof: {
    data: String, // Base64 encoded file
    contentType: String,
    originalName: String,
    size: Number
  },
  
  // PUBLIC PROFILE (Visible to Patients)
  profilePhoto: {
    data: String, // Base64 encoded file
    contentType: String,
    originalName: String,
    size: Number
  },
  about: String,
  
  // CONSULTATION DETAILS (Editable by Doctor after Approval)
  consultationModes: {
    video: {
      type: Boolean,
      default: true
    },
    physical: {
      type: Boolean,
      default: false
    }
  },
  consultationFee: {
    video: {
      type: Number,
      default: 10
    },
    physical: {
      type: Number,
      default: 15
    }
  },
  availableDays: [{
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }],
  maxPatientsPerDay: {
    type: Number,
    default: 10
  },
  followUpPolicy: String,
  
  // SYSTEM FIELDS
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  isApproved: {
    type: Boolean,
    default: false
  },
  approvedAt: Date,
  documentsUpdatedAt: Date,
  rejectionReason: String,
  suspended: {
    type: Boolean,
    default: false
  },
  
  // DRAFT DOCUMENT CHANGES
  draftDocuments: {
    degreeDocument: {
      data: String,
      contentType: String,
      originalName: String,
      size: Number
    },
    licenseDocument: {
      data: String,
      contentType: String,
      originalName: String,
      size: Number
    },
    idProof: {
      data: String,
      contentType: String,
      originalName: String,
      size: Number
    }
  },
  hasDraftChanges: {
    type: Boolean,
    default: false
  },
  draftUpdatedAt: Date,
  
  // RATINGS & REVIEWS
  rating: {
    type: Number,
    default: 0
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  
  // REGISTRATION FEE
  registrationFee: {
    type: Number,
    default: 10
  },
  platformFeePaid: {
    type: Boolean,
    default: false
  },
  
  // AVAILABILITY
  isAvailable: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Method to get public profile (for patients)
doctorSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    name: this.userId?.name,
    profilePhoto: this.profilePhoto,
    specialization: this.specialization,
    qualification: this.qualification,
    experience: this.experience,
    languagesSpoken: this.languagesSpoken,
    currentHospitalClinic: this.currentHospitalClinic,
    currentWorkingCity: this.currentWorkingCity,
    rating: this.rating,
    totalRatings: this.totalRatings,
    consultationFee: this.consultationFee,
    consultationModes: this.consultationModes,
    availableDays: this.availableDays,
    about: this.about,
    isAvailable: this.isAvailable
  };
};

module.exports = mongoose.model('Doctor', doctorSchema);
