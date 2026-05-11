<?php

namespace App\Http\Controllers\Api;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Trait untuk broadcasting ke WebSocket server
 * Tambahkan trait ini ke Controller yang memerlukan broadcasting
 */
trait WebSocketBroadcast
{
    /**
     * Broadcast jadwal update ke WebSocket
     */
    private function broadcastJadwal($action, $jadwal)
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => env('WEBSOCKET_API_KEY', 'PaniisApiKeyNesakti2026'),
                'Content-Type' => 'application/json'
            ])->timeout(5)->post(env('WEBSOCKET_URL', 'http://localhost:1234') . '/api/broadcast/jadwal', [
                'action' => $action,
                'data' => $jadwal
            ]);

            if ($response->successful()) {
                Log::info("WebSocket broadcast success: jadwal:{$action}");
            } else {
                Log::warning("WebSocket broadcast failed: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('WebSocket broadcast error: ' . $e->getMessage());
        }
    }

    /**
     * Broadcast device update ke WebSocket
     */
    private function broadcastDevice($deviceType, $action, $device)
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => env('WEBSOCKET_API_KEY', 'PaniisApiKeyNesakti2026'),
                'Content-Type' => 'application/json'
            ])->timeout(5)->post(env('WEBSOCKET_URL', 'http://localhost:1234') . '/api/broadcast/device', [
                'device_type' => $deviceType,
                'action' => $action,
                'data' => $device
            ]);

            if ($response->successful()) {
                Log::info("WebSocket broadcast success: device:{$deviceType}:{$action}");
            } else {
                Log::warning("WebSocket broadcast failed: " . $response->body());
            }
        } catch (\Exception $e) {
            Log::error('WebSocket broadcast error: ' . $e->getMessage());
        }
    }

    /**
     * Broadcast ke channel tertentu
     */
    private function broadcastToChannel($channel, $event, $data)
    {
        try {
            $response = Http::withHeaders([
                'X-API-Key' => env('WEBSOCKET_API_KEY', 'PaniisApiKeyNesakti2026'),
                'Content-Type' => 'application/json'
            ])->timeout(5)->post(env('WEBSOCKET_URL', 'http://localhost:1234') . '/api/broadcast/channel', [
                'channel' => $channel,
                'event' => $event,
                'data' => $data
            ]);

            if ($response->successful()) {
                Log::info("WebSocket broadcast success: {$channel}:{$event}");
            }
        } catch (\Exception $e) {
            Log::error('WebSocket broadcast error: ' . $e->getMessage());
        }
    }
}

/**
 * Contoh implementasi di JadwalController
 */
class JadwalController extends Controller
{
    use WebSocketBroadcast;

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama' => 'required|string|max:255',
            'waktu_aktif_pertama' => 'required|date_format:H:i',
            'waktu_aktif_kedua' => 'nullable|date_format:H:i',
            'lama_operasi' => 'required|integer|min:1',
            'aktif' => 'boolean',
            'hari' => 'required|array',
        ]);

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
        $jadwal = Jadwal::findOrFail($id);
        
        $validated = $request->validate([
            'nama' => 'string|max:255',
            'waktu_aktif_pertama' => 'date_format:H:i',
            'waktu_aktif_kedua' => 'nullable|date_format:H:i',
            'lama_operasi' => 'integer|min:1',
            'aktif' => 'boolean',
            'hari' => 'array',
        ]);

        $jadwal->update($validated);

        // Broadcast ke WebSocket
        $this->broadcastJadwal('updated', $jadwal);

        return response()->json([
            'message' => 'Jadwal berhasil diperbarui',
            'data' => $jadwal
        ]);
    }

    public function destroy($id)
    {
        $jadwal = Jadwal::findOrFail($id);
        $jadwalData = $jadwal->toArray();
        
        $jadwal->delete();

        // Broadcast ke WebSocket
        $this->broadcastJadwal('deleted', $jadwalData);

        return response()->json([
            'message' => 'Jadwal berhasil dihapus'
        ]);
    }
}

/**
 * Contoh implementasi di DeviceControlController
 */
class DeviceControlController extends Controller
{
    use WebSocketBroadcast;

    public function updateStatus(Request $request, $deviceId)
    {
        $device = DeviceControl::where('device_type', $deviceId)->firstOrFail();

        $validated = $request->validate([
            'current_position' => 'integer',
            'is_active' => 'boolean',
            'servo_angle' => 'integer|min:0|max:180',
            'relay_state' => 'boolean',
        ]);

        $device->update($validated);

        // Broadcast ke WebSocket
        $this->broadcastDevice($device->device_type, 'status_updated', $device);

        return response()->json([
            'message' => 'Device status updated',
            'data' => $device
        ]);
    }

    public function heartbeat(Request $request, $deviceId)
    {
        $device = DeviceControl::where('device_type', $deviceId)->firstOrFail();
        
        $device->update([
            'last_heartbeat' => now()
        ]);

        // Broadcast ke WebSocket
        $this->broadcastDevice($device->device_type, 'heartbeat', $device);

        return response()->json([
            'message' => 'Heartbeat updated',
            'data' => $device
        ]);
    }

    public function update(Request $request, $id)
    {
        $device = DeviceControl::findOrFail($id);

        $validated = $request->validate([
            'mode' => 'in:manual,auto',
            'speed' => 'integer|min:0|max:255',
            'calibration_percentage' => 'numeric|min:0|max:100',
        ]);

        $device->update($validated);

        // Broadcast ke WebSocket
        $this->broadcastDevice($device->device_type, 'config_updated', $device);

        return response()->json([
            'message' => 'Device berhasil diperbarui',
            'data' => $device
        ]);
    }
}
