const mongoose = require('mongoose');

const toolHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    toolName: { type: String, required: true },
    toolIcon: { type: String, default: '🔧' },
    input: { type: String, default: '' },
    output: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ToolHistory', toolHistorySchema);
