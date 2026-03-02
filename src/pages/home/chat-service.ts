import axios from "axios";
import { ChatMessage, Rag } from "./types";

const MIRA_API_URL = "https://mira.maia.prophet.com/v1";
// const MIRA_API_URL = "http://localhost:8100/v1";

export const getStoredItem = <T>(key: string, defaultValue: T): T => {
  const stored = localStorage.getItem(key);
  return stored ? JSON.parse(stored) : defaultValue;
};

export const handleChat = async (
  userMessage: ChatMessage,
  sessionId: string,
  apiKey: string,
  agentId?: string,
  selectedRag?: string,
  overrideSessionId?: string,
  selectedTool?: string,
): Promise<{
  mira_response: string;
  updated_agent_configuration?: any;
  knowledge_base_selection?: boolean;
  tool_selection?: boolean;
  agent_configuration_completed?: boolean;
  agent_id?: string;
}> => {
  try {
    const response = await axios.post(
      `${MIRA_API_URL}/chat/completion`,
      {
        query: userMessage.content,
        session_id: overrideSessionId || sessionId,
        api_key: apiKey,
        ...(agentId && { agent_id: agentId }),
        ...(selectedRag && { knowledge_base_id: selectedRag }),
        ...(selectedTool && { tool_id: selectedTool }),
      },
      {
        headers: {
          accept: "application/json",
          "Content-Type": "application/json",
        },
      },
    );

    return response.data;
  } catch (error) {
    console.error("Error in handleChat:", error);
    throw error;
  }
};

export const handleAudioTranscription = async (
  audioBlob: Blob,
): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.wav");

    const response = await axios.post(
      `${MIRA_API_URL}/chat/transcribe`,
      formData,
      {
        headers: {
          accept: "application/json",
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return response.data.text;
  } catch (error) {
    console.error("Error in handleAudioTranscription:", error);
    throw error;
  }
};

export const fetchRags = async (apiKey: string) => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_RAG_URL}/v3/rag/user/${apiKey}/`,
      { headers: { accept: "application/json", "x-api-key": apiKey } },
    );
    return (
      response.data.configs?.map((rag: any) => ({ ...rag, id: rag._id })) || []
    );
  } catch (err) {
    console.error("Failed to refresh RAGs", err);
    throw err;
  }
};

export const fetchTools = async (apiKey: string) => {
  try {
    const response = await axios.get<string[]>(
      `${import.meta.env.VITE_BASE_URL}/v3/tools/composio/user`,
      {
        headers: {
          accept: "application/json",
          "x-api-key": apiKey,
        },
      },
    );
    return response.data || [];
  } catch (error) {
    console.error("Error refreshing tools:", error);
    throw error;
  }
};

export const getQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    sessionId: params.get("sessionId") || "",
    agentId: params.get("agentId") || "",
  };
};

export const updateQueryParams = (sessionId: string, agentId: string) => {
  const params = new URLSearchParams(window.location.search);
  if (sessionId) params.set("sessionId", sessionId);
  else params.delete("sessionId");
  if (agentId) params.set("agentId", agentId);
  else params.delete("agentId");

  window.history.replaceState(
    {},
    "",
    params.toString() ? `?${params.toString()}` : window.location.pathname,
  );
};

export const saveToLocalStorage = (
  messages: ChatMessage[],
  sessionId: string,
  agentId: string,
  hasInitialQuery: boolean,
) => {
  localStorage.setItem("chatMessages", JSON.stringify(messages));
  localStorage.setItem("sessionId", sessionId);
  localStorage.setItem("agentId", agentId);
  localStorage.setItem("hasInitialQuery", JSON.stringify(hasInitialQuery));
};

export const clearLocalStorage = () => {
  localStorage.removeItem("chatMessages");
  localStorage.removeItem("sessionId");
  localStorage.removeItem("agentId");
  localStorage.removeItem("hasInitialQuery");
};

export const generateSessionId = () =>
  Math.random().toString(36).substring(2, 15);

export const handleRagChat = async (
  ragId: string,
  rags: Rag[],
  sessionId: string,
  apiKey: string,
  agentId: string,
) => {
  const selectedRagConfig = rags.find((rag) => rag.id === ragId);
  if (!selectedRagConfig) return null;

  const ragDetailsMessage: ChatMessage = {
    role: "user",
    content: `Selected rag_id is ${selectedRagConfig.id}, rag_name is ${selectedRagConfig.collection_name}.`,
  };

  return await handleChat(ragDetailsMessage, sessionId, apiKey, agentId, ragId);
};

export const handleToolSelection = async (
  toolId: string,
  sessionId: string,
  apiKey: string,
  agentId: string,
) => {
  const toolDetailsMessage: ChatMessage = {
    role: "user",
    content: `Selected tool is ${toolId}.`,
  };

  return await handleChat(
    toolDetailsMessage,
    sessionId,
    apiKey,
    agentId,
    undefined,
    undefined,
    toolId,
  );
};

export const formatFeatureName = (feature: string) => {
  return feature
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};
