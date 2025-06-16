const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
  assignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  dueDate: { type: Date },
  attachments: [{ type: String }], // file URLs or paths
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema); 