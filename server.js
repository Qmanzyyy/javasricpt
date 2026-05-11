require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const axios = require('axios');
const broadcastRoutes = require('./routes/broadcast');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Make io accessible to routes
app.set('io', io);

// Routes
app.use('/api/broadcast', broadcastRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: io.engine.clientsCount
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);
  
  // ESP32 register dengan device_type
  socket.on('esp:register', (data) => {
    const { device_type } = data;
    if (device_type) {
      broadcastRoutes.espClients.set(device_type, socket.id);
      console.log(`[${new Date().toISOString()}] ESP32 registered: ${device_type} (${socket.id})`);
      socket.emit('esp:registered', { device_type, message: 'ESP32 registered successfully' });
    }
  });

  // ESP32 kirim data sensor/status
  socket.on('esp:data', async (data) => {
    const { device_type, ...deviceData } = data;
    console.log(`[${new Date().toISOString()}] ESP data received: ${device_type}`, deviceData);
    
    try {
      // Forward ke Laravel API
      const axios = require('axios');
      const laravelUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';
      
      await axios.post(`${laravelUrl}/device/${device_type}/status`, deviceData, {
        headers: {
          'X-API-Key': process.env.LARAVEL_API_KEY || 'PaniisApiKeyNesakti2026',
          'Content-Type': 'application/json'
        },
        timeout: 5000
      });

      // Broadcast ke client lain (browser)
      io.emit(`device:${device_type}:status_updated`, data);
      
      socket.emit('esp:ack', { success: true, message: 'Data received and forwarded' });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] Error forwarding ESP data:`, error.message);
      socket.emit('esp:ack', { success: false, message: 'Failed to forward data' });
    }
  });
  
  // Join private channel
  socket.on('join-channel', (channel) => {
    socket.join(channel);
    console.log(`[${new Date().toISOString()}] Client ${socket.id} joined channel: ${channel}`);
    socket.emit('joined', { channel, message: 'Successfully joined channel' });
  });

  // Leave channel
  socket.on('leave-channel', (channel) => {
    socket.leave(channel);
    console.log(`[${new Date().toISOString()}] Client ${socket.id} left channel: ${channel}`);
  });

  // Disconnect handling
  socket.on('disconnect', () => {
    // Remove ESP32 dari registry jika disconnect
    for (const [device_type, socketId] of broadcastRoutes.espClients.entries()) {
      if (socketId === socket.id) {
        broadcastRoutes.espClients.delete(device_type);
        console.log(`[${new Date().toISOString()}] ESP32 unregistered: ${device_type}`);
        break;
      }
    }
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);
  });
});

// Start server
const PORT = process.env.PORT || 1234;
server.listen(PORT, () => {
  console.log('===========================================');
  console.log('Smart Farm WebSocket Server');
  console.log('===========================================');
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`API Key: ${process.env.LARAVEL_API_KEY}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Broadcast API: http://localhost:${PORT}/api/broadcast`);
  console.log('===========================================');
});
