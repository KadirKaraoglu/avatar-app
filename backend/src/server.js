import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3100;

// Apply middleware FIRST
app.use(cors());
app.use(express.json());

// === CUSTOM MODE SESSION ENDPOINTS ===
// Create session token for CUSTOM mode
app.post('/api/liveavatar/session/token', async (req, res) => {
    try {
        const HEYGEN_API_URL = 'https://api.liveavatar.com'; // Assuming this constant is needed and should be defined or imported
        const HEYGEN_TOKEN = process.env.HEYGEN_TOKEN || process.env.NEXT_PUBLIC_HEYGEN_TOKEN; // Assuming this constant is needed

        if (!HEYGEN_TOKEN) {
            return res.status(500).json({ error: 'HeyGen API key not configured' });
        }

        const response = await fetch(`${HEYGEN_API_URL}/v1/sessions/token`, {
            method: 'POST',
            headers: {
                'X-Api-Key': HEYGEN_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                mode: 'CUSTOM',
                avatar_id: '073b60a9-89a8-45aa-8902-c358f64d2852',
                language: 'tr'  // Turkish language for HeyGen TTS
            })
        });

        const data = await response.json();

        if (data.code !== 1000) {
            console.error('HeyGen API error:', data);
            return res.status(400).json(data);
        }

        console.log('✓ Session token created:', data.data.session_id);
        res.json(data);
    } catch (error) {
        console.error('Session token creation error:', error);
        res.status(500).json({ error: error.message });
    }
});

// HeyGen Session STOP Endpoint - Close server session
app.post('/api/liveavatar/session/stop', async (req, res) => {
    try {
        const { session_id } = req.body;

        if (!session_id) {
            return res.status(400).json({ error: 'session_id is required' });
        }

        console.log('🛑 Stopping HeyGen server session:', session_id);

        const HEYGEN_TOKEN = process.env.HEYGEN_TOKEN || process.env.NEXT_PUBLIC_HEYGEN_TOKEN;

        const response = await fetch(`${HEYGEN_API_URL}/v1/streaming.stop`, {
            method: 'POST',
            headers: {
                'X-Api-Key': HEYGEN_TOKEN,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id })
        });

        const data = await response.json();
        console.log('✓ HeyGen server session stopped:', data);
        res.json({ success: true, data });
    } catch (error) {
        console.error('Session stop error:', error);
        res.status(500).json({ error: error.message });
    }
});

// === FULL MODE SESSION ENDPOINTS (existing) ===

// LiveKit token generation endpoint
app.post('/api/livekit/token', async (req, res) => {
    try {
        const { roomName, participantName } = req.body;

        if (!roomName || !participantName) {
            return res.status(400).json({
                error: 'roomName and participantName are required'
            });
        }

        const apiKey = process.env.LIVEKIT_API_KEY;
        const apiSecret = process.env.LIVEKIT_API_SECRET;

        if (!apiKey || !apiSecret) {
            return res.status(500).json({
                error: 'LiveKit credentials not configured'
            });
        }

        // Create access token
        const token = new AccessToken(apiKey, apiSecret, {
            identity: participantName,
        });

        // Grant permissions
        token.addGrant({
            room: roomName,
            roomJoin: true,
            canPublish: true,
            canSubscribe: true,
            canPublishData: true,  // Required for LiveAvatar to send commands via data channel
        });

        const jwt = await token.toJwt();

        res.json({
            token: jwt,
            url: process.env.LIVEKIT_URL,
            roomName,
            participantName
        });

    } catch (error) {
        console.error('Token generation error:', error);
        res.status(500).json({ error: 'Failed to generate token' });
    }
});

// Fetch available voices from LiveAvatar
app.get('/api/liveavatar/voices', async (req, res) => {
    try {
        const apiKey = process.env.HEYGEN_TOKEN || process.env.NEXT_PUBLIC_HEYGEN_TOKEN;

        const response = await fetch('https://api.liveavatar.com/v1/voices', {
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Voices fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch voices' });
    }
});

// Fetch user contexts from LiveAvatar
app.get('/api/liveavatar/contexts', async (req, res) => {
    try {
        const apiKey = process.env.HEYGEN_TOKEN || process.env.NEXT_PUBLIC_HEYGEN_TOKEN;

        const response = await fetch('https://api.liveavatar.com/v1/contexts', {
            headers: {
                'Accept': 'application/json',
                'X-Api-Key': apiKey
            }
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Contexts fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch contexts' });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`LiveKit URL: ${process.env.LIVEKIT_URL}`);
});
