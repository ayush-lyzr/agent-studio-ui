
import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

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

interface TimelineScrubberProps {
  events: SocketEvent[];
  isConnected: boolean;
  onEventReplay: (eventIndex: number, event: SocketEvent) => void;
  onTimelineChange: (currentIndex: number, totalEvents: number) => void;
}

const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  events,
  isConnected,
  onEventReplay,
  onTimelineChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(events.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Update current index when new events arrive
  useEffect(() => {
    if (events.length > 0 && !isPlaying) {
      setCurrentIndex(events.length - 1);
    }
  }, [events.length, isPlaying]);

  // Notify parent of timeline changes
  useEffect(() => {
    onTimelineChange(currentIndex, events.length);
  }, [currentIndex, events.length, onTimelineChange]);

  const handleSliderChange = useCallback((value: number[]) => {
    const newIndex = value[0];
    setCurrentIndex(newIndex);
    
    if (events[newIndex]) {
      onEventReplay(newIndex, events[newIndex]);
    }
  }, [events, onEventReplay]);

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    setIsPlaying(true);
    
    const playInterval = setInterval(() => {
      setCurrentIndex(prevIndex => {
        const nextIndex = Math.min(prevIndex + 1, events.length - 1);
        
        if (nextIndex >= events.length - 1) {
          setIsPlaying(false);
          clearInterval(playInterval);
          return nextIndex;
        }
        
        if (events[nextIndex]) {
          onEventReplay(nextIndex, events[nextIndex]);
        }
        
        return nextIndex;
      });
    }, 1000 / playbackSpeed);

    return () => clearInterval(playInterval);
  }, [isPlaying, events, playbackSpeed, onEventReplay]);

  const handleReset = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(0);
    if (events[0]) {
      onEventReplay(0, events[0]);
    }
  }, [events, onEventReplay]);

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

  const getCurrentEvent = () => events[currentIndex];
  const currentEvent = getCurrentEvent();

  if (events.length === 0) {
    return null;
  }

  return (
    <div className={`fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border transition-all duration-300 ${
      isExpanded ? 'h-32' : 'h-16'
    }`}>
      {/* Main Controls */}
      <div className="flex items-center justify-between px-4 py-3 h-16">
        {/* Left Controls */}
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </Button>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-muted-foreground hover:text-foreground"
              disabled={events.length === 0}
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePlay}
              className="text-muted-foreground hover:text-foreground"
              disabled={events.length === 0}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{currentIndex + 1} / {events.length}</span>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 mx-8">
          <Slider
            value={[currentIndex]}
            onValueChange={handleSliderChange}
            max={Math.max(0, events.length - 1)}
            min={0}
            step={1}
            className="w-full"
            disabled={events.length === 0}
          />
        </div>

        {/* Right Info */}
        <div className="flex items-center space-x-4">
          {currentEvent && (
            <div className="text-sm text-foreground">
              <span className="font-medium">{currentEvent.event_type.replace(/_/g, ' ')}</span>
              <span className="text-muted-foreground ml-2">
                {formatTimestamp(currentEvent.timestamp)}
              </span>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-xs text-muted-foreground">
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-4 py-2 border-t border-border h-16 overflow-hidden">
          {currentEvent ? (
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-1">
                  {currentEvent.event_type.replace(/_/g, ' ')}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentEvent.tool_name && `Tool: ${currentEvent.tool_name} • `}
                  {currentEvent.function_name && `Function: ${currentEvent.function_name} • `}
                  Run ID: {currentEvent.run_id.slice(-8)}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="text-xs text-muted-foreground">
                  Speed: {playbackSpeed}x
                </div>
                <div className="flex space-x-1">
                  {[0.5, 1, 2, 4].map(speed => (
                    <Button
                      key={speed}
                      variant={playbackSpeed === speed ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setPlaybackSpeed(speed)}
                      className="text-xs px-2 py-1 h-6"
                    >
                      {speed}x
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-2">
              <span className="text-sm">No event data available</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineScrubber;
