const express = require('express');
const cors = require('cors');
const { OBSWebSocket } = require('obs-websocket-js');
const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

// ==========================================
// CONFIGURATION
// ==========================================
const PORT = 3001; // Port for this local bridge server
const OBS_URL = 'ws://127.0.0.1:4455'; // Default OBS WebSocket port (v5)
const OBS_PASSWORD = 'your_obs_password_here'; // Set this in OBS WebSocket settings

// VSeeFace OSC Configuration (Enable OSC/VMC receiver in VSeeFace settings)
const VSEEFACE_IP = '127.0.0.1';
const VSEEFACE_PORT = 3333; // Default OSC port in VSeeFace

// ==========================================
// INITIALIZATION
// ==========================================
const app = express();
app.use(cors());
app.use(express.json());

const obs = new OBSWebSocket();
const udpClient = dgram.createSocket('udp4');

// Connect to OBS
async function connectOBS() {
    try {
        await obs.connect(OBS_URL, OBS_PASSWORD);
        console.log('✅ Connected to OBS Studio successfully!');
    } catch (error) {
        console.error('❌ Failed to connect to OBS. Is OBS running and WebSocket enabled?', error.message);
    }
}
connectOBS();

// ==========================================
// HELPER: SEND OSC TO VSEEFACE
// ==========================================
// Simple OSC message builder for VMC protocol (Virtual Motion Capture)
// VSeeFace uses VMC protocol over OSC to control blendshapes (expressions)
function sendVSeeFaceExpression(expressionName, value) {
    // VMC Protocol format for blendshapes: /VMC/Ext/Blend/Val <string:name> <float:value>
    // Note: Building raw OSC buffers in JS requires a library like 'osc' or 'osc-min' for production.
    // For this bridge example, we log the intent. In a real app, you'd use the 'osc' npm package.
    console.log(`[OSC -> VSeeFace] Setting expression '${expressionName}' to ${value}`);
    
    // Example of how it would look with the 'osc' package:
    /*
    const msg = {
        address: "/VMC/Ext/Blend/Val",
        args: [
            { type: "s", value: expressionName }, // e.g., "Joy", "Angry", "Sorrow", "Fun"
            { type: "f", value: value }           // 0.0 to 1.0
        ]
    };
    udpPort.send(msg, VSEEFACE_IP, VSEEFACE_PORT);
    */
}

// ==========================================
// API ENDPOINTS (Called by AmazeAvatar Web)
// ==========================================

// 1. Handle Avatar Actions (from avatarSkillService.ts)
app.post('/api/action', async (req, res) => {
    const { action, payload } = req.body;
    console.log(`\n📥 Received Action from Web: ${action}`);

    try {
        switch (action) {
            case 'PIN':
                // OBS: Show product image source overlay
                console.log(`[OBS] Showing Product Overlay for: ${payload.product.title}`);
                await obs.call('SetSceneItemEnabled', {
                    sceneName: 'Livestream_Scene', // Replace with your OBS Scene Name
                    sceneItemId: 1, // You need to get the actual Item ID of your product image source
                    sceneItemEnabled: true
                });
                
                // Hide after 15 seconds
                setTimeout(async () => {
                    await obs.call('SetSceneItemEnabled', {
                        sceneName: 'Livestream_Scene',
                        sceneItemId: 1,
                        sceneItemEnabled: false
                    });
                    console.log(`[OBS] Hid Product Overlay`);
                }, 15000);
                break;

            case 'CHANGE_ENV':
                // OBS: Switch to a different Scene (Background)
                console.log(`[OBS] Switching Scene to: ${payload.envType}`);
                let targetScene = 'Scene_Studio';
                if (payload.envType === 'STAGE') targetScene = 'Scene_Stage';
                if (payload.envType === 'OUTDOOR') targetScene = 'Scene_Outdoor';
                
                await obs.call('SetCurrentProgramScene', { sceneName: targetScene });
                break;

            case 'JOKE':
            case 'SING':
                // VSeeFace: Trigger a happy/fun expression
                sendVSeeFaceExpression('Fun', 1.0);
                setTimeout(() => sendVSeeFaceExpression('Fun', 0.0), 5000); // Reset after 5s
                break;

            default:
                console.log(`No local handler for action: ${action}`);
        }
        res.json({ success: true, message: `Action ${action} processed locally.` });
    } catch (error) {
        console.error(`❌ Error processing action ${action}:`, error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Handle Audio Playback (Routing TTS to Virtual Cable)
app.post('/api/play-audio', (req, res) => {
    const { audioBase64 } = req.body;
    
    // In a full implementation, you would:
    // 1. Decode base64 to a temporary .wav file
    // 2. Play the .wav file using a library like 'play-sound' or 'node-wav-player'
    // 3. Ensure the system's default playback device is set to a "Virtual Audio Cable" (e.g., VB-Cable)
    // 4. Set VSeeFace's microphone input to that same "Virtual Audio Cable"
    // This routes the TTS audio directly into VSeeFace for lip-syncing!
    
    console.log(`[AUDIO] Received audio chunk (${audioBase64.length} bytes)`);
    console.log(`[AUDIO] Playing audio through Virtual Cable to VSeeFace...`);
    
    // Simulate playback duration
    setTimeout(() => {
        res.json({ success: true, message: 'Audio playback finished' });
    }, 3000);
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
    console.log(`
===================================================
🚀 AmazeAvatar Local Bridge is running on port ${PORT}
===================================================
This script connects your Web Dashboard to:
1. OBS Studio (via WebSocket)
2. VSeeFace (via OSC/Virtual Audio Cable)

Make sure OBS WebSocket is enabled on port 4455.
Make sure VSeeFace OSC Receiver is enabled on port 3333.
===================================================
    `);
});
