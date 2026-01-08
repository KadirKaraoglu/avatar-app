export class FaceDetectionService {
    private faceDetector: any = null;
    private videoElement: HTMLVideoElement | null = null;
    private stream: MediaStream | null = null;
    private animationId: number | null = null;
    private lastFaceDetectedTime: number = Date.now();
    private readonly TIMEOUT_MS = 5000; // 5 seconds
    private isRunning = false;

    constructor(
        private onTimeout: () => Promise<void>,
        private onFaceDetected?: () => void
    ) { }

    async start(): Promise<void> {
        console.log("👁️ Starting MediaPipe Face Detection...");

        try {
            // 1. Dynamically load MediaPipe Tasks Vision (client-side only)
            const vision = await import("@mediapipe/tasks-vision");
            const { FaceDetector, FilesetResolver } = vision;

            console.log("✓ MediaPipe module loaded");

            // 2. Load WASM files from CDN
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
            );

            console.log("✓ WASM resolver loaded");

            // 3. Create Face Detector with GPU acceleration
            this.faceDetector = await FaceDetector.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
                    delegate: "GPU",
                },
                runningMode: "VIDEO",
            });

            console.log("✓ Face detector model loaded");

            // 4. Start webcam
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480 },
                audio: false
            });

            // Create hidden video element for detection
            this.videoElement = document.createElement('video');
            this.videoElement.srcObject = this.stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.width = 640;
            this.videoElement.height = 480;

            await new Promise<void>((resolve) => {
                this.videoElement!.addEventListener('loadeddata', () => {
                    resolve();
                });
            });

            console.log("✓ Webcam started");

            // 5. Start detection loop
            this.lastFaceDetectedTime = Date.now();
            this.isRunning = true;
            this.detectLoop();

            console.log("✓ Face detection active");

        } catch (error) {
            console.error("❌ Face detection start error:", error);
            throw error;
        }
    }

    async stop(): Promise<void> {
        console.log("🛑 Stopping face detection...");

        this.isRunning = false;

        // Stop animation loop
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Stop webcam
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        // Cleanup video element
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement = null;
        }

        // Dispose detector
        if (this.faceDetector && this.faceDetector.close) {
            this.faceDetector.close();
            this.faceDetector = null;
        }

        console.log("✓ Face detection stopped");
    }

    private detectLoop = async (): Promise<void> => {
        if (!this.isRunning || !this.faceDetector || !this.videoElement) {
            return;
        }

        try {
            const startTimeMs = Date.now();

            // Run face detection
            const detectionResult = this.faceDetector.detectForVideo(
                this.videoElement,
                startTimeMs
            );

            if (detectionResult && detectionResult.detections && detectionResult.detections.length > 0) {
                // Face detected!
                this.lastFaceDetectedTime = Date.now();

                if (this.onFaceDetected) {
                    this.onFaceDetected();
                }
            } else {
                // No face detected - check timeout
                const timeSinceLastFace = Date.now() - this.lastFaceDetectedTime;

                if (timeSinceLastFace >= this.TIMEOUT_MS) {
                    console.warn("⚠️ 🎥 FACE DETECTION: No face for 5 seconds!");
                    console.log("Stopping detection and calling callback...");

                    this.isRunning = false;
                    await this.onTimeout();

                    console.log("✓ Face detection timeout callback completed");
                    return;
                }
            }

        } catch (error) {
            console.error("Face detection error:", error);
        }

        // Continue loop
        this.animationId = requestAnimationFrame(this.detectLoop);
    }
}
