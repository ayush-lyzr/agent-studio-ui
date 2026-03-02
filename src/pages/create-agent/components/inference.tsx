import { useState, useRef, useEffect } from "react";
import ChatBox from "../../studio/components/chatbox";
import ActivityLog from "@/pages/studio/components/activity-log";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  RocketIcon,
  ExternalLink,
  MessageSquare,
  Activity,
  RefreshCcw,
} from "lucide-react";
import { Launch } from "./launch";
import { Link } from "react-router-dom";
import { IAgent, MemberstackCurrentUser, UserRole } from "@/lib/types";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSortedActivities } from "@/hooks/useSortedActivities";
import { MAIA_FRONTEND_URL, IS_PROPHET_DEPLOYMENT } from "@/lib/constants";
import useStore from "@/lib/store";
interface InferenceProps {
  agent: Partial<IAgent>;
  appId?: string;
  isLaunched?: boolean;
  userId: string;
  currentUser: Partial<MemberstackCurrentUser>;
  agentUserId?: string;
  onSubmit?: () => void;
  isCreating?: boolean;
  features?: any[];
  tool?: string | null;
  tools?: any[];
  managedAgents?: any[];
  agentRegistryData?: any;
  refetchRegistry?: () => void;
  isSharedAgent?: boolean;
}

export default function Inference({
  agent,
  appId,
  isLaunched,
  currentUser,
  userId,
  onSubmit,
  isCreating,
  features = [],
  tool,
  tools,
  managedAgents = [],
  agentRegistryData,
  refetchRegistry,
  agentUserId,
  isSharedAgent,
}: InferenceProps) {
  const [chatText, setChatText] = useState("");
  const [userName] = useState(currentUser?.auth?.email || "");
  const [chatHistory] = useState([]);
  const [isLoadingHistory] = useState(false);
  const [showLaunch, setShowLaunch] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const [_, setActivityMessages] = useState<any[]>([]);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const apiKey = useStore((state) => state.api_key);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );


  // const { data: agentRegistryData, refetch } = useQuery<AgentRegistryData>({
  //   queryKey: ["agentRegistry", agent?._id],
  //   queryFn: async () => {
  //     const res = await axios.get(`/api/v1/agent-registry/${agent?._id}`, {
  //       baseURL: MAIA_URL,
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     return res.data;
  //   },
  //   enabled: !!agent?._id,
  // });



  // const isLaunched = !!agentRegistryData?.is_present;
  // const appId = agentRegistryData?.id;


  const isActionable =
    [UserRole.owner, 'role_admin'].includes(
      current_organization?.role as UserRole,
    ) || agentUserId === apiKey;


  // Quick fix for the prophet deployment 
  // this needs to support both the Roles
  // const isActionable =
  //   [UserRole.role_admin, UserRole.role_owner, UserRole.role_builder].includes(
  //     current_organization?.role as UserRole,
  //   )

  const isManagerAgent = managedAgents.length >= 0 ? true : false;

  const enableVoiceInput = features.some((feature) => feature.type === "VOICE");

  const { clearEvents, addEvent, sortedEvents } = useSortedActivities();

  const handleSwitchToActivity = () => {
    setActiveTab("activity");
  };

  const [sessionKey, setSessionKey] = useState(Date.now());
  const chatBoxRef = useRef<any>(null);

  const handleRefresh = () => {
    if (chatBoxRef?.current?.startNewSession) {
      console.log("Starting new session...");
      chatBoxRef.current.startNewSession();
      clearEvents();
      setActivityMessages([]);
      setSessionKey(Date.now());
    }
  };

  useEffect(() => {
    if (agent?._id) {
      setSessionKey(Date.now());
      setActivityMessages([]);
      clearEvents();
    }
  }, [agent?._id]);

  // Fetch registry data if it's empty
  useEffect(() => {
    if (IS_PROPHET_DEPLOYMENT && agent?._id && !agentRegistryData && refetchRegistry) {
      refetchRegistry();
    }
  }, [agent?._id, agentRegistryData, refetchRegistry]);

  const appLink = IS_PROPHET_DEPLOYMENT ? `${MAIA_FRONTEND_URL}/agent-library/${agent?._id}` : `/agent/${appId}`

  return (
    <div className="flex-1">
      <div className="flex flex-row items-center justify-between space-y-0 pb-4">
        <Label className="text-lg font-semibold">
          {agent?._id ? "Test Agent Inference" : ""}
        </Label>
        {agent?._id && isActionable && (
          <div>
            {isLaunched ? (
              <Link to={appLink} target="_blank">
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Agent
                </Button>
              </Link>
            ) : (
              <Button variant="outline" onClick={() => setShowLaunch(true)}>
                <RocketIcon className="mr-2 h-4 w-4" />
                {IS_PROPHET_DEPLOYMENT
                  ? (agentRegistryData?.is_present ? "Update in Maia" : "Publish to Maia")
                  : "Launch Agent"}
              </Button>
            )}
          </div>
        )}
      </div>
      {agent?._id ? (
        managedAgents.length >= 0 ? (
          <Tabs
            defaultValue="chat"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="mb-4 flex items-center gap-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat" className="flex items-center">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat
                </TabsTrigger>
                <TabsTrigger value="activity" className="flex items-center">
                  <Activity className="mr-2 h-4 w-4" />
                  Activity
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
                setActivityMessages={setActivityMessages}
                isLoadingHistory={isLoadingHistory}
                features={features}
                tool={tool}
                tools={tools}
                enableVoiceInput={enableVoiceInput}
                isManagerAgent={isManagerAgent}
                onSwitchToActivity={handleSwitchToActivity}
                onGeneratingChange={setIsGeneratingResponse}
                addEvent={addEvent}
                isSharedAgent={isSharedAgent}
              />
            </TabsContent>
            <TabsContent
              value="activity"
              className="h-full"
              style={{ display: activeTab === "activity" ? "block" : "none" }}
            >
              <ActivityLog
                key={`activity-${sessionKey}`}
                messages={sortedEvents}
                isProcessing={isGeneratingResponse}
                setMessages={setActivityMessages}
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
        <div className="flex h-[calc(100vh-100px)] flex-col items-center justify-center space-y-8">
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
          updatedMode={agentRegistryData?.is_present}
          initialValues={agentRegistryData}
          onSuccess={refetchRegistry}
        />
      )}
    </div>
  );
}
