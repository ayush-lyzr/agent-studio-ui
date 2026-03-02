import React, { useRef, useState, useEffect } from "react";
import useStore from "@/lib/store";
import hark from "hark";
import { Mic, MicOff } from "lucide-react";
import { ChatMessage } from "@/pages/home/types";
import MultiLineCircularVisualizer from "./voice-visualizer";

interface VoiceChatProps {
  session_id: string;
  user_id: string;
  agent_id: string;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setIsResponseLoading: (value: boolean) => void;
  setIsVoiceChatActive: (value: boolean) => void;
  isStreaming?: boolean;
}

const VoiceChat: React.FC<VoiceChatProps> = ({
  session_id,
  user_id,
  agent_id,
  setMessages,
  setIsResponseLoading,
  setIsVoiceChatActive,
  isStreaming,
}) => {
  const wsRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const harkRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const autoStopTimeoutRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const currentStreamRef = useRef<MediaStream | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<
    "disconnected" | "connecting" | "connected"
  >("disconnected");
  const [isRecording, setIsRecording] = useState(false);
  const [shouldStartRecording, setShouldStartRecording] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);
  const queueRef = useRef<Uint8Array[]>([]);
  const isBufferUpdatingRef = useRef(false);
  const shouldSendLastChunkRef = useRef(true);

  const api_key = useStore((state: any) => state.api_key);

  const log = (message: string, category: string = "App") => {
    const timestamp = new Date().toISOString().slice(11, 23);
    console.log(`[${timestamp}] [${category}] ${message}`);
  };

  const connectWebSocket = async () => {
    if (wsRef.current) return;
    setConnectionStatus("connecting");
    try {
      wsRef.current = new WebSocket(
        `${import.meta.env.VITE_BASE_URL}/ws/listen_audio/${session_id}?x-api-key=${encodeURIComponent(api_key)}`,
      );
      wsRef.current.binaryType = "arraybuffer";

      wsRef.current.onopen = () => {
        log("WebSocket connection established", "WebSocket");
        setConnectionStatus("connected");
      };

      wsRef.current.onmessage = (event) => {
        if (typeof event.data === "string") {
          try {
            const parsed = JSON.parse(event.data);

            if (parsed.type === "transcript") {
              if (parsed.text == "") {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  if (
                    newMessages.length > 0 &&
                    newMessages[newMessages.length - 1].role === "loading"
                  ) {
                    newMessages.pop();
                  }
                  return [...newMessages];
                });
                return;
              }
              const userMessage: ChatMessage = {
                role: "user",
                content: parsed.text,
              };
              setMessages((prev) => {
                const newMessages = [...prev];
                if (
                  newMessages.length > 0 &&
                  newMessages[newMessages.length - 1].role === "loading"
                ) {
                  newMessages.pop();
                }
                return [...newMessages, userMessage];
              });

              // ✅ Only add loading if not already present
              setMessages((prev) => {
                if (prev[prev.length - 1]?.role === "loading") return prev;
                return [...prev, { role: "loading", content: "Loading..." }];
              });

              log(`Transcript received: ${parsed.text}`, "WebSocket");
              setIsResponseLoading(true);
            }

            if (parsed.type === "response_text") {
              setMessages((prev) => {
                const updated = [...prev];
                if (updated[updated.length - 1]?.role === "loading")
                  updated.pop();
                return [
                  ...updated,
                  { role: "assistant", content: parsed.text },
                ];
              });
              setIsResponseLoading(false);
              log(`Response received: ${parsed.text}`, "WebSocket");
            }

            if (parsed.type === "audio_start") {
              mediaSourceRef.current = new MediaSource();
              queueRef.current = [];

              audioRef.current!.src = URL.createObjectURL(
                mediaSourceRef.current,
              );
              audioRef.current!.play().catch(console.error);

              mediaSourceRef.current.onsourceopen = () => {
                const mime = "audio/webm;codecs=opus";
                const sourceBuffer =
                  mediaSourceRef.current!.addSourceBuffer(mime);
                sourceBuffer.mode = "sequence";
                sourceBufferRef.current = sourceBuffer;

                sourceBuffer.addEventListener("updateend", () => {
                  isBufferUpdatingRef.current = false;
                  processQueue();
                });

                log("MediaSource opened, SourceBuffer created", "AudioPlayer");
              };
            }

            if (parsed.type === "audio_end") {
              try {
                if (mediaSourceRef.current?.readyState === "open") {
                  mediaSourceRef.current.endOfStream();
                  log("Audio stream ended", "AudioPlayer");
                }
              } catch (e) {
                console.error("Error ending MediaSource stream:", e);
              }
            }
          } catch (err) {
            console.error("Error parsing WebSocket text message:", err);
          }
        } else if (
          event.data instanceof ArrayBuffer &&
          sourceBufferRef.current
        ) {
          queueRef.current.push(new Uint8Array(event.data));
          processQueue();
        }
      };

      wsRef.current.onclose = () => {
        log("WebSocket connection closed", "WebSocket");

        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.src = "";
        }

        stopRecording();

        // ✅ Remove all trailing loading messages on close
        setMessages((prev) => {
          const newMessages = [...prev];
          while (
            newMessages.length > 0 &&
            newMessages[newMessages.length - 1].role === "loading"
          ) {
            newMessages.pop();
          }
          return newMessages;
        });

        cleanupAudioStream();
        setConnectionStatus("disconnected");
        wsRef.current = null;
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      setConnectionStatus("disconnected");
    }
  };

  const processQueue = () => {
    if (
      !sourceBufferRef.current ||
      isBufferUpdatingRef.current ||
      queueRef.current.length === 0
    )
      return;
    const chunk = queueRef.current.shift();
    if (!chunk) return;
    try {
      sourceBufferRef.current.appendBuffer(chunk as BufferSource);
      isBufferUpdatingRef.current = true;
    } catch (err) {
      console.error("Error appending buffer:", err);
    }
  };

  const sendAudioBlob = (audioBlob: Blob) => {
    const metadata = {
      user_id,
      agent_id,
      session_id,
      audio_format: "webm;codecs=opus",
      "x-api-key": api_key,
      is_streaming: isStreaming,
    };

    const metaStr = JSON.stringify(metadata);
    const encoder = new TextEncoder();
    const metaBytes = encoder.encode(metaStr);
    const header = new DataView(new ArrayBuffer(4));
    header.setUint32(0, metaBytes.length, true);

    audioBlob.arrayBuffer().then((audioBuffer) => {
      const combined = new Uint8Array(
        header.byteLength + metaBytes.length + audioBuffer.byteLength,
      );
      combined.set(new Uint8Array(header.buffer), 0);
      combined.set(metaBytes, header.byteLength);
      combined.set(
        new Uint8Array(audioBuffer),
        header.byteLength + metaBytes.length,
      );
      wsRef.current?.send(combined.buffer);
      log(`Sent audio blob of size ${audioBlob.size}`, "Sender");
    });
  };

  const startNewRecorder = (stream: MediaStream) => {
    const recorder = new MediaRecorder(stream, {
      mimeType: "audio/webm;codecs=opus",
    });

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0 && shouldSendLastChunkRef.current) {
        sendAudioBlob(event.data);
      } else {
        log("Discarded final stale audio chunk", "Recorder");
      }
    };

    recorder.onstop = () => {
      if (isSpeakingRef.current) {
        mediaRecorderRef.current = startNewRecorder(stream);
        mediaRecorderRef.current.start();
        log("Recorder restarted after silence", "Recorder");
      }
    };

    return recorder;
  };

  const startRecording = async () => {
    if (!wsRef.current || connectionStatus !== "connected") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMediaStream(stream);
      currentStreamRef.current = stream;

      harkRef.current = hark(stream, { interval: 40, threshold: -68 });

      harkRef.current.on("speaking", () => {
        log("Started speaking", "VAD");

        // ✅ Only add loading if not already present
        setMessages((prev) => {
          if (prev[prev.length - 1]?.role === "loading") return prev;
          return [...prev, { role: "loading", content: "Loading..." }];
        });

        isSpeakingRef.current = true;

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (autoStopTimeoutRef.current)
          clearTimeout(autoStopTimeoutRef.current);
      });

      harkRef.current.on("stopped_speaking", () => {
        log("Stopped speaking, stopping recorder after 1000ms", "VAD");

        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        silenceTimeoutRef.current = window.setTimeout(() => {
          isSpeakingRef.current = true;
          shouldSendLastChunkRef.current = true;
          mediaRecorderRef.current?.stop();
        }, 1000);

        if (autoStopTimeoutRef.current)
          clearTimeout(autoStopTimeoutRef.current);
        autoStopTimeoutRef.current = window.setTimeout(() => {
          log("Silence lasted 30s, auto-stopping recording", "VAD");
          shouldSendLastChunkRef.current = false;
          stopRecording();
        }, 30000);
      });

      mediaRecorderRef.current = startNewRecorder(stream);
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsVoiceChatActive(true);
      log("MediaRecorder started", "Recorder");
    } catch (error) {
      console.error("Recording setup error:", error);
    }
  };

  const stopRecording = () => {
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (autoStopTimeoutRef.current) clearTimeout(autoStopTimeoutRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current = null;

    currentStreamRef.current?.getTracks().forEach((track) => track.stop());
    harkRef.current?.stop();
    setIsRecording(false);
    setIsVoiceChatActive(false);
    isSpeakingRef.current = false;
    setMediaStream(null);
  };

  const cleanupAudioStream = () => {
    sourceBufferRef.current = null;
    mediaSourceRef.current = null;
    queueRef.current = [];
    isBufferUpdatingRef.current = false;
  };

  useEffect(() => {
    if (
      shouldStartRecording &&
      connectionStatus === "connected" &&
      !isRecording
    ) {
      startRecording();
      setShouldStartRecording(false);
    }
  }, [shouldStartRecording, connectionStatus, isRecording]);

  useEffect(() => {
    return () => {
      wsRef.current?.close();
      stopRecording();
      cleanupAudioStream();
    };
  }, []);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative flex items-center space-x-2">
        <button
          className={`m-0 flex items-center justify-center rounded-md p-0 focus:outline-none focus:ring-0
            ${isRecording ? "h-16 w-16 bg-transparent" : "h-8 w-8 bg-black"}`}
          onClick={async () => {
            if (connectionStatus === "disconnected") {
              setShouldStartRecording(true);
              await connectWebSocket();
            } else if (!isRecording) {
              await startRecording();
            } else {
              stopRecording();
            }
          }}
          disabled={connectionStatus === "connecting"}
        >
          {connectionStatus === "connecting" ? (
            <span className="text-xs text-white">...</span>
          ) : isRecording ? (
            <MultiLineCircularVisualizer
              mediaStream={mediaStream}
              isActive={isRecording}
              size={64}
            />
          ) : connectionStatus === "disconnected" ? (
            <Mic className="h-4 w-4 text-white" />
          ) : (
            <MicOff className="h-4 w-4 text-white" />
          )}
        </button>

        {connectionStatus === "connected" && (
          <button
            className="ml-40 flex h-6 w-6 items-center justify-center rounded-full bg-red-500/10 text-xs text-red-500"
            onClick={() => {
              stopRecording();
              wsRef.current?.close();
              setConnectionStatus("disconnected");
            }}
          >
            X
          </button>
        )}
      </div>

      <audio
        ref={audioRef}
        controls
        hidden
        className="mt-4 w-full max-w-md"
        onPlay={() => log("User initiated playback", "AudioPlayer")}
      />
    </div>
  );
};

export default VoiceChat;
