const mongoose = require('mongoose');
const Doctor = require('../models/Doctor');
const Slot = require('../models/Slot');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/telemedicine');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const fixDoctorAvailability = async () => {
  try {
    console.log('🔧 Starting doctor availability fix...');
    
    // Get today's date at midnight for proper comparison
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all approved doctors
    const doctors = await Doctor.find({ 
      status: 'approved', 
      isApproved: true,
      suspended: { $ne: true }
    });
    
    console.log(`📋 Found ${doctors.length} approved doctors`);
    
    let fixedCount = 0;
    
    for (const doctor of doctors) {
      // Check if doctor has available slots
      const availableSlots = await Slot.countDocuments({
        doctorId: doctor._id,
        date: { $gte: today },
        isBooked: false
      });
      
      const shouldBeAvailable = availableSlots > 0;
      
      if (shouldBeAvailable && !doctor.isAvailable) {
        // Doctor has slots but is marked unavailable - fix it
        await Doctor.findByIdAndUpdate(doctor._id, { isAvailable: true });
        console.log(`✅ Fixed: Dr. ${doctor.userId?.name || doctor._id} - set as available (${availableSlots} slots)`);
        fixedCount++;
      } else if (!shouldBeAvailable && doctor.isAvailable) {
        // Doctor has no slots but is marked available - fix it
        await Doctor.findByIdAndUpdate(doctor._id, { isAvailable: false });
        console.log(`❌ Fixed: Dr. ${doctor.userId?.name || doctor._id} - set as unavailable (no slots)`);
        fixedCount++;
      } else {
        console.log(`✓ OK: Dr. ${doctor.userId?.name || doctor._id} - availability correct (${availableSlots} slots, available: ${doctor.isAvailable})`);
      }
    }
    
    console.log(`\n🎉 Completed! Fixed ${fixedCount} doctors' availability status.`);
    
  } catch (error) {
    console.error('❌ Error fixing doctor availability:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📝 Database connection closed');
  }
};

// Run the script
const runScript = async () => {
  await connectDB();
  await fixDoctorAvailability();
};

// Check if this script is being run directly
if (require.main === module) {
  runScript();
}

module.exports = { fixDoctorAvailability };