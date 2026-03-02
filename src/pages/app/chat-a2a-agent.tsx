import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { FileAttachment } from "@/types/chat";
import { IAgent } from "@/lib/types";
import { ChatInput } from "@/components/custom/chat-input";
import { ChatMessage } from "../pub-app";
import useStore from "@/lib/store";
import { useChatStore } from "./chat.store";
import { useA2AChat } from "./a2a.chat";
import { Message } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { PageTitle } from "@/components/ui/page-title";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";

export default function StandaloneChatPage() {
  const params = useParams();
  const location = useLocation();
  const appId = params?.app_id ?? "";
  const initialAgent = (location.state as { agent?: IAgent })?.agent;
  const navigate = useNavigate();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState<string>("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const apiKey = useStore((state) => state.api_key);
  const { agent, setAgent } = useChatStore((state) => state);
  const { chatA2AAgent, isChattingA2AAgent } = useA2AChat({ apiKey });

  const handleNewChat = async () => {
    if (!appId || !query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      created_at: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");

    try {
      const res = await chatA2AAgent({
        agent_id: agent?.agent_id ?? initialAgent?._id ?? "",
        message: currentQuery,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res?.data?.result?.message?.content || "No response",
        created_at: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error chatting with A2A agent:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        created_at: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSend = async () => {
    if (!appId || !query.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
      created_at: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentQuery = query;
    setQuery("");

    try {
      const res = await chatA2AAgent({
        agent_id: agent?.agent_id ?? initialAgent?._id ?? "",
        message: currentQuery,
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: res?.data?.result?.message?.content || "No response",
        created_at: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error chatting with A2A agent:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        created_at: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  useEffect(() => {
    if (initialAgent) {
      setAgent(initialAgent);
    }
  }, [initialAgent, setAgent]);

  useEffect(() => {
    if (messages && messages?.length > 0) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }, [messages?.length]);

  const hasMessages = messages.length > 0;
  const agentName = agent?.name || initialAgent?.name || "Agent";

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden">
      {!hasMessages ? (
        <div className="flex h-full w-full items-center justify-center">
          <div className="w-full max-w-2xl px-4">
            <Button
              variant="link"
              className="p-0 text-muted-foreground"
              onClick={() => navigate(-1)}
            >
              <ChevronLeft className="mr-2 cursor-pointer" size={20} />
              Back
            </Button>
            <h1 className="mb-2 text-3xl font-semibold tracking-tight">
              Welcome to {agentName}
            </h1>
            <p className="mb-8 text-muted-foreground">
              Start a conversation by asking a question below.
            </p>
            <ChatInput
              query={query}
              setQuery={setQuery}
              onSubmit={handleNewChat}
              attachments={attachments}
              setAttachments={setAttachments}
              loading={isChattingA2AAgent}
            />
          </div>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex h-full w-full flex-col px-8 py-4"
          >
            <div className="mb-2 flex items-center gap-2">
              <ArrowLeft
                onClick={() => navigate(-1)}
                className="mr-2 mt-1 cursor-pointer"
              />
              <PageTitle title={agentName} />
            </div>
            <Separator />
            <div className="flex flex-1 flex-col overflow-hidden">
              <div className="no-scrollbar flex-1 overflow-y-auto">
                <div className="mx-auto w-full max-w-3xl px-4 py-8">
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id}>
                        <ChatMessage message={message} />
                      </div>
                    ))}
                    {isChattingA2AAgent && (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-current" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </div>
              </div>
              <div className="border-t border-border bg-background">
                <div className="mx-auto w-full max-w-3xl px-4 py-4">
                  <ChatInput
                    query={query}
                    setQuery={setQuery}
                    attachments={attachments}
                    setAttachments={setAttachments}
                    onSubmit={handleSend}
                    loading={isChattingA2AAgent}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
