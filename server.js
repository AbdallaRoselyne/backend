require('dotenv').config();
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const path = require('path');
const connectDB = require('./config/db');

// Route imports
const authRoutes = require('./routes/auth');
const tasksRoutes = require('./routes/tasks');
const projectsRoutes = require('./routes/projects');
const requestsRoutes = require('./routes/requests');
const membersRoutes = require('./routes/members');
const completionsRoutes = require('./routes/taskCompletion');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Enhanced CORS configuration
const allowedOrigins = [
  'http://localhost:3000', 
  process.env.CLIENT_URL, 
  'https://frontend-production-f39d.up.railway.app' 
].filter(Boolean); 

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Handle preflight requests
app.options('*', cors(corsOptions));

// Middleware
app.use(express.json());

// API Routes
app.use("/",authRoutes);
app.use('/auth', authRoutes);
app.use('/api/requests', requestsRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/tasks', completionsRoutes)
app.use('/api/projects', projectsRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/completions', completionsRoutes);

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  // Correct path to your frontend build
  const frontendPath = path.join(__dirname, '../front-end/build');
  app.use(express.static(frontendPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
const PORT = process.env.PORT || 8080; // Railway uses 8080 by default
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Allowed origins: ${allowedOrigins.join(', ')}`);
});

// WebSocket Server
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
  const origin = req.headers.origin;
  
  // Validate origin
  if (!allowedOrigins.includes(origin)) {
    ws.close();
    return;
  }

  console.log('New WebSocket client connected');

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    // Broadcast message to all clients
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

// Handle WebSocket upgrade requests
server.on('upgrade', (request, socket, head) => {
  const origin = request.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});