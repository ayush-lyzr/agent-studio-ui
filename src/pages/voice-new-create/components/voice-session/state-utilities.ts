import type { AgentState } from "@livekit/components-react";

export type AgentStateMeta = {
  label: string;
  description: string;
  dotClass: string;
  badgeClass: string;
};

export function getAgentStateMeta(
  state: AgentState,
  hasAgent: boolean,
): AgentStateMeta {
  const waitingDescription = hasAgent
    ? "Preparing the agent audio stream."
    : "Waiting for the agent to join.";

  const defaultMeta: AgentStateMeta = {
    label: "Connecting",
    description: waitingDescription,
    dotClass: "bg-yellow-500 animate-pulse",
    badgeClass:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
  };

  switch (state) {
    case "listening": {
      return {
        label: "Listening",
        description: "Agent is ready for your input.",
        dotClass: "bg-emerald-500 animate-pulse",
        badgeClass:
          "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
      };
    }
    case "thinking": {
      return {
        label: "Thinking",
        description: "Agent is formulating a response.",
        dotClass: "bg-amber-500 animate-pulse",
        badgeClass:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200 animate-pulse",
      };
    }
    case "speaking": {
      return {
        label: "Speaking",
        description: "Agent is responding now.",
        dotClass: "bg-indigo-500 animate-pulse",
        badgeClass:
          "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
      };
    }
    case "idle": {
      return {
        label: "Idle",
        description: "Agent is connected and standing by.",
        dotClass: "bg-blue-500",
        badgeClass:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200",
      };
    }
    case "pre-connect-buffering":
    case "initializing": {
      return {
        label: "Initializing",
        description: "Agent is spinning up services.",
        dotClass: "bg-yellow-500 animate-pulse",
        badgeClass:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200",
      };
    }
    case "failed": {
      return {
        label: "Connection issue",
        description: "Agent failed to connect—please try again.",
        dotClass: "bg-red-500 animate-pulse",
        badgeClass:
          "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200",
      };
    }
    case "disconnected": {
      return {
        label: "Disconnected",
        description: "Agent left the room. Reconnect to continue.",
        dotClass: "bg-gray-400",
        badgeClass:
          "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-100",
      };
    }
    default: {
      return defaultMeta;
    }
  }
}
