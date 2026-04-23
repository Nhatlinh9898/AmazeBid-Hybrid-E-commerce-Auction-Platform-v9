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
let workspacePath = null; // To be set via API
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
// ... (omitted sendVSeeFaceExpression for brevity) ...
function sendVSeeFaceExpression(expressionName, value) {
    // VMC Protocol format for blendshapes: /VMC/Ext/Blend/Val <string:name> <float:value>
    // Note: Building raw OSC buffers in JS requires a library like 'osc' or 'osc-min' for production.
    // For this bridge example, we log the intent. In a real app, you'd use the 'osc' npm package.
    console.log(`[OSC -> VSeeFace] Setting expression '${expressionName}' to ${value}`);
}

// ==========================================
// API ENDPOINTS (Called by AmazeAvatar Web)
// ==========================================

// 0. Workspace Management
app.post('/api/setup-workspace', (req, res) => {
    const { basePath } = req.body;
    if (!basePath) return res.status(400).json({ error: 'basePath is required' });

    try {
        // Create specialized folders to match Knowledge Base categories
        const folders = ['images', 'videos', 'articles', 'specs', 'instructions', 'backups'];
        if (!fs.existsSync(basePath)) {
            fs.mkdirSync(basePath, { recursive: true });
        }

        folders.forEach(f => {
            const fPath = path.join(basePath, f);
            if (!fs.existsSync(fPath)) {
                fs.mkdirSync(fPath);
                console.log(`[WS] Created folder: ${fPath}`);
            }
        });

        workspacePath = basePath;
        res.json({ success: true, workspace: workspacePath, folders });
    } catch (error) {
        console.error('[WS] Setup failed:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/browse-workspace', (req, res) => {
    if (!workspacePath) return res.status(400).json({ error: 'Workspace not set. Call /api/setup-workspace first.' });

    try {
        const foldersMap = {
            'images': 'IMAGE',
            'videos': 'VIDEO',
            'articles': 'TEXT',
            'specs': 'SPEC',
            'instructions': 'INSTRUCTION'
        };
        
        const results = [];

        Object.keys(foldersMap).forEach(folder => {
            const dir = path.join(workspacePath, folder);
            const itemType = foldersMap[folder];
            
            if (fs.existsSync(dir)) {
                const files = fs.readdirSync(dir);
                files.forEach(file => {
                    const fullPath = path.join(dir, file);
                    const stats = fs.statSync(fullPath);
                    if (stats.isFile()) {
                        results.push({
                            name: file,
                            path: fullPath,
                            category: folder, // folder name
                            type: itemType,   // KnowledgeItem type
                            size: stats.size,
                            modifiedAt: stats.mtime
                        });
                    }
                });
            }
        });

        res.json({ success: true, files: results, workspace: workspacePath });
    } catch (error) {
        console.error('[WS] Browse failed:', error);
        res.status(500).json({ error: error.message });
    }
});

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

// 3. Handle Local File Serving (Knowledge Base Reference)
app.get('/api/file', (req, res) => {
    const filePath = req.query.path;
    if (!filePath) {
        return res.status(400).send('Path is required');
    }

    try {
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filePath).toLowerCase();
            const mimeMap = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.txt': 'text/plain',
                '.pdf': 'application/pdf'
            };
            
            res.setHeader('Content-Type', mimeMap[ext] || 'application/octet-stream');
            fs.createReadStream(filePath).pipe(res);
        } else {
            console.error(`[FILE] File not found: ${filePath}`);
            res.status(404).send('File not found');
        }
    } catch (error) {
        console.error(`[FILE] Error serving file:`, error);
        res.status(500).send('Error serving file');
    }
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
