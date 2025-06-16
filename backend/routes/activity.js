const express = require('express');
const Activity = require('../models/Activity');
const Project = require('../models/Project');
const auth = require('../middleware/auth');

const router = express.Router();

// Helper: check if user is member of project
async function isProjectMember(projectId, userId) {
  const project = await Project.findById(projectId);
  if (!project) return false;
  return project.members.some(m => m.user.toString() === userId);
}

// Get activities for a project
router.get('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!(await isProjectMember(projectId, req.user.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const activities = await Activity.find({ project: projectId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50); // Limit to last 50 activities

    res.json(activities);
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create activity entry (internal use only)
router.post('/', auth, async (req, res) => {
  try {
    const { project, user, action, details, entityType, entityId } = req.body;
    if (!(await isProjectMember(project, req.user.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const activity = new Activity({
      project,
      user,
      action,
      details,
      entityType,
      entityId
    });

    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    console.error('Error creating activity:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 