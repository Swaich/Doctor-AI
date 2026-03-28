const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const createAdmin = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected');

    // Check if admin exists
    const existingAdmin = await User.findOne({ email: 'admin@MegaHealth.com' });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin already exists');
      console.log('Email:', existingAdmin.email);
      console.log('Verified:', existingAdmin.isVerified);
      
      // Update to ensure it's verified
      existingAdmin.isVerified = true;
      existingAdmin.otp = undefined;
      existingAdmin.otpExpiry = undefined;
      await existingAdmin.save();
      console.log('✅ Admin account verified and ready');
    } else {
      // Create new admin
      const admin = await User.create({
        email: 'admin@MegaHealth.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        isVerified: true,
        credits: 1000
      });
      console.log('✅ Admin created successfully');
      console.log('Email: admin@MegaHealth.com');
      console.log('Password: admin123');
    }

    // Create test patient
    const existingPatient = await User.findOne({ email: 'patient@test.com' });
    if (!existingPatient) {
      await User.create({
        email: 'patient@test.com',
        password: 'patient123',
        name: 'Test Patient',
        role: 'patient',
        isVerified: true,
        credits: 100
      });
      console.log('✅ Test patient created');
      console.log('Email: patient@test.com');
      console.log('Password: patient123');
    }

    console.log('\n🎉 Setup complete! You can now login with:');
    console.log('Admin: admin@MegaHealth.com / admin123');
    console.log('Patient: patient@test.com / patient123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

createAdmin();
