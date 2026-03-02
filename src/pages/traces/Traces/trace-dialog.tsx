import { useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { User, Bot, Code, Wrench } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import axios from "@/lib/axios";
import useStore from "@/lib/store";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ActivityTab from "./activity-tab";

interface DialogProps {
  trace_id: string;
  runs: string[];
  open: boolean;
  setOpen: (open: boolean) => void;
}

interface AgentRun {
  _id: string;
  trace_id: string;
  agent_id: string;
  log_id: string;
  run_id: string;
  org_id: string;
  latency_ms: number;
  start_time: string;
  end_time: string;
  llm_provider: string;
  language_model: string;
  actions: number;
  input_messages: InputMessage[];
  output_messages: OutputMessage;
  agent_name: string;
}

interface InputMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OutputMessage {
  content: string;
  role: string;
  tool_calls: null | any; // You might want to define a more specific type here if you know the structure
  function_call: null | any; // You might want to define a more specific type here if you know the structure
  annotations: any[]; // You might want to define a more specific type here if you know the structure
}

const TraceDialog: React.FC<DialogProps> = ({ trace_id, runs }) => {
  const { api_key: apiKey } = useStore((state) => state);

  const [currentRunId, setCurrentRunId] = useState<string>(
    runs?.length > 0 ? runs[0][0] : "",
  );

  const [agentInferences, setAgentInferences] = useState<AgentRun[]>([]);

  const { isPending: isFetchingTrace, mutateAsync: fetchTrace } = useMutation({
    mutationKey: ["getTrace"],
    mutationFn: () =>
      axios.get(`/ops/trace/${trace_id}/run/${currentRunId}`, {
        headers: {
          "x-api-key": apiKey,
        },
      }),
    onSuccess: (res) => {
      setAgentInferences(res.data);
    },
  });

  useEffect(() => {
    fetchTrace();
  }, [currentRunId]);

  return (
    <div className="max-h-[80vh] overflow-hidden">
      <div className="flex gap-2">
        <ScrollArea className="h-[calc(80vh-2rem)] basis-1/6 border-r">
          <p className="pb-2 text-lg font-semibold">Agent Inferences</p>
          <div className={`space-y-1`}>
            {runs?.map((ele) => (
              <p
                key={ele[0]}
                className={`hover:bg-muted" mr-2 cursor-pointer rounded-md p-2 text-sm ${ele[0] == currentRunId ? "bg-muted" : ""}`}
                onClick={() => setCurrentRunId(ele[0])}
              >
                {ele[1]}
              </p>
            ))}
          </div>
        </ScrollArea>
        {isFetchingTrace && <SkeletonLoader />}
        {!isFetchingTrace && agentInferences?.length > 0 && (
          <ScrollArea className="h-[calc(80vh-2rem)] flex-1">
            <Accordion
              defaultValue={agentInferences[0].log_id}
              type="single"
              collapsible
              className="w-full"
            >
              {agentInferences.map((agentRun: AgentRun, index: number) => (
                <AccordionItem value={agentRun.log_id} key={index}>
                  <AccordionTrigger>{agentRun.agent_name}</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <p className="mb-3 text-sm font-medium text-muted-foreground">
                          Trace Details
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <KeyValuePair
                            label="Agent Name"
                            value={agentRun.agent_name}
                          />
                          <KeyValuePair
                            label="Agent ID"
                            value={agentRun.agent_id}
                          />

                          <KeyValuePair
                            label="Provider"
                            value={agentRun.llm_provider}
                          />

                          <KeyValuePair
                            label="Model"
                            value={agentRun.language_model}
                          />
                          <KeyValuePair
                            label="Start Time"
                            value={new Date(agentRun.start_time).toLocaleString(
                              "default",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              },
                            )}
                          />
                          <KeyValuePair
                            label="End Time"
                            value={new Date(agentRun.end_time).toLocaleString(
                              "default",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: true,
                              },
                            )}
                          />
                          <KeyValuePair
                            label="Latency (ms)"
                            value={agentRun.latency_ms}
                          />
                          <KeyValuePair
                            label="Credits Consumed"
                            value={agentRun.actions.toFixed(2)}
                          />
                          <KeyValuePair label="Trace Status" value="Success" />
                        </div>
                      </div>
                      <Tabs defaultValue="messages">
                        <TabsList>
                          <TabsTrigger value="messages">Messages</TabsTrigger>
                          <TabsTrigger value="activities">
                            Activities
                          </TabsTrigger>
                        </TabsList>
                        <TabsContent value="messages">
                          <div className="space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">
                              Input Messages
                            </p>
                            <div className="max-h-[300px] overflow-y-auto">
                              <div className="space-y-4 pr-4">
                                {agentRun.input_messages
                                  .slice(2)
                                  .map((message, idx) => (
                                    <InputMessageComponent
                                      key={idx}
                                      message={message}
                                    />
                                  ))}
                              </div>
                            </div>
                          </div>

                          <div className="space-y-4">
                            <p className="text-sm font-medium text-muted-foreground">
                              Output Message
                            </p>
                            <OutputMessageComponent
                              message={agentRun.output_messages}
                            />
                          </div>
                        </TabsContent>
                        <TabsContent value="activities">
                          <ActivityTab
                            trace_id={trace_id}
                            run_id={currentRunId}
                            log_id={agentRun.log_id}
                          />
                        </TabsContent>
                      </Tabs>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

const MessageBadge = ({ role }: { role: string }) => {
  const getBadgeStyle = () => {
    switch (role?.toLowerCase()) {
      case "system":
        return "bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20";
      case "user":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "agent":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const getIcon = () => {
    switch (role.toLowerCase()) {
      case "system":
        return <Code className="h-3 w-3" />;
      case "user":
        return <User className="h-3 w-3" />;
      case "assistant":
        return <Bot className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <Badge variant="outline" className={`${getBadgeStyle()} gap-1`}>
      {getIcon()}
      {role.charAt(0).toUpperCase() + role.slice(1)}
    </Badge>
  );
};

const InputMessageComponent = ({ message }: { message: InputMessage }) => {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <MessageBadge role={message.role} />
      </div>
      <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
        {message.content}
      </div>
    </div>
  );
};

const OutputMessageComponent = ({ message }: { message: OutputMessage }) => {
  return (
    <div className="rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-2 flex items-center gap-2">
        <MessageBadge role={message.role} />
        {message.tool_calls && (
          <Badge
            variant="outline"
            className="gap-1 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20"
          >
            <Wrench className="h-3 w-3" />
            Tool Call
          </Badge>
        )}
      </div>
      <div className="h-full max-h-[200px] overflow-y-auto">
        {message.content && (
          <div className="whitespace-pre-wrap rounded-md bg-muted/50 p-3 text-sm">
            {message.content}
          </div>
        )}
        {message.tool_calls && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Tool Calls:
            </p>
            <div className="rounded-md bg-muted/30 p-3">
              {message.tool_calls.map((toolCall: any) => (
                <div className="space-y-2">
                  <div>
                    <p>Name</p>
                    <p className="text-xs">{toolCall.function.name}</p>
                  </div>
                  <div key={toolCall.id}>
                    <p>Arguments</p>
                    <p className="text-xs">{toolCall.function.arguments}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {message.function_call && (
          <div className="mt-3 space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Function Call:
            </p>
            <div className="rounded-md bg-muted/30 p-3">
              <pre className="text-xs">
                {JSON.stringify(message.function_call, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const KeyValuePair = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="flex items-start justify-between gap-4 rounded-md bg-muted/40 px-4 py-2">
    <span className="text-sm font-medium text-muted-foreground">{label}</span>
    <span className="text-right text-sm font-medium text-primary">{value}</span>
  </div>
);

const SkeletonLoader = () => {
  return (
    <ScrollArea className="h-[calc(80vh-2rem)] flex-1">
      <div className="w-full">
        <div className="space-y-6 rounded-lg border p-6">
          {/* Accordion Header Skeleton */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-[200px]" />
            <Skeleton className="h-4 w-4" />
          </div>

          {/* Trace Details Section */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-24" /> {/* Section Title */}
            <div className="grid grid-cols-2 gap-2">
              {/* Generate 8 key-value pair skeletons */}
              {Array.from({ length: 8 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-4 rounded-md bg-muted/40 px-4 py-2"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Input Messages Section */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" /> {/* Section Title */}
            <div className="space-y-4">
              {/* Generate 3 message skeletons */}
              {Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border bg-card p-4">
                  <div className="mb-2">
                    <Skeleton className="h-5 w-20" />
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Output Message Section */}
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" /> {/* Section Title */}
            <div className="rounded-lg border bg-card p-4">
              <div className="mb-2">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              {/* Tool Calls Section */}
              <div className="mt-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <div className="rounded-md bg-muted/30 p-3">
                  <div className="space-y-1">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-5/6" />
                    <Skeleton className="h-3 w-4/6" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default TraceDialog;
