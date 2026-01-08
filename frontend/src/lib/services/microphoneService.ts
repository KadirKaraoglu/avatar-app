export class MicrophoneService {
    private mediaRecorder: MediaRecorder | null = null;
    private stream: MediaStream | null = null;
    private isRecording = false;
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private isMuted = false; // Flag to control audio processing

    constructor(
        private onAudioData: (audioChunk: string) => void,
        private onInterrupt?: () => void // Callback when user starts speaking
    ) { };

    public async start() {
        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000 // Gemini expects 16kHz PCM
                }
            });

            // Create audio context
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Create processor for chunks
            const bufferSize = 2048;
            this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1);

            this.processor.onaudioprocess = (event) => {
                // Skip processing if muted (avatar is speaking)
                if (this.isMuted) {
                    return;
                }

                const inputData = event.inputBuffer.getChannelData(0);

                // Convert Float32Array to Int16Array (PCM)
                const pcmData = new Int16Array(inputData.length);
                for (let i = 0; i < inputData.length; i++) {
                    const s = Math.max(-1, Math.min(1, inputData[i]));
                    pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                }

                // Convert directly to base64 and send
                const base64 = this.arrayBufferToBase64(pcmData.buffer);
                this.onAudioData(base64);
            };

            source.connect(this.processor);
            this.processor.connect(this.audioContext.destination);

            console.log("Microphone started successfully");
        } catch (error) {
            console.error("Failed to start microphone:", error);
            throw error;
        }
    }

    public stop() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        console.log("Microphone stopped");
    }

    /**
     * Mute microphone - stops sending audio to Gemini (for echo prevention)
     */
    public mute() {
        this.isMuted = true;
        console.log("🔇 Microphone MUTED (Avatar speaking)");
    }

    /**
     * Unmute microphone - resumes sending audio to Gemini
     */
    public unmute() {
        this.isMuted = false;
        console.log("🔊 Microphone UNMUTED (Avatar finished)");
    }

    /**
     * Get current muted state
     */
    public getIsMuted(): boolean {
        return this.isMuted;
    }

    private arrayBufferToBase64(buffer: ArrayBuffer): string {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    }
}
