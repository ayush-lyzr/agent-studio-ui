import { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import { IAgent } from "@/lib/types";
import useStore from "@/lib/store";

// Fetch agents from the agent-builder store
export const useAgents = () => {
  const apiKey = useStore((state) => state.api_key);
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { agents: storeAgents } = useStore();

  useEffect(() => {
    const getAgents = async () => {
      if (!apiKey) return;

      setIsLoading(true);
      setError(null);

      try {
        // Use the agents from the store or fetch them if needed
        if (storeAgents && storeAgents.length > 0) {
          setAgents(storeAgents);
        } else {
          // Fallback to empty array if no agents available
          setAgents([]);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err : new Error("Unknown error occurred"),
        );
      } finally {
        setIsLoading(false);
      }
    };

    getAgents();
  }, [apiKey, storeAgents]);

  // Generate random UUIDs for session and user - return direct values
  const getRandomIds = () => {
    return {
      user_id: uuidv4(),
      session_id: uuidv4(),
    };
  };

  return { agents, isLoading, error, getRandomIds };
};
