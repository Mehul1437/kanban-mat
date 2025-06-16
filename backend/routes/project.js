const express = require('express');
const Project = require('../models/Project');
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Notification = require('../models/Notification');

const router = express.Router();

// Create project
router.post('/', auth, async (req, res) => {
  try {
    const { name, description } = req.body;
    const project = new Project({
      name,
      description,
      owner: req.user.userId,
      members: [{ user: req.user.userId, role: 'Owner' }],
    });
    await project.save();
    req.io.emit('projectCreated', project);
    // Activity log
    await ActivityLog.create({
      project: project._id,
      user: req.user.userId,
      action: 'Created project',
      details: name,
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all projects for user
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user.userId });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get project by id
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (!project.members.some(m => m.user.toString() === req.user.userId)) {
      return res.status(403).json({ message: 'Access denied' });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Update project (Owner only)
router.put('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const member = project.members.find(m => m.user.toString() === req.user.userId);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Only owner can update project' });
    }
    project.name = req.body.name || project.name;
    project.description = req.body.description || project.description;
    await project.save();
    req.io.emit('projectUpdated', project);
    // Activity log
    await ActivityLog.create({
      project: project._id,
      user: req.user.userId,
      action: 'Updated project',
      details: project.name,
    });
    // Notify all members except actor
    const notifyUsers = project.members.filter(m => m.user.toString() !== req.user.userId);
    for (const m of notifyUsers) {
      await Notification.create({
        user: m.user,
        type: 'project',
        message: `Project updated: ${project.name}`,
      });
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete project (Owner only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const member = project.members.find(m => m.user.toString() === req.user.userId);
    if (!member || member.role !== 'Owner') {
      return res.status(403).json({ message: 'Only owner can delete project' });
    }
    await project.remove();
    req.io.emit('projectDeleted', { _id: req.params.id });
    // Activity log
    await ActivityLog.create({
      project: req.params.id,
      user: req.user.userId,
      action: 'Deleted project',
      details: project.name,
    });
    // Notify all members except actor
    const notifyUsers = project.members.filter(m => m.user.toString() !== req.user.userId);
    for (const m of notifyUsers) {
      await Notification.create({
        user: m.user,
        type: 'project',
        message: `Project deleted: ${project.name}`,
      });
    }
    res.json({ message: 'Project deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all tasks for a project
router.get('/:id/tasks', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(m => m.user.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const tasks = await Task.find({ project: req.params.id })
      .populate('assignees', 'name email')
      .sort({ createdAt: -1 });

    res.json(tasks);
  } catch (err) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all members of a project
router.get('/:id/members', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('members.user', 'name email')
      .populate('members.invitedBy', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(m => m.user.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project.members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Invite a member to the project
router.post('/:id/members/invite', auth, async (req, res) => {
  try {
    const { email } = req.body;
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is a member of the project
    const isMember = project.members.some(m => m.user.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if user already exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is already a member
    const isAlreadyMember = project.members.some(m => m.user.toString() === user._id.toString());
    if (isAlreadyMember) {
      return res.status(400).json({ message: 'User is already a member' });
    }

    // Add user to members array with pending status
    project.members.push({
      user: user._id,
      role: 'Member',
      status: 'pending',
      invitedBy: req.user.userId
    });

    await project.save();

    // Create notification for invited user
    await Notification.create({
      user: user._id,
      type: 'invitation',
      message: `You have been invited to join project: ${project.name}`,
    });

    // Log activity
    await ActivityLog.create({
      project: project._id,
      user: req.user.userId,
      action: 'Invited member',
      details: email
    });

    res.status(201).json(project.members);
  } catch (err) {
    console.error('Error inviting member:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept invitation
router.post('/:id/members/invites/:inviteId/accept', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const member = project.members.id(req.params.inviteId);
    if (!member) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (member.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    member.status = 'accepted';
    await project.save();

    // Log activity
    await ActivityLog.create({
      project: project._id,
      user: req.user.userId,
      action: 'Accepted invitation',
      details: project.name
    });

    res.json(member);
  } catch (err) {
    console.error('Error accepting invitation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject invitation
router.post('/:id/members/invites/:inviteId/reject', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const member = project.members.id(req.params.inviteId);
    if (!member) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    if (member.user.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Remove member from project
    project.members = project.members.filter(m => m._id.toString() !== req.params.inviteId);
    await project.save();

    // Log activity
    await ActivityLog.create({
      project: project._id,
      user: req.user.userId,
      action: 'Rejected invitation',
      details: project.name
    });

    res.json({ message: 'Invitation rejected' });
  } catch (err) {
    console.error('Error rejecting invitation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove member from project
router.delete('/:id/members/:memberId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user is project owner
    const isOwner = project.members.some(m => 
      m.user.toString() === req.user.userId && m.role === 'Owner'
    );
    if (!isOwner) {
      return res.status(403).json({ message: 'Only owner can remove members' });
    }

    const member = project.members.id(req.params.memberId);
    if (!member) {
      return res.status(404).json({ message: 'Member not found' });
    }

    // Don't allow removing the owner
    if (member.role === 'Owner') {
      return res.status(400).json({ message: 'Cannot remove project owner' });
    }

    // Remove member
    project.members = project.members.filter(m => m._id.toString() !== req.params.memberId);
    await project.save();

    // Log activity
    await ActivityLog.create({
      project: project._id,
      user: req.user.userId,
      action: 'Removed member',
      details: member.user.name || member.user.email
    });

    res.json({ message: 'Member removed' });
  } catch (err) {
    console.error('Error removing member:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 