const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendOTP } = require('../utils/email');

// Generate OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await User.create({
      email,
      password,
      name,
      role: role || 'patient',
      otp,
      otpExpiry
    });

    await sendOTP(email, otp);

    res.status(201).json({
      message: 'User registered. OTP sent to email',
      userId: user._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: 'Please verify your email first' });
    }

    // Check if patient is blocked
    if (user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact admin for assistance.' });
    }

    // Check if user is a doctor and if approved
    if (user.role === 'doctor') {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findOne({ userId: user._id });
      
      if (!doctor) {
        return res.status(403).json({ message: 'Doctor profile not found. Please complete your registration.' });
      }

      if (doctor.status === 'pending') {
        return res.status(403).json({ message: 'Your doctor profile is pending admin approval. You will receive an email once approved.' });
      }

      if (doctor.status === 'rejected') {
        return res.status(403).json({ message: `Your doctor profile was rejected. Reason: ${doctor.rejectionReason || 'Not specified'}` });
      }

      if (!doctor.isApproved) {
        return res.status(403).json({ message: 'Your doctor profile is not approved yet. Please wait for admin approval.' });
      }

      if (doctor.suspended) {
        return res.status(403).json({ message: 'Your doctor account has been suspended. Please contact admin.' });
      }
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Resend OTP
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    await sendOTP(email, otp);

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Google OAuth Login
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;

    // Decode Google JWT token
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    const googleUser = JSON.parse(jsonPayload);

    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Return user data for role selection instead of creating account
      return res.json({
        needsRoleSelection: true,
        googleUserData: {
          email: googleUser.email,
          name: googleUser.name,
          picture: googleUser.picture
        }
      });
    }

    // Check if user is blocked
    if (user.blocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Please contact admin for assistance.' });
    }

    // Check if user is a doctor and if approved
    if (user.role === 'doctor') {
      const Doctor = require('../models/Doctor');
      const doctor = await Doctor.findOne({ userId: user._id });
      
      if (!doctor) {
        return res.status(403).json({ message: 'Doctor profile not found. Please complete your registration.' });
      }

      if (doctor.status === 'pending') {
        return res.status(403).json({ message: 'Your doctor profile is pending admin approval. You will receive an email once approved.' });
      }

      if (doctor.status === 'rejected') {
        return res.status(403).json({ message: `Your doctor profile was rejected. Reason: ${doctor.rejectionReason || 'Not specified'}` });
      }

      if (!doctor.isApproved) {
        return res.status(403).json({ message: 'Your doctor profile is not approved yet. Please wait for admin approval.' });
      }

      if (doctor.suspended) {
        return res.status(403).json({ message: 'Your doctor account has been suspended. Please contact admin.' });
      }
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password - Send OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist' });
    }

    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    await sendOTP(email, otp);

    res.json({ message: 'OTP sent to your email' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Verify Reset OTP
router.post('/verify-reset-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordOTP !== otp || user.resetPasswordOTPExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.json({ message: 'OTP verified successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordOTP !== otp || user.resetPasswordOTPExpiry < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpiry = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Complete Google OAuth Registration with Role Selection
router.post('/google/complete', async (req, res) => {
  try {
    const { googleUserData, role } = req.body;

    // Validate input data
    if (!googleUserData || !googleUserData.email || !googleUserData.name) {
      return res.status(400).json({ message: 'Invalid Google user data' });
    }

    // Validate role
    if (!['patient', 'doctor'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role selected' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: googleUserData.email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user with selected role
    const user = await User.create({
      email: googleUserData.email,
      name: googleUserData.name,
      password: Math.random().toString(36).slice(-8),
      role: role,
      isVerified: true,
      profileImage: googleUserData.picture
    });

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token: jwtToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        credits: user.credits
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
