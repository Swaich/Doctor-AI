const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io Configuration - Set to '*' for maximum compatibility during deployment
const io = socketIO(server, {
  cors: {
    origin: "*", 
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
// Using origin: '*' ensures your Vercel frontend is never blocked by the backend
app.use(cors({
  origin: '*', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make io accessible to routes
app.set('io', io);

// Initialize socket handler (WebRTC + Notes + Chat)
// Ensure you have the /socket/index.js file uploaded to GitHub!
require('./socket/index')(io);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/credits', require('./routes/credits'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/consultation-requests', require('./routes/consultationRequests'));
app.use('/api/slots', require('./routes/slots'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/stores', require('./routes/stores'));
app.use('/api/video', require('./routes/videoCall'));
app.use('/api/medbot', require('./routes/medbot'));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'MegaHealth API is running successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => e.message)
    });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format'
    });
  }
  if (err.code === 11000) {
    return res.status(400).json({
      message: 'Duplicate field value'
    });
  }
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`
  });
});

// Database connection
// process.env.MONGO_URI must be set in Render Environment Variables
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    console.error('❌ Server error:', err);
    process.exit(1);
  }
});
