const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const User = require('../models/User');

// GET /api/user/profile
router.get('/profile', auth, async (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/user/update  — update name, email, location, field
router.put(
  '/update',
  auth,
  [
    body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
    body('location').optional().trim(),
    body('field').optional().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email, location, field } = req.body;
    try {
      // Check email uniqueness if changing
      if (email && email !== req.user.email) {
        const taken = await User.findOne({ email });
        if (taken) return res.status(409).json({ error: 'This email is already in use.' });
      }

      const updates = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (location !== undefined) updates.location = location;
      if (field !== undefined) updates.field = field;

      const user = await User.findByIdAndUpdate(req.user._id, updates, {
        new: true,
        runValidators: true,
      });

      res.json({ user, message: 'Profile updated successfully.' });
    } catch (err) {
      console.error('Update error:', err);
      res.status(500).json({ error: 'Update failed. Please try again.' });
    }
  }
);

// PUT /api/user/password  — change password
router.put(
  '/password',
  auth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { currentPassword, newPassword } = req.body;
    try {
      const user = await User.findById(req.user._id).select('+password');
      const valid = await user.comparePassword(currentPassword);
      if (!valid) return res.status(400).json({ error: 'Current password is incorrect.' });

      user.password = newPassword;
      await user.save();
      res.json({ message: 'Password changed successfully.' });
    } catch (err) {
      console.error('Password change error:', err);
      res.status(500).json({ error: 'Password change failed. Please try again.' });
    }
  }
);

// PUT /api/user/preferences  — update preferences toggles
router.put('/preferences', auth, async (req, res) => {
  const allowed = ['darkMode', 'emailNotifications', 'autoSaveNotes', 'aiSuggestions', 'soundEffects'];
  const updates = {};

  for (const key of allowed) {
    if (req.body[key] !== undefined) {
      updates[`preferences.${key}`] = Boolean(req.body[key]);
    }
  }

  try {
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
    res.json({ user, message: 'Preferences saved.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save preferences.' });
  }
});

module.exports = router;
