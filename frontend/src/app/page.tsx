"use client";

import AvatarContainer from "@/components/avatar/AvatarContainer";
import ContentPanel from "@/components/content/ContentPanel";
import Footer from "@/components/layout/Footer";
import { useUIStore } from "@/lib/store/uiStore";
import { useEffect, useRef, useState } from "react";
import { LiveAvatarClient, AVATAR_EVENTS } from "@/lib/avatar/LiveAvatarClient";
import { GeminiService } from "@/lib/services/geminiService";
import { MicrophoneService } from "@/lib/services/microphoneService";
import { FaceDetectionService } from "@/lib/services/faceDetectionService";

// Temporary tokens (In real app, fetch from backend)
const GEMINI_API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || "";
const HEYGEN_API_URL = process.env.NEXT_PUBLIC_HEYGEN_API_URL || "https://api.liveavatar.com";
const HEYGEN_TOKEN = process.env.NEXT_PUBLIC_HEYGEN_TOKEN || "cef71aca-eadb-11f0-a99e-066a7fa2e369";

console.log("🔑 API Keys Loaded:", {
  gemini: GEMINI_API_KEY ? `${GEMINI_API_KEY.substring(0, 20)}...` : "❌ MISSING",
  heygen: HEYGEN_TOKEN ? "✅" : "❌"
});

export default function Home() {
  const { toggleContentVisible, isContentVisible } = useUIStore();
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const sessionStarted = useRef(false); // Prevent double execution in Strict Mode
  const [avatarClient, setAvatarClient] = useState<LiveAvatarClient | null>(null);
  const [microphoneService, setMicrophoneService] = useState<MicrophoneService | null>(null);
  const [geminiService, setGeminiService] = useState<GeminiService | null>(null);
  const [faceDetectionService, setFaceDetectionService] = useState<FaceDetectionService | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [avatarSession, setAvatarSession] = useState<any>(null); // HeyGen SDK session

  // Ensure audio plays when video element is ready
  useEffect(() => {
    const videoEl = avatarVideoRef.current;
    if (!videoEl) return;

    const handleLoadedMetadata = () => {
      videoEl.volume = 1.0;
      videoEl.muted = false;
      console.log("✓ Video ready - Volume:", videoEl.volume, "Muted:", videoEl.muted);

      // Force play if paused
      if (videoEl.paused) {
        videoEl.play().catch(err => console.warn("Autoplay failed:", err));
      }
    };

    videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);

    if (videoEl.readyState >= 1) {
      handleLoadedMetadata();
    }

    return () => {
      videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  const stopSession = async () => {
    console.log("🛑 ========== STOPPING SESSION ==========");

    try {
      // 1. Stop Face Detection
      if (faceDetectionService) {
        await faceDetectionService.stop();
        setFaceDetectionService(null);
      }

      // 2. Stop Microphone
      if (microphoneService) {
        await microphoneService.stop();
        setMicrophoneService(null);
      }

      // 3. Disconnect Gemini
      if (geminiService) {
        geminiService.disconnect();
        setGeminiService(null);
      }

      // 4. Stop Avatar Session
      if (avatarSession && sessionId) {
        // Stop server session first
        try {
          await fetch('/api/liveavatar/session/stop', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId })
          });
        } catch (error) {
          console.warn("⚠️ Server stop error:", error);
        }

        // Then stop client session
        await avatarSession.stop();
        setAvatarSession(null);
      }

      // 5. Clear video element
      if (avatarVideoRef.current) {
        avatarVideoRef.current.srcObject = null;
      }

      // 6. Reset states
      setIsSessionActive(false);
      setSessionId(null);
      setAvatarClient(null);
      setGeminiService(null);
      setMicrophoneService(null);
      setAvatarSession(null);
      setFaceDetectionService(null);
      sessionStarted.current = false;

      console.log("✅ ========== SESSION STOPPED ==========  ");
    } catch (error) {
      console.error("❌ Error stopping session:", error);
    }
  };

  const startSession = async () => {
    if (sessionStarted.current) return;
    sessionStarted.current = true;

    console.log("Creating CUSTOM mode session...");

    try {
      // 1. Fetch session token from backend
      const tokenRes = await fetch('/api/liveavatar/session/token', {
        method: 'POST'
      });
      const tokenData = await tokenRes.json();

      if (tokenData.code !== 1000) {
        console.error('Failed to get session token:', tokenData);
        return;
      }

      const sessionToken = tokenData.data.session_token;
      const receivedSessionId = tokenData.data.session_id;

      // STORE SESSION ID FOR CLEANUP
      setSessionId(receivedSessionId);

      // 2. Initialize Avatar SDK with session token
      const { LiveAvatarSession } = await import('@heygen/liveavatar-web-sdk');
      const session = new LiveAvatarSession(sessionToken);
      setAvatarSession(session);

      // 3. Start session
      await session.start();

      // 4. Attach video element
      if (avatarVideoRef.current) {
        session.attach(avatarVideoRef.current);
      }

      // 5. Initialize Gemini Service
      const gemini = new GeminiService(
        (audioBase64) => {
          session.repeatAudio(audioBase64);
        },
        () => {
          console.log("🛑 Gemini requested interruption -> Stopping Avatar");
          session.interrupt();
        }
      );
      setGeminiService(gemini);

      // 6. Connect Gemini to Live API
      await gemini.connect(GEMINI_API_KEY);

      // 7. Start Microphone
      const microphone = new MicrophoneService(
        (audioChunk) => {
          gemini.sendAudioChunk(audioChunk);
        }
      );
      await microphone.start();
      setMicrophoneService(microphone);

      setIsSessionActive(true);

    } catch (error) {
      console.error("Session setup error:", error);
      sessionStarted.current = false;
      setIsSessionActive(false);
    }
  };

  return (
    <main className="relative w-full h-full overscroll-none text-white">

      {/* 1. START SCREEN (Visible when session is NOT active) */}
      {!isSessionActive && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center animate-fade-in">
          {/* Header Text */}
          <h1 className="text-4xl md:text-5xl font-bold mb-12 text-center tracking-wider drop-shadow-lg text-white">
            ELAZIĞ ORGANİZE SANAYİ MÜDÜRLÜĞÜ
          </h1>

          {/* Start Button */}
          <button
            onClick={startSession}
            className="group relative px-8 py-5 bg-[#FFC107] hover:bg-[#FFD54F] text-black text-xl font-bold rounded-2xl shadow-[0_0_20px_rgba(255,193,7,0.5)] transition-all duration-300 transform hover:scale-105 active:scale-95 animate-breathing"
          >
            <span className="relative z-10 flex items-center gap-3">
              ASİSTANA BAĞLANMAK İÇİN TIKLAYINIZ
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </span>
          </button>
        </div>
      )}

      {/* 2. AVATAR VIDEO (Always rendered but hidden/shown based on state) */}
      <video
        ref={avatarVideoRef}
        autoPlay
        playsInline
        muted={false}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${isSessionActive ? 'opacity-100 z-40' : 'opacity-0 -z-10'}`}
      />

      {/* 3. STOP BUTTON (Only visible when session IS active) */}
      {isSessionActive && (
        <div className="absolute bottom-10 left-0 right-0 flex justify-center z-50">
          <button
            onClick={stopSession}
            className="bg-red-600/90 hover:bg-red-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg backdrop-blur-sm transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Asistanı Kapat
          </button>
        </div>
      )}

    </main>
  );
}
