import { useState, useEffect, useRef, useCallback, memo } from "react";
import {
  Send,
  Loader2,
  RefreshCcw,
  Check,
  ArrowUpRight,
  Mic,
  HistoryIcon,
  Plus,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import useStore from "@/lib/store";
import TypingAnimation from "@/components/ui/loading-typing-lottie";
import ReactMarkdown from "react-markdown";
import Inference from "../create-agent/components/inference";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";
import { ChatMessage, Rag, AgentConfiguration } from "./types";
import {
  getStoredItem,
  handleChat,
  fetchRags,
  getQueryParams,
  updateQueryParams,
  saveToLocalStorage,
  clearLocalStorage,
  generateSessionId,
  handleRagChat,
  formatFeatureName,
  handleToolSelection,
  fetchTools,
  handleAudioTranscription,
} from "./chat-service";
import { motion, AnimatePresence } from "framer-motion";
import MarkdownRenderer from "@/components/custom/markdown";

const examplePromptsMapping = [
  {
    label: "Customer Service",
    text: "I need a customer service assistant that can handle inquiries, resolve complaints, and provide product information while maintaining a friendly and professional tone throughout all interactions.",
  },
  {
    label: "Coding Tutor",
    text: "Create a coding tutor that can help beginners learn JavaScript fundamentals, explain complex concepts in simple terms, provide code examples, and review code snippets with helpful feedback.",
  },
  {
    label: "Fitness Coach",
    text: "I want a fitness coach agent that can create personalized workout plans based on fitness goals, suggest exercises for specific muscle groups, track progress, and provide nutritional advice.",
  },
  {
    label: "Language Tutor",
    text: "Design a language tutor for Spanish learners that can teach vocabulary, grammar rules, provide conversation practice, and customize lessons based on proficiency level and learning goals.",
  },
  {
    label: "Travel Advisor",
    text: "Build a travel advisor agent that can recommend destinations based on preferences, suggest itineraries, provide information about local attractions, and offer tips for budget-friendly travel options.",
  },
];

const ExamplePrompts = ({
  onSelect,
}: {
  onSelect: (prompt: string) => void;
}) => {
  return (
    <div className="mt-6 flex max-w-4xl flex-wrap justify-center gap-2">
      {examplePromptsMapping.map((prompt, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          className="text-xs md:text-sm"
          onClick={() => onSelect(prompt.text)}
        >
          {prompt.label}
        </Button>
      ))}
    </div>
  );
};

const AgentConfigDisplay = memo(
  ({ config }: { config: AgentConfiguration }) => {
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.5,
          ease: "easeOut",
        },
      },
    };

    return (
      <motion.div
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        layout
        layoutRoot
      >
        <motion.div
          variants={itemVariants}
          className="rounded-lg p-4"
          layout
          key="agent-details"
        >
          <h4 className="mb-4 text-lg font-semibold">Agent Details</h4>
          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Name
              </span>
              <span className="text-sm">{config.name}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-muted-foreground">
                Agent Instructions
              </span>
              <p className="text-sm">{config.agent_instructions}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-lg p-4"
          layout
          key="model-config"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Provider
              </p>
              <p className="text-sm">{config.provider_id}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Model</p>
              <p className="text-sm">{config.model}</p>
            </div>
          </div>
        </motion.div>

        {(config.features || config.tool || config.rag_name) && (
          <motion.div
            variants={itemVariants}
            className="rounded-lg p-4"
            layout
            key="additional-features"
          >
            <h4 className="mb-4 text-lg font-semibold">Agent Features</h4>
            <div className="space-y-3">
              {config.features && Array.isArray(config.features) && (
                <div className="flex flex-wrap gap-2">
                  {config.features.map((feature, index) => (
                    <span
                      key={index}
                      className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                    >
                      {formatFeatureName(feature)}
                    </span>
                  ))}
                </div>
              )}
              {config.tool && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Tool:
                  </span>
                  <span className="rounded-md bg-secondary/50 px-2 py-1 text-sm">
                    {config.tool}
                  </span>
                </div>
              )}
              {config.rag_name && (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-muted-foreground">
                    Knowledge Base:
                  </span>
                  <span className="rounded-md bg-secondary/50 px-2 py-1 text-sm">
                    {config.rag_name}
                  </span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </motion.div>
    );
  },
);

AgentConfigDisplay.displayName = "AgentConfigDisplay";

const Mira = () => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [showInitialView, setShowInitialView] = useState(true);
  const [hasPreviousSession, setHasPreviousSession] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasInitialQuery, setHasInitialQuery] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [agentId, setAgentId] = useState<string>("");
  const api_key = useStore((state: any) => state.api_key);
  const [rags, setRags] = useState<Rag[]>([]);
  const [isRagRefreshing, setIsRagRefreshing] = useState(false);
  const [selectedRag, setSelectedRag] = useState<string>("");
  const [userTools, setUserTools] = useState<string[]>([]);
  const [isToolsRefreshing, setIsToolsRefreshing] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>(
    () => localStorage.getItem("selectedTool") || "",
  );
  const [agentConfig, setAgentConfig] = useState<AgentConfiguration | null>(
    () => {
      const storedConfig = localStorage.getItem("agentConfig");
      const storedGenerating = localStorage.getItem("isGeneratingResponse");
      return storedGenerating === "false" && storedConfig
        ? JSON.parse(storedConfig)
        : null;
    },
  );
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const loadingMessages = [
    "Understanding your use case...",
    "Defining agent role and instructions...",
    "Picking the optimal model...",
    "Configuring agent capabilities...",
  ];

  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/wav",
        });
        try {
          setIsTranscribing(true);
          const transcribedText = await handleAudioTranscription(audioBlob);
          setInput(transcribedText);
        } catch (error) {
          console.error("Error processing audio:", error);
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  useEffect(() => {
    if (isGeneratingResponse) {
      const interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [isGeneratingResponse]);

  const textareaVariants = {
    center: {
      width: "50rem",
      height: "8rem",
      y: 0,
      position: "relative" as "relative",
      bottom: "auto" as "auto",
    },
    bottom: {
      width: "100%",
      height: "3rem",
      y: 0,
      position: "fixed" as "fixed",
      bottom: "4rem" as "4rem",
    },
  };

  const builderButtonVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.8,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: 0.2,
      },
    },
  };

  useEffect(() => {
    if (api_key) {
      refreshRags();
      refreshTools();
    }
  }, [api_key]);

  useEffect(() => {
    const storedMessages = localStorage.getItem("chatMessages");
    const storedHasInitialQuery = localStorage.getItem("hasInitialQuery");
    const storedSessionId = localStorage.getItem("sessionId");

    setHasPreviousSession(
      !!storedMessages &&
        !!storedHasInitialQuery &&
        JSON.parse(storedHasInitialQuery) === true &&
        !!storedSessionId,
    );
  }, []);

  const resumePreviousSession = () => {
    const storedMessages = getStoredItem("chatMessages", []);
    const storedHasInitialQuery = getStoredItem("hasInitialQuery", false);
    const storedSessionId = localStorage.getItem("sessionId") || "";
    const storedAgentId = localStorage.getItem("agentId") || "";
    const storedGenerating = JSON.parse(
      localStorage.getItem("isGeneratingResponse") || "false",
    );
    const storedSelectedTool = localStorage.getItem("selectedTool") || "";
    const storedConfig = localStorage.getItem("agentConfig");

    setMessages(storedMessages);
    setHasInitialQuery(storedHasInitialQuery);
    setIsGeneratingResponse(storedGenerating);
    setSessionId(storedSessionId);
    setAgentId(storedAgentId);
    setSelectedTool(storedSelectedTool);

    if (storedConfig) {
      setAgentConfig(JSON.parse(storedConfig));
    }

    setShowInitialView(false);
  };

  useEffect(() => {
    const { sessionId: existingSessionId, agentId: existingAgentId } =
      getQueryParams();
    if (existingSessionId) setSessionId(existingSessionId);
    if (existingAgentId) setAgentId(existingAgentId);
  }, []);

  useEffect(() => {
    if (!showInitialView) {
      updateQueryParams(sessionId, agentId);
      saveToLocalStorage(messages, sessionId, agentId, hasInitialQuery);
    }
  }, [messages, sessionId, agentId, hasInitialQuery, showInitialView]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!agentId && hasInitialQuery) {
        e.preventDefault();
        e.returnValue =
          "Warning: Your progress will be lost if the agent is incomplete.";
        return "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [agentId, hasInitialQuery]);

  useEffect(() => {
    return () => {
      localStorage.setItem("isGeneratingResponse", "false");
    };
  }, []);

  const startNewSession = () => {
    if (!agentId && hasInitialQuery) {
      const confirmNewSession = window.confirm(
        "Warning: Your progress will be lost if the agent is incomplete.",
      );
      if (!confirmNewSession) return;
    }
    clearLocalStorage();
    setSessionId("");
    setAgentId("");
    setMessages([]);
    setHasInitialQuery(false);
    setSelectedTool("");
    setAgentConfig(null);
    setShowInitialView(true);
    localStorage.removeItem("selectedTool");
    localStorage.removeItem("agentConfig");
    updateQueryParams("", "");
  };

  const handleRagSelection = async (ragId: string) => {
    setSelectedRag(ragId);

    setMessages((prevMessages) =>
      prevMessages.slice(-1)[0]?.content.includes("Selected rag_id is")
        ? [...prevMessages.slice(0, -1)]
        : [...prevMessages],
    );

    setMessages((prev) => [
      ...prev,
      { role: "loading", content: "Loading..." },
    ]);

    try {
      const response = await handleRagChat(
        ragId,
        rags,
        sessionId,
        api_key,
        agentId,
      );
      if (response) {
        const agentMessage: ChatMessage = {
          role: "assistant",
          content: response.mira_response,
          showRagSelection: response.knowledge_base_selection || false,
        };
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          agentMessage,
        ]);
      }
    } catch (error) {
      console.error("Error in handleRagSelection:", error);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  const refreshRags = useCallback(async () => {
    try {
      setIsRagRefreshing(true);
      const ragsData = await fetchRags(api_key);
      setRags(ragsData);
    } catch (error) {
      console.error("Error refreshing RAGs:", error);
    } finally {
      setIsRagRefreshing(false);
    }
  }, [api_key]);

  const refreshTools = useCallback(async () => {
    try {
      setIsToolsRefreshing(true);
      const toolsData = await fetchTools(api_key);
      setUserTools(toolsData);
    } catch (error) {
      console.error("Error refreshing tools:", error);
    } finally {
      setIsToolsRefreshing(false);
    }
  }, [api_key]);

  const onToolSelect = async (toolId: string) => {
    setSelectedTool(toolId);

    setMessages((prevMessages) =>
      prevMessages.slice(-1)[0]?.content.includes("Selected tool_id is")
        ? [...prevMessages.slice(0, -1)]
        : [...prevMessages],
    );

    setMessages((prev) => [
      ...prev,
      { role: "loading", content: "Loading..." },
    ]);

    try {
      const response = await handleToolSelection(
        toolId,
        sessionId,
        api_key,
        agentId,
      );

      if (response) {
        const agentMessage: ChatMessage = {
          role: "assistant",
          content: response.mira_response,
          showRagSelection: response.knowledge_base_selection || false,
          showToolsSelection: response.tool_selection || false,
        };
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          agentMessage,
        ]);
      }
    } catch (error) {
      console.error("Error in handleToolSelection:", error);
      setMessages((prev) => prev.slice(0, -1));
    }
  };

  useEffect(() => {
    if (selectedTool) {
      localStorage.setItem("selectedTool", selectedTool);
    } else {
      localStorage.removeItem("selectedTool");
    }
  }, [selectedTool]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isGeneratingResponse) return;

      setShowInitialView(false);

      const newSessionId = !sessionId ? generateSessionId() : sessionId;
      if (!sessionId) setSessionId(newSessionId);

      const userMessage: ChatMessage = { role: "user", content: input };
      setMessages((prev) => [...prev, userMessage]);
      setHasInitialQuery(true);
      setInput("");

      setMessages((prev) => [
        ...prev,
        { role: "loading", content: "Loading..." },
      ]);
      setIsGeneratingResponse(true);
      localStorage.setItem("isGeneratingResponse", "true");

      try {
        const response = await handleChat(
          userMessage,
          sessionId,
          api_key,
          agentId,
          selectedRag,
          newSessionId,
          selectedTool,
        );

        if (response.updated_agent_configuration) {
          const newConfig = response.updated_agent_configuration;
          setAgentConfig(newConfig);
          localStorage.setItem("agentConfig", JSON.stringify(newConfig));
        }

        const agentMessage: ChatMessage = {
          role: "assistant",
          content: response.mira_response,
          showRagSelection: response.knowledge_base_selection || false,
          showToolsSelection: response.tool_selection || false,
        };

        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          agentMessage,
        ]);

        if (response.agent_configuration_completed && response.agent_id) {
          setAgentId(response.agent_id);
        }
      } catch (error) {
        console.error("Error sending message:", error);
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsGeneratingResponse(false);
        localStorage.setItem("isGeneratingResponse", "false");
      }
    },
    [
      input,
      isGeneratingResponse,
      sessionId,
      api_key,
      agentId,
      selectedRag,
      selectedTool,
      showInitialView,
    ],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit(e);
      }
    },
    [handleSubmit],
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
    if (
      messages.length > 0 &&
      messages[messages.length - 1].role === "assistant"
    ) {
      inputRef.current?.focus();
    }
  }, [messages, scrollToBottom]);

  const containerVariants = {
    full: { width: "100%" },
    partial: { width: "66.666667%" },
  };

  const rightPanelVariants = {
    hidden: {
      opacity: 0,
      x: 50,
      width: 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      width: "33.333333%",
      transition: { duration: 0.3 },
    },
  };

  const messageVariants = {
    initial: (role: string) => ({
      opacity: 0,
      x: role === "user" ? 20 : -20,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
    exit: (role: string) => ({
      opacity: 0,
      x: role === "user" ? 20 : -20,
      transition: {
        duration: 0.2,
      },
    }),
  };

  useEffect(() => {
    if (!sessionId || !agentId) {
      localStorage.removeItem("agentConfig");
    }
  }, [sessionId, agentId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      setRecordingDuration(0);
      interval = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      clearInterval(interval);
      setRecordingDuration(0);
    };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const iconVariants = {
    initial: { opacity: 0, scale: 0.3, rotate: -180 },
    animate: { opacity: 1, scale: 1, rotate: 0 },
    exit: { opacity: 0, scale: 0.3, rotate: 180 },
  };

  const handleExamplePrompt = useCallback(
    (prompt: string) => {
      setInput(prompt);

      setShowInitialView(false);

      const newSessionId = !sessionId ? generateSessionId() : sessionId;
      if (!sessionId) setSessionId(newSessionId);

      const userMessage: ChatMessage = { role: "user", content: prompt };
      setMessages((prev) => [...prev, userMessage]);
      setHasInitialQuery(true);
      setInput("");

      setMessages((prev) => [
        ...prev,
        { role: "loading", content: "Loading..." },
      ]);
      setIsGeneratingResponse(true);
      localStorage.setItem("isGeneratingResponse", "true");

      handleChat(
        userMessage,
        sessionId,
        api_key,
        agentId,
        selectedRag,
        newSessionId,
        selectedTool,
      )
        .then((response) => {
          if (response.updated_agent_configuration) {
            const newConfig = response.updated_agent_configuration;
            setAgentConfig(newConfig);
            localStorage.setItem("agentConfig", JSON.stringify(newConfig));
          }

          const agentMessage: ChatMessage = {
            role: "assistant",
            content: response.mira_response,
            showRagSelection: response.knowledge_base_selection || false,
            showToolsSelection: response.tool_selection || false,
          };

          setMessages((prevMessages) => [
            ...prevMessages.slice(0, -1),
            agentMessage,
          ]);

          if (response.agent_configuration_completed && response.agent_id) {
            setAgentId(response.agent_id);
          }
        })
        .catch((error) => {
          console.error("Error sending message:", error);
          setMessages((prev) => prev.slice(0, -1));
        })
        .finally(() => {
          setIsGeneratingResponse(false);
          localStorage.setItem("isGeneratingResponse", "false");
        });
    },
    [sessionId, api_key, agentId, selectedRag, selectedTool],
  );

  return (
    <div className="flex h-screen flex-col items-center bg-background py-8">
      <div className="flex h-full w-full max-w-full gap-4 px-4">
        <motion.div
          className="flex flex-col"
          initial="full"
          animate={hasInitialQuery && !showInitialView ? "partial" : "full"}
          variants={containerVariants}
          transition={{ duration: 0.3 }}
        >
          {showInitialView ? (
            <div className="mt-[5dvh] flex flex-col items-center justify-center bg-background px-4">
              <div className="mb-12 space-y-4 text-center">
                <img
                  src="/mira-logo.svg"
                  alt="Mira Logo"
                  className="mx-auto size-[14rem]"
                />
                <h1 className="text-4xl font-bold tracking-tight md:text-4xl">
                  What would you like to build?
                </h1>
                <p className="text-muted-foreground">
                  Build, refine and publish agents effortlessly in minutes.
                </p>
              </div>
              <motion.form
                initial="center"
                animate="center"
                variants={textareaVariants}
                onSubmit={handleSubmit}
                className="relative shadow-lg"
              >
                <Textarea
                  ref={inputRef}
                  value={isTranscribing ? "Transcribing audio..." : input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Start typing or speaking..."
                  className="h-full w-full resize-none border p-4 pr-24 shadow-none"
                  disabled={isRecording || isTranscribing}
                  autoFocus
                />
                {isRecording && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                      <p className="text-lg font-medium">
                        Mira is listening...
                      </p>
                    </div>
                    <p className="font-mono text-sm">
                      {formatDuration(recordingDuration)}
                    </p>
                  </div>
                )}
                <div className="absolute right-3 top-5 flex gap-2">
                  <AnimatePresence mode="wait">
                    {!input.trim() ? (
                      <motion.button
                        key="mic"
                        type="button"
                        onClick={isRecording ? stopRecording : startRecording}
                        className={`text-muted-foreground transition-colors hover:text-foreground ${
                          isRecording ? "text-red-500 hover:text-red-600" : ""
                        }`}
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <Mic
                          className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`}
                        />
                      </motion.button>
                    ) : (
                      <motion.button
                        key="send"
                        type="submit"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        variants={iconVariants}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                      >
                        <Send className="h-5 w-5" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
                <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
                  Press Enter to submit, Shift + Enter for new line
                </div>
              </motion.form>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-2 text-center text-sm text-muted-foreground"
              >
                or, build a custom agent in{" "}
                <Link
                  to="/agent-create"
                  className="text-blue-600 hover:underline dark:text-blue-500"
                >
                  Agent Builder
                </Link>
              </motion.div>

              {/* Example prompts section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-5 flex flex-col justify-center"
              >
                <p className="mt-4 text-center text-sm text-muted-foreground">
                  Try one of these examples:
                </p>
                <ExamplePrompts onSelect={handleExamplePrompt} />
              </motion.div>

              {hasPreviousSession && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-10"
                >
                  <Button
                    variant="outline"
                    onClick={resumePreviousSession}
                    className="gap-2"
                  >
                    <HistoryIcon className="h-4 w-4" />
                    Resume last session
                  </Button>
                </motion.div>
              )}
            </div>
          ) : (
            <>
              <div
                className="scrollbar-hide flex-1 space-y-4 overflow-y-auto p-4 pb-32"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  marginBottom: "6rem",
                }}
              >
                {messages.map((message, i) => (
                  <div key={i}>
                    {/* Assistant message */}
                    {message.role === "assistant" && (
                      <div className="flex justify-start">
                        <motion.div
                          className="max-w-[80%] rounded-lg p-3 text-sm"
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          variants={messageVariants}
                          custom={message.role}
                          layout
                        >
                          <ReactMarkdown className="whitespace-pre-wrap break-words dark:text-white">
                            {message.content}
                          </ReactMarkdown>
                        </motion.div>
                      </div>
                    )}

                    {/* RAG Selection UI - shown after assistant message */}
                    {message.role === "assistant" &&
                      message.showRagSelection && (
                        <div className="flex justify-end">
                          <div className="max-w-[80%] rounded-lg bg-muted p-3 text-sm">
                            {rags && rags.length > 0 ? (
                              <>
                                {selectedRag ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Check className="h-4 w-4" />
                                    <span>
                                      Knowledge base{" "}
                                      {rags
                                        .find(
                                          (rag: any) => rag.id === selectedRag,
                                        )
                                        ?.collection_name.slice(0, -4)}{" "}
                                      selected
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <p className="mb-2 text-sm font-medium">
                                      Select a knowledge base:
                                    </p>
                                    <RadioGroup
                                      value={selectedRag}
                                      onValueChange={handleRagSelection}
                                      className="space-y-2"
                                    >
                                      {rags.map((rag: any) => (
                                        <div
                                          key={rag.collection_name}
                                          className="flex items-center space-x-2"
                                        >
                                          <RadioGroupItem
                                            value={rag.id}
                                            id={rag.id}
                                          />
                                          <Label htmlFor={rag.id}>
                                            {rag.collection_name.slice(0, -4)}
                                            <div className="mt-1 text-muted-foreground">
                                              {rag.description}
                                            </div>
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </>
                                )}
                                {!selectedRag && (
                                  <div className="mt-4 flex items-center gap-2">
                                    <button
                                      onClick={refreshRags}
                                      title="Refresh Knowledge Bases"
                                    >
                                      <RefreshCcw
                                        className={`ml-1 h-4 w-4 ${isRagRefreshing ? "animate-spin" : ""}`}
                                      />
                                    </button>
                                    <Link
                                      to="/knowledge-base"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                                    >
                                      Create New
                                      <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Link>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={refreshRags}
                                  title="Refresh Knowledge Bases"
                                >
                                  <RefreshCcw
                                    className={`h-4 w-4 ${isRagRefreshing ? "animate-spin" : ""}`}
                                  />
                                </button>
                                <Link
                                  to="/knowledge-base"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                                >
                                  Create New
                                  <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* Tool Selection UI - shown after assistant message */}
                    {message.role === "assistant" &&
                      message.showToolsSelection && (
                        <div className="flex justify-end">
                          <div className="max-w-[80%] rounded-lg bg-muted p-3 text-sm">
                            {Array.isArray(userTools) &&
                            userTools.length > 0 ? (
                              <>
                                {selectedTool ? (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Check className="h-4 w-4" />
                                    <span>Tool {selectedTool} selected</span>
                                  </div>
                                ) : (
                                  <>
                                    <p className="mb-2 text-sm font-medium">
                                      Select a tool:
                                    </p>
                                    <RadioGroup
                                      value={selectedTool}
                                      onValueChange={onToolSelect}
                                      className="space-y-2"
                                    >
                                      {userTools.map((tool: string) => (
                                        <div
                                          key={tool}
                                          className="flex items-center space-x-2"
                                        >
                                          <RadioGroupItem
                                            value={tool}
                                            id={tool}
                                          />
                                          <Label htmlFor={tool}>
                                            {tool.charAt(0).toUpperCase() +
                                              tool.slice(1)}
                                          </Label>
                                        </div>
                                      ))}
                                    </RadioGroup>
                                  </>
                                )}
                                {!selectedTool && (
                                  <div className="mt-4 flex items-center gap-2">
                                    <button
                                      onClick={refreshTools}
                                      title="Refresh Tools"
                                    >
                                      <RefreshCcw
                                        className={`ml-1 h-4 w-4 ${isToolsRefreshing ? "animate-spin" : ""}`}
                                      />
                                    </button>
                                    <Link
                                      to="/configure/tools"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                                    >
                                      Connect New
                                      <ArrowUpRight className="ml-1 h-4 w-4" />
                                    </Link>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={refreshTools}
                                  title="Refresh Tools"
                                >
                                  <RefreshCcw
                                    className={`h-4 w-4 ${isToolsRefreshing ? "animate-spin" : ""}`}
                                  />
                                </button>
                                <Link
                                  to="/configure/tools"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-sm font-medium text-blue-600 hover:underline"
                                >
                                  Connect New
                                  <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    {/* User message */}
                    {message.role === "user" && (
                      <div className="flex justify-end">
                        <motion.div
                          className="max-w-[80%] rounded-lg bg-muted p-3 text-sm"
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          variants={messageVariants}
                          custom={message.role}
                          layout
                        >
                          <MarkdownRenderer content={message.content} />
                        </motion.div>
                      </div>
                    )}

                    {/* Loading animation */}
                    {message.role === "loading" && (
                      <div className="flex justify-start">
                        <motion.div
                          className="max-w-[80%] rounded-lg p-3 text-sm"
                          initial="initial"
                          animate="animate"
                          exit="exit"
                          variants={messageVariants}
                          custom="assistant"
                          layout
                        >
                          <div className="h-5">
                            <TypingAnimation />
                          </div>
                        </motion.div>
                      </div>
                    )}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {agentId && (
                <motion.div
                  className="fixed bottom-[7.5rem] right-[calc(34%)] z-10"
                  initial="hidden"
                  animate="visible"
                  variants={builderButtonVariants}
                  layout
                >
                  <Button className="gap-2" variant={"outline"}>
                    <Link
                      to={`/agent-create/${agentId}`}
                      className="flex items-center gap-2"
                    >
                      Open Agent in Builder
                      <ArrowUpRight className="size-4" />
                    </Link>
                  </Button>
                </motion.div>
              )}
              <motion.div
                initial="center"
                animate="bottom"
                variants={textareaVariants}
                transition={{ type: "spring", stiffness: 100, damping: 20 }}
                className="fixed bottom-4 w-[calc(50%-2rem)] max-w-[62%]"
              >
                <form onSubmit={handleSubmit} className="relative">
                  <Textarea
                    ref={inputRef}
                    value={isTranscribing ? "Transcribing audio..." : input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="h-full w-full resize-none border p-4 pr-24 shadow-lg"
                    disabled={
                      isGeneratingResponse || isRecording || isTranscribing
                    }
                    autoFocus
                  />
                  {isRecording && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                        <p className="text-lg font-medium">Recording</p>
                      </div>
                      <p className="font-mono text-sm">
                        {formatDuration(recordingDuration)}
                      </p>
                    </div>
                  )}
                  <div className="absolute right-3 top-5 flex gap-2">
                    <AnimatePresence mode="wait">
                      {!input.trim() ? (
                        <motion.button
                          key="mic"
                          type="button"
                          onClick={isRecording ? stopRecording : startRecording}
                          className={`text-muted-foreground transition-colors hover:text-foreground ${
                            isRecording ? "text-red-500 hover:text-red-600" : ""
                          }`}
                          disabled={isGeneratingResponse}
                          variants={iconVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          <Mic
                            className={`h-5 w-5 ${isRecording ? "animate-pulse" : ""}`}
                          />
                        </motion.button>
                      ) : (
                        <motion.button
                          key="send"
                          type="submit"
                          disabled={isGeneratingResponse}
                          className="text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                          variants={iconVariants}
                          initial="initial"
                          animate="animate"
                          exit="exit"
                        >
                          {isGeneratingResponse ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <Send className="h-5 w-5" />
                          )}
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </form>
                {messages.length > 0 && (
                  <button
                    onClick={startNewSession}
                    className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <Plus className="h-3 w-3" />
                    Start new session
                  </button>
                )}
              </motion.div>
            </>
          )}
        </motion.div>

        <motion.div
          className="h-full"
          initial="hidden"
          animate={hasInitialQuery && !showInitialView ? "visible" : "hidden"}
          variants={rightPanelVariants}
        >
          {agentId ? (
            <Inference
              agent={{ _id: agentId }}
              userId={sessionId}
              currentUser={{}}
            />
          ) : (
            <Card className="h-full p-6">
              {isGeneratingResponse ? (
                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <motion.h3
                    key={loadingMessageIndex}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5 }}
                    className="text-lg font-medium"
                  >
                    {loadingMessages[loadingMessageIndex]}
                  </motion.h3>
                  <p className="text-sm text-muted-foreground">
                    Please wait while we update the agent configuration.
                  </p>
                </div>
              ) : agentConfig ? (
                <AgentConfigDisplay config={agentConfig} />
              ) : (
                <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
                  <h3 className="text-lg font-medium">
                    Creating your agent...
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Please continue the conversation to configure your agent.
                  </p>
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              )}
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Mira;
