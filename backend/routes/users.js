const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { 
      name, age, dateOfBirth, gender, phone, location, 
      bloodGroup, emergencyContact, medicalHistory 
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 
        name, age, dateOfBirth, gender, phone, location, 
        bloodGroup, emergencyContact, medicalHistory 
      },
      { new: true, runValidators: true }
    ).select('-password');

    // Update profile completion status
    user.profileCompleted = user.isProfileComplete();
    await user.save();

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get profile completion status
router.get('/profile/completion', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    const isComplete = user.isProfileComplete();
    const percentage = user.getProfileCompletionPercentage();
    
    // Get missing required fields
    const requiredFields = [
      { field: 'age', label: 'Age', value: user.age },
      { field: 'gender', label: 'Gender', value: user.gender },
      { field: 'phone', label: 'Phone Number', value: user.phone },
      { field: 'location.city', label: 'City', value: user.location?.city }
    ];
    
    const recommendedFields = [
      { field: 'dateOfBirth', label: 'Date of Birth', value: user.dateOfBirth },
      { field: 'bloodGroup', label: 'Blood Group', value: user.bloodGroup },
      { field: 'emergencyContact.name', label: 'Emergency Contact Name', value: user.emergencyContact?.name },
      { field: 'emergencyContact.phone', label: 'Emergency Contact Phone', value: user.emergencyContact?.phone }
    ];
    
    const missingRequired = requiredFields.filter(f => !f.value);
    const missingRecommended = recommendedFields.filter(f => !f.value);
    
    res.json({
      isComplete,
      percentage,
      missingRequired,
      missingRecommended: missingRecommended.slice(0, 2) // Show only 2 most important
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get credits balance
router.get('/credits', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('credits');
    res.json({ credits: user.credits });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
