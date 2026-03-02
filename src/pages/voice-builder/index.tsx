import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, Mic, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

import { Layout } from "@/components/custom/layout";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { IAgent } from "@/lib/types";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
// import thinking from "../../assets/thinking.gif"
// import AudioWave from "@/components/custom/audio-wave-animation";

const VoiceBuilder = () => {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedVoice, setSelectedVoice] = useState<string>("alloy");
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  const [agentDropdownOpen, setAgentDropdownOpen] = useState<boolean>(false);
  const [interimTranscript, setInterimTranscript] = useState<string>("");
  const [_, setIsListening] = useState(false);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const apiKey = useStore((state) => state.api_key);

  const voices = [
    { id: "alloy", name: "Alloy" },
    { id: "ash", name: "Ash" },
    { id: "ballad", name: "Ballad" },
    { id: "coral", name: "Coral" },
    { id: "echo", name: "Echo" },
    { id: "sage", name: "Sage" },
    { id: "shimmer", name: "Shimmer" },
    { id: "verse", name: "Verse" },
  ];

  useEffect(() => {
    fetchAgents();
    return () => {
      stopRecording();
    };
  }, [apiKey]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, interimTranscript]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isVoiceEnabled ? 1 : 0;
    }
  }, [isVoiceEnabled]);

  const fetchAgents = async () => {
    if (!apiKey) return;

    setIsLoadingAgents(true);
    try {
      const response = await axios.get("/agents/", {
        headers: {
          "x-api-key": apiKey,
        },
      });

      const agentData = response.data;
      setAgents(agentData);
      useStore.getState().setAgents(agentData);
    } catch (error) {
      console.error("Error fetching agents:", error);
      toast.error("Failed to load agents");
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const handleMessage = async (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data);
      console.log("Received message:", message);

      switch (message.type) {
        case "speech.started":
          console.log("Speech started");
          setIsListening(true);
          break;

        case "speech.ended":
          console.log("Speech ended");
          setIsListening(false);
          setInterimTranscript("");
          break;

        case "conversation.transcription":
          // Handle user's speech transcription
          if (message.transcription?.text) {
            console.log("User transcription:", message.transcription);
            if (message.transcription.is_final) {
              setMessages((prev) => [
                ...prev,
                { role: "user", content: message.transcription.text },
              ]);
              setInterimTranscript("");
            } else {
              setInterimTranscript(message.transcription.text);
            }
          }
          break;

        case "response.partial":
          // Handle partial AI responses
          if (message.response?.output?.[0]?.content?.[0]?.transcript) {
            const transcript = message.response.output[0].content[0].transcript;
            setInterimTranscript(transcript);
          }
          break;

        case "response.done":
          // Handle final AI responses
          if (message.response?.output?.[0]?.content?.[0]?.transcript) {
            const transcript = message.response.output[0].content[0].transcript;
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: transcript },
            ]);
            setInterimTranscript("");
          }
          break;
        case "conversation.item.input_audio_transcription.completed":
          setMessages((prev) => [
            ...prev,
            { role: "user", content: message.transcript },
          ]);
          break;

        default:
          console.log("Unhandled message type:", message.type);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      toast.error("Error processing response");
    }
  };

  const setupAudio = async (peerConnection: RTCPeerConnection) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;
      stream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, stream);
      });

      // Set up audio output handling
      peerConnection.ontrack = (event) => {
        if (audioRef.current && event.streams[0]) {
          audioRef.current.srcObject = event.streams[0];
          audioRef.current.volume = isVoiceEnabled ? 1 : 0;
          audioRef.current
            .play()
            .catch((e) => console.error("Error playing audio:", e));
        }
      };
    } catch (error) {
      console.error("Error accessing microphone:", error);
      throw new Error("Failed to access microphone");
    }
  };

  const setupDataChannel = (peerConnection: RTCPeerConnection) => {
    const dataChannel = peerConnection.createDataChannel("oai-events");
    dataChannelRef.current = dataChannel;

    dataChannel.onopen = () => {
      console.log("Data channel opened");
      setIsRecording(true);

      // Initialize the session
      const sessionInit = {
        type: "session.update",
        session: {
          tool_choice: "auto",
        },
      };
      dataChannel.send(JSON.stringify(sessionInit));
    };

    dataChannel.addEventListener("message", handleMessage);
  };

  const startRecording = async () => {
    if (!apiKey || !selectedAgent) {
      toast.error("Please select an agent first");
      return;
    }

    try {
      // Get WebRTC session from backend
      const sessionResponse = await axios.post(
        `/inference/webrtc-session/${selectedAgent}/${selectedVoice}`,
        {},
        { headers: { "x-api-key": apiKey } },
      );

      const { session } = sessionResponse.data;
      const EPHEMERAL_KEY = session.client_secret.value;

      // Setup WebRTC
      const peerConnection = new RTCPeerConnection();
      peerConnectionRef.current = peerConnection;

      await setupAudio(peerConnection);
      setupDataChannel(peerConnection);

      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      // Connect to OpenAI's realtime API
      const baseUrl = "https://api.openai.com/v1/realtime";
      const sdpResponse = await fetch(`${baseUrl}?model=${session.model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error("Failed to connect to OpenAI");
      }

      const answer: RTCSessionDescriptionInit = {
        type: "answer" as RTCSdpType,
        sdp: await sdpResponse.text(),
      };
      await peerConnection.setRemoteDescription(answer);

      setIsRecording(true);
      // const startAudio = new Audio("/start-voice.wav");
      // startAudio.play();
      toast.success("Connected successfully");
    } catch (error) {
      console.error("Error starting recording:", error);
      toast.error("Failed to start recording");
      stopRecording();
    }
  };

  const stopRecording = () => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop());
      audioStreamRef.current = null;
    }

    if (dataChannelRef.current) {
      dataChannelRef.current.close();
      dataChannelRef.current = null;
    }

    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <Layout>
      <div className="flex h-screen flex-col overflow-hidden">
        <div className="flex-none p-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">Voice Playground</h1>
            <p className="text-muted-foreground">
              Have a voice conversation with your AI agent
            </p>
          </div>
          <Separator className="my-4" />
        </div>

        <div className="flex-1 overflow-hidden p-6 pt-0">
          <div className="grid h-full grid-cols-2 gap-6">
            {/* Left side - Controls and Transcript */}
            <div className="flex flex-col rounded-xl border border-input p-6">
              <div className="space-y-4">
                <div className="flex w-full flex-col gap-2">
                  <Label className="font-medium">Select Agent</Label>
                  <Popover
                    open={agentDropdownOpen}
                    onOpenChange={setAgentDropdownOpen}
                  >
                    <PopoverTrigger asChild disabled={isLoadingAgents}>
                      <Button
                        variant="outline"
                        className="flex w-full justify-between"
                        type="button"
                      >
                        <span className="truncate">
                          {agents.find((agent) => agent._id === selectedAgent)
                            ?.name || "Select an agent"}
                        </span>
                        <ChevronDown className="size-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>

                    <PopoverContent className="!w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search agents..." />

                        <CommandList>
                          <CommandEmpty className="p-2 text-sm text-gray-500">
                            No agents found.
                          </CommandEmpty>

                          <CommandGroup>
                            {agents?.map((storeAgent) => (
                              <CommandItem
                                key={storeAgent._id}
                                onSelect={(value) => {
                                  const agentId =
                                    agents.find(
                                      (agent) =>
                                        agent.name.toLowerCase() === value,
                                    )?._id ?? "";
                                  setSelectedAgent(agentId);
                                  setAgentDropdownOpen(false);
                                }}
                                className="flex items-center justify-between"
                                value={storeAgent.name}
                              >
                                <span className="truncate">
                                  {storeAgent.name}
                                </span>
                                {selectedAgent === storeAgent._id && (
                                  <Check className="h-4 w-4 text-green-600" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="font-medium">Select Voice</Label>
                  <Select
                    value={selectedVoice}
                    onValueChange={setSelectedVoice}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a voice" />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-center gap-4">
                  <Button
                    variant={isVoiceEnabled ? "default" : "outline"}
                    size="icon"
                    onClick={() => setIsVoiceEnabled(!isVoiceEnabled)}
                  >
                    {isVoiceEnabled ? <Volume2 /> : <VolumeX />}
                  </Button>

                  <Button
                    variant={isRecording ? "destructive" : "default"}
                    onClick={toggleRecording}
                    // disabled={!selectedAgent}
                    className="flex-1"
                  >
                    <Mic className="mr-2 h-4 w-4" />
                    {isRecording ? "Stop Listening" : "Start Listening"}
                  </Button>
                </div>
              </div>

              <div className="flex flex-1 items-center justify-center">
                {/* <AudioWave /> */}
              </div>
            </div>

            {/* Right side - Chat Messages */}
            <div className="flex h-full flex-col overflow-hidden rounded-xl border border-input">
              <div className="border-b p-4">
                <h3 className="font-medium">Agent Responses</h3>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <MarkdownRenderer
                      content={message.content}
                      className={cn(
                        "max-w-[80%] rounded-lg px-4 py-2",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-accent",
                      )}
                    />
                  </div>
                ))}
                {interimTranscript && (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg bg-primary/50 px-4 py-2 text-primary-foreground">
                      {interimTranscript}
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        </div>
        <audio ref={audioRef} autoPlay playsInline />
      </div>
    </Layout>
  );
};

export default VoiceBuilder;
