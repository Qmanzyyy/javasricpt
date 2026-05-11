// ESP32 WebSocket Client Example untuk Smart Farm
// Library: ArduinoWebsockets by Gil Maimon

#include <WiFi.h>
#include <ArduinoWebsockets.h>

using namespace websockets;

// WiFi credentials
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// WebSocket server
const char* websocket_server = "ws://192.168.1.100:1234"; // Ganti dengan IP server Node.js

// Device info
const char* device_type = "dinamo_x"; // dinamo_x, dinamo_y, relay_pump, servo_nozzle

WebsocketsClient client;

void setup() {
  Serial.begin(115200);
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected!");
  Serial.print("IP: ");
  Serial.println(WiFi.localIP());
  
  // Setup WebSocket callbacks
  client.onMessage(onMessageCallback);
  client.onEvent(onEventsCallback);
  
  // Connect to WebSocket server
  connectWebSocket();
}

void loop() {
  if (client.available()) {
    client.poll();
  } else {
    Serial.println("WebSocket disconnected, reconnecting...");
    connectWebSocket();
    delay(5000);
  }
  
  // Simulasi kirim data sensor setiap 5 detik
  static unsigned long lastSend = 0;
  if (millis() - lastSend > 5000) {
    sendSensorData();
    lastSend = millis();
  }
}

void connectWebSocket() {
  Serial.println("Connecting to WebSocket server...");
  
  if (client.connect(websocket_server)) {
    Serial.println("WebSocket connected!");
    
    // Register ESP32 dengan device_type
    String registerMsg = "{\"device_type\":\"" + String(device_type) + "\"}";
    client.send("esp:register", registerMsg);
    
  } else {
    Serial.println("WebSocket connection failed!");
  }
}

void onMessageCallback(WebsocketsMessage message) {
  Serial.print("Received: ");
  Serial.println(message.data());
  
  // Parse JSON command dari Laravel
  // Contoh: {"command":"move","position":500,"speed":200}
  
  // TODO: Implementasi eksekusi command
  // - Jika dinamo: gerakkan motor ke posisi tertentu
  // - Jika relay: nyalakan/matikan relay
  // - Jika servo: set sudut servo
}

void onEventsCallback(WebsocketsEvent event, String data) {
  if (event == WebsocketsEvent::ConnectionOpened) {
    Serial.println("WebSocket connection opened");
  } else if (event == WebsocketsEvent::ConnectionClosed) {
    Serial.println("WebSocket connection closed");
  } else if (event == WebsocketsEvent::GotPing) {
    Serial.println("Got ping");
  } else if (event == WebsocketsEvent::GotPong) {
    Serial.println("Got pong");
  }
}

void sendSensorData() {
  // Contoh data untuk dinamo_x
  String jsonData = "{";
  jsonData += "\"device_type\":\"" + String(device_type) + "\",";
  jsonData += "\"current_position\":" + String(random(0, 1000)) + ",";
  jsonData += "\"is_active\":" + String(random(0, 2) == 1 ? "true" : "false");
  jsonData += "}";
  
  Serial.print("Sending data: ");
  Serial.println(jsonData);
  
  // Kirim via WebSocket event
  client.send("esp:data", jsonData);
}

// Fungsi untuk kirim heartbeat
void sendHeartbeat() {
  String jsonData = "{";
  jsonData += "\"device_type\":\"" + String(device_type) + "\"";
  jsonData += "}";
  
  client.send("esp:heartbeat", jsonData);
}
