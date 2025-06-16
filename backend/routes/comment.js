const express = require('express');
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');
const Project = require('../models/Project');

const router = express.Router();

// Add comment to a task
router.post('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { content } = req.body;

    // First find the task to ensure it exists and get the project ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = new Comment({
      task: taskId,
      author: req.user.userId,
      content,
    });
    await comment.save();

    // Add comment to task's comments array
    await Task.findByIdAndUpdate(taskId, { $push: { comments: comment._id } });
    
    // Get project for notifications
    const project = await Project.findById(task.project);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Emit to project room
    const io = req.app.get('io');
    if (io) {
      io.to(task.project.toString()).emit('commentAdded', {
        ...comment.toObject(),
        author: req.user
      });
    }
    
    // Create activity
    await Activity.create({
      project: task.project,
      user: req.user.userId,
      action: 'Added comment',
      details: content,
      entityType: 'comment',
      entityId: comment._id
    });
    
    // Notify all project members except actor
    const notifyUsers = project.members.filter(m => m.user.toString() !== req.user.userId);
    for (const m of notifyUsers) {
      await Notification.create({
        user: m.user,
        type: 'comment',
        message: `New comment on task: ${task.title}`,
      });
    }
    res.status(201).json(comment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all comments for a task
router.get('/:taskId', auth, async (req, res) => {
  try {
    const { taskId } = req.params;
    const comments = await Comment.find({ task: taskId }).populate('author', 'name email');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 