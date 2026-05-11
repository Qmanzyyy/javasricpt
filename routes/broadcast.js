const express = require('express');
const router = express.Router();
const { validateApiKey } = require('../middleware/auth');
const axios = require('axios');

// Store untuk menyimpan mapping ESP32 client
const espClients = new Map(); // device_type -> socket.id

// GET endpoint untuk info (tanpa auth)
router.get('/', (req, res) => {
  res.json({
    message: 'Smart Farm WebSocket Broadcast API',
    version: '1.0.0',
    endpoints: {
      'POST /api/broadcast/all': 'Broadcast to all clients',
      'POST /api/broadcast/channel': 'Broadcast to specific channel',
      'POST /api/broadcast/jadwal': 'Broadcast jadwal updates',
      'POST /api/broadcast/device': 'Broadcast device updates (Laravel -> ESP32)',
      'POST /api/broadcast/esp-data': 'Forward ESP32 data to Laravel (not used, use WebSocket event instead)'
    },
    note: 'POST endpoints require X-API-Key header (only for Laravel requests)',
    websocket_events: {
      'esp:register': 'ESP32 register with device_type',
      'esp:data': 'ESP32 send sensor data (no API key needed)',
      'esp:command': 'Receive command from Laravel',
      'device:{type}:{action}': 'Device updates broadcast to clients'
    },
    connected_esp32: Array.from(espClients.keys())
  });
});

// Middleware untuk validasi API key (hanya untuk POST)
router.use((req, res, next) => {
  if (req.method === 'POST') {
    return validateApiKey(req, res, next);
  }
  next();
});

// Broadcast ke semua client
router.post('/all', (req, res) => {
  const io = req.app.get('io');
  const { event, data } = req.body;

  if (!event || !data) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Event and data are required'
    });
  }

  io.emit(event, data);
  
  console.log(`[${new Date().toISOString()}] Broadcast to all - Event: ${event}`);
  
  res.json({
    message: 'Broadcast sent successfully',
    event,
    recipients: 'all',
    timestamp: new Date().toISOString()
  });
});

// Broadcast ke channel tertentu
router.post('/channel', (req, res) => {
  const io = req.app.get('io');
  const { channel, event, data } = req.body;

  if (!channel || !event || !data) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Channel, event, and data are required'
    });
  }

  io.to(channel).emit(event, data);
  
  console.log(`[${new Date().toISOString()}] Broadcast to channel: ${channel} - Event: ${event}`);
  
  res.json({
    message: 'Broadcast sent successfully',
    channel,
    event,
    timestamp: new Date().toISOString()
  });
});

// Broadcast jadwal update
router.post('/jadwal', (req, res) => {
  const io = req.app.get('io');
  const { action, data } = req.body;

  if (!action || !data) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'Action and data are required'
    });
  }

  const event = `jadwal:${action}`;
  io.emit(event, data);
  
  console.log(`[${new Date().toISOString()}] Jadwal broadcast - Action: ${action}`);
  
  res.json({
    message: 'Jadwal broadcast sent successfully',
    event,
    action,
    timestamp: new Date().toISOString()
  });
});

// Broadcast device update (Laravel -> WebSocket -> ESP32 & Clients)
router.post('/device', (req, res) => {
  const io = req.app.get('io');
  const { device_type, action, data } = req.body;

  if (!device_type || !action || !data) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'device_type, action, and data are required'
    });
  }

  const event = `device:${device_type}:${action}`;
  
  // Broadcast ke semua client (browser, mobile app)
  io.emit(event, data);
  
  // Kirim khusus ke ESP32 jika ada command
  if (action === 'command') {
    const espSocketId = espClients.get(device_type);
    if (espSocketId) {
      io.to(espSocketId).emit('esp:command', data);
      console.log(`[${new Date().toISOString()}] Command sent to ESP32: ${device_type}`);
    }
  }
  
  console.log(`[${new Date().toISOString()}] Device broadcast - Type: ${device_type}, Action: ${action}`);
  
  res.json({
    message: 'Device broadcast sent successfully',
    event,
    device_type,
    action,
    timestamp: new Date().toISOString()
  });
});

// Endpoint untuk ESP32 kirim data ke Laravel (ESP32 -> WebSocket -> Laravel)
router.post('/esp-data', async (req, res) => {
  const { device_type, data } = req.body;

  if (!device_type || !data) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'device_type and data are required'
    });
  }

  try {
    // Forward data ke Laravel API
    const laravelUrl = process.env.LARAVEL_API_URL || 'http://localhost:8000/api';
    const response = await axios.post(`${laravelUrl}/device/${device_type}/status`, data, {
      headers: {
        'X-API-Key': process.env.LARAVEL_API_KEY || 'PaniisApiKeyNesakti2026',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log(`[${new Date().toISOString()}] ESP data forwarded to Laravel: ${device_type}`);

    res.json({
      message: 'Data forwarded to Laravel successfully',
      device_type,
      laravel_response: response.data
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error forwarding to Laravel:`, error.message);
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to forward data to Laravel',
      details: error.message
    });
  }
});

// Export espClients untuk digunakan di server.js
router.espClients = espClients;

module.exports = router;
