const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const mongoose = require('mongoose');

// Helper function to create notification
const createNotification = async (projectId, type, message) => {
  try {
    const notification = new Notification({
      project: projectId,
      type,
      message
    });
    await notification.save();
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Helper function to create activity
const createActivity = async (projectId, userId, action, details, entityType = 'project', entityId = null) => {
  try {
    const activity = new Activity({
      project: projectId,
      user: userId,
      action,
      details,
      entityType,
      entityId
    });
    await activity.save();
  } catch (error) {
    console.error('Error creating activity:', error);
  }
};

// Get project notifications
router.get('/:id/notifications', auth, async (req, res) => {
  try {
    console.log('Fetching notifications for project:', req.params.id);
    const notifications = await Notification.find({ project: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    console.log('Found notifications:', notifications.length);
    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get project activities
router.get('/:id/activities', auth, async (req, res) => {
  try {
    console.log('Fetching activities for project:', req.params.id);
    const activities = await Activity.find({ project: req.params.id })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(50);
    console.log('Found activities:', activities.length);
    res.json(activities);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get all projects
router.get('/', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const projects = await Project.find({
      $or: [
        { owner: userId },
        { 'members.user': userId }
      ]
    }).populate('owner', 'name email')
      .populate('members.user', 'name email');
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single project
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.userId);
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');
    
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is owner or member
    const isOwner = project.owner._id.toString() === userId.toString();
    const isMember = project.members.some(m => m.user._id.toString() === userId.toString());

    if (!isOwner && !isMember) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const project = new Project({
      ...req.body,
      owner: req.user.userId
    });
    await project.save();
    
    // Create activity for project creation
    await createActivity(
      project._id,
      req.user.userId,
      'Created project',
      project.name,
      'project',
      project._id
    );
    
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update project
router.patch('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    Object.assign(project, req.body);
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await project.remove();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add member
router.post('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if user is already a member
    if (project.members.some(member => member.user.toString() === user._id.toString())) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add member with proper structure
    project.members.push({
      user: user._id,
      role: 'Member',
      status: 'accepted',
      invitedBy: req.user.userId,
      joinedAt: new Date()
    });
    
    await project.save();

    // Create notification and activity for new member
    await createNotification(project._id, 'info', `New member ${user.name} joined the project`);
    await createActivity(
      project._id,
      req.user.userId,
      'Added member',
      user.name,
      'member',
      user._id
    );

    res.json(project);
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(400).json({ message: error.message });
  }
});

// Remove member
router.delete('/:id/members/:userId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    project.members = project.members.filter(member => member.toString() !== req.params.userId);
    await project.save();
    res.json(project);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create task
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const task = new Task({
      ...req.body,
      project: project._id
    });
    await task.save();

    // Create notification and activity for new task
    await createNotification(project._id, 'info', `New task "${task.title}" created`);
    await createActivity(
      project._id,
      req.user.userId,
      'Created task',
      task.title,
      'task',
      task._id
    );

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update task status
router.patch('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const oldStatus = task.status;
    task.status = req.body.status;
    await task.save();

    // Create notification and activity for status change
    if (oldStatus !== task.status) {
      const statusMessage = task.status === 'completed' ? 'completed' : `moved to ${task.status}`;
      await createNotification(task.project, 'success', `Task "${task.title}" ${statusMessage}`);
      await createActivity(task.project, req.user._id, `Updated task "${task.title}" status to ${task.status}`);
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router; 