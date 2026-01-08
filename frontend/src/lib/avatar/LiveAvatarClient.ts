import {
    Room,
    RoomEvent,
    RemoteVideoTrack,
    RemoteAudioTrack,
    VideoPresets,
} from "livekit-client";

// Event types for internal communication
export const AVATAR_EVENTS = {
    STREAM_READY: "stream_ready",
    DISCONNECTED: "disconnected",
    USER_START: "user_start",
    USER_STOP: "user_stop",
    AVATAR_START_TALKING: "avatar_start_talking",
    AVATAR_STOP_TALKING: "avatar_stop_talking",
} as const;

export interface AvatarConfig {
    quality?: "low" | "medium" | "high";
}

export class LiveAvatarClient {
    private room: Room;
    private mediaStream: MediaStream;
    private eventTarget: EventTarget;
    private videoElement: HTMLVideoElement | null = null;
    private debug: boolean = true;

    constructor(config?: AvatarConfig) {
        this.mediaStream = new MediaStream();
        this.eventTarget = new EventTarget();

        this.room = new Room({
            adaptiveStream: true,
            dynacast: true,
            videoCaptureDefaults: {
                resolution: VideoPresets.h720.resolution,
            },
        });

        this.setupRoomListeners();
    }

    private setupRoomListeners() {
        this.room.on(
            RoomEvent.TrackSubscribed,
            (track, publication, participant) => {
                if (this.debug) console.log("Track subscribed:", track.kind, participant.identity);

                // In Custom mode, we expect tracks from 'heygen' participant usually, 
                // but we'll accept any remote track for now.
                if (track.kind === "video" || track.kind === "audio") {
                    this.mediaStream.addTrack(track.mediaStreamTrack);

                    if (track.kind === "video") {
                        // attach to element if we have one
                        if (this.videoElement) {
                            (track as RemoteVideoTrack).attach(this.videoElement);
                        }
                    }
                    if (track.kind === "audio") {
                        if (this.videoElement) {
                            (track as RemoteAudioTrack).attach(this.videoElement);
                            // Force unmute and max volume for audio playback
                            this.videoElement.muted = false;
                            this.videoElement.volume = 1.0;
                            if (this.debug) console.log("Audio track attached - Volume:", this.videoElement.volume, "Muted:", this.videoElement.muted);
                        }
                    }

                    // Check if we have both video and audio
                    if (this.mediaStream.getVideoTracks().length > 0 && this.mediaStream.getAudioTracks().length > 0) {
                        this.emit(AVATAR_EVENTS.STREAM_READY);
                    }
                }
            }
        );

        this.room.on(RoomEvent.DataReceived, (payload, participant, kind, topic) => {
            const str = new TextDecoder().decode(payload);
            try {
                const data = JSON.parse(str);
                if (data.type === 'avatar_start_talking') {
                    this.emit(AVATAR_EVENTS.AVATAR_START_TALKING);
                }
                if (data.type === 'avatar_stop_talking') {
                    this.emit(AVATAR_EVENTS.AVATAR_STOP_TALKING);
                }
            } catch (e) {
                // ignore
            }
        });

        this.room.on(RoomEvent.Disconnected, () => {
            this.emit(AVATAR_EVENTS.DISCONNECTED);
        });
    }

    // --- Public API ---

    public on(event: string, callback: EventListener) {
        this.eventTarget.addEventListener(event, callback);
    }

    public off(event: string, callback: EventListener) {
        this.eventTarget.removeEventListener(event, callback);
    }

    private emit(event: string, detail?: any) {
        this.eventTarget.dispatchEvent(new CustomEvent(event, { detail }));
    }

    public async createSession(apiKey: string, apiUrl: string = "https://api.liveavatar.com") {
        if (this.debug) console.log("Creating LiveAvatar session...", apiUrl);

        const safeApiUrl = apiUrl && apiUrl.trim() !== "" ? apiUrl : "https://api.liveavatar.com";

        // FULL Mode: LiveAvatar manages its own LiveKit infrastructure
        const maskedKey = apiKey ? `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}` : "undefined";
        if (this.debug) console.log(`Creating FULL mode session with key: ${maskedKey}`);

        const tokenResponse = await fetch(`${safeApiUrl}/v1/sessions/token`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Api-Key": apiKey
            },
            body: JSON.stringify({
                mode: "FULL",
                avatar_id: "fc9c1f9f-bc99-4fd9-a6b2-8b4b5669a046",
                avatar_persona: {
                    language: "en",
                    voice_id: "c2527536-6d1f-4412-a643-53a3497dada9",
                    context_id: "667fc090-191d-4dc2-861b-e6d15e1ac03c"
                }
            })
        });

        if (!tokenResponse.ok) {
            const errorText = await tokenResponse.text();
            console.error("Token creation failed:", tokenResponse.status, errorText);
            throw new Error(`Failed to get session token: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`);
        }

        const tokenData = await tokenResponse.json();
        if (this.debug) console.log("Session token created:", tokenData);

        const { session_token, session_id } = tokenData.data;

        // Step 2: Start session to get LiveKit credentials
        const startResponse = await fetch(`${safeApiUrl}/v1/sessions/start`, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session_token}`
            },
            body: JSON.stringify({})
        });

        if (!startResponse.ok) {
            const errorText = await startResponse.text();
            console.error("Session start failed:", startResponse.status, errorText);
            throw new Error(`Failed to start session: ${startResponse.status} - ${errorText}`);
        }

        const startData = await startResponse.json();
        if (this.debug) console.log("Session started:", startData);

        // Extract LiveKit credentials from LiveAvatar's response
        const { livekit_url, livekit_client_token } = startData.data;

        return {
            url: livekit_url,
            access_token: livekit_client_token,
            session_id
        };
    }

    public async stopSession(session_id: string, apiKey: string, apiUrl: string = "https://api.liveavatar.com") {
        const safeApiUrl = apiUrl && apiUrl.trim() !== "" ? apiUrl : "https://api.liveavatar.com";

        await fetch(`${safeApiUrl}/v1/sessions/stop`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "X-Api-Key": apiKey
            },
            body: JSON.stringify({
                session_id: session_id,
                reason: "USER_REQUEST"
            })
        });
    }

    public async connect(url: string, token: string) {
        if (this.debug) {
            console.log("Connecting to LiveKit room...", url);
            console.log("Token:", token.substring(0, 50) + "...");
        }

        try {
            await this.room.connect(url, token);
            if (this.debug) console.log("✓ Connected to LiveKit room successfully!");
        } catch (error) {
            console.error("LiveKit connection failed:", error);
            throw error;
        }
    }

    public async disconnect() {
        await this.room.disconnect();
    }

    public attach(videoElement: HTMLVideoElement) {
        this.videoElement = videoElement;
        // Attach existing tracks
        this.room.remoteParticipants.forEach((p) => {
            p.trackPublications.forEach((pub) => {
                if (pub.track && (pub.kind === "video" || pub.kind === "audio")) {
                    pub.track.attach(videoElement);
                }
            });
        });
    }

    // Speak method: Sends audio to HeyGen for playback (Custom Mode)
    public async speak(audioBase64: string) {
        console.log("✓ speak() called - Audio length:", audioBase64.length, "chars");

        if (this.room.state !== "connected") {
            console.warn("Avatar not connected, cannot speak.");
            return;
        }

        const reqId = crypto.randomUUID();
        const msg = {
            event_type: "avatar_speak_audio",
            audio: audioBase64,
            req_id: reqId
        };

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(msg));

        await this.room.localParticipant.publishData(data, {
            reliable: true,
            topic: "lk-command-channel"
        });

        console.log("✓ Audio data published to LiveKit - reqId:", reqId);
    }

    // SpeakText method: Sends TEXT to HeyGen for TTS playback (FULL Mode)
    public async speakText(text: string) {
        console.log("✓ speakText() called - Text:", text.substring(0, 100));

        if (this.room.state !== "connected") {
            console.warn("Avatar not connected, cannot speak.");
            return;
        }

        const reqId = crypto.randomUUID();
        const msg = {
            event_type: "avatar_speak_text",
            text: text,
            req_id: reqId
        };

        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(msg));

        await this.room.localParticipant.publishData(data, {
            reliable: true,
            topic: "lk-command-channel"
        });

        console.log("✓ Text sent to Avatar TTS - reqId:", reqId);
    }

    public async interrupt() {
        if (this.room.state !== "connected") return;

        const msg = {
            event_type: "avatar_interrupt", // CommandEventsEnum.AVATAR_INTERRUPT
        };
        const encoder = new TextEncoder();
        const data = encoder.encode(JSON.stringify(msg));

        await this.room.localParticipant.publishData(data, {
            reliable: true,
            topic: "lk-command-channel"
        });
    }
}
