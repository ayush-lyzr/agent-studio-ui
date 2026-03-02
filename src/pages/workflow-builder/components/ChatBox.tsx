import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, RotateCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { createAgent, CreateAgentParams } from "@/services/agentApiService";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import MarkdownRenderer from "@/components/custom/markdown";

interface ChatBoxProps {
  onAgentCreated: (agent: any) => void;
  onWorkflowGenerated: (workflowData: string) => void;
  openAiKey: string;
  onSetOpenAiKey: (key: string) => void;
}

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

const ChatBox: React.FC<ChatBoxProps> = ({
  onAgentCreated,
  onWorkflowGenerated,
  openAiKey,
  onSetOpenAiKey,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "system",
      content:
        "I am a workflow builder assistant. I can help you create agents and generate workflows. Start by telling me what kind of workflow you want to build.",
    },
  ]);
  const [input, setInput] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [openAiKeyInput, setOpenAiKeyInput] = useState<string>(openAiKey || "");
  const [autoCreateAgents, setAutoCreateAgents] = useState<boolean>(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom of chat whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!input.trim() || isLoading) return;

    if (!openAiKey) {
      toast.error("Please enter your OpenAI API key first");
      return;
    }

    // Add user message to chat
    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Prepare conversation history for API call
      const history = [...messages, userMessage]
        .filter((msg) => msg.role !== "system")
        .map((msg) => ({ role: msg.role, content: msg.content }));

      // System prompt specifically designed for workflow and agent generation
      const systemPrompt = {
        role: "system" as const,
        content: `You are a workflow builder assistant for the Lyzr Agent Studio. 
        Your job is to help users create workflows by generating the necessary JSON and creating agents.
        
        When asked to create a workflow:
        1. First identify what agents are needed and create them using the required API format
        2. Then generate a complete workflow JSON structure that connects these agents
        
        For creating agents, output a JSON object with these fields (required by the API):
        {
          "name": "agent name",
          "description": "agent description",
          "agent_role": "agent role",
          "agent_instructions": "detailed instructions for the agent",
          "provider_id": "OpenAI",
          "model": "gpt-4o-mini",
          "temperature": 0.7,
          "top_p": 0.9,
          "llm_credential_id": "lyzr_openai",
          "response_format": {"type": "text"}
        }
        
        For workflow JSON, follow this structure:
        {
          "tasks": [
            {
              "name": "unique_task_id",
              "tag": "Human readable name",
              "function": "call_lyzr_agent",
              "params": {
                "config": {
                  "user_id": "user-id-placeholder",
                  "session_id": "session-id-placeholder",
                  "api_key": "api-key-placeholder",
                  "agent_id": "created-agent-id",
                  "api_url": "${import.meta.env.VITE_BASE_URL}/v3/inference/chat/",
                  "agent_name": "Agent name"
                },
                "dependencies": {}
              }
            }
          ],
          "default_inputs": {},
          "flow_name": "Workflow Name",
          "run_name": "Run 1",
          "edges": [
            {
              "source": "source-task-id",
              "target": "target-task-id",
              "condition": "condition-if-applicable"
            }
          ]
        }
        
        Always wrap your generated JSON in markdown code blocks with the language specified as json.
        When creating agents, prefix the code block with "AGENT_CREATION_JSON:".
        When creating workflows, prefix the code block with "WORKFLOW_JSON:".`,
      };

      // Call OpenAI API
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAiKey}`,
          },
          body: JSON.stringify({
            model: "gpt-4-turbo",
            messages: [systemPrompt, ...history],
            temperature: 0.7,
          }),
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || "Error calling OpenAI API");
      }

      const data = await response.json();
      const assistantMessage = data.choices[0].message.content;

      // Add assistant message to chat
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: assistantMessage },
      ]);

      // Extract workflow JSON if present
      const workflowJsonMatch = assistantMessage.match(
        /WORKFLOW_JSON:\s*```json\s*([\s\S]*?)\s*```/,
      );
      if (workflowJsonMatch && workflowJsonMatch[1]) {
        const workflowJson = workflowJsonMatch[1].trim();
        handleWorkflowGenerated(workflowJson);
      }

      // Extract and process agent creation JSONs if present and auto-create is enabled
      if (autoCreateAgents) {
        const agentJsonMatches = assistantMessage.match(
          /AGENT_CREATION_JSON:\s*```json\s*([\s\S]*?)\s*```/g,
        );
        if (agentJsonMatches) {
          for (const match of agentJsonMatches) {
            const agentJsonContent = match
              .replace(
                /AGENT_CREATION_JSON:\s*```json\s*([\s\S]*?)\s*```/,
                "$1",
              )
              .trim();
            try {
              const agentParams = JSON.parse(
                agentJsonContent,
              ) as CreateAgentParams;
              handleAgentCreation(agentParams);
            } catch (error) {
              console.error("Error parsing agent JSON:", error);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error in chat:", error);
      toast.error(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Sorry, there was an error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentCreation = async (agentParams: CreateAgentParams) => {
    try {
      // Add log to see the exact agent params being sent
      console.log(
        "Creating agent with params:",
        JSON.stringify(agentParams, null, 2),
      );

      const createdAgent = await createAgent(agentParams);
      onAgentCreated(createdAgent);

      // Log the created agent response
      console.log("Agent created successfully, response:", createdAgent);

      toast.success(
        `Agent "${agentParams.name}" created successfully with ID: ${createdAgent.id || "unknown"}`,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Agent "${agentParams.name}" created with ID: ${createdAgent.id || "unknown"}`,
        },
      ]);
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error(
        `Failed to create agent: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Failed to create agent: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    }
  };

  const handleWorkflowGenerated = (workflowJson: string) => {
    try {
      // Log the workflow JSON for debugging
      console.log("Generated workflow JSON:", workflowJson);

      // Validate the JSON
      const parsedJson = JSON.parse(workflowJson);
      console.log("Parsed workflow JSON:", parsedJson);

      // Call the parent handler
      onWorkflowGenerated(workflowJson);

      toast.success("Workflow JSON generated and loaded into UI!");
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content:
            "Workflow generated and loaded into the builder. You can now modify it in the UI.",
        },
      ]);
    } catch (error) {
      console.error("Error processing workflow JSON:", error);
      toast.error(
        `Invalid workflow JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "system",
          content: `Failed to process workflow JSON: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    }
  };

  const saveOpenAiKey = () => {
    onSetOpenAiKey(openAiKeyInput);
    toast.success("OpenAI API key saved");
  };

  const clearChat = () => {
    setMessages([
      {
        role: "system",
        content:
          "I am a workflow builder assistant. I can help you create agents and generate workflows. Start by telling me what kind of workflow you want to build.",
      },
    ]);
  };

  return (
    <>
      {/* Chat button */}
      {/* <div className="fixed bottom-4 right-4 z-[9999]">
        <Button
          className="h-12 w-12 rounded-full shadow-lg"
          onClick={() => setIsOpen(!isOpen)}
          variant="default"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
        </Button>
      </div> */}

      {/* Chat panel */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/20"
          onClick={() => setIsOpen(false)}
        >
          <Card
            className="fixed bottom-20 right-4 z-[9999] flex h-[600px] w-96 flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b p-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Workflow Assistant</h3>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={clearChat}
                  title="Clear chat"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setIsOpen(false)}
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* OpenAI Key Input */}
            <div className="border-b p-3">
              <div className="mb-2 flex items-center gap-2">
                <Input
                  type="password"
                  placeholder="Enter OpenAI API Key"
                  value={openAiKeyInput}
                  onChange={(e) => setOpenAiKeyInput(e.target.value)}
                  className="flex-1"
                />
                <Button size="sm" onClick={saveOpenAiKey}>
                  Save
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="auto-create"
                  checked={autoCreateAgents}
                  onCheckedChange={setAutoCreateAgents}
                />
                <Label htmlFor="auto-create">Auto-create agents</Label>
              </div>
            </div>

            {/* Chat messages */}
            <ScrollArea className="flex-1 p-3">
              <div className="space-y-4">
                {messages
                  .filter((msg) => msg.role !== "system")
                  .map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === "assistant"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {message.role === "assistant" ? (
                          <div className="prose prose-sm max-w-none">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        ) : (
                          <p>{message.content}</p>
                        )}
                      </div>
                    </div>
                  ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="border-t p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <Input
                  placeholder="Ask me to create a workflow..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading}
                  ref={inputRef}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isLoading || !input.trim()}
                >
                  {isLoading ? (
                    <span className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

export default ChatBox;
