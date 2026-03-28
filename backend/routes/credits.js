const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// Credit packages
const CREDIT_PACKAGES = [
  { amount: 100, credits: 10 },
  { amount: 500, credits: 60 },
  { amount: 1000, credits: 150 }
];

// Get credit packages
router.get('/packages', (req, res) => {
  res.json(CREDIT_PACKAGES);
});

// Simulate payment and add credits (for testing without payment gateway)
router.post('/purchase', protect, async (req, res) => {
  try {
    const { amount, credits } = req.body;

    if (!amount || !credits) {
      return res.status(400).json({ message: 'Amount and credits required' });
    }

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = await User.findById(req.user._id);
    user.credits += credits;
    await user.save();

    await Transaction.create({
      userId: req.user._id,
      type: 'credit_purchase',
      amount,
      credits,
      paymentId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'completed',
      description: `Purchased ${credits} credits for $${amount}`
    });

    res.json({
      message: 'Payment processed successfully',
      credits: user.credits
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get transaction history
router.get('/transactions', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user._id })
      .sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
