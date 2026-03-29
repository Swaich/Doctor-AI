const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIO = require('socket.io');

// 1. Load Environment Variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// 2. Advanced CORS Configuration
// This allows your specific Vercel frontend to talk to this backend securely
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  'http://localhost:3000',
  'https://doctor-ai-pi.vercel.app' // Added your specific Vercel URL
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      return callback(new Error('CORS Policy: This origin is not allowed'), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// 3. Socket.io Setup with optimized settings for Render
const io = socketIO(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  },
  transports: ['websocket', 'polling'] // Ensures compatibility
});

// 4. Standard Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Make io accessible to routes
app.set('io', io);

// 5. Initialize socket handler 
// Ensure your folder is lowercase 'socket' on GitHub!
try {
  require('./socket/index')(io);
  console.log('✅ Socket handlers initialized');
} catch (err) {
  console.error('❌ Socket initialization failed. Check if /socket/index.js exists.');
}

// 6. Routes (Organized and verified)
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
app.use('/api/video', require('./routes/videoCall'));
app.use('/api/medbot', require('./routes/medbot'));

// Health check endpoint (for Render to know the app is alive)
app.get('/', (req, res) => {
  res.status(200).send('MegaHealth API is Live and Running');
});

// 7. Global Error Handler (This will debug "Registration Failed" for you)
app.use((err, req, res, next) => {
  console.error('--- SERVER ERROR ---');
  console.error(err.stack);
  
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  res.status(status).json({
    success: false,
    message: message,
    error: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// 8. Database Connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error('❌ MONGO_URI is missing from Environment Variables!');
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB connected successfully'))
  .catch(err => {
    console.error('❌ MongoDB Connection Error:', err.message);
    process.exit(1);
  });

// 9. Start Server
const PORT = process.env.PORT || 10000; // Render uses 10000 by default
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
