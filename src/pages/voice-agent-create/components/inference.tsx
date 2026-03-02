import { useState, useRef, useEffect } from "react";
import ChatBox from "../../studio/components/chatbox";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  RocketIcon,
  ExternalLink,
  MessageSquare,
  Mic,
  RefreshCcw,
  MicOff,
} from "lucide-react";
import { Launch } from "./launch";
import { Link } from "react-router-dom";
import { IAgent, MemberstackCurrentUser, UserRole } from "@/lib/types";
import useStore from "@/lib/store";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSortedActivities } from "@/hooks/useSortedActivities";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { toast } from "sonner";

interface InferenceProps {
  agent: Partial<IAgent>;
  isLaunched?: boolean;
  appId?: string | null;
  userId: string;
  currentUser: Partial<MemberstackCurrentUser>;
  agentUserId?: string;
  onSubmit?: () => void;
  isCreating?: boolean;
  features?: any[];
  tool?: string | null;
  tools?: any[];
  managedAgents?: any[];
}

export default function Inference({
  agent,
  isLaunched,
  appId,
  agentUserId,
  currentUser,
  userId,
  onSubmit,
  isCreating,
  features = [],
  tool,
  tools,
  managedAgents = [],
}: InferenceProps) {
  const [chatText, setChatText] = useState("");
  const [userName] = useState(currentUser?.auth?.email || "");
  const [chatHistory] = useState([]);
  const [isLoadingHistory] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const [activeTab, setActiveTab] = useState("voice");
  const [_isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const apiKey = useStore((state) => state.api_key);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );

  const isActionable =
    [UserRole.owner, UserRole.admin].includes(
      current_organization?.role as UserRole,
    ) || agentUserId === apiKey;

  const isManagerAgent = managedAgents.length >= 0 ? true : false;

  const enableVoiceInput = features.some((feature) => feature.type === "VOICE");

  const { clearEvents, addEvent } = useSortedActivities();

  const {
    connect,
    disconnect,
    status: voiceStatus,
    transcripts,
    error: voiceError,
    isThinking,
  } = useVoiceChat(agent?._id || "");

  const [sessionKey, setSessionKey] = useState(Date.now());
  const chatBoxRef = useRef<any>(null);
  const transcriptContainerRef = useRef<HTMLDivElement>(null);

  const handleRefresh = () => {
    if (chatBoxRef?.current?.startNewSession) {
      console.log("Starting new session...");
      chatBoxRef.current.startNewSession();
      clearEvents();
      setSessionKey(Date.now());
    }
  };

  const handleVoiceToggle = async () => {
    if (voiceStatus === "idle") {
      try {
        await connect();
      } catch (err) {
        toast.error("Failed to start voice session");
      }
    } else if (voiceStatus === "connected") {
      disconnect();
    }
  };

  useEffect(() => {
    if (voiceError) {
      toast.error(voiceError);
    }
  }, [voiceError]);

  useEffect(() => {
    if (agent?._id) {
      setSessionKey(Date.now());
      clearEvents();
    }
  }, [agent?._id]);

  // Auto-scroll to bottom when new transcripts arrive
  useEffect(() => {
    if (transcriptContainerRef.current) {
      transcriptContainerRef.current.scrollTop =
        transcriptContainerRef.current.scrollHeight;
    }
  }, [transcripts]);

  return (
    <div className="flex-1">
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Label className="text-lg font-semibold">
          {agent?._id ? "Test Agent Inference" : ""}
        </Label>
        {agent?._id && isActionable && (
          <div>
            {isLaunched ? (
              <Link to={`/agent/${appId}`} target="_blank">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Agent
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={() => setShowLaunch(true)}>
                <RocketIcon className="mr-2 h-4 w-4" />
                Launch Agent
              </Button>
            )}
          </div>
        )}
      </div>
      {agent?._id ? (
        managedAgents.length >= 0 ? (
          <Tabs
            defaultValue="voice"
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex h-[calc(100vh-5rem)] w-full flex-col"
          >
            <div className="mb-4 flex items-center gap-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="voice" className="flex items-center">
                  <Mic className="mr-2 h-4 w-4" />
                  Voice
                </TabsTrigger>
                <TabsTrigger value="chat" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </TabsTrigger>
              </TabsList>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRefresh}
                      className="flex items-center gap-1"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Start new session</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <TabsContent
              value="voice"
              className="min-h-0 flex-1"
              forceMount
              style={{ display: activeTab === "voice" ? "block" : "none" }}
            >
              <div className="flex h-full min-h-0 flex-col">
                {voiceStatus === "idle" ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <Mic className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                      <h3 className="text-lg font-semibold">Voice Interface</h3>
                      <p className="mb-4 text-sm text-muted-foreground">
                        Start a voice conversation with your agent
                      </p>
                      <Button
                        variant="default"
                        size="lg"
                        className="gap-2"
                        onClick={handleVoiceToggle}
                        disabled={!agent?._id}
                      >
                        <Mic className="h-5 w-5" />
                        Start Voice
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-full min-h-0 flex-col">
                    <div className="mb-4 flex items-center justify-between rounded-lg border bg-card p-4">
                      <div className="flex items-center gap-3">
                        {voiceStatus === "connecting" ? (
                          <>
                            <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />
                            <span className="text-sm font-medium">
                              Connecting...
                            </span>
                          </>
                        ) : voiceStatus === "connected" ? (
                          <>
                            <div className="h-3 w-3 animate-pulse rounded-full bg-green-500" />
                            <span className="text-sm font-medium">
                              Connected
                            </span>
                            {isThinking && (
                              <span className="ml-2 animate-pulse text-xs text-orange-500">
                                🤔 Thinking...
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="text-sm font-medium">Error</span>
                          </>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="gap-2"
                        onClick={handleVoiceToggle}
                      >
                        <MicOff className="h-4 w-4" />
                        End Call
                      </Button>
                    </div>
                    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
                      {/* Blur overlay at top */}
                      <div className="pointer-events-none absolute left-0 right-0 top-0 z-10 h-12 bg-gradient-to-b from-background to-transparent backdrop-blur-[0.5px]" />

                      <div
                        ref={transcriptContainerRef}
                        className="flex-1 space-y-4 overflow-y-auto p-4"
                      >
                        {transcripts.length === 0 ? (
                          <div className="flex h-full items-center justify-center">
                            <p className="text-sm text-muted-foreground">
                              Start speaking to see transcripts...
                            </p>
                          </div>
                        ) : (
                          transcripts.map((transcript, i) => (
                            <div
                              key={i}
                              className={`rounded-lg p-3 ${
                                transcript.role === "user"
                                  ? "ml-auto max-w-[80%] bg-primary text-primary-foreground"
                                  : "mr-auto max-w-[80%] bg-muted"
                              }`}
                            >
                              <div className="mb-1 text-xs font-semibold uppercase opacity-70">
                                {transcript.role}
                              </div>
                              <div className="text-sm">{transcript.text}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent
              value="chat"
              className="h-full"
              forceMount
              style={{ display: activeTab === "chat" ? "block" : "none" }}
            >
              <ChatBox
                ref={chatBoxRef}
                agentId={agent?._id}
                setChatData={setChatText}
                chatData={chatText}
                user_id={userName}
                chatHistory={chatHistory}
                isLoadingHistory={isLoadingHistory}
                features={features}
                tool={tool}
                tools={tools}
                enableVoiceInput={enableVoiceInput}
                isManagerAgent={isManagerAgent}
                onGeneratingChange={setIsGeneratingResponse}
                addEvent={addEvent}
              />
            </TabsContent>
          </Tabs>
        ) : (
          <ChatBox
            key={`chat-${sessionKey}`}
            ref={chatBoxRef}
            agentId={agent?._id}
            setChatData={setChatText}
            chatData={chatText}
            user_id={userName}
            chatHistory={chatHistory}
            isLoadingHistory={isLoadingHistory}
            features={features}
            tool={tool}
            tools={tools}
            enableVoiceInput={enableVoiceInput}
            isManagerAgent={isManagerAgent}
            onGeneratingChange={setIsGeneratingResponse}
            addEvent={addEvent}
          />
        )
      ) : (
        <div className="flex h-full flex-col items-center justify-center space-y-8">
          <div className="rounded-full bg-primary/10 p-3">
            <RocketIcon className="size-6 text-primary" />
          </div>
          <h1 className="text-xl font-semibold text-foreground">
            Start Building
          </h1>

          <div className="flex w-96 flex-col space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 p-2">
                <span className="text-xs font-medium text-primary">1</span>
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  Choose LLM & Define Role
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select your preferred large language model and define your
                  agent's purpose
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 p-2">
                <span className="text-xs font-medium text-primary">2</span>
              </div>
              <div>
                <h3 className="text-sm font-medium">Add Tools (Optional)</h3>
                <p className="text-sm text-muted-foreground">
                  Enhance your agent with external tools and capabilities
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex size-6 items-center justify-center rounded-full bg-primary/10 p-2">
                <span className="text-xs font-medium text-primary">3</span>
              </div>
              <div>
                <h3 className="text-sm font-medium">
                  Enable Features (Optional)
                </h3>
                <p className="text-sm text-muted-foreground">
                  Add advanced features to boost your agent's internal powers
                </p>
              </div>
            </div>
          </div>

          <Button type="button" onClick={onSubmit} loading={isCreating}>
            Create
          </Button>
        </div>
      )}
      {agent?._id && (
        <Launch
          open={showLaunch}
          onOpenChange={setShowLaunch}
          agent={agent}
          currentUser={currentUser}
          userId={userId}
        />
      )}
    </div>
  );
}
