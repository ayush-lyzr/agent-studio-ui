import React, { useState, useRef, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import axios from "axios";
import mixpanel from "mixpanel-browser";
import { useDragDrop } from "@/hooks/useDragDrop";
import { DragDropOverlay } from "@/components/custom/drag-drop-overlay";
import {
  Send,
  HelpCircle,
  BookOpen,
  Cpu,
  Code,
  Loader2,
  ArrowDown,
  ChevronDown,
  RefreshCcw,
  Paperclip,
  X,
  Timer,
  Image,
  Presentation,
  Music,
  FileText,
  Download,
  TriangleAlert,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import TypingAnimation from "@/components/ui/loading-typing-lottie";
import useStore from "@/lib/store";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isDevEnv, isMixpanelActive, METRICS_WS_URL } from "@/lib/constants";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import VoiceChat from "./audio-chat";
import MarkdownRenderer from "@/components/custom/markdown";
import { cn } from "@/lib/utils";
import { WebSocketMessage } from "@/types/chat";
import { CopyMessage } from "../../../components/custom/copy-message";
import { useCredits } from "@/hooks/use-credits";
import { validateFileUploadWithMessage, shouldDisableSendButton } from "@/utils/fileUploadValidation";

interface ChatMessage {
  role: "user" | "assistant" | "loading";
  content: string;
  latency?: number;
  thinking?: string;
  totalActions?: number;
  attachments?: FileAttachment[];
  artifacts?: Artifact[];
}

interface Artifact {
  file_url: string;
  artifact_id: string;
  name: string;
  format_type: string;
}

interface FileAttachment {
  asset_id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  mime_type: string;
}
interface FormData {
  message: string;
}

// interface WebSocketMessage {
//   event_type: string;
//   function_name: string;
//   response: any;
// }

interface ChatBoxProps {
  setChatData: (text: string) => void;
  chatData: string;
  agentId: string;
  user_id: string;
  chatHistory: ChatMessage[];
  isLoadingHistory: boolean;
  features?: any[];
  tool?: string | null;
  tools?: any[];
  enableVoiceInput?: boolean;
  isManagerAgent?: boolean;
  onSwitchToActivity?: () => void;
  setActivityMessages?: React.Dispatch<
    React.SetStateAction<WebSocketMessage[]>
  >;
  onGeneratingChange?: (isGenerating: boolean) => void;
  addEvent?: (event: WebSocketMessage) => void;
  isSharedAgent?: boolean;
}

const ChatBox = React.forwardRef<any, ChatBoxProps>(
  (
    {
      setChatData,
      chatData,
      agentId,
      user_id,
      chatHistory,
      isLoadingHistory,
      features = [],
      tool,
      tools,
      enableVoiceInput = false,
      isManagerAgent = false,
      onSwitchToActivity,
      setActivityMessages,
      onGeneratingChange,
      addEvent,
      isSharedAgent = false,
    },
    ref,
  ) => {
    const { register, handleSubmit, reset, setValue } = useForm<FormData>();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [, setLoading] = useState<boolean>(false);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const api_key = useStore((state: any) => state.api_key);
    const startTimeRef = useRef<number | null>(null);
    const [localHistory, setLocalHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState<number>(-1);
    const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [sessionId, setSessionId] = useState<string>(agentId);
    const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
    const processedMessages = useRef(new Set<string>());
    const [shouldReconnect, setShouldReconnect] = useState<boolean>(false);
    const [, setIsProcessing] = useState(false);
    const [isVoiceChatActive, setIsVoiceChatActive] = useState<boolean>(false);
    const [uploadedFiles, setUploadedFiles] = useState<FileAttachment[]>([]);
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const missingPersistAuthTools = useMemo(() => {
      if (!Array.isArray(tools) || tools.length === 0) return [];
      return tools.filter(
        (t: any) => t?.tool_source !== "openapi" && t?.persist_auth === false,
      );
    }, [tools]);

    const handleDragDropFiles = async (files: File[]) => {
      const fileList = new DataTransfer();
      files.forEach(file => fileList.items.add(file));
      await handleFileUpload(fileList.files);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    };
    const { isDragging, isOverDropZone, error: dragError } = useDragDrop({
      onFilesDropped: handleDragDropFiles,
      acceptedTypes: ['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.pptx', '.xlsx', '.xls'],
      maxFiles: 10,
      maxSizeMB: 10,
      disabled: isGeneratingResponse || isUploading,
    });

    // Add: Stop inference handler
    // const handleStopInference = async () => {
    //   if (!sessionId || !api_key) return;
    //   try {
    //     await fetch(
    //       `${import.meta.env.VITE_BASE_URL}/v3/inference/session/${sessionId}/stop`,
    //       {
    //         method: "POST",
    //         headers: {
    //           accept: "application/json",
    //           "x-api-key": api_key,
    //         },
    //       },
    //     );
    //   } catch (error) {
    //     console.error("Failed to stop inference:", error);
    //   } finally {
    //     setIsGeneratingResponse(false);
    //     setLoading(false);
    //   }
    // };


    const shouldStream = useMemo(() => {
      const noToolSelected = !tool;
      const noValidTools =
        tools?.length === 0 ||
        tools?.every((obj) => Object.values(obj).every((val) => val === ""));

      const hasDisqualifyingFeature = features.some((feature) => {
        const type = feature.type;
        const modules = feature.config?.modules;

        return (
          type === "HUMANIZER" ||
          type === "SRS" ||
          type === "CONTEXT_RELEVANCE" ||
          type === "GROUNDEDNESS" ||
          type === "UQLM_LLM_JUDGE" ||
          type === "UQLM_JUDGE_PANEL" ||
          type === "RAI" ||
          modules?.reflection ||
          modules?.bias ||
          modules?.toxicity
        );
      });

      return noToolSelected && noValidTools && !hasDisqualifyingFeature;
    }, [tool, tools, features]);

    const [isStreaming, setIsStreaming] = useState(shouldStream);

    // const current_organization = useManageAdminStore(
    //   (state) => state.current_organization,
    // );
    // const setUsageData = useManageAdminStore((state) => state.setUsageData);
    // const token = useStore((state) => state.app_token);

    // const { getUsage } = useOrganization({ current_organization, token });
    const { handleCredits } = useCredits();

    const sampleQueries = [
      {
        icon: <HelpCircle className="mr-2 h-4 w-4" />,
        text: "What are your main features?",
      },
      {
        icon: <BookOpen className="mr-2 h-4 w-4" />,
        text: "How do I get started?",
      },
      {
        icon: <Cpu className="mr-2 h-4 w-4" />,
        text: "What knowledge are you trained on?",
      },
      {
        icon: <Code className="mr-2 h-4 w-4" />,
        text: "Show me an example of your output",
      },
    ];

    const handleSampleQuery = (query: string) => {
      const fakeEvent = {
        target: { value: query },
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChangeEvent(fakeEvent);
      onSubmit({ message: query });
    };

    const scrollToBottom = () => {
      if (chatContainerRef.current) {
        chatContainerRef.current.scrollTo({
          top: chatContainerRef.current.scrollHeight,
          behavior: "smooth",
        });
      }
    };

    const handleScroll = () => {
      if (chatContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } =
          chatContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShouldAutoScroll(isAtBottom);
        setShowScrollButton(!isAtBottom);
      }
    };

    const generateSessionId = () => {
      return `${agentId}-${Math.random().toString(36).substring(2, 15)}`;
    };

    const separateThinkingContent = (content: string) => {
      let thinking: string | undefined;
      let artifacts: any[] | undefined;
      let actualContent = content;

      const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
      if (thinkMatch) {
        thinking = thinkMatch[1].trim();
        actualContent = actualContent
          .replace(/<think>[\s\S]*?<\/think>/, "")
          .trim();
      }

      const artifactMatch = content.match(/<artifacts>([\s\S]*?)<\/artifacts>/);
      if (artifactMatch) {
        const artifactContent = artifactMatch[1].trim();
        try {
          const parsed = JSON.parse(artifactContent);
          artifacts = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          artifacts = [artifactContent];
        }
        actualContent = actualContent
          .replace(/<artifacts>([\s\S]*?)<\/artifacts>/, "")
          .trim();
      }

      return { thinking, content: actualContent, artifacts };
    };

    const getFileIcon = (fileType: string) => {
      const type = fileType?.toLowerCase();
      const className = "mt-0.5 h-3 w-3 flex-shrink-0";

      if (
        type === "image" ||
        ["jpg", "jpeg", "png", "gif", "webp"].includes(type)
      ) {
        return <Image className={className} />;
      }
      if (type === "pptx") {
        return <Presentation className={className} />;
      }
      if (["mp3", "ogg", "wav"].includes(type)) {
        return <Music className={className} />;
      }

      return <FileText className={className} />;
    };

    const handleStream = async (userMessage: ChatMessage) => {
      setIsGeneratingResponse(true);
      setIsProcessing(true);

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/v3/inference/stream/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api_key,
            accept: "application/json",
          },
          body: JSON.stringify({
            user_id: user_id,
            agent_id: agentId,
            session_id: sessionId,
            message: userMessage.content,
            assets: userMessage.attachments?.map((att) => att.asset_id) || [],
          }),
        },
      );

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track(`Inference chat`, {
          sessionId: sessionId,
          query: userMessage?.content,
        });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error("Credits exhausted");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let isFirstChunk = true;
      let buffer = "";

      const agentMessage: ChatMessage = {
        role: "assistant",
        content: "",
        latency: 0,
      };

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        agentMessage,
      ]);

      if (!reader) return;

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                setLoading(false);
                setIsGeneratingResponse(false);
                return;
              }

              if (data.startsWith("[ERROR]")) {
                console.error(data);
                setLoading(false);
                setIsGeneratingResponse(false);
                return;
              }

              const decodedData = data
                .replace(/\\n/g, "\n")
                .replace(/\\"/g, '"')
                .replace(/\\'/g, "'")
                .replace(/\\&/g, "&")
                .replace(/\\r/g, "\r")
                .replace(/\\\\/g, "\\")
                .replace(/\\t/g, "\t")
                .replace(/&quot;/g, '"')
                .replace(/&apos;/g, "'")
                .replace(/&lt;/g, "<")
                .replace(/&gt;/g, ">")
                .replace(/&amp;/g, "&")
                .replace(/\\u([0-9a-fA-F]{4})/g, (_, p1) =>
                  String.fromCharCode(parseInt(p1, 16)),
                );

              if (!decodedData) continue;

              buffer += decodedData;

              const { thinking, content, artifacts } =
                separateThinkingContent(buffer);

              setMessages((prevMessages) => {
                const lastMessage = {
                  ...prevMessages[prevMessages.length - 1],
                };

                if (isFirstChunk) {
                  const latency = startTimeRef.current
                    ? Date.now() - startTimeRef.current
                    : 0;
                  lastMessage.latency = latency;
                  isFirstChunk = false;
                }

                lastMessage.content = content;
                lastMessage.thinking = thinking;
                lastMessage.artifacts = artifacts;
                return [...prevMessages.slice(0, -1), lastMessage];
              });
            }
          }
        }
      } catch (error) {
        console.error("Stream reading failed:", error);
        setLoading(false);
        setIsGeneratingResponse(false);
      } finally {
        reader.releaseLock();
        setIsProcessing(false);
      }
    };

    const handleChat = async (userMessage: ChatMessage) => {
      let provider_overrides;
      const isToolPresent = tools?.length && tools?.length > 0;
      if (isToolPresent) {
        provider_overrides = Object.fromEntries(
          tools.map((tool) => [tool.provider_uuid, tool.credential_id]),
        );
      }
      setIsGeneratingResponse(true);
      setIsProcessing(true);
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/v3/inference/chat/`,
        {
          user_id: user_id,
          agent_id: agentId,
          session_id: sessionId,
          message: userMessage.content,
          assets: userMessage.attachments?.map((att) => att.asset_id) || [],
          // assets: [],
          provider_overrides,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api_key,
          },
        },
      );

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track(`Inference chat`, {
          sessionId: sessionId,
          query: userMessage?.content,
        });

      const latency = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;

      const { thinking, content } = separateThinkingContent(
        response.data.response,
      );

      const artifacts = response.data.module_outputs?.artifact_files;

      // const totalActions = response.data.credits_cost?.total_actions || null;

      const agentMessage: ChatMessage = {
        role: "assistant",
        content: content,
        thinking: thinking,
        artifacts: artifacts,
        latency: latency,
        // totalActions: totalActions,
      };

      setMessages((prevMessages) => [
        ...prevMessages.slice(0, -1),
        agentMessage,
      ]);

      // let index = 0;
      // const streamInterval = setInterval(() => {
      //   if (index < response.data.response.length) {
      //     setMessages((prevMessages) => {
      //       const lastMessage = prevMessages[prevMessages.length - 1];
      //       lastMessage.content = response.data.response.slice(0, index + 1);
      //       return [...prevMessages.slice(0, -1), lastMessage];
      //     });
      //     index++;
      //   } else {
      //     clearInterval(streamInterval);
      //     setLoading(false);
      //     setIsGeneratingResponse(false);
      //   }
      // }, 10);

      setLoading(false);
      setIsProcessing(false);
      setIsGeneratingResponse(false);
    };

    const connectWebSocket = () => {
      if (isManagerAgent && (!wsConnection || shouldReconnect)) {
        processedMessages.current.clear();

        if (wsConnection) {
          wsConnection.close();
        }


        console.log(`Connecting WebSocket to ${METRICS_WS_URL}/ws/${sessionId}`);
        const websocket = new WebSocket(
          `${METRICS_WS_URL}/ws/${sessionId}?x-api-key=${encodeURIComponent(api_key)}`,
        );

        websocket.onopen = () => {
          console.log("Connected to WebSocket");
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received:", data);

            const messageHash = JSON.stringify({
              type: data.event_type,
              func: data.function_name,
              resp:
                typeof data.response === "string"
                  ? data.response
                  : JSON.stringify(data.response),
              timestamp: Date.now(),
            });

            if (!processedMessages.current.has(messageHash)) {
              processedMessages.current.add(messageHash);
              setActivityMessages?.((prev) => [...prev, data]);
              if (addEvent) {
                console.log("Adding event:", data);
                addEvent(data);
              }
            }
          } catch (error) {
            console.error("Error processing message:", error);
          }
        };

        websocket.onclose = () => {
          console.log("Disconnected from WebSocket");
          setWsConnection(null);
        };

        websocket.onerror = (error) => {
          console.error("WebSocket error:", error);
          setWsConnection(null);
        };

        setWsConnection(websocket);
        return websocket;
      }
      return null;
    };

    const disconnectWebSocket = () => {
      if (wsConnection) {
        console.log("Disconnecting WebSocket");
        wsConnection.close();
        setWsConnection(null);
      }
    };

    const onSubmit = async (data: FormData) => {
      if (isGeneratingResponse) return;

      if (!validateFileUploadWithMessage(uploadedFiles.length > 0, data.message)) {
        return;
      }

      if (isManagerAgent) {
        if (!wsConnection || shouldReconnect) {
          connectWebSocket();
          setShouldReconnect(false);
        }
      }

      if (data.message.trim()) {
        setLocalHistory((prev) => {
          const newHistory = [...prev, data.message];
          return newHistory.slice(-10);
        });
        setHistoryIndex(-1);
      }

      const userMessage: ChatMessage = {
        role: "user",
        content: data.message,
        attachments: uploadedFiles.length > 0 ? uploadedFiles : undefined,
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setUploadedFiles([]);
      setLoading(true);
      reset();
      startTimeRef.current = Date.now();

      const loadingMessage: ChatMessage = {
        role: "loading",
        content: "Loading...",
      };
      setMessages((prevMessages) => [...prevMessages, loadingMessage]);
      setChatData("");

      try {
        if (isStreaming) {
          await handleStream(userMessage);
        } else {
          await handleChat(userMessage);
        }
        setTimeout(handleCredits, 3 * 1000);

        if (isManagerAgent) {
          setTimeout(disconnectWebSocket, 1000);
        }
      } catch (error: any) {
        console.error("Error sending message:", error);
        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          {
            content: error?.message,
            role: "assistant",
          },
        ]);
        setLoading(false);
        setIsGeneratingResponse(false);
        if (isManagerAgent) {
          disconnectWebSocket();
        }
      }
    };

    const handleFileUpload = async (files: FileList) => {
      const allowedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/jpeg",
        "image/png",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];

      const validFiles = Array.from(files).filter((file) =>
        allowedTypes.includes(file.type),
      );

      if (validFiles.length === 0) {
        alert("Please upload only PDF, DOCX, Excel, or image files.");
        return;
      }

      const formData = new FormData();
      validFiles.forEach((file) => {
        formData.append("files", file);
      });

      setIsUploading(true);

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL}/v3/assets/upload`,
          formData,
          {
            headers: {
              "x-api-key": api_key,
              "Content-Type": "multipart/form-data",
            },
          },
        );

        const successfulUploads = response.data.results.filter(
          (result: any) => result.success,
        );
        const failedUploads = response.data.results.filter(
          (result: any) => !result.success,
        );

        if (failedUploads.length > 0) {
          console.error("Some uploads failed:", failedUploads);
          const failedFileNames = failedUploads
            .map((result: any) => result.file_name)
            .join(", ");
          alert(`Failed to upload: ${failedFileNames}`);
        }

        if (successfulUploads.length > 0) {
          const newAttachments: FileAttachment[] = successfulUploads.map(
            (result: any) => ({
              asset_id: result.asset_id,
              name: result.file_name,
              type: result.type,
              size: result.file_size,
              url: result.url,
              mime_type: result.mime_type,
            }),
          );

          setUploadedFiles((prev) => [...prev, ...newAttachments]);
        }
      } catch (error) {
        console.error("File upload failed:", error);
        alert("File upload failed. Please try again.");
      } finally {
        setIsUploading(false);
      }
    };

    const removeFile = (index: number) => {
      setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const onChangeEvent = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setChatData(event.target.value);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        if (!isGeneratingResponse) {
          handleSubmit(onSubmit)();
        }
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        if (localHistory.length > 0 && historyIndex < localHistory.length - 1) {
          const newIndex = historyIndex + 1;
          setHistoryIndex(newIndex);
          setValue("message", localHistory[localHistory.length - 1 - newIndex]);
        }
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setValue("message", localHistory[localHistory.length - 1 - newIndex]);
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setValue("message", "");
        }
      }
    };

    useEffect(() => {
      const chatContainer = chatContainerRef.current;
      if (chatContainer) {
        chatContainer.addEventListener("scroll", handleScroll);
        return () => chatContainer.removeEventListener("scroll", handleScroll);
      }

      return () => {
        disconnectWebSocket();
        processedMessages.current.clear();
      };
    }, []);

    useEffect(() => {
      if (shouldAutoScroll && messages.length > 0) {
        scrollToBottom();
      }
    }, [messages, shouldAutoScroll]);

    useEffect(() => {
      if (agentId) {
        setMessages(chatHistory.length > 0 ? chatHistory : []);
      }
    }, [agentId, chatHistory]);

    useEffect(() => {
      setIsStreaming(shouldStream);
    }, [shouldStream]);

    useEffect(() => {
      onGeneratingChange?.(isGeneratingResponse);
    }, [isGeneratingResponse, onGeneratingChange]);

    useEffect(() => {
      if (ref) {
        // @ts-ignore
        ref.current = {
          startNewSession: () => {
            setMessages([]);
            const newSessionId = generateSessionId();
            setSessionId(newSessionId);

            if (isManagerAgent) {
              disconnectWebSocket();
              processedMessages.current.clear();
              setShouldReconnect(true);
            }
          },
        };
      }
    }, [ref, isManagerAgent]);

    useEffect(() => {
      if (shouldReconnect && isManagerAgent) {
        const ws = connectWebSocket();
        setShouldReconnect(false);

        return () => {
          if (ws) {
            ws.close();
          }
        };
      }
    }, [shouldReconnect, isManagerAgent]);

    useEffect(() => {
      // on mount, re-generate session id
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
    }, []);

    return (
      <>
        <DragDropOverlay
          isDragging={isDragging}
          isOverDropZone={isOverDropZone}
          error={dragError}
          acceptedTypes={['.pdf', '.docx', '.jpg', '.jpeg', '.png', '.pptx', '.xlsx', '.xls']}
          maxFiles={10}
          showSuccess={showSuccess}
        />
        <div className="w-full">
          <div className="space-y-4">
            <div
              ref={chatContainerRef}
              className={cn(
                "relative overflow-y-auto rounded-md border p-2",
                uploadedFiles.length > 0
                  ? "h-[calc(100vh-18rem)]"
                  : "h-[calc(100vh-13rem)]",
              )}
            >
              {isDevEnv && (
                <div className="sticky top-0 z-10 mb-2 border-b bg-background/95 pb-2 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                  <div className="flex items-center justify-end space-x-2">
                    <Label htmlFor="streaming-mode">Stream Responses</Label>
                    <Switch
                      id="streaming-mode"
                      checked={isStreaming}
                      onCheckedChange={setIsStreaming}
                      disabled={!shouldStream}
                    />
                  </div>
                </div>
              )}

              {!isLoadingHistory && messages.length > 0 && !isManagerAgent && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          // @ts-ignore
                          if (ref?.current?.startNewSession) {
                            // @ts-ignore
                            ref.current.startNewSession();
                            setIsGeneratingResponse(false);
                          }
                        }}
                        className="sticky left-2 top-2 z-10 bg-background/95"
                      >
                        <RefreshCcw className="size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>New session</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}

              {isLoadingHistory ? (
                "Loading chat history..."
              ) : messages.length === 0 ? (
                <div className="flex h-[calc(100%-10rem)] flex-col items-center justify-center text-center">
                  <p className="mb-4 text-muted-foreground">
                    Start a conversation or try one of these examples:
                  </p>
                  <div className="flex max-w-2xl flex-wrap justify-center gap-2">
                    {sampleQueries.map((query, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        className="flex items-center text-sm"
                        onClick={() => handleSampleQuery(query.text)}
                      >
                        {query.icon}
                        {query.text}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={cn(
                      "flex flex-col p-2",
                      msg.role === "user" ? "items-end" : "items-start",
                    )}
                  >
                    {msg.role === "assistant" && (
                      <p className="mb-1 ml-1 text-sm">Agent</p>
                    )}
                    <span
                      className={cn(
                        "group inline-block max-w-full rounded-2xl border-input",
                        msg.role === "user"
                          ? "border text-foreground"
                          : msg.role === "loading"
                            ? "transparent text-foreground"
                            : "border border-input bg-accent text-foreground",
                      )}
                    >
                      {msg.role === "loading" ? (
                        <div className="flex flex-col px-4 py-2">
                          <div className="h-5">
                            <TypingAnimation />
                          </div>
                          {isManagerAgent && onSwitchToActivity ? (
                            <div className="flex items-center justify-center gap-1">
                              <p className="text-xs text-foreground">
                                Inference might take a while.
                              </p>
                              <button
                                onClick={onSwitchToActivity}
                                className="text-xs text-blue-600 hover:underline"
                              >
                                Track activity.
                              </button>
                            </div>
                          ) : (
                            <p className="text-center text-xs"></p>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {msg.thinking && (
                            <Collapsible className="w-full rounded-lg border bg-muted/50 px-4 py-2">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-semibold">
                                  Reasoning
                                </h4>
                                <CollapsibleTrigger className="flex items-center">
                                  <ChevronDown className="h-4 w-4" />
                                </CollapsibleTrigger>
                              </div>
                              <CollapsibleContent className="pt-2">
                                <MarkdownRenderer
                                  content={msg.thinking}
                                  maxWidth="100%"
                                />
                              </CollapsibleContent>
                            </Collapsible>
                          )}
                          <MarkdownRenderer
                            content={msg.content}
                            maxWidth="100%"
                          />
                        </div>
                      )}
                    </span>
                    {/* File attachments displayed below message bubble */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div
                        className={cn(
                          "mt-2 flex flex-wrap gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        {msg.attachments.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="flex min-w-[140px] items-start gap-2 rounded-md border bg-muted/50 p-2 text-xs"
                          >
                            <Paperclip className="mt-0.5 h-3 w-3 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">
                                {file.name}
                              </div>
                              <div className="mt-0.5 text-[10px] text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {msg.artifacts && msg.artifacts.length > 0 && (
                      <div
                        className={cn(
                          "mt-2 flex flex-wrap gap-2",
                          msg.role === "user" ? "justify-end" : "justify-start",
                        )}
                      >
                        {msg.artifacts.map((file, fileIndex) => (
                          <div
                            key={fileIndex}
                            className="group flex min-w-[140px] cursor-pointer items-start gap-2 rounded-md border bg-muted/50 p-2 text-xs hover:bg-muted"
                            onClick={() => window.open(file.file_url, "_blank")}
                          >
                            <div className="group-hover:hidden">
                              {getFileIcon(file.format_type)}
                            </div>
                            <Download className="mt-0.5 hidden size-3 flex-shrink-0 group-hover:block" />
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-xs font-medium">
                                {file.name}{file.format_type !== "image" ? `.${file.format_type}` : ""}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {msg.role !== "loading" && (
                      <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                        <CopyMessage content={msg.content} />
                        {typeof msg.latency === "number" &&
                          msg.role === "assistant" && (
                            <span className="inline-flex items-center gap-1">
                              <Timer className="size-3.5" />{" "}
                              {(msg.latency / 1000).toFixed(2)} sec
                            </span>
                          )}
                      </div>
                    )}


                  </div>
                ))
              )}
              {showScrollButton && (
                <TooltipProvider delayDuration={0}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="secondary"
                        size="icon"
                        className="fixed bottom-24 right-8 z-10 flex h-8 w-8 items-center justify-center rounded-full shadow-lg"
                        onClick={scrollToBottom}
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Scroll to bottom</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            <form
              onSubmit={handleSubmit(onSubmit)}
              className="relative flex w-full items-center"
            >
              <div className="relative w-full">
                {/* File attachments preview inside textarea */}
                {uploadedFiles.length > 0 && (
                  <div className="absolute left-2 right-12 top-2 z-10 flex max-h-24 flex-row flex-wrap items-start justify-start gap-2 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex w-fit flex-shrink-0 items-center gap-1 rounded-md border bg-muted/90 px-2 py-1 text-xs backdrop-blur-sm"
                      >
                        <Paperclip className="h-3 w-3 flex-shrink-0" />
                        <div className="flex min-w-0 flex-col">
                          <span className="max-w-[80px] truncate font-medium">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="ml-1 flex-shrink-0 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-2 w-2" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {missingPersistAuthTools.length > 0 && isSharedAgent && (
                  <div className="mb-2 flex items-center gap-2 text-xs text-eval-yellow">
                    <TriangleAlert className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">
                      Authentication required. Connect to tool(s) to start
                      interacting.
                    </span>
                  </div>
                )}

                {/* Textarea */}
                <Textarea
                  placeholder={
                    !isVoiceChatActive
                      ? "↑↓ to navigate chat history, Shift+Enter for newline"
                      : ""
                  }
                  className={`w-full resize-none pr-20 ${uploadedFiles.length > 0 ? "pt-24" : ""}`}
                  onKeyDown={handleKeyDown}
                  disabled={isVoiceChatActive}
                  {...register("message", {
                    required: uploadedFiles.length === 0,
                    validate: (value) =>
                      uploadedFiles.length > 0 || value.trim() !== "",
                    onChange: onChangeEvent,
                  })}
                />

                {/* File input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.jpg,.jpeg,.png,.pptx,.xlsx,.xls"
                  onChange={(e) =>
                    e.target.files && handleFileUpload(e.target.files)
                  }
                  className="hidden"
                />

                {/* Button area (Upload, Mic or Send) */}
                <div
                  className={`absolute flex items-center gap-1
                  ${isVoiceChatActive
                      ? "left-1/2 top-0 -translate-x-1/2"
                      : "right-3 top-1/2 -translate-y-1/2"
                    }`}
                >
                  {!isVoiceChatActive && (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isGeneratingResponse || isUploading}
                            className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isUploading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Paperclip size={18} />
                            )}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>
                            {isUploading
                              ? "Uploading..."
                              : "Upload PDF, DOCX, PPTX, Excel, or image"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {/* Add Stop button when generating response */}
                  {/* {isGeneratingResponse && !isVoiceChatActive && (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={handleStopInference}
                          className="flex items-center justify-center rounded-md border-2 border-red-500 bg-transparent text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                          style={{
                            width: "18px",
                            height: "18px",
                            aspectRatio: "1 / 1",
                          }}
                        ></button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Stop Inference</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )} */}
                  {enableVoiceInput && chatData.trim() === "" ? (
                    // && uploadedFiles.length === 0 ? (
                    <VoiceChat
                      session_id={sessionId}
                      user_id={user_id}
                      agent_id={agentId}
                      setMessages={setMessages}
                      setIsResponseLoading={setLoading}
                      setIsVoiceChatActive={setIsVoiceChatActive}
                      isStreaming={isStreaming}
                    />
                  ) : (
                    <TooltipProvider delayDuration={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="submit"
                            disabled={shouldDisableSendButton(uploadedFiles.length > 0, chatData, isGeneratingResponse)}
                            className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isGeneratingResponse ? (
                              <Loader2 size={20} className="animate-spin" />
                            ) : (
                              <Send size={20} />
                            )}
                          </button>
                        </TooltipTrigger>
                        {uploadedFiles.length > 0 && chatData.trim() === "" && (
                          <TooltipContent>
                            <p>Please enter a message along with the file</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  },
);

export default ChatBox;

const styles = `
.typing-dots {
    display: inline-block;
}

.typing-dots span {
    animation: typing 1s infinite;
    font-size: 1.5em;
}

.typing-dots span:nth-child(1) {
    animation-delay: 0s;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.02s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.2s;
}

@keyframes typing {
    0%, 80%, 100% {
        opacity: 0;
    }
    40% {
        opacity: 1;
    }
}
`;

// Add the styles to the document
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);
