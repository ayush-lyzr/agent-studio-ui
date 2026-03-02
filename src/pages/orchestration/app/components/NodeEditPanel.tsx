import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Save, Send, WandSparkles, Maximize2, Settings, Info, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForm, FormProvider } from "react-hook-form";
import { Agent } from "../types/agent";
import { toast } from "sonner";
import { useAgentSocket } from "../hooks/useAgentSocket";
import { getAuthHeaders, getCurrentUserEmail } from "../services/apiClient";
import { useCredits } from "@/hooks/use-credits";
import { updateAgent } from "../services/agentService";
import axios from "axios";
import useStore from "@/lib/store";
import { BASE_URL, isDevEnv, nvidiaModelDisplayNames } from "@/lib/constants";
import { IProvider } from "@/lib/types";
import { useModel } from "@/pages/configure/models/model-service";
import { ConfigureMemory } from "@/pages/create-agent/components/configure-memory";
import { ConfigureRag } from "@/pages/create-agent/components/configure-rag";
import { cn, resolveModelDisplayName } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import MarkdownRenderer from "@/components/custom/markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NodeEditPanelProps {
  agent: Agent | null;
  onClose: () => void;
  onUpdate: (agentId: string, updates: Partial<Agent>) => void;
  isUpdating: boolean;
  onAgentGlow?: (agentId: string) => void;
  onAgentStopGlow?: (agentId: string) => void;
  onSocketEvent?: (event: any) => void;
  openedViaPlayButton?: boolean;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

const NodeEditPanel: React.FC<NodeEditPanelProps> = ({
  agent,
  onClose,
  onUpdate,
  isUpdating,
  onAgentGlow,
  onAgentStopGlow,
  onSocketEvent,
  openedViaPlayButton = false,
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    agent_role: "",
    agent_goal: "",
    agent_instructions: "",
    provider_id: "",
    model: "",
    temperature: 0.7,
    top_p: 0.9,
    llm_credential_id: "",
    examples: "",
    response_format: "text" as "text" | "json_object",
    features: [] as any[],
  });

  const { handleCredits } = useCredits();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState(
    openedViaPlayButton ? "chat" : "edit",
  );
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [isPromptImproved, setIsPromptImproved] = useState(false);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(false);
  const [isUpdatingAgent, setIsUpdatingAgent] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(false);
  const [knowledgeBaseEnabled, setKnowledgeBaseEnabled] = useState(false);
  const [providers, setProviders] = useState<IProvider[]>([]);
  const [models, setModels] = useState<{ [key: string]: any }>({});
  const [bedrockCredentials, setBedrockCredentials] = useState<any[]>([]);
  const [huggingfaceCredentials, setHuggingfaceCredentials] = useState<any[]>([]);
  const [nvidiaCredentials, setNvidiaCredentials] = useState<any[]>([]);

  // Form for features components that require form context
  const featuresForm = useForm({
    defaultValues: {
      features: formData.features || [],
    },
  });

  const apiKey = useStore((state) => state.api_key);
  const { getLyzrProviders, isFetchingLyzrProviders } = useModel({ apiKey });

  const providerLabelMap: { [key: string]: string } = {
    nvidia: "Nvidia",
    huggingface: "Hugging Face",
    watsonx: "IBM Watson X",
    cohere: "Cohere",
  };

  const sessionIdRef = useRef<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const handleProviderChange = useCallback(
    async (value: string) => {
      console.log("handleProviderChange called with:", value);

      if (value) {
        // Parse provider ID and credential name
        const baseProviderId = value.split(" [")[0];
        const credentialName = value.match(/\[(.*?)\]/)?.[1] || "";

        // Always reset model when changing provider
        setFormData(prev => ({ ...prev, model: "" }));

        // Define a mapping of provider IDs to their credential arrays
        const credentialsMap: Record<string, any[]> = {
          "aws-bedrock": bedrockCredentials,
          huggingface: huggingfaceCredentials,
          nvidia: nvidiaCredentials,
        };

        // Find credential and set credential ID
        const lowerProviderId = baseProviderId.toLowerCase();
        const credentialArray = credentialsMap[lowerProviderId];
        const credential = credentialArray?.find(
          (cred) => (cred?.name ?? "Default") === credentialName,
        );
        const region_name = credential?.credentials?.aws_region_name
          ? credential?.credentials?.aws_region_name?.startsWith("us")
            ? "us"
            : "eu"
          : "us";

        if (credentialArray?.length) {
          if (credential) {
            setFormData(prev => ({ ...prev, llm_credential_id: credential.credential_id }));
          } else {
            setFormData(prev => ({ ...prev, llm_credential_id: `lyzr_${lowerProviderId}` }));
          }
        } else {
          setFormData(prev => ({ ...prev, llm_credential_id: `lyzr_${lowerProviderId}` }));
        }

        // Set the provider ID
        setFormData(prev => ({ ...prev, provider_id: value }));

        // Update models for the selected provider
        try {
          const modelsList = Array.isArray(models[lowerProviderId])
            ? models[lowerProviderId]
            : models[lowerProviderId]?.[region_name];

          if (modelsList?.length > 0) {
            setModels((prevModels) => ({
              ...prevModels,
              [baseProviderId]: modelsList,
              ...(credentialArray ? { [baseProviderId]: modelsList } : {}),
            }));
          }
        } catch (error) {
          console.error("Error updating models for provider:", error);
          toast.error("Failed to load models for the selected provider");
        }
      }
    },
    [bedrockCredentials, huggingfaceCredentials, nvidiaCredentials, models],
  );

  const updateFeatures = (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: any,
  ) => {
    const currentFeatures = formData.features || [];
    const existingFeatureIndex = currentFeatures.findIndex(
      (feature: any) => feature.type === name,
    );

    if (enabled) {
      const newFeature = {
        type: name,
        enabled: true,
        priority: 1,
        config: config || {},
      };

      if (ragId) {
        newFeature.config.rag_id = ragId;
      }
      if (ragName) {
        newFeature.config.rag_name = ragName;
      }

      if (existingFeatureIndex >= 0) {
        currentFeatures[existingFeatureIndex] = newFeature;
      } else {
        currentFeatures.push(newFeature);
      }
    } else {
      if (existingFeatureIndex >= 0) {
        currentFeatures.splice(existingFeatureIndex, 1);
      }
    }

    setFormData(prev => ({ ...prev, features: currentFeatures }));

    // Update features form
    featuresForm.setValue("features", currentFeatures);

    // Update local state
    if (name === "MEMORY") {
      setMemoryEnabled(enabled);
    } else if (name === "KNOWLEDGE_BASE") {
      setKnowledgeBaseEnabled(enabled);
    }
  };

  const improvePrompt = async () => {
    setIsImprovingPrompt(true);
    setIsPromptImproved(false);
    try {
      const roleAndInstructions = `
        Agent Role : ${formData.agent_role}
        Agent Goal : ${formData.agent_goal}
        Agent Instructions : ${formData.agent_instructions}
      `;

      const response = await axios.post(
        `/v3/inference/chat/`,
        {
          user_id: "studio",
          agent_id: isDevEnv
            ? "6822ea3b8ee3fcec7d31c9c1"
            : "682d6c9dced2bfaff52a78e3",
          message: roleAndInstructions,
          session_id: isDevEnv
            ? "6822ea3b8ee3fcec7d31c9c1-ycsl1paihbe"
            : "682d6c9dced2bfaff52a78e3-9orjfopy1gg",
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

      const responseText = response.data.response;
      const roleMatch = responseText.match(/ROLE:(.*?)(?=INSTRUCTIONS:|$)/s);
      const instructionsMatch = responseText.match(/INSTRUCTIONS:(.*?)$/s);

      if (roleMatch && instructionsMatch) {
        setFormData(prev => ({
          ...prev,
          agent_role: roleMatch[1].trim(),
          agent_instructions: instructionsMatch[1].trim()
        }));
        setIsPromptImproved(true);
        toast.success("Prompt improved successfully!");
      } else {
        toast.error("Invalid response format from the improvement service.");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("There was an issue improving the prompt. Please try again.");
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  const getSessionId = () => {
    if (!agent) return null;
    if (!sessionIdRef.current) {
      sessionIdRef.current = `${agent._id}-${Date.now()}`;
    }
    return sessionIdRef.current;
  };

  const { isConnected, error } = useAgentSocket({
    agentId: activeTab === "chat" ? agent?._id || null : null,
    sessionId: activeTab === "chat" ? getSessionId() : null,
    onToolCalled: (agentId: string) => {
      console.log("Agent tool called:", agentId);
      onAgentGlow?.(agentId);
    },
    onToolResponse: (agentId: string) => {
      console.log("Agent tool response:", agentId);
      onAgentStopGlow?.(agentId);
    },
    onSocketEvent: onSocketEvent,
  });

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  useEffect(() => {
    if (agent) {
      setFormData({
        name: agent.name || "",
        description: agent.description || "",
        agent_role: agent.agent_role || "",
        agent_goal: agent.agent_goal || "",
        agent_instructions: agent.agent_instructions || "",
        provider_id: agent.provider_id || "",
        model: agent.model || "",
        temperature: agent.temperature || 0.7,
        top_p: agent.top_p || 0.9,
        llm_credential_id: agent.llm_credential_id || "",
        examples: agent.examples || "",
        response_format: (agent.response_format?.type as "text" | "json_object") || "text",
        features: agent.features || [],
      });

      // Set feature states based on agent data
      const hasMemory = agent.features?.some((f: any) => f.type === "MEMORY");
      const hasKnowledgeBase = agent.features?.some((f: any) => f.type === "KNOWLEDGE_BASE");
      setMemoryEnabled(hasMemory || false);
      setKnowledgeBaseEnabled(hasKnowledgeBase || false);

      // Update features form with agent data
      featuresForm.reset({
        features: agent.features || [],
      });

      setChatMessages([]);
      setCurrentMessage("");
      sessionIdRef.current = null;
      setActiveTab(openedViaPlayButton ? "chat" : "edit");
    }
  }, [agent, openedViaPlayButton]);

  // Fetch providers and models data
  useEffect(() => {
    if (!apiKey) return;

    const fetchProvidersAndModels = async () => {
      try {
        const lyzrProvidersResponse = await getLyzrProviders();
        const lyzrProviders = lyzrProvidersResponse.data ?? [];

        setProviders(
          lyzrProviders.sort(
            (firstEl: IProvider, secondEl: IProvider) => firstEl.priority - secondEl.priority,
          ),
        );

        const modelsMap = lyzrProviders.reduce(
          (acc: Record<string, any>, provider: IProvider) => {
            const models = provider.meta_data.models;

            if (Array.isArray(models)) {
              const modelNames = models.map((model: any) => {
                if (Array.isArray(model)) {
                  return typeof model[0] === "string" ? model[0] : model[0][0];
                }
                return model;
              });
              acc[provider.provider_id?.toLowerCase()] = modelNames;
            }
            if (!Array.isArray(models)) {
              const modelNames = Object.entries(models).reduce(
                (acc: any, curr: any) => {
                  acc[curr[0]] = curr[1]?.map((model: string[]) =>
                    typeof model[0] === "string" ? model[0] : model[0][0],
                  );
                  return acc;
                },
                {},
              );
              acc[provider?.provider_id?.toLowerCase()] = modelNames;
            }

            return acc;
          },
          {},
        );
        setModels(() => ({ ...modelsMap }));
      } catch (error) {
        console.error("Error fetching providers:", error);
        toast.error("Unable to load providers. Please try again.");
      }
    };

    const fetchCredentials = async (
      providerKey: string,
      setCredentials: React.Dispatch<React.SetStateAction<any[]>>,
    ) => {
      try {
        const response = await axios.get(
          `/v3/providers/credentials/user/llm/${providerKey}`,
          {
            baseURL: BASE_URL,
            headers: {
              accept: "application/json",
              "x-api-key": apiKey,
            },
          },
        );

        if (response.data.credentials?.length > 0) {
          setCredentials(response.data.credentials);
        }
      } catch (error) {
        console.error(`Error fetching ${providerKey} credentials:`, error);
      }
    };

    const fetchAllData = async () => {
      await fetchProvidersAndModels();
      await Promise.all([
        fetchCredentials("aws-bedrock", setBedrockCredentials),
        fetchCredentials("huggingface", setHuggingfaceCredentials),
        fetchCredentials("nvidia", setNvidiaCredentials),
      ]);
    };

    fetchAllData();
  }, [apiKey, getLyzrProviders]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agent || !apiKey) {
      toast.error("Agent or API key not found");
      return;
    }

    setIsUpdatingAgent(true);

    try {
      console.log("Updating agent with data:", formData);

      // Prepare agent data with updated form values
      const agentData = {
        name: formData.name,
        description: formData.description || "",
        agent_role: formData.agent_role || "",
        agent_goal: formData.agent_goal || "",
        agent_instructions: formData.agent_instructions || "",
        features: formData.features || [],
        provider_id: formData.provider_id,
        model: formData.model,
        temperature: formData.temperature,
        top_p: formData.top_p,
        llm_credential_id: formData.llm_credential_id || "",
        examples: formData.examples || "",
        response_format: formData.response_format ? { type: formData.response_format } : { type: "text" },
        template_type: agent.template_type || "STANDARD",
        agent_context: agent.agent_context,
        agent_output: agent.agent_output,
        tool: agent.tool,
        tool_usage_description: agent.tool_usage_description,
        managed_agents: agent.managed_agents || [],
        version: agent.version,
      };

      console.log("Sending agent update to API:", agentData);

      const response = await updateAgent(agent._id, agentData);

      console.log("Agent updated successfully:", response);

      // Call parent callback to update the agent in the canvas
      const completeUpdate = {
        ...formData,
        template_type: agent.template_type,
        agent_context: agent.agent_context,
        agent_output: agent.agent_output,
        tool: agent.tool,
        tool_usage_description: agent.tool_usage_description,
        managed_agents: agent.managed_agents,
        version: agent.version,
        response_format: formData.response_format ? { type: formData.response_format } : { type: "text" },
      };

      onUpdate(agent._id, completeUpdate);

      toast.success(`Agent "${formData.name}" updated successfully`);

    } catch (error: any) {
      console.error("Failed to update agent:", error);

      const errorMessage = error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        "Failed to update agent. Please try again.";

      toast.error(errorMessage);
    } finally {
      setIsUpdatingAgent(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !agent || isSending) return;

    const userMessage: ChatMessage = {
      role: "user",
      content: currentMessage,
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    const messageToSend = currentMessage;
    setCurrentMessage("");
    setIsSending(true);

    const assistantMessage: ChatMessage = {
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };

    setChatMessages((prev) => [...prev, assistantMessage]);

    try {
      const sessionId = getSessionId();
      console.log("Sending message with session_id:", sessionId);

      const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:8001";
      const response = await fetch(`${baseUrl}/v3/inference/stream/`, {
        method: "POST",
        headers: {
          ...getAuthHeaders(),
          accept: "text/event-stream",
        },
        body: JSON.stringify({
          user_id: getCurrentUserEmail() || "user@example.com",
          agent_id: agent._id,
          session_id: sessionId,
          message: messageToSend,
          assets: [],
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) {
        throw new Error("No response body reader available");
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              setIsSending(false);
              return;
            }

            if (data.startsWith("[ERROR]")) {
              console.error(data);
              throw new Error(data);
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

            setChatMessages((prev) => {
              const messages = [...prev];
              const lastMessage = messages[messages.length - 1];
              if (lastMessage && lastMessage.role === "assistant") {
                lastMessage.content = buffer;
              }
              return messages;
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message to agent");

      setChatMessages((prev) => {
        const messages = [...prev];
        const lastMessage = messages[messages.length - 1];
        if (
          lastMessage &&
          lastMessage.role === "assistant" &&
          !lastMessage.content
        ) {
          lastMessage.content =
            "Sorry, I encountered an error. Please try again.";
        }
        return messages;
      });
    } finally {
      setIsSending(false);
      setTimeout(handleCredits, 3 * 1000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const parseMessageContent = (content: string) => {
    let processedContent = content
      .replace(/<strong>(.*?)<\/strong>/g, "**$1**")
      .replace(/<em>(.*?)<\/em>/g, "*$1*")
      .replace(/<br\s*\/?>/g, "\n")
      .replace(/<\/p>/g, "\n\n")
      .replace(/<p>/g, "");

    const sections = processedContent.split(/(?=\n[A-Z][a-z]+ Details?\n)/);

    return sections.map((section, index) => {
      if (section.includes("Details")) {
        const [title, ...content] = section.split("\n");
        return (
          <div
            key={index}
            className="mb-4 rounded-lg border border-border bg-secondary p-3"
          >
            <h4 className="mb-2 text-sm font-semibold text-blue-500 dark:text-blue-400">
              {title.trim()}
            </h4>
            <div className="space-y-1">
              {content
                .filter((line) => line.trim())
                .map((line, lineIndex) => {
                  if (line.includes("**") && line.includes(":")) {
                    const [label, value] = line.split(":");
                    return (
                      <div key={lineIndex} className="flex flex-col">
                        <span className="text-xs font-medium text-muted-foreground">
                          {label.replace(/\*\*/g, "").trim()}
                        </span>
                        <span className="ml-2 text-xs text-foreground">
                          {value?.trim() || ""}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={lineIndex}
                      className="text-xs text-muted-foreground"
                    >
                      {line.trim()}
                    </div>
                  );
                })}
            </div>
          </div>
        );
      }

      return (
        <div key={index} className="mb-3">
          <MarkdownRenderer content={section.trim()} />
          {/* <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p className="mb-2 text-xs last:mb-0">{children}</p>
              ),
              strong: ({ children }) => (
                <strong className="font-semibold text-foreground">
                  {children}
                </strong>
              ),
              em: ({ children }) => (
                <em className="italic text-muted-foreground">{children}</em>
              ),
            }}
          >
            {section.trim()}
          </ReactMarkdown> */}
        </div>
      );
    });
  };

  const getModelsList = (): string[] => {
    const baseProviderId = formData.provider_id.split(" [")[0]?.toLowerCase();
    const modelsList = models[baseProviderId];

    if (Array.isArray(modelsList)) {
      return modelsList;
    } else if (baseProviderId === "aws-bedrock" && typeof models === "object") {
      const currentCredential = bedrockCredentials.find(
        (cred) => cred?.credential_id === formData.llm_credential_id,
      );

      const aws_region_name = currentCredential?.credentials?.aws_region_name
        ? currentCredential?.credentials?.aws_region_name?.startsWith("us")
          ? "us"
          : "eu"
        : "us";
      return modelsList?.[aws_region_name] ?? [];
    }

    return [];
  };

  const allProviders = [
    ...providers.slice(0, 2),
    ...bedrockCredentials,
    ...providers.slice(2, providers.length),
    ...nvidiaCredentials,
    ...huggingfaceCredentials,
  ];

  if (!agent) return null;

  return (
    <div className="absolute right-0 top-0 z-[70] flex h-full w-96 flex-col overflow-hidden border-l border-border bg-card shadow-xl">
      <div className="flex flex-shrink-0 items-center justify-between border-b border-border p-3">
        <h2 className="text-lg font-semibold text-foreground">Agent Panel</h2>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to={`/agent-create/${agent._id}`}
                target="_blank"
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="left" sideOffset={5} className="z-[100]">
              View Agent
            </TooltipContent>
          </Tooltip>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-shrink-0 border-b border-border p-3">
        <h3 className="mb-1 truncate text-sm font-medium text-foreground">
          {agent.name}
        </h3>
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {agent.description || "No description available"}
        </p>
        {activeTab === "chat" && (
          <div className="mt-2 flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected ? "Connected" : "Disconnected"}
            </span>
            {error && (
              <span className="text-xs text-red-500 dark:text-red-400">
                ({error})
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex min-h-0 flex-1 flex-col"
        >
          <TabsList className="mx-3 mb-2 mt-2 grid h-8 w-full flex-shrink-0 grid-cols-2 bg-secondary">
            <TabsTrigger
              value="edit"
              className="h-6 px-2 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground"
            >
              Edit
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              className="h-6 px-2 text-xs text-muted-foreground data-[state=active]:bg-accent data-[state=active]:text-foreground"
            >
              Chat
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="edit"
            className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-3">
                {/* Basic Info */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="name" className="text-sm text-foreground">
                      Agent Name
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      placeholder="Enter agent name..."
                      className="h-8 border-border bg-secondary text-sm text-foreground placeholder-gray-400"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label
                      htmlFor="description"
                      className="text-sm text-foreground"
                    >
                      Description
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      placeholder="Enter agent description..."
                      className="h-8 border-border bg-secondary text-sm text-foreground placeholder-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="agent_role"
                    className="text-sm text-foreground"
                  >
                    Agent Role
                  </Label>
                  <Input
                    id="agent_role"
                    value={formData.agent_role}
                    onChange={(e) =>
                      setFormData({ ...formData, agent_role: e.target.value })
                    }
                    placeholder="Enter agent role..."
                    className="h-8 border-border bg-secondary text-sm text-foreground placeholder-gray-400"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="agent_goal"
                    className="text-sm text-foreground"
                  >
                    Agent Goal
                  </Label>
                  <Textarea
                    id="agent_goal"
                    value={formData.agent_goal}
                    onChange={(e) =>
                      setFormData({ ...formData, agent_goal: e.target.value })
                    }
                    placeholder="Enter agent goal..."
                    rows={2}
                    className="resize-none border-border bg-secondary text-sm text-foreground placeholder-gray-400"
                  />
                </div>

                <div className="space-y-1">
                  <Label
                    htmlFor="agent_instructions"
                    className="text-sm text-foreground"
                  >
                    Agent Instructions
                  </Label>
                  <div className="relative">
                    <Textarea
                      id="agent_instructions"
                      value={formData.agent_instructions}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          agent_instructions: e.target.value,
                        })
                      }
                      placeholder="Enter agent instructions..."
                      rows={6}
                      className="resize-none border-border bg-secondary pr-12 text-sm text-foreground placeholder-gray-400"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => improvePrompt()}
                      disabled={
                        isImprovingPrompt || !formData.agent_instructions.trim()
                      }
                      className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-blue-100 disabled:opacity-50"
                      title="Improve with AI"
                    >
                      <WandSparkles
                        className={`h-4 w-4 ${isPromptImproved ? "text-green-600" : "text-blue-600"} ${isImprovingPrompt ? "animate-spin" : ""}`}
                      />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsInstructionsExpanded(true)}
                      className="absolute bottom-2 right-2 h-6 w-6 p-0"
                      title="Expand"
                    >
                      <Maximize2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* LLM Configuration Section */}
                <div className="space-y-3 rounded-lg border border-border bg-card p-3">
                  <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Settings className="h-4 w-4" />
                    LLM Configuration
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-foreground">
                        Provider
                      </Label>
                      {isFetchingLyzrProviders ? (
                        <Skeleton className="h-8 w-full" />
                      ) : (
                        <Select
                          value={formData.provider_id}
                          onValueChange={handleProviderChange}
                        >
                          <SelectTrigger className="h-8 border-border bg-secondary text-xs">
                            <SelectValue placeholder="Select Provider" />
                          </SelectTrigger>
                          <SelectContent>
                            {allProviders.map((provider: IProvider) => {
                              const providerId = provider.provider_id.replace(
                                /(^|-)([a-z])/g,
                                (_: any, separator: any, letter: any) =>
                                  separator + letter.toUpperCase(),
                              );
                              const isLyzrLlm = provider?.type === "lyzr-llm";
                              const isLlm = provider?.type === "llm";
                              const displayText = isLyzrLlm
                                ? provider.display_name
                                : `${
                                    providers.find(
                                      (p) =>
                                        p.provider_id.toLowerCase() ===
                                        provider.provider_id,
                                    )?.display_name ??
                                    providerLabelMap[provider?.provider_id]
                                  } [${provider?.credentials?.name || "Default"}]`;

                              const selectValue = isLlm
                                ? `${providerId} [${provider?.credentials?.name || "Default"}]`
                                : providerId;

                              return (
                                <SelectItem
                                  key={selectValue}
                                  value={selectValue}
                                  className="w-full text-xs"
                                >
                                  {displayText}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-foreground">Model</Label>
                      {isFetchingLyzrProviders ? (
                        <Skeleton className="h-8 w-full" />
                      ) : formData.provider_id
                          ?.toLowerCase()
                          .includes("huggingface") ? (
                        <Input
                          value={
                            formData.model?.replace("huggingface/", "") || ""
                          }
                          placeholder="Enter model name"
                          onChange={(e) => {
                            const value = e.target.value;
                            setFormData((prev) => ({
                              ...prev,
                              model: value ? `huggingface/${value}` : "",
                            }));
                          }}
                          className="h-8 border-border bg-secondary text-xs"
                        />
                      ) : (
                        <Select
                          value={formData.model}
                          onValueChange={(value) => {
                            if (value) {
                              setFormData((prev) => ({
                                ...prev,
                                model: value,
                              }));
                            }
                          }}
                          disabled={!formData.provider_id}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 border-border bg-secondary text-xs",
                              !formData.provider_id
                                ? "cursor-not-allowed opacity-50"
                                : "",
                            )}
                          >
                            <SelectValue
                              placeholder={
                                !formData.provider_id
                                  ? "Select Provider First"
                                  : "Select Model"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {getModelsList().map((value) => {
                              const baseProviderId = formData.provider_id?.split(" [")[0];
                              const selectedProvider = providers.find((p) =>
                                p.provider_id?.toLowerCase() === baseProviderId?.toLowerCase() && p.type === "lyzr-llm"
                              );
                              const displayName = resolveModelDisplayName(
                                value,
                                selectedProvider?.meta_data?.display_names,
                                nvidiaModelDisplayNames,
                              );
                              return (
                                <SelectItem
                                  key={value}
                                  value={value}
                                  className="text-xs"
                                >
                                  {displayName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-foreground">
                          Temperature
                        </Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.temperature}
                        </span>
                      </div>
                      <Slider
                        value={[formData.temperature]}
                        onValueChange={([value]) =>
                          setFormData((prev) => ({
                            ...prev,
                            temperature: value,
                          }))
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs text-foreground">Top P</Label>
                        <span className="text-xs text-muted-foreground">
                          {formData.top_p}
                        </span>
                      </div>
                      <Slider
                        value={[formData.top_p]}
                        onValueChange={([value]) =>
                          setFormData((prev) => ({ ...prev, top_p: value }))
                        }
                        min={0}
                        max={1}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Features Section */}
                <FormProvider {...featuresForm}>
                  <div className="space-y-3 rounded-lg border border-border bg-card p-3">
                    <h4 className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Info className="h-4 w-4" />
                      Features
                    </h4>

                    {/* Memory Feature */}
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">🧠</span>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            Memory
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Enable conversation memory for your agent
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={memoryEnabled}
                          onCheckedChange={(checked) => {
                            updateFeatures(
                              "MEMORY",
                              checked,
                              undefined,
                              undefined,
                              {
                                max_messages_context_count: 10,
                              },
                            );
                          }}
                        />
                        {memoryEnabled && (
                          <ConfigureMemory
                            updateFeatures={updateFeatures}
                            featureName="MEMORY"
                          />
                        )}
                      </div>
                    </div>

                    {/* Knowledge Base Feature */}
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">📚</span>
                        <div>
                          <p className="text-xs font-medium text-foreground">
                            Knowledge Base (RAG)
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Connect your agent to a knowledge base
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={knowledgeBaseEnabled}
                          onCheckedChange={(checked) => {
                            updateFeatures("KNOWLEDGE_BASE", checked);
                          }}
                        />
                        {knowledgeBaseEnabled && (
                          <ConfigureRag
                            updateFeatures={updateFeatures}
                            featureName="KNOWLEDGE_BASE"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </FormProvider>
              </div>

              <div className="flex-shrink-0 border-t border-border p-3">
                <Button
                  type="submit"
                  disabled={isUpdating || isUpdatingAgent}
                  className="h-8 w-full bg-blue-600 text-sm text-white hover:bg-blue-700"
                >
                  <Save className="mr-2 h-3 w-3" />
                  {isUpdating || isUpdatingAgent
                    ? "Updating..."
                    : "Update Agent"}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent
            value="chat"
            className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                ref={chatContainerRef}
                className="min-h-0 flex-1 overflow-y-auto p-3"
                style={{ scrollBehavior: "smooth" }}
              >
                {chatMessages.length === 0 ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <p className="text-sm">
                        Start a conversation with {agent.name}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={cn(
                            "rounded-3xl py-2",
                            message.role === "user"
                              ? "border border-secondary bg-sidebar-accent px-3 text-primary"
                              : "bg-transparent px-1 text-primary",
                          )}
                        >
                          {message.role === "assistant" ? (
                            <div className="text-sm leading-relaxed">
                              {parseMessageContent(message.content)}
                            </div>
                          ) : (
                            <div className="break-words text-sm leading-relaxed">
                              {/* <ReactMarkdown
                                components={{
                                  p: ({ children }) => (
                                    <p className="mb-1 last:mb-0">{children}</p>
                                  ),
                                }}
                              >
                                {message.content}
                              </ReactMarkdown> */}
                              <MarkdownRenderer content={message.content} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {isSending && (
                      <div className="flex justify-start">
                        <div className="rounded-lg bg-accent p-2.5 text-accent-foreground">
                          <p className="text-sm">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex-shrink-0 border-t border-border p-3">
                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="h-8 flex-1 border-border bg-secondary text-sm text-foreground placeholder-gray-400"
                    disabled={isSending}
                  />
                  <Button
                    onClick={sendMessage}
                    size="icon"
                    disabled={!currentMessage.trim() || isSending}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Expanded Instructions Dialog */}
      <Dialog
        open={isInstructionsExpanded}
        onOpenChange={setIsInstructionsExpanded}
      >
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>Agent Instructions</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Textarea
                value={formData.agent_instructions}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    agent_instructions: e.target.value,
                  })
                }
                placeholder="Enter detailed agent instructions..."
                rows={20}
                className="resize-none border-border bg-secondary pr-12 text-sm text-foreground placeholder-gray-400"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => improvePrompt()}
                disabled={
                  isImprovingPrompt || !formData.agent_instructions.trim()
                }
                className="absolute right-2 top-2 h-8 w-8 p-0 hover:bg-blue-100 disabled:opacity-50"
                title="Improve with AI"
              >
                <WandSparkles
                  className={`h-4 w-4 ${isPromptImproved ? "text-green-600" : "text-blue-600"} ${isImprovingPrompt ? "animate-spin" : ""}`}
                />
              </Button>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsInstructionsExpanded(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NodeEditPanel;
