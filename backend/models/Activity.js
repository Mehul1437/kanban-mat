const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: [
      'Created project',
      'Updated project',
      'Deleted project',
      'Added member',
      'Removed member',
      'Invited member',
      'Accepted invitation',
      'Rejected invitation',
      'Created task',
      'Updated task',
      'Deleted task',
      'Added comment',
      'Updated status'
    ]
  },
  details: {
    type: String,
    required: true
  },
  entityType: {
    type: String,
    enum: ['project', 'task', 'member', 'comment'],
    required: true
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Activity', activitySchema); 