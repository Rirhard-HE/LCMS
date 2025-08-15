
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true, select: false }, 
  university:{ type: String },
  address:   { type: String },
}, { timestamps: true });


userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(String(this.password), salt);
  next();
});

module.exports = mongoose.model('User', userSchema);
