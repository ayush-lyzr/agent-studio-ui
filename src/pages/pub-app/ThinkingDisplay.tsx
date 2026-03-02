import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, Search, Settings, CheckCircle } from 'lucide-react';

export interface ThinkingEvent {
  context_type: string;
  thinking: string;
  iteration: number | null;
  tool_name: string | null;
  timestamp: number;
}

interface ThinkingDisplayProps {
  event: ThinkingEvent | null;
  isStreaming: boolean;
}

interface QueuedEvent extends ThinkingEvent {
  id: string;
  displayText: string;
}

const ThinkingDisplay: React.FC<ThinkingDisplayProps> = ({ event, isStreaming }) => {
  const [eventQueue, setEventQueue] = useState<QueuedEvent[]>([]);
  const [typingStates, setTypingStates] = useState<{ [key: string]: string }>({});
  const maxQueueSize = useRef(Math.floor(Math.random() * 3) + 2); // Random between 2-4

  useEffect(() => {
    if (event) {
      const newEvent: QueuedEvent = {
        ...event,
        id: `${event.timestamp}-${Math.random()}`,
        displayText: event.thinking
      };
      
      setEventQueue(prev => {
        // Check for duplicate thinking text
        const isDuplicate = prev.some(evt => evt.thinking === event.thinking);
        if (isDuplicate) {
          return prev;
        }
        
        // Add new event at the beginning (top)
        const updated = [newEvent, ...prev];
        
        // Remove oldest (bottom) if exceeding max queue size
        if (updated.length > maxQueueSize.current) {
          const trimmed = updated.slice(0, maxQueueSize.current);
          // Set removed events to full text immediately
          const removedIds = updated.slice(maxQueueSize.current).map(evt => evt.id);
          setTypingStates(prevStates => {
            const newStates = { ...prevStates };
            removedIds.forEach(id => delete newStates[id]);
            return newStates;
          });
          return trimmed;
        }
        return updated;
      });
      
      // Initialize typing state for this event
      setTypingStates(prev => ({ ...prev, [newEvent.id]: '' }));
      
      // Complete typing for all previous events
      setEventQueue(prevQueue => {
        prevQueue.forEach(evt => {
          if (evt.id !== newEvent.id) {
            setTypingStates(prevStates => ({
              ...prevStates,
              [evt.id]: evt.displayText
            }));
          }
        });
        return prevQueue;
      });
    }
  }, [event]);
  
  // Typing animation only for the latest event
  useEffect(() => {
    if (eventQueue.length === 0) return;
    
    const latestEvent = eventQueue[0]; // First event is the newest
    const currentTyped = typingStates[latestEvent.id] || '';
    
    if (currentTyped.length < latestEvent.displayText.length) {
      const timer = setTimeout(() => {
        setTypingStates(prev => ({
          ...prev,
          [latestEvent.id]: latestEvent.displayText.slice(0, currentTyped.length + 1)
        }));
      }, 20);
      
      return () => clearTimeout(timer);
    }
  }, [eventQueue, typingStates]);
  
  // Clean up events immediately when streaming stops
  useEffect(() => {
    if (!isStreaming) {
      setEventQueue([]);
      setTypingStates({});
    }
  }, [isStreaming]);

  const getIcon = (contextType: string) => {
    switch (contextType) {
      case 'iteration_start':
        return <Brain className="w-3 h-3" />;
      case 'tool_selection':
        return <Search className="w-3 h-3" />;
      case 'tool_result':
        return <CheckCircle className="w-3 h-3" />;
      case 'artifact_operation':
        return <Settings className="w-3 h-3" />;
      case 'completion':
        return <CheckCircle className="w-3 h-3" />;
      default:
        return <Lightbulb className="w-3 h-3" />;
    }
  };

  const getContextLabel = (evt: ThinkingEvent) => {
    // If we have a tool name, prioritize showing it
    if (evt.tool_name) {
      // Clean up tool names for display
      const toolDisplay = evt.tool_name
        .replace(/_/g, ' ')
        .replace(/agent tool/i, 'Agent')
        .replace(/\b\w/g, l => l.toUpperCase());
      return toolDisplay;
    }
    
    switch (evt.context_type) {
      case 'iteration_start':
        return evt.iteration ? `Step ${evt.iteration}` : 'Analyzing';
      case 'tool_selection':
        return 'Selecting tool';
      case 'tool_result':
        return 'Processing result';
      case 'artifact_operation':
        return 'Creating artifact';
      case 'completion':
        return 'Completing';
      case 'thinking_log':
        return evt.iteration ? `Step ${evt.iteration}` : 'Thinking';
      default:
        return 'Thinking';
    }
  };

  // Only show if we have events in queue AND are actively streaming
  if (eventQueue.length === 0 || !isStreaming) {
    return null;
  }

  return (
    <div className="mb-2 space-y-1">
      <AnimatePresence mode="popLayout">
        {eventQueue.map((evt, index) => {
          const typedText = typingStates[evt.id] || '';
          const isTyping = typedText.length < evt.displayText.length;
          
          return (
            <motion.div
              key={evt.id}
              initial={{ opacity: 0, y: 10, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -10, height: 0 }}
              transition={{ 
                duration: 0.3,
                height: { duration: 0.2 }
              }}
            >
              <div className="flex items-start gap-2 rounded-md bg-muted/30 px-2.5 py-1.5">
                {/* Icon */}
                <motion.div
                  className="mt-0.5 text-muted-foreground"
                  animate={index === 0 && isStreaming ? { 
                    rotate: [0, 360] 
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  {getIcon(evt.context_type)}
                </motion.div>
                
                {/* Label and text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {getContextLabel(evt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                    {typedText}
                    {isTyping && (
                      <span className="inline-block w-0.5 h-3 ml-0.5 bg-muted-foreground/50 animate-pulse" />
                    )}
                  </p>
                </div>

                {/* Animated dots for latest item */}
                {index === 0 && isStreaming && (
                  <div className="flex items-center space-x-0.5 mt-1">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        className="h-1 w-1 rounded-full bg-muted-foreground/40"
                        animate={{
                          opacity: [0.3, 1, 0.3],
                          scale: [0.8, 1.2, 0.8],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                          delay: i * 0.2,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default ThinkingDisplay;