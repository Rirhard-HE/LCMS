// models/Evidence.js
const mongoose = require('mongoose');

const evidenceSchema = new mongoose.Schema(
  {
    caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true },
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true }, // GridFS file _id
    originalName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },
    hash: { type: String, required: true }, // SHA-256
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metadata: { type: Object }, 
    tags: [{ type: String }],// 可存捕获时间/地点/备注等
  },
  { timestamps: true }
);

module.exports = mongoose.model('Evidence', evidenceSchema);
