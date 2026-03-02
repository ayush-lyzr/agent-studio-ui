
import { useState, useCallback } from "react";
import { WebSocketMessage } from "@/types/chat";

export const useSortedActivities = () => {
  const [sortedEvents, setSortedEvents] = useState<WebSocketMessage[]>([]);

  function getTimestampWithMicroseconds(timestamp: string) {

    const date = new Date(timestamp);
    const parts = timestamp.split(".");
    const microseconds = parseInt(parts[1]) || 0;

    return {
      milliseconds: date.getTime(),
      microseconds: microseconds,
      // For sorting: combine ms and remaining microseconds
      totalMicroseconds: date.getTime() * 1000 + (microseconds % 1000),
    };
  }

  const addEvent = useCallback((event: WebSocketMessage) => {
    setSortedEvents((prevEvents) => {

      let timestamp;

      // If the event has no timestamp, set it to the current date
      if(!event.timestamp) { 
        event.timestamp = new Date().toISOString();
      }

      // for thinking log the timestamp in coming as number 
      if (typeof event.timestamp === "number") { 
        timestamp = new Date(event.timestamp).getTime().toString();
      }else{
        timestamp = event.timestamp
      }

      const { totalMicroseconds : eventTime } = getTimestampWithMicroseconds(timestamp);

      // Find the correct insertion position using binary search
      let left = 0;
      let right = prevEvents.length;

      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        const midTime = new Date(prevEvents[mid].timestamp).getTime();

        if (midTime <= eventTime) {
          left = mid + 1;
        } else {
          right = mid;
        }
      }

      // Insert the event at the correct position
      const newEvents = [...prevEvents];
      newEvents.splice(left, 0, event);
      return newEvents;
    });
  }, []);

  const clearEvents = useCallback(() => {
    setSortedEvents([]);
  }, []);

  return { sortedEvents, addEvent, clearEvents };
};
