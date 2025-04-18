const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

// const envPath = path.join(__dirname, '.env');
// const result = dotenv.config({ path: envPath });

// if (result.error) {
//   console.warn('Local .env file not found - relying on Railway environment variables');
// } else {
//   console.log('Local .env file loaded successfully');
// }

console.log('🔍 Environment Variables Verification:', {
  MONGO_URI: process.env.MONGO_URI ? 'Loaded' : 'MISSING',
  JWT_SECRET: process.env.JWT_SECRET ? 'Loaded' : 'MISSING',
  PORT: process.env.PORT || 'Using default (8080)',
  NODE_ENV: process.env.NODE_ENV || 'Not set (defaulting to development)',
  CLIENT_URL: process.env.CLIENT_URL || 'Not set'
});

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const projectsRoutes = require('./routes/projects');
const requestsRoutes = require('./routes/requests');
const membersRoutes = require('./routes/members');
const completionsRoutes = require('./routes/taskCompletion');

const app = express();

(async () => {
  try {
    await connectDB();
    console.log('Database connection established');
  } catch (dbError) {
    console.error('FATAL: Database connection failed:', dbError.message);
    process.exit(1); 
  }
})();

//CORS configuration
const allowedOrigins = [
  'http://localhost:3000', 
  process.env.CLIENT_URL, 
  'https://frontend-production-f39d.up.railway.app'
].filter(Boolean); 

console.log('Allowed CORS Origins:', allowedOrigins);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn('Blocked CORS request from:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// API Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: "Backend API is running",
    status: "healthy",
    dbStatus: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use("/auth", authRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/tasks', completionsRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/completions', completionsRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Start server
const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0'; 

const server = app.listen(PORT, HOST, () => {
  console.log(`\n Server running on http://${HOST}:${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}\n`);
}
);

// WebSocket Server with enhanced logging
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  
  if (!allowedOrigins.includes(origin)) {
    console.log(`🚫 Blocked WebSocket connection from unauthorized origin: ${origin}`);
    return ws.close();
  }

  console.log(`➕ New WebSocket client connected (${origin})`);

  ws.on('message', (message) => {
    console.log(`📨 Received message: ${message}`);
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => {
    console.log('WebSocket client disconnected');
  });
});

server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    console.log(`🚫 Blocked WebSocket upgrade from unauthorized origin: ${origin}`);
    socket.destroy();
  }
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM received - shutting down gracefully');
  server.close(() => {
    console.log('💤 Server closed');
    process.exit(0);
  });
});