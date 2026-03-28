const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, authorize } = require('../middleware/auth');

// Get all categories
router.get('/', async (req, res) => {
  try {
    console.log('Categories endpoint called');
    const categories = await Category.find({ isActive: true });
    console.log(`Found ${categories.length} categories`);
    res.json(categories);
  } catch (error) {
    console.error('Error in categories endpoint:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create category (Admin only)
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
