const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Note = require('../models/Note');

// GET /api/notes  — get all notes for current user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user._id }).sort({ pinned: -1, updatedAt: -1 });
    res.json({ notes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

// POST /api/notes  — create note
router.post(
  '/',
  auth,
  [body('title').trim().notEmpty().withMessage('Title is required')],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    const { title, content, tags } = req.body;
    try {
      const note = await Note.create({ user: req.user._id, title, content, tags });
      res.status(201).json({ note, message: 'Note created.' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to create note.' });
    }
  }
);

// PUT /api/notes/:id  — update note
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });

    const { title, content, tags, pinned } = req.body;
    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (tags !== undefined) note.tags = tags;
    if (pinned !== undefined) note.pinned = pinned;

    await note.save();
    res.json({ note, message: 'Note updated.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// DELETE /api/notes/:id  — delete note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!note) return res.status(404).json({ error: 'Note not found.' });
    res.json({ message: 'Note deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

module.exports = router;
