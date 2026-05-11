#!/bin/bash

# Test script untuk WebSocket broadcasting
API_KEY="PaniisApiKeyNesakti2026"
BASE_URL="http://localhost:1234/api/broadcast"

echo "=========================================="
echo "Smart Farm WebSocket Broadcast Test"
echo "=========================================="

# Test 1: Broadcast Jadwal Created
echo -e "\n1. Testing Jadwal Created Broadcast..."
curl -X POST "$BASE_URL/jadwal" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "created",
    "data": {
      "id": 10,
      "nama": "Jadwal Test Baru",
      "waktu_aktif_pertama": "08:00",
      "waktu_aktif_kedua": "16:00",
      "lama_operasi": 15,
      "aktif": true,
      "hari": ["senin", "rabu", "jumat"]
    }
  }'

echo -e "\n"

# Test 2: Broadcast Jadwal Updated
echo -e "\n2. Testing Jadwal Updated Broadcast..."
curl -X POST "$BASE_URL/jadwal" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updated",
    "data": {
      "id": 2,
      "nama": "Jadwal Penyiraman Updated",
      "waktu_aktif_pertama": "09:00",
      "aktif": true
    }
  }'

echo -e "\n"

# Test 3: Broadcast Device Dinamo X
echo -e "\n3. Testing Device Dinamo X Broadcast..."
curl -X POST "$BASE_URL/device" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "device_type": "dinamo_x",
    "action": "status_updated",
    "data": {
      "id": 2,
      "device_type": "dinamo_x",
      "name": "Dinamo Sumbu X",
      "current_position": 750,
      "is_active": true,
      "speed": 200
    }
  }'

echo -e "\n"

# Test 4: Broadcast Device Relay Pump
echo -e "\n4. Testing Device Relay Pump Broadcast..."
curl -X POST "$BASE_URL/device" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "device_type": "relay_pump",
    "action": "status_updated",
    "data": {
      "id": 4,
      "device_type": "relay_pump",
      "name": "Pompa Air",
      "relay_state": true,
      "is_active": true
    }
  }'

echo -e "\n"

# Test 5: Broadcast to Channel
echo -e "\n5. Testing Channel Broadcast..."
curl -X POST "$BASE_URL/channel" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "channel": "smartfarm-private",
    "event": "system:notification",
    "data": {
      "message": "System notification test",
      "priority": "high"
    }
  }'

echo -e "\n"

# Test 6: Broadcast to All
echo -e "\n6. Testing Broadcast to All..."
curl -X POST "$BASE_URL/all" \
  -H "X-API-Key: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "system:alert",
    "data": {
      "message": "Global alert test",
      "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'"
    }
  }'

echo -e "\n\n=========================================="
echo "Test completed!"
echo "=========================================="
