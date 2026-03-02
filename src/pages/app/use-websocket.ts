import { useState } from "react";

import { AgentData, ChatEvent } from "@/types/chat";
import { cleanEventText } from "@/lib/utils";
import { WEBSOCKET_URL } from "@/lib/constants";

export const useWebSocket = (
  agent: Partial<AgentData>,
  apiKey: string,
  onEvent: (event: ChatEvent) => void,
) => {
  const [websocket, setWebsocket] = useState<WebSocket | null>(null);

  const cleanResponse = (response: string) => {
    try {
      const parsed = JSON.parse(response);
      if (parsed.response && typeof parsed.response === "string") {
        return parsed.response;
      }
      return response;
    } catch {
      return response;
    }
  };

  const connectWebSocket = (sessionId: string) => {
    if (websocket) {
      console.log("WebSocket closing for session:", sessionId);
      websocket.close();
    }

    const wsUrl = `${WEBSOCKET_URL}/ws/${sessionId}?x-api-key=${apiKey}`;

    try {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected for session:", sessionId);
        console.log("Using agent:", agent?.name);
        onEvent({
          id: Math.random().toString(36).substring(7),
          type: "websocket_connected",
          message: "Activity will appear here",
          timestamp: new Date(),
        });
      };

      ws.onmessage = (event) => {
        try {
          // Skip error messages from backend
          if (
            event.data.includes("[ERROR]") &&
            event.data.includes("cannot access local variable")
          ) {
            // console.debug("Suppressed backend error:", event.data);
            return; // Silently ignore this backend error
          }

          const eventData = JSON.parse(event.data);

          // Check for thinking field FIRST, regardless of event type
          if (eventData.thinking) {
            // Dispatch thinking event to window
            const thinkingEvent = new CustomEvent("thinking_event", {
              detail: {
                context_type: eventData.context_type || eventData.event_type,
                thinking: eventData.thinking,
                iteration: eventData.iteration || null,
                tool_name:
                  eventData.tool_name ||
                  eventData.agent_name ||
                  eventData.arguments?.name ||
                  null,
                timestamp: eventData.timestamp || Date.now(),
              },
            });
            window.dispatchEvent(thinkingEvent);
          }

          const handleEvent = (
            type: string,
            message: string,
            isAutoDelete: boolean = false,
            agentName?: string,
          ) => {
            onEvent({
              id: Math.random().toString(36).substring(7),
              type,
              message: cleanEventText(message),
              timestamp: new Date(),
              isAutoDelete,
              isStreaming: isAutoDelete,
              isRemoving: false,
              agentName,
            });
          };

          switch (eventData.event_type) {
            case "context_memory_updated":
              handleEvent("context_memory_updated", "Memory Updated", true);
              break;
            case "human_intervention_requested":
              handleEvent(
                "human_intervention_requested",
                eventData.response || "Human intervention requested",
                true,
              );
              break;
            case "llm_response":
              handleEvent(
                "llm_response",
                eventData.response || "LLM response received",
                false,
              );
              break;
            case "tool_call_prepare": {
              const agentName = eventData.arguments?.name || "Tool";
              const message = eventData.arguments?.message || "Retrieving data";
              handleEvent(
                "tool_call_prepare",
                `${agent?.name} asked ${agentName}: ${message}`,
                false,
              );
              break;
            }
            case "tool_response": {
              const toolName = eventData.arguments?.name || "Tool";
              const cleanedResponse = cleanResponse(
                eventData.response || "Tool response received",
              );
              handleEvent("tool_response", cleanedResponse, false, toolName);
              break;
            }
            case "artifact_create_success": {
              // Dispatch artifact event to window for EventsPanel to capture
              const artifactEvent = new CustomEvent("artifact_event", {
                detail: eventData,
              });
              window.dispatchEvent(artifactEvent);
              // Also add to regular events for notification
              handleEvent(
                "artifact_created",
                `Artifact created: ${eventData.name || "Untitled"}`,
                false,
              );
              break;
            }
            default:
              console.log("Unmapped event type:", eventData.event_type);
          }
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
          console.error("Raw event data:", event.data);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        onEvent({
          id: Math.random().toString(36).substring(7),
          type: "websocket_error",
          message: "WebSocket connection error",
          timestamp: new Date(),
        });
      };

      // ws.onclose = () => {
      //   console.log("WebSocket disconnected");
      //   onEvent({
      //     id: Math.random().toString(36).substring(7),
      //     type: "websocket_disconnected",
      //     message: "Events stream disconnected",
      //     timestamp: new Date(),
      //   });
      // };

      setWebsocket(ws);
    } catch (error) {
      console.error("Failed to connect WebSocket:", error);
      onEvent({
        id: Math.random().toString(36).substring(7),
        type: "websocket_error",
        message: "Failed to connect to events stream",
        timestamp: new Date(),
      });
    }
  };

  return { websocket, connectWebSocket };
};
