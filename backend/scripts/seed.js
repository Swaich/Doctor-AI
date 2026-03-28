const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const User = require('../models/User');
const MedicalStore = require('../models/MedicalStore');

dotenv.config();

const categories = [
  { name: 'General Physician', icon: '🩺', description: 'Primary care and general health' },
  { name: 'Dermatologist', icon: '🧴', description: 'Skin, hair, and nail care' },
  { name: 'Cardiologist', icon: '❤️', description: 'Heart and cardiovascular health' },
  { name: 'Dentist', icon: '🦷', description: 'Dental and oral health' },
  { name: 'Gynecologist', icon: '👶', description: 'Women\'s health' },
  { name: 'Psychiatrist', icon: '🧠', description: 'Mental health' },
  { name: 'Pediatrician', icon: '👶', description: 'Children\'s health' },
  { name: 'Orthopedic', icon: '🦴', description: 'Bone and joint care' },
  { name: 'Neurologist', icon: '🧠', description: 'Brain and nervous system' },
  { name: 'Ophthalmologist', icon: '👁️', description: 'Eye care and vision' },
  { name: 'ENT Specialist', icon: '👂', description: 'Ear, nose, and throat' },
  { name: 'Urologist', icon: '🫘', description: 'Urinary system and male reproductive health' },
  { name: 'Gastroenterologist', icon: '🫄', description: 'Digestive system' },
  { name: 'Pulmonologist', icon: '🫁', description: 'Respiratory system and lungs' },
  { name: 'Endocrinologist', icon: '⚖️', description: 'Hormones and metabolism' },
  { name: 'Rheumatologist', icon: '🦴', description: 'Arthritis and autoimmune diseases' },
  { name: 'Oncologist', icon: '🎗️', description: 'Cancer treatment and care' },
  { name: 'Radiologist', icon: '📷', description: 'Medical imaging and diagnostics' },
  { name: 'Anesthesiologist', icon: '💉', description: 'Anesthesia and pain management' },
  { name: 'Pathologist', icon: '🔬', description: 'Laboratory medicine and diagnostics' }
];

const medicalStores = [
  {
    name: 'HealthPlus Pharmacy',
    address: '123 Main St, New York, NY',
    location: { type: 'Point', coordinates: [-74.006, 40.7128] },
    phone: '+1234567890',
    openingHours: '8 AM - 10 PM'
  },
  {
    name: 'MediCare Store',
    address: '456 Oak Ave, Los Angeles, CA',
    location: { type: 'Point', coordinates: [-118.2437, 34.0522] },
    phone: '+1234567891',
    openingHours: '24/7'
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await Category.deleteMany({});
    await MedicalStore.deleteMany({});

    // Seed categories
    await Category.insertMany(categories);
    console.log('Categories seeded');

    // Seed medical stores
    await MedicalStore.insertMany(medicalStores);
    console.log('Medical stores seeded');

    // Create admin user
    const adminExists = await User.findOne({ email: 'admin@MegaHealth.com' });
    if (!adminExists) {
      await User.create({
        email: 'admin@MegaHealth.com',
        password: 'admin123',
        name: 'Admin User',
        role: 'admin',
        isVerified: true
      });
      console.log('Admin user created: admin@MegaHealth.com / admin123');
    }

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
