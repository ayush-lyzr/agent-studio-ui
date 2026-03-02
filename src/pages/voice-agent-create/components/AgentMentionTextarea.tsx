import React, { useState, useRef, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import useStore from "@/lib/store";
import { cn } from "@/lib/utils";

interface Agent {
  _id: string;
  name: string;
  description?: string;
}

interface AgentMentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  onAgentMention: (agentId: string, agentName: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  disabled?: boolean;
}

interface MentionSuggestion {
  id: string;
  name: string;
  description?: string;
}

const AgentMentionTextarea: React.FC<AgentMentionTextareaProps> = ({
  value,
  onChange,
  onAgentMention,
  placeholder,
  rows = 4,
  className,
  disabled = false,
}) => {
  const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const [_, setMentionQuery] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const storeAgents = useStore((state) => state.agents) as Agent[];

  // Filter agents based on mention query
  const filterAgents = (query: string): MentionSuggestion[] => {
    if (!storeAgents) return [];

    const filtered = storeAgents
      .filter(
        (agent) =>
          agent.name?.toLowerCase().includes(query?.toLowerCase()) &&
          agent._id &&
          agent.name,
      )
      .map((agent) => ({
        id: agent._id,
        name: agent.name,
        description: agent.description,
      }))
      .slice(0, 5); // Limit to 5 suggestions

    return filtered;
  };

  // Extract valid @mentions from text
  const extractMentions = (text: string) => {
    if (!storeAgents || !text) return [];

    const agentNames = storeAgents.map((agent) => agent.name).filter(Boolean);
    if (agentNames.length === 0) return [];

    const escapedNames = agentNames.map((name) =>
      name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    );

    const mentionRegex = new RegExp(`@(${escapedNames.join("|")})\\b`, "g");
    const mentions = [];
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      mentions.push(match[0]);
    }

    return [...new Set(mentions)]; // Remove duplicates
  };

  // Handle text change and detect @ mentions
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursorPos = e.target.selectionStart;

    onChange(newValue);

    // Find the most recent @ symbol before cursor that's not part of a completed mention
    let atIndex = -1;
    let currentWordStart = cursorPos;

    // Find the start of the current word (go back until we hit a space, newline, or start of text)
    for (let i = cursorPos - 1; i >= 0; i--) {
      if (newValue[i] === " " || newValue[i] === "\n") {
        currentWordStart = i + 1;
        break;
      }
      if (i === 0) {
        currentWordStart = 0;
        break;
      }
    }

    // Check if there's an @ symbol at the start of the current word
    if (
      currentWordStart < newValue.length &&
      newValue[currentWordStart] === "@"
    ) {
      atIndex = currentWordStart;
    }

    if (atIndex !== -1) {
      // Extract query after @
      const query = newValue.slice(atIndex + 1, cursorPos);

      // Only show suggestions if the query doesn't contain spaces (incomplete mention)
      if (!query.includes(" ") && !query.includes("\n")) {
        const filtered = filterAgents(query);

        if (filtered.length > 0) {
          setSuggestions(filtered);
          setMentionStart(atIndex);
          setMentionQuery(query);
          setShowSuggestions(true);
          setSelectedIndex(0);
        } else {
          setShowSuggestions(false);
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation in suggestions
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
      case "Tab":
        e.preventDefault();
        selectSuggestion(suggestions[selectedIndex]);
        break;
      case "Escape":
        setShowSuggestions(false);
        break;
    }
  };

  // Select a suggestion and insert it
  const selectSuggestion = (suggestion: MentionSuggestion) => {
    if (!textareaRef.current) return;

    const beforeMention = value.slice(0, mentionStart);
    const afterCursor = value.slice(textareaRef.current.selectionStart);
    const newValue = beforeMention + `@${suggestion.name}` + afterCursor;

    onChange(newValue);
    setShowSuggestions(false);

    // Call the callback to add agent to managed_agents
    onAgentMention(suggestion.id, suggestion.name);

    // Focus back to textarea and position cursor
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeMention.length + suggestion.name.length + 1;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Calculate suggestion box position
  const getSuggestionPosition = () => {
    if (!textareaRef.current || mentionStart === -1) return {};

    const textarea = textareaRef.current;
    const textBeforeCursor = value.slice(0, mentionStart);
    const lines = textBeforeCursor.split("\n");
    const currentLine = lines.length - 1;
    const currentColumn = lines[lines.length - 1].length;

    const computedStyle = window.getComputedStyle(textarea);
    const fontSize = parseFloat(computedStyle.fontSize);
    const lineHeight = parseFloat(computedStyle.lineHeight) || fontSize * 1.2;

    const top = (currentLine + 1) * lineHeight + 8;
    const left = Math.max(currentColumn * (fontSize * 0.6), 0);

    return { top, left };
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !textareaRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const suggestionPosition = getSuggestionPosition();

  // Get detected mentions for display
  const detectedMentions = extractMentions(value);

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        className={cn("relative", className)}
        disabled={disabled}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 max-h-48 w-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800"
          style={{
            top: `${suggestionPosition.top || 0}px`,
            left: `${suggestionPosition.left || 0}px`,
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`cursor-pointer px-3 py-2 text-sm ${
                index === selectedIndex
                  ? "bg-blue-500 text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
              onClick={() => selectSuggestion(suggestion)}
            >
              <div className="font-medium">
                <span className="text-link">@</span>
                {suggestion.name}
              </div>
              {suggestion.description && (
                <div
                  className={`text-xs ${
                    index === selectedIndex
                      ? "text-blue-100"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {suggestion.description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Display detected @mentions */}
      {detectedMentions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          <span className="text-xs text-muted-foreground">
            Referenced agents:
          </span>
          {detectedMentions.map((mention, index) => (
            <span
              key={`detected-${index}`}
              className="inline-flex items-center rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-link dark:bg-blue-950/30"
            >
              {mention}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentMentionTextarea;
