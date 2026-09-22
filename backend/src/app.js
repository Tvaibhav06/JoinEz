const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const { errorHandler } = require('./middleware/errorHandler');
const { error, success } = require('./utils/response');

const authRoutes = require('./routes/authRoutes');
const groupRoutes = require('./routes/groupRoutes');
const courseRoutes = require('./routes/courseRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const submissionRoutes = require('./routes/submissionRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Configure CORS origin based on environment
const corsOptions = {
  origin: env.CLIENT_URL && env.CLIENT_URL !== '*'
    ? [env.CLIENT_URL, 'http://localhost:5173', 'http://localhost:3000']
    : '*',
  credentials: true
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  return success(res, { status: 'healthy', timestamp: new Date().toISOString() }, 'Joineazy API is running');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/assignments/:id/submission', submissionRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  return error(res, `Route not found: ${req.method} ${req.originalUrl}`, 404);
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
