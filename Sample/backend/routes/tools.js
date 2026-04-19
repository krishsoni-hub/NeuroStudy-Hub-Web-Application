const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/auth');
const ToolHistory = require('../models/ToolHistory');
const ai = require('../services/openrouter');

// ─── Optional auth middleware (allows guests) ─────────────────────────────────
function optionalAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return next();
  const jwt = require('jsonwebtoken');
  const User = require('../models/User');
  const token = header.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
    if (err) return next(); // invalid token — treat as guest
    try {
      req.user = await User.findById(decoded.id);
    } catch (_) {}
    next();
  });
}

// ─── POST /api/tools/run ──────────────────────────────────────────────────────
router.post(
  '/run',
  optionalAuth,
  [
    body('toolName').trim().notEmpty().withMessage('toolName is required'),
    body('input').trim().notEmpty().withMessage('input text is required'),
    body('input').isLength({ max: 15000 }).withMessage('Input is too long (max 15,000 characters)'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const {
      toolName,
      toolIcon = '🔧',
      input,
      outputLength = 'medium',
      format = 'paragraph',
    } = req.body;

    try {
      // Call OpenRouter / Mistral-7B
      const output = await ai.runTool({ toolName, text: input, outputLength, format });

      // Save to history if user is logged in
      let historyId = null;
      if (req.user) {
        try {
          const entry = await ToolHistory.create({
            user: req.user._id,
            toolName,
            toolIcon,
            input: input.slice(0, 500), // store preview only
            output: output.slice(0, 2000),
          });
          historyId = entry._id;
        } catch (histErr) {
          console.error('[History] Save failed:', histErr.message);
          // Non-fatal — don't fail the response
        }
      }

      res.json({ output, historyId });
    } catch (err) {
      console.error('[Tools] Error:', err.message);

      if (err.message.includes('OPENROUTER_API_KEY') || err.message.includes('not configured')) {
        return res.status(503).json({
          error: 'AI service not configured. Add OPENROUTER_API_KEY to your .env file. Get a free key at openrouter.ai',
        });
      }
      if (err.message.includes('Invalid OpenRouter') || err.message.includes('API key')) {
        return res.status(401).json({ error: err.message });
      }

      // For any other error, still return a response so the user isn't stuck
      res.status(200).json({
        output: `The AI service encountered an issue: ${err.message}\n\nPlease try again in a moment.`,
        historyId: null,
      });
    }
  }
);

// ─── GET /api/tools/history ───────────────────────────────────────────────────
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await ToolHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch history.' });
  }
});

// ─── POST /api/tools/history — save entry manually (guest merge) ──────────────
router.post('/history', authMiddleware, async (req, res) => {
  const { toolName, toolIcon, input, output } = req.body;
  if (!toolName) return res.status(400).json({ error: 'toolName is required.' });

  try {
    const entry = await ToolHistory.create({
      user: req.user._id,
      toolName,
      toolIcon: toolIcon || '🔧',
      input: (input || '').slice(0, 500),
      output: (output || '').slice(0, 2000),
    });
    res.status(201).json({ entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save history.' });
  }
});

// ─── DELETE /api/tools/history/:id ───────────────────────────────────────────
router.delete('/history/:id', authMiddleware, async (req, res) => {
  try {
    await ToolHistory.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Entry deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete entry.' });
  }
});

// ─── DELETE /api/tools/history — clear all ────────────────────────────────────
router.delete('/history', authMiddleware, async (req, res) => {
  try {
    await ToolHistory.deleteMany({ user: req.user._id });
    res.json({ message: 'History cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear history.' });
  }
});

module.exports = router;
