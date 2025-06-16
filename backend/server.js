const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projectRoutes');
const taskRoutes = require('./routes/task');
const commentRoutes = require('./routes/comment');
const uploadRoutes = require('./routes/upload');
const activityRoutes = require('./routes/activity');
const notificationRoutes = require('./routes/notification');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ message: 'Route not found' });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Make io available globally
app.set('io', io);

// Add io to request object
app.use((req, res, next) => {
  req.io = app.get('io');
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-project', (projectId) => {
    socket.join(projectId);
    console.log(`User ${socket.id} joined project ${projectId}`);
  });

  socket.on('leave-project', (projectId) => {
    socket.leave(projectId);
    console.log(`User ${socket.id} left project ${projectId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Serve uploads statically with absolute path
const uploadsPath = path.join(__dirname, 'uploads');
console.log('Serving uploads from:', uploadsPath);
app.use('/uploads', express.static(uploadsPath));

// Add logging middleware for uploads
app.use('/uploads', (req, res, next) => {
  console.log('Accessing upload:', req.path);
  next();
}); 