import React, { useState, useEffect, useRef } from 'react';
import { ChevronUp, ChevronDown, X, Circle, Play, CheckCircle, AlertCircle, Clock, Zap, MessageSquare, Settings, Truck, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

interface SocketLogsPanelProps {
  logs: SocketEvent[];
  isConnected: boolean;
  onClose?: () => void;
}

const SocketLogsPanel: React.FC<SocketLogsPanelProps> = ({ logs, isConnected, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shouldAutoExpand, setShouldAutoExpand] = useState(true);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-expand when new logs arrive (if not manually collapsed)
  useEffect(() => {
    if (logs.length > 0 && shouldAutoExpand && !isCollapsed) {
      setIsExpanded(true);
    }
  }, [logs.length, shouldAutoExpand, isCollapsed]);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (isExpanded && !isCollapsed && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, isExpanded, isCollapsed]);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
    setShouldAutoExpand(!isExpanded);
  };

  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
    if (!isCollapsed) {
      setIsExpanded(false);
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'tool_calling_iteration':
        return <Play className="w-3 h-3 text-blue-400" />;
      case 'scratch_pad_created':
        return <Settings className="w-3 h-3 text-purple-400" />;
      case 'tool_called':
        return <Zap className="w-3 h-3 text-orange-400" />;
      case 'tool_response':
        return <CheckCircle className="w-3 h-3 text-green-400" />;
      case 'tool_call_prepare':
        return <Clock className="w-3 h-3 text-yellow-400" />;
      case 'coroutine_tool_response':
        return <MessageSquare className="w-3 h-3 text-cyan-400" />;
      case 'tool_output':
        return <Truck className="w-3 h-3 text-indigo-400" />;
      case 'process_complete':
        return <CheckCircle className="w-3 h-3 text-emerald-400" />;
      case 'error':
        return <AlertCircle className="w-3 h-3 text-red-400" />;
      default:
        return <Circle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'tool_calling_iteration':
        return 'border-blue-400/20 bg-blue-900/10';
      case 'scratch_pad_created':
        return 'border-purple-400/20 bg-purple-900/10';
      case 'tool_called':
        return 'border-orange-400/20 bg-orange-900/10';
      case 'tool_response':
        return 'border-green-400/20 bg-green-900/10';
      case 'tool_call_prepare':
        return 'border-yellow-400/20 bg-yellow-900/10';
      case 'coroutine_tool_response':
        return 'border-cyan-400/20 bg-cyan-900/10';
      case 'tool_output':
        return 'border-indigo-400/20 bg-indigo-900/10';
      case 'process_complete':
        return 'border-emerald-400/20 bg-emerald-900/10';
      case 'error':
        return 'border-red-400/20 bg-red-900/10';
      default:
        return 'border-gray-400/20 bg-card/10';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return timestamp;
    }
  };

  const getEventDescription = (event: SocketEvent) => {
    switch (event.event_type) {
      case 'tool_calling_iteration':
        return 'Starting new iteration';
      case 'scratch_pad_created':
        return 'Creating scratch pad';
      case 'tool_called':
        return event.tool_name ? `Calling ${event.tool_name}` : 'Tool called';
      case 'tool_response':
        return 'Tool response received';
      case 'tool_call_prepare':
        return event.function_name ? `Preparing ${event.function_name}` : 'Preparing tool call';
      case 'coroutine_tool_response':
        return 'Coroutine response';
      case 'tool_output':
        return 'Tool output generated';
      case 'process_complete':
        return 'Process completed successfully';
      case 'error':
        return 'Error occurred';
      default:
        return event.event_type.replace(/_/g, ' ');
    }
  };

  const getAgentName = (event: SocketEvent) => {
    try {
      if (event.tool_input) {
        const toolInput = JSON.parse(event.tool_input);
        return toolInput.name;
      }
      if (event.arguments?.name) {
        return event.arguments.name;
      }
      if (event.response && event.response.includes('Agent')) {
        const match = event.response.match(/([A-Za-z\s]+Agent)/);
        return match ? match[1] : null;
      }
    } catch (e) {
      // Ignore parsing errors
    }
    return null;
  };

  if (!isConnected && logs.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-[60] bg-card border-t border-border transition-all duration-300 ${isCollapsed ? 'translate-y-full' : isExpanded ? 'translate-y-0' : 'translate-y-full'
      }`}>
      {/* Collapsed State - Just a thin bar at bottom */}
      {isCollapsed && (
        <div className="fixed bottom-0 left-0 right-0 z-[60]">
          <div
            className="h-2 bg-gradient-to-r from-blue-500 to-green-500 cursor-pointer hover:h-3 transition-all duration-200 flex items-center justify-center"
            onClick={handleCollapse}
          >
            <ChevronUp className="w-3 h-3 text-foreground opacity-50 hover:opacity-100" />
          </div>
        </div>
      )}

      {/* Expanded State */}
      {!isCollapsed && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border bg-secondary">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggle}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
              </Button>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Live' : 'Disconnected'} • {logs.length} events
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCollapse}
                className="text-muted-foreground hover:text-foreground p-1"
                title={isCollapsed ? "Expand" : "Minimize"}
              >
                {isCollapsed ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </Button>
              {onClose && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Timeline Content */}
          {isExpanded && (
            <div className="h-48 overflow-y-auto p-2">
              {logs.length === 0 ? (
                <div className="text-center text-muted-foreground py-4">
                  <Clock className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">Waiting for agent activity...</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline Line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 opacity-20" />

                  {/* Timeline Events */}
                  <div className="space-y-1">
                    {logs.map((log, index) => {
                      const agentName = getAgentName(log);
                      return (
                        <div
                          key={`${log.log_id}-${index}`}
                          className={`relative flex items-center gap-2 px-2 py-1 rounded border text-xs transition-all duration-500 hover:scale-[1.01] ${getEventColor(log.event_type)}`}
                          style={{
                            animationDelay: `${index * 50}ms`,
                            animation: 'fade-in 0.3s ease-out forwards'
                          }}
                        >
                          {/* Timeline Node */}
                          <div className="relative z-10 flex-shrink-0 w-7 h-7 bg-secondary rounded-full border border-border flex items-center justify-center">
                            {getEventIcon(log.event_type)}
                          </div>

                          {/* Event Content */}
                          <div className="flex-1 min-w-0 flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-medium text-foreground truncate">
                                {getEventDescription(log)}
                              </span>
                              {agentName && (
                                <span className="text-xs px-1.5 py-0.5 bg-blue-600/20 text-blue-300 rounded border border-blue-500/30 flex-shrink-0">
                                  {agentName}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className="text-xs text-muted-foreground font-mono">
                                {formatTimestamp(log.timestamp)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {log.run_id.slice(-4)}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div ref={logsEndRef} />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SocketLogsPanel;
