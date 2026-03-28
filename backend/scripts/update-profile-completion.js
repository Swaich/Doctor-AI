const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const updateProfileCompletion = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('📊 Updating profile completion status for all users...');

    const users = await User.find({ role: 'patient' });
    let updated = 0;

    for (const user of users) {
      const wasComplete = user.profileCompleted;
      user.profileCompleted = user.isProfileComplete();
      
      if (wasComplete !== user.profileCompleted) {
        await user.save();
        updated++;
        console.log(`✅ Updated ${user.name} (${user.email}) - Complete: ${user.profileCompleted}`);
      }
    }

    console.log(`🎉 Profile completion update complete! Updated ${updated} users out of ${users.length} total patients.`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating profile completion:', error);
    process.exit(1);
  }
};

updateProfileCompletion();