import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import useStore from "@/lib/store";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/custom/button";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { Loader, BotMessageSquare, CloudUpload } from "lucide-react";
import NumericCard from "@/components/ui/numeric-card";

interface Agent {
  id: string;
  name: string;
  system_prompt: string;
  agent_description: string;
  env_id: string;
}

interface Message {
  role: string;
  content: string;
  created_at: string;
}

interface Session {
  session_id: string;
  session_name: string;
  user_id: string;
  created_at: string;
}

export default function ChatLogsTab() {
  const [agentOpen, setAgentOpen] = useState(false);
  const [sessionOpen, setSessionOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionHistory, setSessionHistory] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const newAgent: Agent = {
    id: "",
    name: "",
    system_prompt: "You are a helpful agent",
    agent_description: "A test agent",
    env_id: "",
  };
  const [agent, setAgent] = useState<Agent>(newAgent);

  const agents = useStore((state) => (state as { agents: Agent[] }).agents);
  const apiKey = useStore((state) => (state as { api_key: string }).api_key);
  const { toast } = useToast();

  useEffect(() => {
    if (selectedAgentId) {
      const selectedAgent = agents.find((a) => a.id === selectedAgentId);
      if (selectedAgent) {
        setAgent(selectedAgent);
        fetchSessions(selectedAgent.id);
      }
    } else {
      setAgent(newAgent);
      setSessions([]);
      setSelectedSessionId("");
    }
  }, [selectedAgentId, agents]);

  useEffect(() => {
    if (selectedSessionId) {
      fetchSessionHistory(selectedSessionId);
    } else {
      setSessionHistory([]);
    }
  }, [selectedSessionId]);

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
      const data: Session[] = await response.json();
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      setSessions([]);
    }
  };

  const fetchSessionHistory = async (sessionId: string) => {
    setIsLoading(true);
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
      setSessionHistory(data);
    } catch (error) {
      console.error("Error fetching session history:", error);
      setSessionHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAgentSelect = (agentId: string) => {
    setSelectedAgentId(agentId);
    setAgentOpen(false);
    setSelectedSessionId("");
  };

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSessionOpen(false);
    toast({
      title: `Loading session logs...`,
    });
  };

  return (
    <TabsContent value="chat-logs" className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        <NumericCard
          speed={1}
          title={"Total Agents"}
          description={""}
          targetValue={agents.length}
          initialValue={0}
          numberPrefix={""}
          numberSuffix={""}
          icon={BotMessageSquare}
        />
        <NumericCard
          speed={5}
          title={"Average Latency"}
          description={""}
          targetValue={500}
          initialValue={0}
          numberPrefix={""}
          numberSuffix={" ms"}
          icon={Loader}
        />
        <NumericCard
          speed={1}
          title={"Average Inferences per Minute"}
          description={""}
          targetValue={20}
          initialValue={0}
          numberPrefix={""}
          numberSuffix={""}
          icon={CloudUpload}
        />
        <NumericCard
          speed={1}
          title={"Total Inferences"}
          description={""}
          targetValue={20}
          initialValue={0}
          numberPrefix={""}
          numberSuffix={""}
          icon={BotMessageSquare}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <Popover open={agentOpen} onOpenChange={setAgentOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={agentOpen}
                className="w-full justify-between"
              >
                {agent.name || "Select agent"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[40rem] p-0">
              <Command className="max-h-[300px] overflow-hidden">
                <CommandInput placeholder="Search agent..." className="h-9" />
                <CommandEmpty>No agent found.</CommandEmpty>
                <div className="max-h-[300px] overflow-y-auto">
                  <CommandGroup>
                    {agents.map((curAgent) => (
                      <CommandItem
                        key={curAgent.id}
                        onSelect={() => handleAgentSelect(curAgent.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            agent.id === curAgent.id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {curAgent.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </div>
              </Command>
            </PopoverContent>
          </Popover>

          <Popover open={sessionOpen} onOpenChange={setSessionOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={sessionOpen}
                className="w-full justify-between"
                disabled={!selectedAgentId}
              >
                {selectedSessionId || "Select session"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[40rem] p-0">
              <Command className="max-h-[300px] overflow-hidden">
                <CommandInput placeholder="Search session..." className="h-9" />
                <CommandEmpty>No session found.</CommandEmpty>
                <div className="max-h-[300px] overflow-y-auto">
                  <CommandGroup>
                    {sessions.map((session) => (
                      <CommandItem
                        key={session.session_id}
                        onSelect={() => handleSessionSelect(session.session_id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedSessionId === session.session_id
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
        </div>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>View Session Logs:</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {!selectedSessionId ? (
              <p className="max-h-96 min-h-96 list-none space-y-4 overflow-auto p-4 text-gray-500">
                Please select a session to view its logs.
              </p>
            ) : (
              <ul className="max-h-96 min-h-96 list-none space-y-4 overflow-auto p-4">
                {isLoading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <li key={index} className="space-y-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-4 w-[150px]" />
                      </li>
                    ))
                  : sessionHistory.map((message: Message, index: number) => (
                      <li key={index}>
                        <div className="rounded-lg p-3">
                          <p className="mb-1 text-sm font-semibold">
                            {message.role === "user" ? "User" : "Assistant"}
                          </p>
                          <p>{message.content}</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleString()}
                          </p>
                        </div>
                        {index < sessionHistory.length - 1 &&
                          sessionHistory[index + 1].role !== message.role && (
                            <Separator className="my-2" />
                          )}
                      </li>
                    ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
