# Smart Farm Communication Flow

## Arsitektur Sistem

```
ESP32 ←→ WebSocket Server (Node.js) ←→ Laravel API
                ↓
         Browser Clients
```

## Flow 1: ESP32 → WebSocket → Laravel (Data Sensor)

**Kirim data sensor/status dari ESP32 ke Laravel**

```
1. ESP32 connect ke WebSocket server
   Event: 'esp:register'
   Data: { device_type: "dinamo_x" }

2. ESP32 kirim data sensor
   Event: 'esp:data'
   Data: {
     device_type: "dinamo_x",
     current_position: 500,
     is_active: true
   }

3. WebSocket forward ke Laravel API
   POST http://localhost:8000/api/device/dinamo_x/status
   Header: X-API-Key: PaniisApiKeyNesakti2026
   Body: {
     current_position: 500,
     is_active: true
   }

4. Laravel simpan ke database dan response
   Response: {
     message: "Device status updated",
     data: { ... }
   }

5. WebSocket broadcast ke semua client browser
   Event: 'device:dinamo_x:status_updated'
   Data: { ... }
```

## Flow 2: Laravel → WebSocket → ESP32 (Command/Control)

**Kirim perintah dari Laravel ke ESP32**

```
1. User klik tombol di web Laravel (misal: "Gerakkan Dinamo X ke posisi 750")

2. Laravel kirim command ke WebSocket
   POST http://localhost:1234/api/broadcast/device
   Header: X-API-Key: PaniisApiKeyNesakti2026
   Body: {
     device_type: "dinamo_x",
     action: "command",
     data: {
       command: "move",
       position: 750,
       speed: 200
     }
   }

3. WebSocket kirim ke ESP32 yang terdaftar
   Event: 'esp:command'
   Data: {
     command: "move",
     position: 750,
     speed: 200
   }

4. ESP32 eksekusi command (gerakkan motor)

5. ESP32 kirim status update (kembali ke Flow 1)
   Event: 'esp:data'
   Data: {
     device_type: "dinamo_x",
     current_position: 750,
     is_active: true
   }
```

## Flow 3: Laravel → WebSocket → Browser (Broadcast Update)

**Broadcast update dari Laravel ke semua client browser**

```
1. Ada perubahan di Laravel (CRUD jadwal, update device config, dll)

2. Laravel broadcast ke WebSocket
   POST http://localhost:1234/api/broadcast/jadwal
   Header: X-API-Key: PaniisApiKeyNesakti2026
   Body: {
     action: "updated",
     data: {
       id: 2,
       nama: "Jadwal Penyiraman",
       aktif: true
     }
   }

3. WebSocket broadcast ke semua client
   Event: 'jadwal:updated'
   Data: { ... }

4. Browser client update UI real-time
```

## WebSocket Events

### ESP32 Events (ESP32 ↔ WebSocket)

**Dari ESP32:**
- `esp:register` - Register ESP32 dengan device_type
- `esp:data` - Kirim data sensor/status
- `esp:heartbeat` - Heartbeat signal

**Ke ESP32:**
- `esp:registered` - Konfirmasi registrasi
- `esp:command` - Command dari Laravel
- `esp:ack` - Acknowledgment

### Client Events (Browser ↔ WebSocket)

**Dari Browser:**
- `join-channel` - Join private channel
- `leave-channel` - Leave channel

**Ke Browser:**
- `joined` - Konfirmasi join channel
- `jadwal:created` - Jadwal baru dibuat
- `jadwal:updated` - Jadwal diupdate
- `jadwal:deleted` - Jadwal dihapus
- `jadwal:activated` - Jadwal diaktifkan
- `device:{type}:status_updated` - Status device berubah
- `device:{type}:config_updated` - Config device berubah
- `device:{type}:command` - Command dikirim ke device

## API Endpoints

### WebSocket Server (Node.js)

**Health Check:**
```
GET /health
Response: { status: "ok", connections: 5 }
```

**Broadcast Endpoints (Require X-API-Key header):**

```
POST /api/broadcast/all
POST /api/broadcast/channel
POST /api/broadcast/jadwal
POST /api/broadcast/device
POST /api/broadcast/esp-data
```

### Laravel API

**Device Endpoints:**
```
GET  /api/device-control
GET  /api/device/{deviceId}
POST /api/device/{deviceId}/status
POST /api/device/{deviceId}/heartbeat
PUT  /api/device-control/{id}
```

**Jadwal Endpoints:**
```
GET  /api/jadwal
GET  /api/jadwal/active
GET  /api/jadwal/{id}
POST /api/jadwal
PUT  /api/jadwal/{id}
```

## Contoh Implementasi

### ESP32 (Arduino)
Lihat: `examples/esp32-example.ino`

### Laravel Controller
Lihat: `examples/laravel-integration.php`

### Browser Client
Lihat: `examples/client-example.html`
