const mongoose = require('mongoose');

const caseSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    status: {
      type: String,
      enum: ['draft', 'open', 'in_review', 'closed'],
      default: 'draft',
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Case', caseSchema);
