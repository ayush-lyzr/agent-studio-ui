import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/contexts/AuthContext";
import mixpanel from "mixpanel-browser";
import { BASE_URL, MARKETPLACE_URL, isMixpanelActive, METRICS_WS_URL } from "@/lib/constants";
import { AgentConfig, AgentData } from "@/types/chat";

export const useAgent = (apiKey: string, initialAgentId?: string) => {
  const [currentAgent, setCurrentAgent] = useState<AgentConfig>({
    name: "Agent",
    agentId: initialAgentId ?? "",
    baseUrl: BASE_URL || "https://agent-prod.test.maia.prophet.com",
    apiKey,
    userId: "test",
    wsBaseUrl: METRICS_WS_URL,
  });

  const [agentData, setAgentData] = useState<AgentData | null>(null);
  const { getToken } = useAuth();
  const token = getToken();

  useEffect(() => {
    if (initialAgentId) {
      setCurrentAgent((prevAgent) => ({
        ...prevAgent,
        agentId: initialAgentId,
      }));
    }
  }, [initialAgentId]);

  useEffect(() => {
    const fetchAgentData = async () => {
      if (!currentAgent.agentId) return;

      try {
        console.log("Fetching agent data for ID:", currentAgent.agentId);

        const response = await axios.get<AgentData>(
          `/app/${currentAgent.agentId}`,
          {
            baseURL: MARKETPLACE_URL,
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        setAgentData(response.data);

        if (mixpanel?.hasOwnProperty("cookie") && isMixpanelActive) {
          mixpanel.track(`App page visited`, {
            app: response.data,
          });
        }

        setCurrentAgent((prevAgent) => ({
          ...prevAgent,
          name: response.data.name || "Avanade Agent",
          agentId: response.data.agent_id || prevAgent.agentId,
        }));
      } catch (error) {
        console.error("Error fetching agent data:", error);
      }
    };

    fetchAgentData();
  }, [currentAgent.agentId, token]);

  return {
    currentAgent,
    setCurrentAgent,
    agentData,
  };
};
