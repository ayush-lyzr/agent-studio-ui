import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import mixpanel from "mixpanel-browser";
import { BASE_URL, isDevEnv, isMixpanelActive } from "@/lib/constants";
import MarkdownRenderer from "@/components/custom/markdown";
import axios from "axios";
import useStore from "@/lib/store";

interface AgentPrompt {
  agent_name?: string;
  agent_description?: string;
  agent_role?: string;
  agent_goal?: string;
  agent_instructions?: string;
}

interface Message {
  sender: "user" | "assistant";
  text: string;
  promptData?: AgentPrompt;
}

export function ConversationAgentDialog({
  isOpen,
  onClose,
  onAgentGenerated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAgentGenerated: (agent: {
    agent_name?: string;
    agent_description?: string;
    agent_role?: string;
    agent_goal?: string;
    agent_instructions?: string;
  }) => void;
}) {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: "assistant",
      text: "What kind of agent would you like to build? I can help you write the agent goal, role and instructions!",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>(
    "6888b55622df0ab09cfa2cab",
  );
  const bottomRef = useRef<HTMLDivElement>(null);
  const apiKey = useStore((state) => state.api_key);

  const scrollToBottom = () => {
    if (bottomRef.current) {
      bottomRef.current.scrollTo({
        top: bottomRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (!isOpen) return;
    scrollToBottom();
  }, [isOpen]);

  useEffect(() => {
    const newSessionId = generateSessionId();
    setSessionId(newSessionId);
  }, []);

  // Helper function to extract key values from invalid json string
  function extractKeyValuesWithRegex(jsonString: string): {
    success: boolean;
    data: any;
    error?: any;
  } {
    try {
      const parsed = JSON.parse(jsonString);
      return { success: true, data: parsed };
    } catch (e) {}

    try {
      let s = jsonString;

      // Remove outer quotes if the whole payload is a quoted string
      if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);

      // Handle line-continuation/backslashes & common oddities
      s = s
        // backslash + newline => newline
        .replace(/\\(\r?\n)/g, "$1")
        // standalone trailing backslashes at line end
        .replace(/\\$/gm, "")
        // backslash + whitespace + newline
        .replace(/\\(\s*\r?\n)/g, "$1")
        // fix accidental double-quotes at line ends / before brace
        .replace(/""\s*\n/g, '"\n')
        .replace(/""\s*$/gm, '"')
        .replace(/""\s*}/g, '"\n}')
        // unescape common sequences
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, "\\");

      const parsed = JSON.parse(s);
      return { success: true, data: parsed };
    } catch (e) {}

    try {
      let s = jsonString;

      if (s.startsWith('"') && s.endsWith('"')) s = s.slice(1, -1);
      s = s
        .replace(/\\(\r?\n)/g, "$1")
        .replace(/\\$/gm, "")
        .replace(/\\(\s*\r?\n)/g, "$1")
        .replace(/""\s*\n/g, '"\n')
        .replace(/""\s*$/gm, '"')
        .replace(/""\s*}/g, '"\n}');

      const result: Record<string, any> = {};

      const keyMatches = [...s.matchAll(/"([^"]+)"\s*:\s*"/g)];

      for (let i = 0; i < keyMatches.length; i++) {
        const current = keyMatches[i];
        const next = keyMatches[i + 1];
        const key = current[1];
        const valueStart = (current.index ?? 0) + current[0].length;

        let valueEnd: number;
        if (next) {
          valueEnd = (next.index ?? s.length) - 1;
          while (valueEnd > valueStart && /[\s,]/.test(s[valueEnd])) valueEnd--;
          if (s[valueEnd] !== '"') valueEnd++;
        } else {
          const lastBrace = s.lastIndexOf("}");
          valueEnd = s.lastIndexOf(
            '"',
            lastBrace === -1 ? s.length : lastBrace,
          );
        }

        let value = s.substring(valueStart, valueEnd);
        if (value.endsWith('"')) value = value.slice(0, -1);

        // Unescape typical sequences
        value = value
          .replace(/\\"/g, '"')
          .replace(/\\n/g, "\n")
          .replace(/\\r/g, "\r")
          .replace(/\\t/g, "\t")
          .replace(/\\\\/g, "\\");

        result[key] = value;
      }

      return { success: true, data: result };
    } catch (err) {
      return { success: false, data: {}, error: err };
    }
  }

  const generateSessionId = () => {
    return `6888b55622df0ab09cfa2cab-${Math.random().toString(36).substring(2, 15)}`;
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("User message send to new improver.");
    const userMessage: Message = { sender: "user", text: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery("");
    setLoading(true);

    try {
      const response = await axios.post(
        `/v3/inference/chat/`,
        {
          user_id: "studio",
          agent_id: isDevEnv
            ? "69393e93f1876c85246dee87"
            : "6888b55622df0ab09cfa2cab",
          message: userMessage.text,
          session_id: sessionId,
        },
        {
          baseURL: BASE_URL,
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        },
      );
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Generate with AI clicked");

      const parsedData = extractKeyValuesWithRegex(
        response.data?.response ?? "",
      );

      const promptData: AgentPrompt | undefined =
        parsedData?.data &&
        (parsedData.data.agent_role ||
          parsedData.data.agent_goal ||
          parsedData.data.agent_instructions ||
          parsedData.data.agent_name ||
          parsedData.data.agent_description)
          ? parsedData.data
          : undefined;

      const assistantMessage: Message = {
        sender: "assistant",
        text: response.data?.response || "",
        promptData,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const assistantMessage: Message = {
        sender: "assistant",
        text: "Something went wrong while contacting the agent.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[80vh] max-w-2xl flex-col">
        <DialogHeader>
          <DialogTitle>Prompt Builder</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="flex-1 space-y-4 overflow-y-auto px-1 py-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={cn(
                "flex flex-col gap-2",
                msg.sender === "user" ? "items-end" : "items-start",
              )}
            >
              <div
                className={cn(
                  "group inline-block max-w-[80%] rounded-2xl border px-3 py-2 text-sm",
                  msg.sender === "user"
                    ? "bg-secondary text-foreground"
                    : "bg-accent text-foreground",
                )}
              >
                {msg.sender === "assistant" ? (
                  <MarkdownRenderer content={msg.text} maxWidth="100%" />
                ) : (
                  msg.text
                )}
              </div>

              {msg.sender === "assistant" && msg.promptData && (
                <Button
                  variant="outline"
                  size="sm"
                  className="p-1"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("Use this prompt clicked");
                    // @ts-ignore
                    onAgentGenerated?.(msg.promptData);
                    onClose();
                  }}
                >
                  Use this prompt
                </Button>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="relative mt-2 w-full">
          <Textarea
            placeholder="Type your query here..."
            className="w-full resize-none rounded-lg border border-border bg-secondary p-3 pr-12 shadow-sm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="absolute bottom-10 right-10">
            <Button
              size="icon"
              className="absolute h-8 w-8 justify-center p-0"
              disabled={query.trim().length === 0 || loading}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
