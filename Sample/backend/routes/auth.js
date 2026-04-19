const express  = require('express');
const router   = express.Router();
const { body, validationResult } = require('express-validator');
const jwt      = require('jsonwebtoken');
const crypto   = require('crypto');
const User     = require('../models/User');
const { sendWelcome, sendVerification, sendPasswordReset, isConfigured } = require('../services/email');
const authMiddleware = require('../middleware/auth');

function signToken(id) {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function randomToken() {
  return crypto.randomBytes(32).toString('hex');
}

// ─── POST /api/auth/register ──────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, email, password } = req.body;
    try {
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const verifyToken        = randomToken();
      const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const user  = await User.create({ name, email, password, verifyToken, verifyTokenExpires, isVerified: false });
      const token = signToken(user._id);

      // Send welcome email only — no verification email
      sendWelcome({ name, email, password })
        .then(() => console.log(`[Email] ✅ Welcome email sent to ${email}`))
        .catch(err => console.error(`[Email] ❌ Welcome email failed for ${email}: ${err.message}`));

      res.status(201).json({
        token,
        user: user.toJSON(),
        message: 'Account created! A welcome email has been sent to ' + email,
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Registration failed. Please try again.' });
    }
  }
);

// ─── POST /api/auth/login ─────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email }).select('+password');
      if (!user || !(await user.comparePassword(password))) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      const token = signToken(user._id);
      res.json({ token, user: user.toJSON() });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed. Please try again.' });
    }
  }
);

// ─── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// ─── GET /api/auth/verify-email?token= ───────────────────────────────────────
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).json({ error: 'Verification token is required.' });

  try {
    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpires: { $gt: new Date() },
    }).select('+verifyToken +verifyTokenExpires');

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired verification link. Please request a new one.' });
    }

    user.isVerified        = true;
    user.verifyToken       = undefined;
    user.verifyTokenExpires = undefined;
    await user.save();

    res.json({ message: 'Email verified successfully. You can now sign in.' });
  } catch (err) {
    console.error('Verify email error:', err);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
});

// ─── POST /api/auth/resend-verification ──────────────────────────────────────
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const user = await User.findOne({ email }).select('+verifyToken +verifyTokenExpires');
    if (!user)           return res.status(404).json({ error: 'No account found with this email.' });
    if (user.isVerified) return res.status(400).json({ error: 'This account is already verified.' });

    const verifyToken        = randomToken();
    user.verifyToken         = verifyToken;
    user.verifyTokenExpires  = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    await sendVerification({ name: user.name, email: user.email, token: verifyToken });
    res.json({ message: 'Verification email sent. Please check your inbox.' });
  } catch (err) {
    console.error('Resend verify error:', err);
    res.status(500).json({ error: 'Failed to resend verification email.' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post(
  '/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { email } = req.body;
    try {
      const user = await User.findOne({ email }).select('+resetPasswordToken +resetPasswordExpires');

      if (!user) {
        // Don't reveal whether account exists
        return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
      }

      const resetToken = randomToken();
      user.resetPasswordToken   = resetToken;
      user.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
      const resetLink   = `${frontendUrl}/reset-password.html?token=${resetToken}`;

      let emailSent = false;
      if (isConfigured()) {
        try {
          emailSent = await sendPasswordReset({ name: user.name, email: user.email, token: resetToken });
        } catch (emailErr) {
          console.error('[Email] Password reset failed:', emailErr.message);
        }
      }

      if (emailSent) {
        return res.json({
          message: `Password reset link sent to ${user.email}. Check your inbox and spam folder.`,
        });
      }

      // Email not configured — return link directly so user can still reset
      return res.json({
        message: 'Email is not configured. Use the reset link below.',
        resetLink,
        token: resetToken,
      });

    } catch (err) {
      console.error('Forgot password error:', err);
      res.status(500).json({ error: 'Failed to process request. Please try again.' });
    }
  }
);

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { token, password } = req.body;
    try {
      const user = await User.findOne({
        resetPasswordToken:   token,
        resetPasswordExpires: { $gt: new Date() },
      }).select('+resetPasswordToken +resetPasswordExpires +password');

      if (!user) {
        return res.status(400).json({ error: 'Reset link is invalid or has expired. Please request a new one.' });
      }

      user.password             = password;
      user.resetPasswordToken   = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ message: 'Password reset successfully. You can now sign in with your new password.' });
    } catch (err) {
      console.error('Reset password error:', err);
      res.status(500).json({ error: 'Password reset failed. Please try again.' });
    }
  }
);

// ─── GET /api/auth/test-email?to=email — quick email config test ──────────────
// Open in browser: http://localhost:5000/api/auth/test-email?to=skrishsoni346@gmail.com
router.get('/test-email', async (req, res) => {
  const { to } = req.query;
  if (!to) return res.status(400).json({ error: 'Usage: /api/auth/test-email?to=your@email.com' });

  if (!isConfigured()) {
    return res.status(503).json({
      configured: false,
      EMAIL_USER: process.env.EMAIL_USER || '(not set)',
      EMAIL_PASS: process.env.EMAIL_PASS ? `(set, ${process.env.EMAIL_PASS.length} chars)` : '(not set)',
      fix: 'Set EMAIL_USER and EMAIL_PASS (Gmail App Password) in Sample/backend/.env',
    });
  }

  try {
    await sendWelcome({ name: 'Test User', email: to });
    res.json({ success: true, message: `Welcome email sent to ${to} — check your inbox!` });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message,
      hint: 'Make sure EMAIL_PASS is a valid Gmail App Password (16 chars, no spaces)',
    });
  }
});

module.exports = router;
