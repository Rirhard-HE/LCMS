// controllers/authController.js
const asyncHandler = require('express-async-handler');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET || 'devsecret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

// @route POST /api/auth/register
exports.registerUser = asyncHandler(async (req, res) => {
  let { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    res.status(400);
    throw new Error('Name, email and password are required');
  }
  email = String(email).toLowerCase().trim();

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error('Email already registered');
  }

  const user = await User.create({
    name: String(name).trim(),
    email,
    password: String(password), // 交给 pre('save') 进行哈希
  });

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    university: user.university || '',
    address: user.address || '',
    token: signToken(user._id),
  });
});

// @route POST /api/auth/login
exports.loginUser = asyncHandler(async (req, res) => {
  let { email, password } = req.body || {};
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }
  email = String(email).toLowerCase().trim();

  // 由于 password: select:false，这里要显式取回密码
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  const ok = await bcrypt.compare(String(password), user.password);
  if (!ok) {
    res.status(401);
    throw new Error('Invalid credentials');
  }

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    university: user.university || '',
    address: user.address || '',
    token: signToken(user._id),
  });
});

// @route GET /api/auth/profile
//      返回不包含密码
exports.getProfile = asyncHandler(async (req, res) => {
  const uid = req.user?.id || req.user?._id;
  const user = await User.findById(uid).select('-password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    university: user.university || '',
    address: user.address || '',
  });
});

// @route PUT /api/auth/profile
//      仅允许更新可编辑字段；清空可选字段时传空串即可
exports.updateProfile = asyncHandler(async (req, res) => {
  const uid = req.user?.id || req.user?._id;
  const user = await User.findById(uid).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const { name, university, address } = req.body || {};
  if (typeof name === 'string' && name.trim()) user.name = name.trim();
  if (typeof university !== 'undefined') user.university = (university || '').trim();
  if (typeof address !== 'undefined') user.address = (address || '').trim();

  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    university: user.university || '',
    address: user.address || '',
  });
});
