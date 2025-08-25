const asyncHandler = require('express-async-handler');
const Case = require('../models/Case');

// POST /api/cases
const createCase = asyncHandler(async (req, res) => {
  const { title, description } = req.body || {};
  if (!title) {
    res.status(400);
    throw new Error('Title is required');
  }
  const doc = await Case.create({
    title,
    description: description || '',
    createdBy: req.user._id,
  });
  res.status(201).json(doc);
});

// GET /api/cases  （仅返回当前用户创建的案件）
const getCases = asyncHandler(async (req, res) => {
  const list = await Case.find({ createdBy: req.user._id })
    .sort({ createdAt: -1 })
    .lean();
  res.json(list);
});

// PUT /api/cases/:id  （仅允许作者更新）
const updateCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const found = await Case.findById(id);
  if (!found) {
    res.status(404);
    throw new Error('Case not found');
  }
  if (found.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }
  const fields = ['title', 'description', 'status'];
  fields.forEach(f => {
    if (typeof req.body[f] !== 'undefined') found[f] = req.body[f];
  });
  await found.save();
  res.json(found);
});


const deleteCase = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const found = await Case.findById(id);
  if (!found) {
    res.status(404);
    throw new Error('Case not found');
  }
  if (found.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Forbidden');
  }
  await found.deleteOne();
  res.json({ message: 'Deleted', id });
});

module.exports = { createCase, getCases, updateCase, deleteCase };
