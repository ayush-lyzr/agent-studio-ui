
import { useEffect, useRef, useState, useCallback } from 'react';
import { getApiKey } from '../services/apiClient';
import { METRICS_WS_URL } from '@/lib/constants';

interface SocketEvent {
  timestamp: string;
  event_type: string;
  run_id: string;
  trace_id: string;
  log_id: string;
  tool_name?: string;
  tool_input?: string;
  arguments?: any;
  function_name?: string;
  response?: string;
}

interface UseAgentSocketProps {
  agentId: string | null;
  sessionId: string | null;
  onToolCalled: (agentId: string) => void;
  onToolResponse: (agentId: string) => void;
  onSocketEvent?: (event: SocketEvent) => void;
}

export const useAgentSocket = ({ agentId, sessionId, onToolCalled, onToolResponse, onSocketEvent }: UseAgentSocketProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const currentSessionRef = useRef<string | null>(null);
  const connectingRef = useRef<boolean>(false);

  const closeConnection = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
      setIsConnected(false);
      console.log('WebSocket connection closed');
    }
    connectingRef.current = false;
  }, []);

  const connectToAgent = useCallback((newSessionId: string) => {
    // Prevent multiple simultaneous connections
    if (connectingRef.current) {
      console.log('Connection already in progress, skipping...');
      return;
    }

    if (socketRef.current && currentSessionRef.current !== newSessionId) {
      closeConnection();
    }

    if (!newSessionId) return;

    connectingRef.current = true;

    const apiKey = getApiKey();
    const wsUrl = `${METRICS_WS_URL}/ws/${newSessionId}?x-api-key=${apiKey}`;

    console.log('Connecting to WebSocket with session_id:', newSessionId);
    console.log('WebSocket URL:', wsUrl);

    try {
      const socket = new WebSocket(wsUrl);
      
      socket.onopen = () => {
        console.log('WebSocket connected for session:', newSessionId);
        setIsConnected(true);
        setError(null);
        currentSessionRef.current = newSessionId;
        connectingRef.current = false;
      };

      socket.onmessage = (event) => {
        try {
          const data: SocketEvent = JSON.parse(event.data);
          console.log('Received socket event:', data);

          // Send event to logs panel
          if (onSocketEvent) {
            onSocketEvent(data);
          }

          if (data.event_type === 'tool_called' && data.tool_input) {
            try {
              const toolInputData = JSON.parse(data.tool_input);
              if (toolInputData.agent_id) {
                console.log('Tool called for agent:', toolInputData.agent_id);
                console.log('Calling onToolCalled with agent_id:', toolInputData.agent_id);
                onToolCalled(toolInputData.agent_id);
              } else {
                console.log('No agent_id found in tool_input:', toolInputData);
              }
            } catch (parseError) {
              console.error('Failed to parse tool_input JSON:', parseError);
              console.log('Raw tool_input:', data.tool_input);
            }
          } else if (data.event_type === 'tool_response' && data.arguments) {
            if (data.arguments.agent_id) {
              console.log('Tool response for agent:', data.arguments.agent_id);
              console.log('Calling onToolResponse with agent_id:', data.arguments.agent_id);
              onToolResponse(data.arguments.agent_id);
            } else {
              console.log('No agent_id found in arguments:', data.arguments);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse socket message:', parseError);
          console.log('Raw message:', event.data);
        }
      };

      socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        setError('WebSocket connection error');
        connectingRef.current = false;
      };

      socket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        connectingRef.current = false;
        if (currentSessionRef.current === newSessionId) {
          currentSessionRef.current = null;
        }
      };

      socketRef.current = socket;
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setError('Failed to create WebSocket connection');
      connectingRef.current = false;
    }
  }, [onToolCalled, onToolResponse, onSocketEvent, closeConnection]);

  useEffect(() => {
    if (agentId && sessionId && sessionId !== currentSessionRef.current) {
      connectToAgent(sessionId);
    } else if (!agentId || !sessionId) {
      closeConnection();
    }

    return () => {
      closeConnection();
    };
  }, [agentId, sessionId]);

  return {
    isConnected,
    error,
    closeConnection,
  };
};
