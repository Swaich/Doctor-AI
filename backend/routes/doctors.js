const express = require('express');
const router = express.Router();
const Doctor = require('../models/Doctor');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { uploadToMemory, fileToBase64, validateFile } = require('../utils/fileStorage');

// Register as doctor (Initial Registration - Requires Approval)
router.post('/register', protect, uploadToMemory.fields([
  { name: 'degreeDocument', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'idProof', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📝 Doctor registration request received');
    console.log('User ID:', req.user._id);
    console.log('Files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('Body keys:', Object.keys(req.body));

    // Check if user already registered as doctor
    const existingDoctor = await Doctor.findOne({ userId: req.user._id });
    if (existingDoctor) {
      console.log('❌ User already has doctor profile');
      return res.status(400).json({ message: 'You have already registered as a doctor' });
    }

    const {
      phone,
      gender,
      dateOfBirth,
      qualification,
      specialization,
      experience,
      medicalRegistrationNumber,
      issuingMedicalCouncil,
      currentHospitalClinic,
      currentWorkingCity,
      languagesSpoken
    } = req.body;

    // Validate required fields
    if (!phone || !gender || !dateOfBirth || !qualification || !specialization || !experience) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ message: 'All required fields must be filled' });
    }

    // Validate required documents
    if (!req.files || !req.files.degreeDocument || !req.files.licenseDocument || !req.files.idProof) {
      console.log('❌ Missing required documents');
      return res.status(400).json({ message: 'All documents (Degree, License, ID Proof) are required' });
    }

    // Validate file sizes and types
    const fileValidationErrors = [];
    
    // Validate degree document
    const degreeErrors = validateFile(req.files.degreeDocument[0]);
    if (degreeErrors.length > 0) {
      fileValidationErrors.push(`Degree Document: ${degreeErrors.join(', ')}`);
    }

    // Validate license document
    const licenseErrors = validateFile(req.files.licenseDocument[0]);
    if (licenseErrors.length > 0) {
      fileValidationErrors.push(`License Document: ${licenseErrors.join(', ')}`);
    }

    // Validate ID proof
    const idErrors = validateFile(req.files.idProof[0]);
    if (idErrors.length > 0) {
      fileValidationErrors.push(`ID Proof: ${idErrors.join(', ')}`);
    }

    // Validate profile photo (optional)
    if (req.files.profilePhoto) {
      const photoErrors = validateFile(req.files.profilePhoto[0], 2 * 1024 * 1024); // 2MB for photos
      if (photoErrors.length > 0) {
        fileValidationErrors.push(`Profile Photo: ${photoErrors.join(', ')}`);
      }
    }

    if (fileValidationErrors.length > 0) {
      console.log('❌ File validation errors:', fileValidationErrors);
      return res.status(400).json({ 
        message: 'File validation failed', 
        errors: fileValidationErrors 
      });
    }

    console.log('✅ Converting files to Base64 and creating doctor profile...');

    // Convert files to Base64 for database storage
    const profilePhotoData = req.files.profilePhoto ? fileToBase64(req.files.profilePhoto[0]) : null;
    const degreeDocumentData = fileToBase64(req.files.degreeDocument[0]);
    const licenseDocumentData = fileToBase64(req.files.licenseDocument[0]);
    const idProofData = fileToBase64(req.files.idProof[0]);

    const doctor = await Doctor.create({
      userId: req.user._id,
      phone,
      gender,
      dateOfBirth,
      qualification,
      specialization,
      experience: parseInt(experience),
      medicalRegistrationNumber,
      issuingMedicalCouncil,
      currentHospitalClinic,
      currentWorkingCity,
      languagesSpoken: JSON.parse(languagesSpoken || '[]'),
      profilePhoto: profilePhotoData,
      degreeDocument: degreeDocumentData,
      licenseDocument: licenseDocumentData,
      idProof: idProofData,
      status: 'pending',
      isApproved: false
    });

    console.log('✅ Doctor profile created with files stored in database:', doctor._id);

    // Update user role to doctor (but not approved yet)
    await User.findByIdAndUpdate(req.user._id, { role: 'doctor' });
    console.log('✅ User role updated to doctor');

    res.status(201).json({
      message: 'Doctor registration submitted successfully. All documents have been securely stored. Please wait for admin approval before you can login.',
      doctor: {
        _id: doctor._id,
        status: doctor.status,
        filesUploaded: {
          profilePhoto: !!profilePhotoData,
          degreeDocument: !!degreeDocumentData,
          licenseDocument: !!licenseDocumentData,
          idProof: !!idProofData
        }
      }
    });
  } catch (error) {
    console.error('❌ Doctor registration error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Medical registration number already exists' });
    }
    res.status(500).json({ message: error.message, details: error.toString() });
  }
});

// Get all approved doctors (PUBLIC - For Patients)
router.get('/', async (req, res) => {
  try {
    const { specialization, minExperience, maxFee, minRating, city, search } = req.query;

    let query = { 
      status: 'approved',
      isApproved: true,
      suspended: { $ne: true }
    };

    if (specialization) query.specialization = specialization;
    if (minExperience) query.experience = { $gte: parseInt(minExperience) };
    if (maxFee) query['consultationFee.video'] = { $lte: parseInt(maxFee) };
    if (minRating) query.rating = { $gte: parseFloat(minRating) };
    if (city) query.currentWorkingCity = new RegExp(city, 'i');

    const doctors = await Doctor.find(query)
      .populate('userId', 'name')
      .populate('specialization', 'name')
      .select('-phone -gender -dateOfBirth -medicalRegistrationNumber -issuingMedicalCouncil -degreeDocument -licenseDocument -idProof -platformFeePaid -registrationFee')
      .sort({ rating: -1 });

    // Return only public profile data
    const publicDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      name: doctor.userId?.name,
      profilePhoto: doctor.profilePhoto,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      languagesSpoken: doctor.languagesSpoken,
      currentHospitalClinic: doctor.currentHospitalClinic,
      currentWorkingCity: doctor.currentWorkingCity,
      rating: doctor.rating,
      totalRatings: doctor.totalRatings,
      consultationFee: doctor.consultationFee,
      consultationModes: doctor.consultationModes,
      availableDays: doctor.availableDays,
      about: doctor.about,
      isAvailable: doctor.isAvailable
    }));

    res.json(publicDoctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor by ID (PUBLIC - For Patients)
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
      .populate('userId', 'name')
      .populate('specialization', 'name')
      .select('-phone -gender -dateOfBirth -medicalRegistrationNumber -issuingMedicalCouncil -degreeDocument -licenseDocument -idProof -platformFeePaid -registrationFee');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (doctor.status !== 'approved' || !doctor.isApproved || doctor.suspended) {
      return res.status(404).json({ message: 'Doctor not available' });
    }

    // Return only public profile
    const publicProfile = {
      _id: doctor._id,
      name: doctor.userId?.name,
      profilePhoto: doctor.profilePhoto,
      specialization: doctor.specialization,
      qualification: doctor.qualification,
      experience: doctor.experience,
      languagesSpoken: doctor.languagesSpoken,
      currentHospitalClinic: doctor.currentHospitalClinic,
      currentWorkingCity: doctor.currentWorkingCity,
      rating: doctor.rating,
      totalRatings: doctor.totalRatings,
      consultationFee: doctor.consultationFee,
      consultationModes: doctor.consultationModes,
      availableDays: doctor.availableDays,
      about: doctor.about,
      isAvailable: doctor.isAvailable
    };

    res.json(publicProfile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Check if doctor profile exists (PROTECTED - For Doctor)
router.get('/my-profile', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'name email')
      .populate('specialization', 'name');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor's own profile (PROTECTED - For Doctor)
router.get('/me/profile', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .populate('userId', 'name email')
      .populate('specialization', 'name');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update consultation details (PROTECTED - Only for Approved Doctors)
router.put('/me/consultation-details', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    if (!doctor.isApproved || doctor.status !== 'approved') {
      return res.status(403).json({ message: 'Your profile is not approved yet. Please wait for admin approval.' });
    }

    const {
      consultationModes,
      consultationFee,
      about,
      availableDays,
      maxPatientsPerDay,
      followUpPolicy,
      isAvailable
    } = req.body;

    // Only allow updating consultation-related fields
    if (consultationModes) doctor.consultationModes = consultationModes;
    if (consultationFee) doctor.consultationFee = consultationFee;
    if (about !== undefined) doctor.about = about;
    if (availableDays) doctor.availableDays = availableDays;
    if (maxPatientsPerDay) doctor.maxPatientsPerDay = maxPatientsPerDay;
    if (followUpPolicy !== undefined) doctor.followUpPolicy = followUpPolicy;
    if (isAvailable !== undefined) doctor.isAvailable = isAvailable;

    await doctor.save();

    res.json({
      message: 'Consultation details updated successfully',
      doctor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update personal information (PROTECTED - Only for Approved Doctors)
router.put('/me/personal-info', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const {
      name,
      phone,
      currentHospitalClinic,
      currentWorkingCity,
      languagesSpoken,
      about
    } = req.body;

    // Update user name if provided
    if (name) {
      await User.findByIdAndUpdate(req.user._id, { name });
    }

    // Update doctor fields
    if (phone) doctor.phone = phone;
    if (currentHospitalClinic) doctor.currentHospitalClinic = currentHospitalClinic;
    if (currentWorkingCity) doctor.currentWorkingCity = currentWorkingCity;
    if (languagesSpoken) doctor.languagesSpoken = languagesSpoken;
    if (about !== undefined) doctor.about = about;

    await doctor.save();

    // Return updated doctor with populated user data
    const updatedDoctor = await Doctor.findById(doctor._id)
      .populate('userId', 'name email')
      .populate('specialization', 'name');

    res.json({
      message: 'Personal information updated successfully',
      doctor: updatedDoctor
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile photo (PROTECTED - For Approved Doctors)
router.put('/me/profile-photo', protect, authorize('doctor'), uploadToMemory.single('profilePhoto'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    if (!doctor.isApproved) {
      return res.status(403).json({ message: 'Your profile is not approved yet' });
    }

    if (req.file) {
      // Validate file
      const errors = validateFile(req.file, 2 * 1024 * 1024); // 2MB for photos
      if (errors.length > 0) {
        return res.status(400).json({ 
          message: 'File validation failed', 
          errors 
        });
      }

      // Convert to Base64 and store in database
      const profilePhotoData = fileToBase64(req.file);
      doctor.profilePhoto = profilePhotoData;
      await doctor.save();
    }

    res.json({
      message: 'Profile photo updated successfully and stored in database',
      hasProfilePhoto: !!doctor.profilePhoto
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update multiple documents (PROTECTED - For Approved Doctors)
router.put('/me/documents', protect, authorize('doctor'), uploadToMemory.fields([
  { name: 'degreeDocument', maxCount: 1 },
  { name: 'licenseDocument', maxCount: 1 },
  { name: 'idProof', maxCount: 1 }
]), async (req, res) => {
  try {
    const { submitForReview } = req.body;
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    if (!doctor.isApproved) {
      return res.status(403).json({ message: 'Your profile is not approved yet' });
    }

    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }

    const updatedDocuments = [];
    const errors = [];

    // Initialize draft documents if not exists
    if (!doctor.draftDocuments) {
      doctor.draftDocuments = {};
    }

    // Process each uploaded document
    for (const [fieldName, files] of Object.entries(req.files)) {
      if (files && files[0]) {
        const file = files[0];
        
        // Validate file
        const fileErrors = validateFile(file);
        if (fileErrors.length > 0) {
          errors.push(`${fieldName}: ${fileErrors.join(', ')}`);
          continue;
        }

        // Convert to Base64
        const documentData = fileToBase64(file);
        
        if (submitForReview === 'true' || submitForReview === true) {
          // Apply directly to main documents
          doctor[fieldName] = documentData;
        } else {
          // Store in draft
          doctor.draftDocuments[fieldName] = documentData;
        }
        
        updatedDocuments.push(fieldName);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'Some files failed validation', 
        errors 
      });
    }

    if (updatedDocuments.length === 0) {
      return res.status(400).json({ message: 'No valid documents to update' });
    }

    if (submitForReview === 'true' || submitForReview === true) {
      // Submit for review immediately
      doctor.status = 'pending';
      doctor.isApproved = false;
      doctor.documentsUpdatedAt = new Date();
      doctor.hasDraftChanges = false;
      doctor.draftDocuments = {};
    } else {
      // Save as draft
      doctor.hasDraftChanges = true;
      doctor.draftUpdatedAt = new Date();
    }
    
    await doctor.save();

    if (submitForReview === 'true' || submitForReview === true) {
      res.json({
        message: `${updatedDocuments.length} document(s) updated and submitted for admin review.`,
        updatedDocuments,
        status: 'pending'
      });
    } else {
      res.json({
        message: `${updatedDocuments.length} document(s) saved as draft. Submit for review when ready.`,
        updatedDocuments,
        status: 'draft',
        hasDraftChanges: true
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update single document in draft mode (PROTECTED - For Approved Doctors)
router.put('/me/document/:type', protect, authorize('doctor'), uploadToMemory.single('document'), async (req, res) => {
  try {
    const { type } = req.params;
    const { submitForReview } = req.body; // Optional flag to submit for review immediately
    const validTypes = ['degreeDocument', 'licenseDocument', 'idProof'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    if (!doctor.isApproved) {
      return res.status(403).json({ message: 'Your profile is not approved yet' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Validate file
    const errors = validateFile(req.file);
    if (errors.length > 0) {
      return res.status(400).json({ 
        message: 'File validation failed', 
        errors 
      });
    }

    // Convert to Base64 and store in database
    const documentData = fileToBase64(req.file);
    
    // Store in draft fields first
    if (!doctor.draftDocuments) {
      doctor.draftDocuments = {};
    }
    doctor.draftDocuments[type] = documentData;
    doctor.hasDraftChanges = true;
    doctor.draftUpdatedAt = new Date();
    
    // If submitForReview is true, apply changes and submit for review
    if (submitForReview === 'true' || submitForReview === true) {
      doctor[type] = documentData;
      doctor.status = 'pending';
      doctor.isApproved = false;
      doctor.documentsUpdatedAt = new Date();
      doctor.hasDraftChanges = false;
      doctor.draftDocuments = {};
    }
    
    await doctor.save();

    const documentNames = {
      degreeDocument: 'Degree Certificate',
      licenseDocument: 'Medical License',
      idProof: 'Government ID'
    };

    if (submitForReview === 'true' || submitForReview === true) {
      res.json({
        message: `${documentNames[type]} updated and submitted for admin review.`,
        hasDocument: !!doctor[type],
        status: 'pending'
      });
    } else {
      res.json({
        message: `${documentNames[type]} saved as draft. Submit for review when ready.`,
        hasDocument: !!doctor.draftDocuments[type],
        status: 'draft',
        hasDraftChanges: true
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Submit draft documents for review (PROTECTED - For Approved Doctors)
router.post('/me/submit-for-review', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    if (!doctor.isApproved) {
      return res.status(403).json({ message: 'Your profile is not approved yet' });
    }

    if (!doctor.hasDraftChanges || !doctor.draftDocuments) {
      return res.status(400).json({ message: 'No draft changes to submit' });
    }

    // Apply all draft changes to actual documents
    const updatedDocuments = [];
    Object.entries(doctor.draftDocuments).forEach(([type, documentData]) => {
      if (documentData) {
        doctor[type] = documentData;
        updatedDocuments.push(type);
      }
    });

    // Mark as pending approval
    doctor.status = 'pending';
    doctor.isApproved = false;
    doctor.documentsUpdatedAt = new Date();
    doctor.hasDraftChanges = false;
    doctor.draftDocuments = {};
    
    await doctor.save();

    const documentNames = {
      degreeDocument: 'Degree Certificate',
      licenseDocument: 'Medical License',
      idProof: 'Government ID'
    };

    const updatedDocumentNames = updatedDocuments.map(type => documentNames[type]);

    res.json({
      message: `${updatedDocuments.length} document(s) submitted for admin review: ${updatedDocumentNames.join(', ')}`,
      updatedDocuments,
      status: 'pending'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Discard draft changes (PROTECTED - For Approved Doctors)
router.delete('/me/draft-documents', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    doctor.hasDraftChanges = false;
    doctor.draftDocuments = {};
    doctor.draftUpdatedAt = null;
    
    await doctor.save();

    res.json({
      message: 'Draft changes discarded successfully'
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve profile photo from database (PUBLIC)
router.get('/:id/profile-photo', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('profilePhoto');
    
    if (!doctor || !doctor.profilePhoto || !doctor.profilePhoto.data) {
      return res.status(404).json({ message: 'Profile photo not found' });
    }

    const imageBuffer = Buffer.from(doctor.profilePhoto.data, 'base64');
    
    res.set({
      'Content-Type': doctor.profilePhoto.contentType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 1 day
    });
    
    res.send(imageBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Serve doctor documents (ADMIN ONLY - For verification)
router.get('/:id/document/:type', protect, authorize('admin'), async (req, res) => {
  try {
    const { id, type } = req.params;
    const validTypes = ['degreeDocument', 'licenseDocument', 'idProof'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ message: 'Invalid document type' });
    }

    const doctor = await Doctor.findById(id).select(type);
    
    if (!doctor || !doctor[type] || !doctor[type].data) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const documentBuffer = Buffer.from(doctor[type].data, 'base64');
    
    res.set({
      'Content-Type': doctor[type].contentType,
      'Content-Length': documentBuffer.length,
      'Content-Disposition': `inline; filename="${doctor[type].originalName}"`,
      'Cache-Control': 'private, no-cache'
    });
    
    res.send(documentBuffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get approval status (PROTECTED - For Doctor)
router.get('/me/approval-status', protect, authorize('doctor'), async (req, res) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id })
      .select('status isApproved documentsUpdatedAt approvedAt rejectionReason')
      .populate('userId', 'name email');

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found' });
    }

    res.json({
      status: doctor.status,
      isApproved: doctor.isApproved,
      documentsUpdatedAt: doctor.documentsUpdatedAt,
      approvedAt: doctor.approvedAt,
      rejectionReason: doctor.rejectionReason,
      doctorName: doctor.userId?.name
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get file info without downloading (For frontend to show file status)
router.get('/:id/files/info', protect, async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('profilePhoto degreeDocument licenseDocument idProof');
    
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    // Only allow doctors to see their own files or admin to see any
    if (req.user.role !== 'admin' && doctor.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { getFileInfo } = require('../utils/fileStorage');

    res.json({
      profilePhoto: getFileInfo(doctor.profilePhoto),
      degreeDocument: getFileInfo(doctor.degreeDocument),
      licenseDocument: getFileInfo(doctor.licenseDocument),
      idProof: getFileInfo(doctor.idProof)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
