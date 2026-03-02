import { useEffect, useRef, useState } from "react";
import { env } from "@/lib/env";

interface VoiceChatTranscript {
  type: "transcript";
  text: string;
  role: "user" | "assistant";
}

interface VoiceChatStatus {
  status: "idle" | "connecting" | "connected" | "error";
  error?: string;
}

export interface UseVoiceChatReturn {
  connect: () => Promise<void>;
  disconnect: () => void;
  status: VoiceChatStatus["status"];
  transcripts: VoiceChatTranscript[];
  error?: string;
  isMuted: boolean;
  toggleMute: () => void;
  isThinking: boolean;
}

export const useVoiceChat = (agentId: string): UseVoiceChatReturn => {
  const [status, setStatus] = useState<VoiceChatStatus["status"]>("idle");
  const [error, setError] = useState<string | undefined>(undefined);
  const [transcripts, setTranscripts] = useState<VoiceChatTranscript[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextPlayTimeRef = useRef<number>(0); // Track when to play next chunk
  const thinkingSoundSourceRef = useRef<AudioBufferSourceNode | null>(null); // Track thinking sound
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set()); // Track active audio sources

  const stopAllAudioSources = () => {
    activeSourcesRef.current.forEach((source) => {
      try {
        source.stop(); // Safe even if already stopped
      } catch {
        // Ignore stop errors
      }
      source.disconnect();
    });
    activeSourcesRef.current.clear();

    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      nextPlayTimeRef.current = audioContextRef.current.currentTime;
    } else {
      nextPlayTimeRef.current = 0;
    }
  };

  const playAudio = (base64: string, sampleRate: number) => {
    if (!audioContextRef.current) return;

    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768 : 32767);
      }

      const buffer = audioContextRef.current.createBuffer(
        1,
        float32.length,
        sampleRate
      );
      buffer.getChannelData(0).set(float32);

      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContextRef.current.destination);

      activeSourcesRef.current.add(source);
      source.onended = () => {
        activeSourcesRef.current.delete(source);
      };

      // KEY FIX: Schedule sequential playback
      const currentTime = audioContextRef.current.currentTime;
      const startTime = Math.max(currentTime, nextPlayTimeRef.current);

      source.start(startTime);

      // Update next play time
      nextPlayTimeRef.current = startTime + buffer.duration;
    } catch (err) {
      console.error("Error playing audio:", err);
    }
  };

  const stopThinkingSound = () => {
    try {
      if (thinkingSoundSourceRef.current) {
        thinkingSoundSourceRef.current.stop();
        thinkingSoundSourceRef.current.disconnect();
        thinkingSoundSourceRef.current = null;
        console.log("🛑 Stopped thinking sound");
      }
    } catch (error) {
      // Ignore errors if already stopped
      console.debug("Thinking sound already stopped or error stopping:", error);
      thinkingSoundSourceRef.current = null;
    }
  };

  const playThinkingSound = (base64Audio: string, sampleRate: number) => {
    if (!audioContextRef.current) return;

    try {
      // Stop any existing thinking sound first
      stopThinkingSound();

      // Decode base64 to binary
      const binary = atob(base64Audio);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Convert PCM16 to Float32
      const pcm16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(pcm16.length);
      for (let i = 0; i < pcm16.length; i++) {
        float32[i] = pcm16[i] / (pcm16[i] < 0 ? 32768 : 32767);
      }

      // Create audio buffer
      const buffer = audioContextRef.current.createBuffer(
        1,
        float32.length,
        sampleRate
      );
      buffer.getChannelData(0).set(float32);

      // Play immediately (don't queue, play over AI response)
      const source = audioContextRef.current.createBufferSource();
      source.buffer = buffer;

      // Lower volume so it doesn't overpower the AI voice
      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = 0.3; // 30% volume

      source.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      // Store reference to stop it later
      thinkingSoundSourceRef.current = source;

      // Clean up reference when sound ends naturally
      source.onended = () => {
        if (thinkingSoundSourceRef.current === source) {
          thinkingSoundSourceRef.current = null;
        }
      };

      source.start(0);

      console.log("🎹 Playing keyboard typing sound");
    } catch (error) {
      console.error("Error playing thinking sound:", error);
    }
  };

  const connect = async () => {
    try {
      setStatus("connecting");
      setError(undefined);
      setTranscripts([]);

      // 1. Get session
      const res = await fetch(`${env.VITE_VOICE_API_URL}/session/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agentId }),
      });

      if (!res.ok) {
        throw new Error(`Failed to start session: ${res.statusText}`);
      }

      const { wsUrl, audioConfig } = await res.json();

      // 2. Setup audio
      audioContextRef.current = new AudioContext({
        sampleRate: audioConfig.sampleRate,
      });
      nextPlayTimeRef.current = audioContextRef.current.currentTime; // Initialize

      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });

      // 3. Process microphone input
      const source = audioContextRef.current.createMediaStreamSource(
        streamRef.current
      );
      processorRef.current = audioContextRef.current.createScriptProcessor(
        4096,
        1,
        1
      );

      processorRef.current.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN && !isMuted) {
          const float32 = e.inputBuffer.getChannelData(0);
          const pcm16 = new Int16Array(float32.length);
          for (let i = 0; i < float32.length; i++) {
            pcm16[i] = Math.max(-32768, Math.min(32767, float32[i] * 32768));
          }
          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(pcm16.buffer))
          );
          wsRef.current.send(
            JSON.stringify({
              type: "audio",
              audio: base64,
              sampleRate: audioConfig.sampleRate,
            })
          );
        }
      };

      source.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);

      // 4. Connect WebSocket
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        setStatus("connected");
      };

      wsRef.current.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "audio") {
            playAudio(msg.audio, audioConfig.sampleRate);
          } else if (msg.type === "transcript") {
            setTranscripts((prev) => [...prev, msg]);
          } else if (msg.type === "thinking") {
            // Handle thinking status
            if (msg.status === "started") {
              console.log("🤔 AI is searching knowledge base...");
              setIsThinking(true);
            } else if (msg.status === "stopped") {
              console.log("✅ AI found the answer");
              setIsThinking(false);
              // Forcefully stop the thinking sound
              stopThinkingSound();
            }
          } else if (msg.type === "thinking_audio") {
            // Play the typing sound
            playThinkingSound(msg.audio, msg.sampleRate);
          } else if (msg.type === "session_started") {
            console.log("Session started:", msg.sessionId);
          } else if (msg.type === "clear") {
            stopAllAudioSources(); // Stop any currently playing clips
            stopThinkingSound();
            setIsThinking(false);
          } else if (msg.type === "error") {
            console.error("WebSocket error message:", msg.message);
            setError(msg.message);
          }
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
        }
      };

      wsRef.current.onerror = (event) => {
        console.error("WebSocket error:", event);
        setStatus("error");
        setError("WebSocket connection error");
      };

      wsRef.current.onclose = () => {
        setStatus("idle");
      };
    } catch (err) {
      console.error("Error connecting to voice chat:", err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to connect");
    }
  };

  const disconnect = () => {
    try {
      wsRef.current?.send(JSON.stringify({ type: "stop" }));
      wsRef.current?.close();
      processorRef.current?.disconnect();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      stopAllAudioSources(); // Stop any active audio sources
      stopThinkingSound(); // Stop thinking sound
      audioContextRef.current?.close();
      nextPlayTimeRef.current = 0; // Reset audio queue
      setStatus("idle");
      setTranscripts([]);
      setIsThinking(false); // Reset thinking state
    } catch (err) {
      console.error("Error disconnecting:", err);
    }
  };

  const toggleMute = () => {
    setIsMuted((prev) => !prev);
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return { connect, disconnect, status, transcripts, error, isMuted, toggleMute, isThinking };
};
