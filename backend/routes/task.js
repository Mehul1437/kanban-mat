const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const Activity = require('../models/Activity');
const Notification = require('../models/Notification');

const router = express.Router();

// Helper: check if user is member of project
async function isProjectMember(projectId, userId) {
  console.log('Checking if user is member of project:', projectId, userId);
  const project = await Project.findById(projectId);
  console.log('Project:', project);
  if (!project) return false;

  const isMember = project.members.some(m => m.user.toString() === userId);
  const isOwner = project.owner.toString() === userId;

  return isMember || isOwner;
}

// Create task
router.post('/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    if (!(await isProjectMember(projectId, req.user.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const { title, description, status, assignees, dueDate } = req.body;
    const task = new Task({
      project: projectId,
      title,
      description,
      status,
      assignees,
      dueDate,
    });
    await task.save();
    req.io.emit('taskCreated', task);
    
    // Create activity
    await Activity.create({
      project: projectId,
      user: req.user.userId,
      action: 'Created task',
      details: title,
      entityType: 'task',
      entityId: task._id
    });
    
    // Notify all project members except actor
    const project = await Project.findById(projectId);
    const notifyUsers = project.members.filter(m => m.user.toString() !== req.user.userId);
    for (const m of notifyUsers) {
      await Notification.create({
        user: m.user,
        type: 'task',
        message: `Task created: ${title}`,
      });
    }
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks for a project
router.get('/:projectId', auth, async (req, res) => {
  console.log('Getting tasks for project:', req.params.projectId);
  console.log('User ID:', req.user.userId);
  try {
    const { projectId } = req.params;
    if (!(await isProjectMember(projectId, req.user.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const tasks = await Task.find({ project: projectId });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get task by id
router.get('/:projectId/:taskId', auth, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    if (!(await isProjectMember(projectId, req.user.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update task
router.put('/:projectId/:taskId', auth, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    if (!(await isProjectMember(projectId, req.user.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    Object.assign(task, req.body);
    await task.save();
    req.io.emit('taskUpdated', task);
    
    // Create activity
    await Activity.create({
      project: projectId,
      user: req.user.userId,
      action: 'Updated task',
      details: task.title,
      entityType: 'task',
      entityId: task._id
    });
    
    // Notify all project members except actor
    const project = await Project.findById(projectId);
    const notifyUsers = project.members.filter(m => m.user.toString() !== req.user.userId);
    for (const m of notifyUsers) {
      await Notification.create({
        user: m.user,
        type: 'task',
        message: `Task updated: ${task.title}`,
      });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete task
router.delete('/:projectId/:taskId', auth, async (req, res) => {
  try {
    const { projectId, taskId } = req.params;
    if (!(await isProjectMember(projectId, req.user.userId))) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Store task info before deletion for activity log
    const taskInfo = {
      title: task.title,
      id: task._id
    };

    // Delete the task
    await Task.findByIdAndDelete(taskId);
    req.io.emit('taskDeleted', { _id: taskId, project: projectId });
    
    // Create activity
    await Activity.create({
      project: projectId,
      user: req.user.userId,
      action: 'Deleted task',
      details: taskInfo.title,
      entityType: 'task',
      entityId: taskInfo.id
    });
    
    // Notify all project members except actor
    const project = await Project.findById(projectId);
    const notifyUsers = project.members.filter(m => m.user.toString() !== req.user.userId);
    for (const m of notifyUsers) {
      await Notification.create({
        user: m.user,
        type: 'task',
        message: `Task deleted: ${taskInfo.title}`,
      });
    }
    res.json({ message: 'Task deleted' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 