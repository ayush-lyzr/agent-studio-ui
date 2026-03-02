import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import rehypeRaw from "rehype-raw";
import {
  X,
  Maximize2,
  Minimize2,
  Copy,
  Check,
  Save,
  Download,
  Play,
  FileCode,
  Send,
  MessageSquare,
  Activity,
  Zap,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import useStore from "@/lib/store";
import axios from "axios";
import { FileItem } from "./FileExplorer";
import ActivityLog from "../../studio/components/activity-log";

// Utility function to clean markdown text from JSON string format
function cleanMarkdown(input: string) {
  if (!input) return "";

  return (
    input
      // Step 1: Handle JSON string format issues
      .replace(/^"(.*)"$/s, "$1") // unquote (s = dotAll)
      .replace(/\\n/g, "\n") // convert escaped newlines to real newlines
      .replace(/\r\n/g, "\n") // normalize CRLF to LF
      .replace(
        /\\u([\dA-Fa-f]{4})/g, // decode unicode escape sequences
        (_, h) => String.fromCharCode(parseInt(h, 16)),
      )

      // Step 2: Ensure markdown compatibility
      .replace(/\n/g, "  \n")
  ); // Add two spaces before newlines for markdown line breaks
}

// Interface for WebSocket messages used in activity log
interface WebSocketMessage {
  event_type: string;
  function_name?: string;
  response?: string | any;
  arguments?: {
    name?: string;
    [key: string]: any;
  };
  timestamp?: string;
  run_id?: string;
  session_id?: string;
  user_id?: string;
  agent_id?: string;
  message_count?: number;
  retrieved_messages?: Array<{
    role: string;
    content_length: number;
    content_preview: string;
    content?: string; // Full content may be available in some cases
  }>;
}

// Interface for chat messages
interface ChatMessage {
  role: "user" | "assistant" | "loading";
  content: string;
}

interface EnhancedCodeEditorProps {
  files: FileItem[];
  onFileChange: (fileId: string, content: string) => void;
  selectedFile: FileItem | null;
  isFullScreen: boolean;
  onToggleFullScreen: () => void;
  onSave: () => void;
  onRun?: () => void;
}

interface TabData {
  id: string;
  name: string;
  language: string;
}

const EnhancedCodeEditor: React.FC<EnhancedCodeEditorProps> = ({
  files,
  onFileChange,
  selectedFile,
  isFullScreen,
  onToggleFullScreen,
  onSave,
  onRun,
}) => {
  const [activeTab, setActiveTab] = useState<string>("editor");
  const [tabs, setTabs] = useState<TabData[]>([]);
  const [currentTabId, setCurrentTabId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "> Agent Studio IDE Terminal",
    "> Type commands to interact with your agent code",
  ]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activityMessages, setActivityMessages] = useState<WebSocketMessage[]>(
    [],
  );
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useStreamEndpoint, setUseStreamEndpoint] = useState(false);
  const [showAsYaml, setShowAsYaml] = useState(false);
  const [panelSizes, setPanelSizes] = useState<number[]>([33, 34, 33]); // Initial panel sizes in percentage
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKey = useStore((state: any) => state.api_key);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedFile && selectedFile.type === "file") {
      if (!tabs.some((tab) => tab.id === selectedFile.id)) {
        setTabs([
          ...tabs,
          {
            id: selectedFile.id,
            name: selectedFile.name,
            language:
              selectedFile.language ||
              getLanguageFromFilename(selectedFile.name),
          },
        ]);
      }
      setCurrentTabId(selectedFile.id);
    }
  }, [selectedFile]);

  // Function to handle streaming response from the agent API using SSE
  const handleStreamResponse = async (
    response: Response,
    userId: string,
    sessionId: string,
    runId: string,
  ) => {
    if (!response.body) return;

    // Remove loading message
    setMessages((prev) => prev.filter((msg) => msg.role !== "loading"));

    // Set streaming status to true to show animation
    setIsStreaming(true);

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let isFirstChunk = true;
    let buffer = "";

    // Add an empty agent message that we'll update with streaming content
    const agentMessage: ChatMessage = {
      role: "assistant",
      content: "",
    };

    setMessages((prev) => [...prev, agentMessage]);

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
              setIsLoading(false);
              setIsStreaming(false);
              return;
            }

            if (data.startsWith("[ERROR]")) {
              console.error(data);
              setIsLoading(false);
              setIsStreaming(false);
              return;
            }

            // Decode escaped characters
            const decodedData = data
              .replace(/\\n/g, "\n")
              .replace(/\\\"|\\"/g, '"')
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

            if (isFirstChunk) {
              isFirstChunk = false;

              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                lastMessage.content = decodedData;
                buffer = decodedData;
                return [...prevMessages.slice(0, -1), lastMessage];
              });
            } else {
              if (
                decodedData &&
                decodedData !== buffer.slice(-decodedData.length)
              ) {
                buffer += decodedData;

                setMessages((prevMessages) => {
                  const lastMessage = prevMessages[prevMessages.length - 1];
                  lastMessage.content = buffer;
                  return [...prevMessages.slice(0, -1), lastMessage];
                });
              }
            }

            // Auto-scroll as content is added
            if (messagesEndRef.current) {
              messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
            }
          }
        }
      }

      // Add activity log entry for completed response
      const agentActivityEntry: WebSocketMessage = {
        event_type: "AGENT_SENT_MESSAGE",
        timestamp: new Date().toISOString(),
        user_id: userId,
        session_id: sessionId,
        run_id: runId,
        agent_id: selectedFile?.metadata?.agentId || "",
        response: buffer,
      };
      setActivityMessages((prev) => [...prev, agentActivityEntry]);
    } catch (error) {
      console.error("Stream reading failed:", error);
      setIsLoading(false);
      setIsStreaming(false);
    } finally {
      reader.releaseLock();
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  // Function to send a message to the agent
  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !selectedFile?.metadata?.agentId)
      return;

    // Add user message to chat
    const userMessage: ChatMessage = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, userMessage]);

    // Clear input
    setInputMessage("");

    // Generate unique IDs for this interaction
    const userId = `user_${Date.now()}`;
    const sessionId = `session_${Date.now()}`;
    const runId = `run_${Date.now()}`;

    // Add loading message
    setIsLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "loading", content: "Thinking..." },
    ]);

    // Add activity log entry for user message
    const userActivityEntry: WebSocketMessage = {
      event_type: "AGENT_RECEIVED_MESSAGE",
      timestamp: new Date().toISOString(),
      user_id: userId,
      session_id: sessionId,
      run_id: runId,
      agent_id: selectedFile.metadata.agentId,
      response: inputMessage,
    };
    setActivityMessages((prev) => [...prev, userActivityEntry]);

    // Common request data
    const requestData = {
      user_id: userId,
      agent_id: selectedFile.metadata.agentId,
      session_id: sessionId,
      message: inputMessage,
    };

    // Common headers
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    };

    try {
      if (useStreamEndpoint) {
        // Use streaming endpoint
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL || "https://api.lyzr.ai"}/v3/inference/stream/`,
          {
            method: "POST",
            headers,
            body: JSON.stringify(requestData),
          },
        );

        if (!response.ok) {
          throw new Error(
            `Stream request failed with status ${response.status}`,
          );
        }

        await handleStreamResponse(response, userId, sessionId, runId);
      } else {
        // Use regular chat endpoint
        const response = await axios.post(
          `${import.meta.env.VITE_BASE_URL || "https://api.lyzr.ai"}/v3/inference/chat/`,
          requestData,
          { headers },
        );

        // Remove loading message
        setMessages((prev) => prev.filter((msg) => msg.role !== "loading"));

        // Add agent response
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response.data.response },
        ]);

        // Add activity log entry for agent response
        const agentActivityEntry: WebSocketMessage = {
          event_type: "AGENT_SENT_MESSAGE",
          timestamp: new Date().toISOString(),
          user_id: userId,
          session_id: sessionId,
          run_id: runId,
          agent_id: selectedFile.metadata.agentId,
          response: response.data.response,
        };
        setActivityMessages((prev) => [...prev, agentActivityEntry]);

        setIsLoading(false);
      }
    } catch (error) {
      console.error("Error communicating with agent:", error);
      // Remove loading message
      setMessages((prev) => prev.filter((msg) => msg.role !== "loading"));

      // Add error message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, there was an error communicating with the agent. Please try again.",
        },
      ]);

      // Add activity log entry for error
      const errorActivityEntry: WebSocketMessage = {
        event_type: "AGENT_ERROR",
        timestamp: new Date().toISOString(),
        user_id: userId,
        session_id: sessionId,
        run_id: runId,
        agent_id: selectedFile.metadata.agentId,
        response: "Error communicating with agent",
      };
      setActivityMessages((prev) => [...prev, errorActivityEntry]);

      toast.error("Failed to communicate with the agent");
      setIsLoading(false);
    }
  };

  // Auto-scroll to bottom of chat when messages change
  useEffect(() => {
    if (messagesEndRef.current && activeTab === "inference") {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Simple function to convert JSON to YAML-like format
  const jsonToYaml = (json: string): string => {
    try {
      const obj = JSON.parse(json);
      return convertToYaml(obj, 0);
    } catch (error) {
      console.error("Error converting JSON to YAML:", error);
      return json; // Return original JSON if conversion fails
    }
  };

  // Helper function to convert JavaScript object to YAML string with proper indentation
  const convertToYaml = (obj: any, indent: number = 0): string => {
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";

    const indentation = " ".repeat(indent);

    if (typeof obj !== "object") {
      // Handle primitive types
      if (typeof obj === "string") {
        // Check if string needs quotes (contains special characters)
        if (/[:\s\[\]{},'"\\]/.test(obj)) {
          return `"${obj.replace(/"/g, '\\"')}"`;
        }
        return obj;
      }
      return String(obj); // For numbers, booleans, etc.
    }

    if (Array.isArray(obj)) {
      if (obj.length === 0) return "[]";

      // For arrays, add a newline after the first item to improve readability
      return obj
        .map((item) => {
          const itemYaml = convertToYaml(item, indent + 2);
          // If it's a complex item (object/array), give it proper indentation
          if (typeof item === "object" && item !== null) {
            if (itemYaml.includes("\n")) {
              return `${indentation}- \n${itemYaml
                .split("\n")
                .map((line) => `${indentation}  ${line}`)
                .join("\n")}`;
            }
            return `${indentation}- ${itemYaml}`;
          }
          return `${indentation}- ${itemYaml}`;
        })
        .join("\n");
    }

    // Handle objects with improved indentation
    const keys = Object.keys(obj);
    if (keys.length === 0) return "{}";

    return keys
      .map((key) => {
        const value = obj[key];

        // Format the key with proper indentation
        const formattedKey = key.includes(" ") ? `"${key}"` : key;

        if (typeof value === "object" && value !== null) {
          // For complex nested objects, improve indentation
          if (Array.isArray(value)) {
            if (value.length === 0) {
              return `${indentation}${formattedKey}: []`;
            }

            // Add a line break after the key for arrays
            return `${indentation}${formattedKey}:\n${convertToYaml(value, indent + 2)}`;
          } else {
            // For objects
            if (Object.keys(value).length === 0) {
              return `${indentation}${formattedKey}: {}`;
            }

            return `${indentation}${formattedKey}:\n${convertToYaml(value, indent + 2)}`;
          }
        }

        // For primitive values
        return `${indentation}${formattedKey}: ${convertToYaml(value, indent)}`;
      })
      .join("\n");
  };

  // Function to format JSON with proper indentation
  const formatJson = (json: string): string => {
    try {
      const parsed = JSON.parse(json);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      // If parsing fails, return the original string
      return json;
    }
  };

  const getLanguageFromFilename = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    switch (ext) {
      case "js":
        return "javascript";
      case "ts":
        return "typescript";
      case "jsx":
        return "javascript";
      case "tsx":
        return "typescript";
      case "py":
        return "python";
      case "json":
        return "json";
      case "html":
        return "html";
      case "css":
        return "css";
      default:
        return "plaintext";
    }
  };

  const getCurrentFile = (): FileItem | null => {
    if (!currentTabId) return null;
    return findFileById(files, currentTabId);
  };

  const findFileById = (items: FileItem[], id: string): FileItem | null => {
    for (const item of items) {
      if (item.id === id) return item;
      if (item.type === "folder" && item.children) {
        const found = findFileById(item.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const handleContentChange = (content: string) => {
    const file = getCurrentFile();
    if (file && file.id) {
      onFileChange(file.id, content);
    }
  };

  // Function to format the JSON in the editor
  const formatCurrentJson = () => {
    const currentContent = getCurrentFile()?.content || "";
    const formattedContent = formatJson(currentContent);
    handleContentChange(formattedContent);
    toast.success("JSON formatted successfully");
  };

  const closeTab = (tabId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const newTabs = tabs.filter((tab) => tab.id !== tabId);
    setTabs(newTabs);

    if (currentTabId === tabId) {
      setCurrentTabId(
        newTabs.length > 0 ? newTabs[newTabs.length - 1].id : null,
      );
    }
  };

  const copyToClipboard = () => {
    const file = getCurrentFile();
    if (file && file.content) {
      navigator.clipboard.writeText(file.content);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    }
  };

  const handleSave = () => {
    onSave();
    toast.success("File saved successfully");
  };

  const handleRun = () => {
    if (onRun) {
      onRun();
      setTerminalOutput((prev) => [
        ...prev,
        "> Running code...",
        "> Started execution at " + new Date().toLocaleTimeString(),
      ]);
      // Simulate output after a delay
      setTimeout(() => {
        setTerminalOutput((prev) => [
          ...prev,
          "> Execution completed successfully",
        ]);
      }, 1500);
    }
  };

  const downloadFile = () => {
    window.open(
      "https://raw.githubusercontent.com/shreyas-lyzr/lyzr-agent/main/lyzr-agent.zip",
      "_blank",
    );
    toast.success("Opening code repository in GitHub.dev");
    // const file = getCurrentFile();
    // if (file && file.content) {
    //   const blob = new Blob([file.content], { type: 'text/plain' });
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement('a');
    //   a.href = url;
    //   a.download = file.name;
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);
    //   toast.success(`Downloaded ${file.name}`);
    // }
  };

  const openInGithub = () => {
    window.open("https://github.dev/NeuralgoLyzr/lyzr-agent-core", "_blank");
    toast.success("Opening code repository in GitHub.dev");
  };

  const renderEditorToolbar = () => (
    <div className="flex items-center justify-between border-b border-border bg-primary/10 p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={handleSave} title="Save">
          <Save className="h-4 w-4" />
        </Button>
        {onRun && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRun}
            title="Run Code"
          >
            <Play className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={openInGithub}
          title="Open in GitHub.dev"
        >
          <ExternalLink className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={downloadFile}
          title="Download File"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={copyToClipboard}
          title="Copy to Clipboard"
        >
          {isCopied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleFullScreen}
        title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
      >
        {isFullScreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {tabs.length > 0 ? (
        <>
          <div className="hide-scrollbar flex items-center overflow-x-auto border-b border-border bg-card/90 shadow-sm">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={cn(
                  "flex cursor-pointer items-center whitespace-nowrap border-r border-border px-3 py-1.5 text-xs text-foreground",
                  tab.id === currentTabId
                    ? "border-b-2 border-b-primary bg-primary/10 font-medium shadow-sm"
                    : "border-b-2 border-b-transparent hover:bg-muted/30",
                )}
                onClick={() => setCurrentTabId(tab.id)}
              >
                <FileCode className="mr-1.5 h-3.5 w-3.5 text-primary" />
                <span className="max-w-[120px] truncate">{tab.name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-1.5 h-5 w-5 rounded-full p-0 hover:bg-primary/20"
                  onClick={(e) => closeTab(tab.id, e)}
                >
                  <X className="h-2.5 w-2.5 text-muted-foreground hover:text-foreground" />
                </Button>
              </div>
            ))}
          </div>

          {renderEditorToolbar()}

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex flex-1 flex-col"
          >
            <div className="border-b bg-card/70 px-4">
              <TabsList className="mb-0 bg-transparent">
                <TabsTrigger
                  value="editor"
                  className="text-foreground data-[state=active]:bg-accent/30 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                >
                  <FileCode className="mr-1.5 h-4 w-4" />
                  Editor
                </TabsTrigger>
                {selectedFile?.metadata?.agentId && (
                  <TabsTrigger
                    value="inference"
                    className="flex items-center gap-1 text-foreground data-[state=active]:bg-accent/30 data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Inference
                  </TabsTrigger>
                )}
                {/* <TabsTrigger value="terminal">Terminal</TabsTrigger> */}
              </TabsList>
            </div>

            <TabsContent
              value="editor"
              className="mt-0 flex-1 overflow-hidden p-0 pt-0"
            >
              <div className="h-full p-0">
                <textarea
                  ref={editorRef}
                  className="h-full w-full resize-none border-none bg-background p-4 font-mono text-sm focus:border-none focus:outline-none focus:ring-0"
                  value={getCurrentFile()?.content || ""}
                  onChange={(e) => handleContentChange(e.target.value)}
                  spellCheck={false}
                />
              </div>
            </TabsContent>

            <TabsContent
              value="inference"
              className="mt-0 flex-1 overflow-hidden p-0 pt-0"
            >
              <div className="h-full" style={{ userSelect: "none" }}>
                {/* Simplify to a single container with absolute positioned dividers */}
                <div
                  className="grid h-full bg-card"
                  style={{
                    gridTemplateColumns: `${panelSizes[0]}% ${panelSizes[1]}% ${panelSizes[2]}%`,
                  }}
                >
                  {/* JSON Editor (Left Panel) */}
                  <div className="relative h-full overflow-hidden border-r border-border bg-card">
                    <div className="flex items-center justify-between border-b border-border bg-primary/10 p-2 shadow-sm">
                      <div className="flex items-center">
                        <FileCode className="mr-1.5 h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          JSON Editor
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        {/* Format button */}
                        {!showAsYaml && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={formatCurrentJson}
                            className="h-7 px-2 py-1 text-xs hover:bg-primary/20"
                            title="Format JSON"
                          >
                            Format
                          </Button>
                        )}
                        <span className="text-xs text-foreground/70">
                          {showAsYaml ? "YAML" : "JSON"}
                        </span>
                        <Switch
                          checked={showAsYaml}
                          onCheckedChange={setShowAsYaml}
                          className="data-[state=checked]:bg-primary"
                        />
                      </div>
                    </div>
                    <div className="h-[calc(100%-32px)] p-0">
                      <textarea
                        className="h-full w-full resize-none border-none bg-card p-4 font-mono text-sm text-foreground focus:border-none focus:outline-none focus:ring-0"
                        value={
                          showAsYaml
                            ? jsonToYaml(getCurrentFile()?.content || "")
                            : getCurrentFile()?.content || ""
                        }
                        onChange={(e) => {
                          // Always convert YAML back to JSON before saving
                          if (showAsYaml) {
                            try {
                              // When in YAML mode, we need to be careful about edits
                              // For now, just disable direct editing in YAML mode
                              toast.error(
                                "Direct editing in YAML mode is disabled. Switch to JSON mode to edit.",
                              );
                            } catch (error) {
                              console.error(
                                "Error processing YAML edit:",
                                error,
                              );
                            }
                          } else {
                            // In JSON mode, allow normal editing
                            handleContentChange(e.target.value);
                          }
                        }}
                        spellCheck={false}
                        readOnly={showAsYaml} // Disable editing in YAML mode
                      />
                    </div>

                    {/* First draggable divider - positioned at the right edge of first column */}
                    <div
                      className="absolute right-0 top-0 h-full w-3 cursor-col-resize bg-transparent hover:bg-primary hover:opacity-50"
                      onMouseDown={(e) => {
                        e.preventDefault();

                        const initialX = e.clientX;
                        const initialGrid = panelSizes.slice();
                        const gridContainer =
                          e.currentTarget.parentElement?.parentElement;
                        const containerWidth =
                          gridContainer?.getBoundingClientRect().width || 1000;

                        function handleMouseMove(moveEvent: MouseEvent) {
                          const dx = moveEvent.clientX - initialX;
                          const percentDelta = (dx / containerWidth) * 100;

                          // Calculate new sizes ensuring minimums
                          const newFirstSize = Math.max(
                            20,
                            Math.min(60, initialGrid[0] + percentDelta),
                          );
                          const sizeDiff = newFirstSize - initialGrid[0];
                          const newSecondSize = Math.max(
                            20,
                            initialGrid[1] - sizeDiff,
                          );
                          const newThirdSize = initialGrid[2];

                          // Update only if changes are valid
                          if (newFirstSize >= 20 && newSecondSize >= 20) {
                            setPanelSizes([
                              newFirstSize,
                              newSecondSize,
                              newThirdSize,
                            ]);
                          }
                        }

                        function handleMouseUp() {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove,
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp,
                          );
                        }

                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    />
                  </div>

                  {/* Chat Interface (Middle Panel) */}
                  <div className="flex h-full flex-col overflow-hidden border-r border-border bg-card">
                    <div className="flex flex-shrink-0 items-center justify-between border-b border-border bg-primary/10 p-2 shadow-sm">
                      <div className="flex items-center">
                        <MessageSquare className="mr-1.5 h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">
                          Chat
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-foreground/70">
                          Stream
                        </span>
                        <Switch
                          checked={useStreamEndpoint}
                          onCheckedChange={setUseStreamEndpoint}
                          className="data-[state=checked]:bg-primary"
                        />
                        <Zap
                          className={`h-3.5 w-3.5 ${useStreamEndpoint ? "text-primary" : "text-foreground/40"}`}
                        />
                      </div>
                    </div>

                    {/* Chat messages area - make it flex-grow to fill available space */}
                    <div className="flex-grow overflow-y-auto p-2">
                      {messages.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                          <MessageSquare className="mb-2 h-10 w-10 text-primary/60 opacity-50" />
                          <p className="text-center text-sm text-foreground/90">
                            Start chatting with the agent.
                          </p>
                          <p className="text-center text-xs text-foreground/80">
                            Make changes to the JSON and test.
                          </p>
                        </div>
                      ) : (
                        messages.map((message, index) => (
                          <div
                            key={index}
                            className={`mb-3 ${message.role === "user" ? "text-right" : "text-left"}`}
                          >
                            <div
                              className={`inline-block max-w-[90%] rounded-lg p-2 text-sm shadow-sm ${
                                message.role === "user"
                                  ? "prose-invert bg-primary text-primary-foreground"
                                  : message.role === "loading"
                                    ? "animate-pulse bg-muted"
                                    : "prose-sm bg-accent/30 text-foreground"
                              }`}
                            >
                              {message.role === "loading" ? (
                                message.content
                              ) : (
                                <div
                                  className={`prose prose-sm max-w-none ${message.role === "user" ? "prose-invert" : ""}`}
                                >
                                  <ReactMarkdown
                                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                                    components={{
                                      // Override to handle newlines properly
                                      p: ({ node, ...props }) => (
                                        <div
                                          {...props}
                                          style={{ marginBottom: "0.75em" }}
                                        />
                                      ),
                                      // Better styling for headings
                                      h1: ({ node, ...props }) => (
                                        <h1
                                          {...props}
                                          style={{
                                            fontSize: "1.5em",
                                            marginTop: "0.5em",
                                            marginBottom: "0.5em",
                                          }}
                                        />
                                      ),
                                      h2: ({ node, ...props }) => (
                                        <h2
                                          {...props}
                                          style={{
                                            fontSize: "1.3em",
                                            marginTop: "0.5em",
                                            marginBottom: "0.5em",
                                          }}
                                        />
                                      ),
                                      h3: ({ node, ...props }) => (
                                        <h3
                                          {...props}
                                          style={{
                                            fontSize: "1.1em",
                                            marginTop: "0.5em",
                                            marginBottom: "0.5em",
                                          }}
                                        />
                                      ),
                                      // Better code block styling
                                      code: ({
                                        node,
                                        className,
                                        ...props
                                      }: any) => {
                                        const match = /language-(\w+)/.exec(
                                          className || "",
                                        );
                                        const isInline =
                                          !match &&
                                          !className?.includes("block");
                                        return isInline ? (
                                          <code
                                            {...props}
                                            className={className}
                                            style={{
                                              backgroundColor:
                                                "rgba(0,0,0,0.1)",
                                              padding: "2px 4px",
                                              borderRadius: "3px",
                                            }}
                                          />
                                        ) : (
                                          <code
                                            {...props}
                                            className={className}
                                            style={{
                                              display: "block",
                                              backgroundColor:
                                                "rgba(0,0,0,0.1)",
                                              padding: "8px",
                                              borderRadius: "4px",
                                              overflowX: "auto",
                                            }}
                                          />
                                        );
                                      },
                                    }}
                                  >
                                    {cleanMarkdown(message.content)}
                                  </ReactMarkdown>
                                </div>
                              )}
                              {/* Add blinking cursor at the end of the last message when streaming */}
                              {isStreaming &&
                                index === messages.length - 1 &&
                                message.role === "assistant" && (
                                  <span
                                    className="ml-0.5 inline-block h-4 w-2 animate-pulse bg-primary"
                                    style={{ animationDuration: "0.8s" }}
                                  ></span>
                                )}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} className="h-2" />
                    </div>

                    {/* Input area - make it flex-shrink-0 to prevent it from being compressed */}
                    <div className="flex-shrink-0 border-t border-border bg-card p-2">
                      <form
                        className="flex items-center gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          sendMessage();
                        }}
                      >
                        <input
                          type="text"
                          value={inputMessage}
                          onChange={(e) => setInputMessage(e.target.value)}
                          placeholder="Type a message to the agent..."
                          className="h-9 flex-1 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary/50 focus:outline-none focus:ring-1 focus:ring-primary/30"
                        />
                        <Button
                          type="submit"
                          disabled={isLoading || !inputMessage.trim()}
                          className="h-9 w-9 flex-shrink-0 rounded-md bg-primary p-0 hover:bg-primary/80"
                          size="sm"
                        >
                          {isLoading ? (
                            <div className="mx-auto h-4 w-4 animate-spin">
                              ⌛
                            </div>
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </form>
                    </div>

                    {/* Second draggable divider - positioned at right edge of second column */}
                    <div
                      className="absolute right-0 top-0 h-full w-3 cursor-col-resize bg-transparent hover:bg-primary hover:opacity-50"
                      onMouseDown={(e) => {
                        e.preventDefault();

                        const initialX = e.clientX;
                        const initialGrid = panelSizes.slice();
                        const gridContainer =
                          e.currentTarget.parentElement?.parentElement;
                        const containerWidth =
                          gridContainer?.getBoundingClientRect().width || 1000;

                        function handleMouseMove(moveEvent: MouseEvent) {
                          const dx = moveEvent.clientX - initialX;
                          const percentDelta = (dx / containerWidth) * 100;

                          // Calculate new sizes ensuring minimums
                          const newSecondSize = Math.max(
                            20,
                            Math.min(60, initialGrid[1] + percentDelta),
                          );
                          const sizeDiff = newSecondSize - initialGrid[1];
                          const newThirdSize = Math.max(
                            20,
                            initialGrid[2] - sizeDiff,
                          );

                          // Update only if changes are valid
                          if (newSecondSize >= 20 && newThirdSize >= 20) {
                            setPanelSizes([
                              initialGrid[0],
                              newSecondSize,
                              newThirdSize,
                            ]);
                          }
                        }

                        function handleMouseUp() {
                          document.removeEventListener(
                            "mousemove",
                            handleMouseMove,
                          );
                          document.removeEventListener(
                            "mouseup",
                            handleMouseUp,
                          );
                        }

                        document.addEventListener("mousemove", handleMouseMove);
                        document.addEventListener("mouseup", handleMouseUp);
                      }}
                    />
                  </div>

                  {/* Activities Panel (Right Panel) */}
                  <div className="h-full overflow-hidden bg-card">
                    <div className="flex items-center border-b border-border bg-primary/10 p-2 shadow-sm">
                      <Activity className="mr-1.5 h-4 w-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Activities
                      </span>
                    </div>
                    <div className="h-[calc(100%-32px)] overflow-auto">
                      <ActivityLog
                        messages={activityMessages}
                        setMessages={setActivityMessages}
                        isProcessing={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent
              value="terminal"
              className="mt-0 flex-1 overflow-hidden p-0 pt-0"
            >
              <div className="h-full overflow-y-auto bg-black p-4 font-mono text-sm text-green-400">
                {terminalOutput.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
                <div className="mt-2 flex items-center">
                  <span className="mr-2">$</span>
                  <input
                    type="text"
                    className="flex-1 bg-transparent focus:outline-none"
                    placeholder="Type command here..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const input = e.currentTarget.value;
                        setTerminalOutput((prev) => [
                          ...prev,
                          `$ ${input}`,
                          "> Command executed",
                        ]);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between border-t border-border bg-muted px-3 py-1 text-xs">
            <div>{getCurrentFile()?.language || "text"}</div>
            <div>
              {getCurrentFile()?.content?.split("\n").length || 0} lines
            </div>
          </div>
        </>
      ) : (
        <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
          <FileCode className="mb-2 h-10 w-10" />
          <p>Select a file from the explorer to edit</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedCodeEditor;
