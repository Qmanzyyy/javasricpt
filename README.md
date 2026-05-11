# Smart Farm WebSocket Server

WebSocket server untuk broadcasting real-time dari Laravel API ke client menggunakan Socket.IO.

## Instalasi

```bash
npm install
```

## Konfigurasi

Copy file `.env.example` ke `.env` dan sesuaikan konfigurasi:

```env
PORT=1234
LARAVEL_API_KEY=PaniisApiKeyNesakti2026
LARAVEL_API_URL=http://localhost:8000/api
NODE_ENV=development
```

## Menjalankan Server

Development mode (dengan auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Endpoint API

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-05-11T00:00:00.000Z",
  "connections": 5
}
```

### Broadcast Endpoints

Semua endpoint broadcast memerlukan header:
```
X-API-Key: PaniisApiKeyNesakti2026
Content-Type: application/json
```

#### 1. Broadcast ke Semua Client
```
POST /api/broadcast/all
```

Request Body:
```json
{
  "event": "notification",
  "data": {
    "message": "Hello World"
  }
}
```

#### 2. Broadcast ke Channel Tertentu
```
POST /api/broadcast/channel
```

Request Body:
```json
{
  "channel": "smartfarm-private",
  "event": "update",
  "data": {
    "message": "Channel update"
  }
}
```

#### 3. Broadcast Jadwal Update
```
POST /api/broadcast/jadwal
```

Request Body:
```json
{
  "action": "created",
  "data": {
    "id": 2,
    "nama": "Jadwal Penyiraman pertama",
    "waktu_aktif_pertama": "08:00",
    "waktu_aktif_kedua": "16:00",
    "lama_operasi": 1,
    "aktif": true,
    "hari": ["senin", "minggu"]
  }
}
```

Actions: `created`, `updated`, `deleted`, `activated`, `deactivated`

#### 4. Broadcast Device Update
```
POST /api/broadcast/device
```

Request Body:
```json
{
  "device_type": "dinamo_x",
  "action": "status_updated",
  "data": {
    "id": 2,
    "device_type": "dinamo_x",
    "name": "Dinamo Sumbu X",
    "current_position": 500,
    "is_active": true
  }
}
```

Device Types: `dinamo_x`, `dinamo_y`, `relay_pump`, `servo_nozzle`
Actions: `status_updated`, `config_updated`, `heartbeat`

## Client Connection (JavaScript)

```javascript
// Import Socket.IO client
import { io } from 'socket.io-client';

// Connect ke server
const socket = io('http://localhost:1234');

// Event: Connected
socket.on('connect', () => {
  console.log('Connected to WebSocket server');
  
  // Join private channel
  socket.emit('join-channel', 'smartfarm-private');
});

// Event: Joined channel
socket.on('joined', (data) => {
  console.log('Joined channel:', data);
});

// Listen untuk jadwal events
socket.on('jadwal:created', (data) => {
  console.log('Jadwal created:', data);
});

socket.on('jadwal:updated', (data) => {
  console.log('Jadwal updated:', data);
});

socket.on('jadwal:activated', (data) => {
  console.log('Jadwal activated:', data);
});

// Listen untuk device events
socket.on('device:dinamo_x:status_updated', (data) => {
  console.log('Dinamo X status updated:', data);
});

socket.on('device:relay_pump:status_updated', (data) => {
  console.log('Relay pump status updated:', data);
});

// Event: Disconnected
socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket server');
});
```

## Integrasi dengan Laravel

Tambahkan kode berikut di Laravel Controller setelah operasi CRUD:

```php
use Illuminate\Support\Facades\Http;

class JadwalController extends Controller
{
    private function broadcastJadwal($action, $jadwal)
    {
        try {
            Http::withHeaders([
                'X-API-Key' => env('WEBSOCKET_API_KEY'),
                'Content-Type' => 'application/json'
            ])->post(env('WEBSOCKET_URL') . '/api/broadcast/jadwal', [
                'action' => $action,
                'data' => $jadwal
            ]);
        } catch (\Exception $e) {
            \Log::error('WebSocket broadcast failed: ' . $e->getMessage());
        }
    }

    public function store(Request $request)
    {
        // ... validasi dan create jadwal
        $jadwal = Jadwal::create($validated);
        
        // Broadcast ke WebSocket
        $this->broadcastJadwal('created', $jadwal);
        
        return response()->json([
            'message' => 'Jadwal berhasil dibuat',
            'data' => $jadwal
        ], 201);
    }

    public function update(Request $request, $id)
    {
        // ... validasi dan update jadwal
        $jadwal->update($validated);
        
        // Broadcast ke WebSocket
        $this->broadcastJadwal('updated', $jadwal);
        
        return response()->json([
            'message' => 'Jadwal berhasil diperbarui',
            'data' => $jadwal
        ]);
    }
}
```

Tambahkan di `.env` Laravel:
```env
WEBSOCKET_URL=http://localhost:1234
WEBSOCKET_API_KEY=PaniisApiKeyNesakti2026
```

## Event Naming Convention

### Jadwal Events
- `jadwal:created` - Jadwal baru dibuat
- `jadwal:updated` - Jadwal diupdate
- `jadwal:deleted` - Jadwal dihapus
- `jadwal:activated` - Jadwal diaktifkan
- `jadwal:deactivated` - Jadwal dinonaktifkan

### Device Events
- `device:{device_type}:status_updated` - Status device berubah
- `device:{device_type}:config_updated` - Konfigurasi device berubah
- `device:{device_type}:heartbeat` - Heartbeat dari ESP32

## Testing dengan cURL

```bash
# Test broadcast jadwal
curl -X POST http://localhost:1234/api/broadcast/jadwal \
  -H "X-API-Key: PaniisApiKeyNesakti2026" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updated",
    "data": {
      "id": 2,
      "nama": "Jadwal Test",
      "aktif": true
    }
  }'

# Test broadcast device
curl -X POST http://localhost:1234/api/broadcast/device \
  -H "X-API-Key: PaniisApiKeyNesakti2026" \
  -H "Content-Type: application/json" \
  -d '{
    "device_type": "dinamo_x",
    "action": "status_updated",
    "data": {
      "id": 2,
      "current_position": 750,
      "is_active": true
    }
  }'
```

## Port

Default port: **1234**

Dapat diubah melalui environment variable `PORT` di file `.env`
