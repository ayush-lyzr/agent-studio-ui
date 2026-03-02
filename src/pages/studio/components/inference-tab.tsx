import { useState, useEffect } from "react";
import { CardHeader, CardTitle } from "@/components/ui/card";
import ChatBox from "./chatbox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/custom/button";
import { Check, ChevronsUpDown, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import useStore from "@/lib/store";
import { toast } from "@/components/ui/use-toast";
import { v4 as uuidv4 } from "uuid";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface Session {
  session_id: string;
  session_name: string;
  user_id: string;
  created_at: string;
}

interface ChatMessage {
  role: "user" | "assistant" | "loading";
  content: string;
}

export default function InferenceTab() {
  const { currentUser } = useCurrentUser();
  const [chatText, setChatText] = useState("");
  const [userName, _] = useState(currentUser?.auth?.email ?? "");
  const [agentId, setAgentId] = useState("");
  const [, setAgent] = useState({});
  const [sessionId, setSessionId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const agents = useStore((state: any) => state.agents);
  const apiKey = useStore((state: any) => state.api_key);

  useEffect(() => {
    setSessionId(uuidv4());
  }, []);

  const setCurrentAgent = (id: string) => {
    setAgentId(id);
    function findObjectById(objects: any[], id: string): any[] | undefined {
      return objects.find((object) => object.id === id);
    }
    setAgent(findObjectById(agents, id) || {});
    fetchSessions(id);
  };

  const fetchSessions = async (agentId: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/v1/agent/${agentId}/sessions`,
        {
          headers: {
            "x-api-key": apiKey,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch sessions");
      }
      const data = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    }
  };

  const fetchSessionHistory = async (sessionId: string) => {
    setIsLoadingHistory(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/v1/sessions/${sessionId}/history`,
        {
          headers: {
            "x-api-key": apiKey,
          },
        },
      );
      if (!response.ok) {
        throw new Error("Failed to fetch session history");
      }
      const data = await response.json();
      setChatHistory(data);
    } catch (error) {
      console.error("Error fetching session history:", error);
      setChatHistory([]);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSessionSelect = async (selectedValue: string) => {
    if (selectedValue === "new") {
      setSessionId(uuidv4());
      setChatHistory([]);
    } else {
      setSessionId(selectedValue);
      await fetchSessionHistory(selectedValue);
    }
    setValue(selectedValue);
    setOpen(false);
  };

  const curlCommand = `curl -X POST '${import.meta.env.VITE_BASE_URL}/v2/chat/' \\
      -H 'Content-Type: application/json' \\
      -H 'x-api-key: <YOUR API KEY>' \\
      -d '{
        "user_id": "${userName}",
        "agent_id": "${agentId}",
        "session_id": "${sessionId}",
        "message": "${chatText}"
        }'`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied!",
        description: `${text} has been copied to your clipboard.`,
      });
    });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="flex flex-1 flex-col space-y-4">
        <Label className="text-md">Chat with</Label>
        <Select
          onValueChange={(val) => setCurrentAgent(val)}
          value={agentId}
          defaultValue={agentId}
        >
          <SelectTrigger className="mt-2 w-full">
            <SelectValue placeholder="Select an Agent" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Agents</SelectLabel>
              {agents.map((agent: any) => (
                <SelectItem key={agent._id} value={agent._id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>

        <Label className="text-md">Select Session</Label>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="mt-2 w-full justify-between"
              disabled={!agentId}
            >
              {value
                ? sessions.find((session) => session.session_id === value)
                    ?.session_name || "New Session"
                : "Select a session..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[38.5rem] rounded-lg bg-opacity-20 p-0 shadow-lg backdrop-blur-lg backdrop-filter">
            <Command className="max-h-[300px] overflow-hidden">
              <CommandInput placeholder="Search sessions..." />
              <CommandEmpty>No session found.</CommandEmpty>
              <div className="max-h-[300px] overflow-y-auto">
                <CommandGroup>
                  <CommandItem
                    onSelect={() => handleSessionSelect("new")}
                    className="font-bold"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === "new" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    Create New Session +
                  </CommandItem>
                  <Separator className="my-2" />
                  {sessions.map((session) => (
                    <CommandItem
                      key={session.session_id}
                      onSelect={() => {
                        handleSessionSelect(session.session_id);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === session.session_id
                            ? "opacity-100"
                            : "opacity-0",
                        )}
                      />
                      {session.session_name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </div>
            </Command>
          </PopoverContent>
        </Popover>

        <Label className="text-md">Chat Logs</Label>
        <ChatBox
          agentId={agentId}
          setChatData={setChatText}
          chatData={chatText}
          user_id={userName}
          chatHistory={chatHistory}
          isLoadingHistory={isLoadingHistory}
        />
      </div>

      <div className="hidden lg:block">
        <Separator orientation="vertical" className="mx-4 h-full" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col">
        <div>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Chat endpoint request:</CardTitle>
              <Button
                onClick={() => copyToClipboard(curlCommand)}
                type="button"
                variant="secondary"
              >
                <Copy size={18} />
              </Button>
            </div>
          </CardHeader>
          <div className="flex-grow overflow-auto">
            <div className="h-full overflow-auto rounded-lg bg-muted p-4">
              <pre className="whitespace-pre-wrap break-words">
                {curlCommand}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
