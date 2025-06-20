const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: {
    type: [String],
    enum: ['Owner', 'Editor', 'Viewer'],
    default: ['Viewer'],
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema); 