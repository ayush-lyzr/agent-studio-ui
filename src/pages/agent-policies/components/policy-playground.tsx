import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAEPPolicies } from "../aep.service";
import { IAEPPolicy } from "../types";
import { useGroups } from "../../groups/groups.service";
import { IGroup } from "@/pages/groups/types";
import useStore from "@/lib/store";

// Actor types for simulation
type ActorType = "high" | "medium" | "low" | "functional_group";

interface Actor {
  id: string;
  type: ActorType;
  name: string;
  group_id?: string;
}

// Message structure for chat
interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
}

export default function PolicyPlayground() {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const { agents } = useStore((state) => state);

  // State for selections
  const [selectedPolicy, setSelectedPolicy] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [selectedActor, setSelectedActor] = useState<string>("");
  const [chatInput, setChatInput] = useState<string>("");
  const apiKey = useStore((state) => state.api_key);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "system",
      content:
        "Welcome to the Agent Entitlement Policy Playground. Select a policy, agent, and actor to test policy enforcement.",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Get data from services
  const { policies } = useAEPPolicies(token);
  const { groups, getAllGroups } = useGroups(token);

  // Generate actors from sensitivities and groups
  const [actors, setActors] = useState<Actor[]>([]);

  // Get groups on load
  useEffect(() => {
    if (token) {
      getAllGroups();
    }
  }, [token, getAllGroups]);

  // Generate actor options when groups are loaded
  useEffect(() => {
    const baseActors: Actor[] = [
      {
        id: "high-data-sensitivity",
        type: "high",
        name: "High Data Sensitivity Agent",
      },
      {
        id: "medium-data-sensitivity",
        type: "medium",
        name: "Medium Data Sensitivity Agent",
      },
      {
        id: "low-data-sensitivity",
        type: "low",
        name: "Low Data Sensitivity Agent",
      },
    ];

    // Add functional group actors
    const groupActors: Actor[] =
      groups?.map((group: IGroup) => ({
        id: group._id,
        type: "functional_group",
        name: `${group.name} Group Agent`,
        group_id: group._id,
      })) || [];

    setActors([...baseActors, ...groupActors]);
  }, [groups]);

  // Check if selected actor is authorized based on policy
  const isActorAuthorized = (): boolean => {
    if (!selectedPolicy || !selectedActor) return false;

    const policy = policies?.find(
      (p: IAEPPolicy) => p.policy_id === selectedPolicy,
    );
    if (!policy) return false;

    const actor = actors.find((a) => a.id === selectedActor);
    if (!actor) return false;

    // Debug information
    console.log("Policy check:", {
      policyId: policy.policy_id,
      policyName: policy.metadata.name,
      actorType: actor.type,
      actorId: actor.id,
      actorName: actor.name,
      allowedGroups: policy.properties.allowed_functional_groups,
      allowedSensitivities: policy.properties.allowed_sensitivities,
      groupId: actor.group_id,
    });

    // Special rule: High sensitivity actors always have access
    if (actor.type === "high") {
      console.log("High sensitivity actor always allowed");
      return true;
    }

    // Check authorization based on actor type
    if (actor.type === "functional_group") {
      // For functional group actors, check if their group_id is in allowed_functional_groups
      if (
        !policy.properties.allowed_functional_groups ||
        policy.properties.allowed_functional_groups.length === 0
      ) {
        // If no functional groups are specified in the policy, deny access
        console.log("No functional groups allowed in policy");
        return false;
      }

      // Check if the actor's group_id is in the policy's allowed_functional_groups
      const isAllowed = policy.properties.allowed_functional_groups.some(
        (groupId: string) => groupId === actor.group_id,
      );

      // Check if the group name matches (as an alternative)
      const groupName = groups?.find(
        (g: IGroup) => g._id === actor.group_id,
      )?.name;
      const policyName = policy.metadata.name;
      const nameMatchesPolicy =
        groupName &&
        policyName &&
        policyName.toLowerCase().includes(groupName.toLowerCase());

      const allowAccess = isAllowed || nameMatchesPolicy;
      console.log("Functional group access:", {
        groupId: actor.group_id,
        groupName,
        policyName,
        isIdAllowed: isAllowed,
        nameMatchesPolicy,
        finalDecision: allowAccess,
      });

      return allowAccess;
    } else {
      // For other sensitivity levels (medium, low)
      if (
        !policy.properties.allowed_sensitivities ||
        policy.properties.allowed_sensitivities.length === 0
      ) {
        // If no sensitivities are specified in the policy, deny access
        console.log("No sensitivity levels allowed in policy");
        return false;
      }

      const isAllowed = policy.properties.allowed_sensitivities.some(
        (sensitivity: string) => sensitivity === actor.type,
      );
      console.log("Sensitivity level access:", isAllowed);
      return isAllowed;
    }
  };

  // Send message to chat
  const sendMessage = async () => {
    if (
      !chatInput.trim() ||
      !selectedPolicy ||
      !selectedAgent ||
      !selectedActor
    ) {
      toast.error("Please fill in all fields before sending a message");
      return;
    }

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    // Check if authorized
    const authorized = isActorAuthorized();

    // Simulate loading time
    setTimeout(async () => {
      if (authorized) {
        try {
          // Get IDs for inference
          const sessionId = uuidv4();
          const userId = uuidv4();

          // Call inference API with Axios instead of fetch
          const response = await axios.post(
            `${import.meta.env.VITE_BASE_URL}/v3/inference/chat/`,
            {
              user_id: userId,
              agent_id: selectedAgent,
              session_id: sessionId,
              message: chatInput,
            },
            {
              headers: {
                "Content-Type": "application/json",
                "x-api-key": apiKey,
              },
            },
          );

          // Add agent response to chat
          const assistantMessage: ChatMessage = {
            role: "assistant",
            content:
              response.data.response || "I don't know how to respond to that.",
            timestamp: new Date(),
          };

          setChatMessages((prev) => [...prev, assistantMessage]);
        } catch (error) {
          console.error("Error in agent inference:", error);

          // Add error message to chat
          const errorMessage: ChatMessage = {
            role: "system",
            content:
              "Error: Failed to communicate with the agent. Please try again.",
            timestamp: new Date(),
          };

          setChatMessages((prev) => [...prev, errorMessage]);
        }
      } else {
        // Add unauthorized message to chat
        const unauthorizedMessage: ChatMessage = {
          role: "system",
          content:
            "Unauthorized: The selected actor does not have access to this agent based on the chosen policy.",
          timestamp: new Date(),
        };

        setChatMessages((prev) => [...prev, unauthorizedMessage]);
      }

      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="grid max-h-[100vh] grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Selection panel */}
      <div className="rounded-xl border border-input p-4 text-card-foreground shadow-sm lg:col-span-1 ">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Policy Playground</h3>
        </div>
        <div className="space-y-6">
          {/* Policy selection */}
          <div className="space-y-2">
            <Label>Select Policy</Label>
            <Select value={selectedPolicy} onValueChange={setSelectedPolicy}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a policy" />
              </SelectTrigger>
              <SelectContent>
                {policies?.map((policy: IAEPPolicy) => (
                  <SelectItem key={policy.policy_id} value={policy.policy_id}>
                    {policy.metadata.name ||
                      `Policy ${policy.policy_id.substring(0, 8)}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Agent selection */}
          <div className="space-y-2">
            <Label>Select Agent</Label>
            <Select value={selectedAgent} onValueChange={setSelectedAgent}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an agent" />
              </SelectTrigger>
              <SelectContent>
                {Array.isArray(agents) && agents.length > 0 ? (
                  agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      {agent.name || `Agent ${agent._id.substring(0, 8)}`}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem disabled value="no-agents">
                    No agents available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Actor selection */}
          <div className="space-y-2">
            <Label>Select Actor</Label>
            <Select value={selectedActor} onValueChange={setSelectedActor}>
              <SelectTrigger>
                <SelectValue placeholder="Choose an actor" />
              </SelectTrigger>
              <SelectContent>
                {actors.map((actor) => (
                  <SelectItem key={actor.id} value={actor.id}>
                    {actor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Policy info */}
          {selectedPolicy && (
            <div className="mt-4 border-t pt-4">
              <h3 className="mb-2 font-medium">Selected Policy Details:</h3>
              {policies && (
                <div className="space-y-1 text-sm text-muted-foreground">
                  {(() => {
                    const policy = policies.find(
                      (p: IAEPPolicy) => p.policy_id === selectedPolicy,
                    );
                    if (!policy) return null;

                    return (
                      <>
                        <p>
                          <span className="font-medium">Name:</span>{" "}
                          {policy.metadata.name}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{" "}
                          {policy.properties.policy_type}
                        </p>
                        <p>
                          <span className="font-medium">Sensitivity:</span>{" "}
                          {policy.properties.sensitivity}
                        </p>
                        <p>
                          <span className="font-medium">Functional Group:</span>{" "}
                          {policy.properties.functional_group}
                        </p>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className="rounded-xl border border-input p-4 shadow-sm lg:col-span-2">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Test Chat</h3>
        </div>
        <div className="flex h-[500px] flex-col">
          {/* Chat messages */}
          <div className="mb-4 flex-1 space-y-4 overflow-y-auto pr-2">
            {chatMessages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-2 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : message.role === "assistant"
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-accent"
                  }`}
                >
                  <p>{message.content}</p>
                  <p className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-secondary px-4 py-2 text-secondary-foreground">
                  <div className="flex space-x-2">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-current"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-current delay-100"></div>
                    <div className="h-2 w-2 animate-bounce rounded-full bg-current delay-200"></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex gap-2">
            <Input
              placeholder="Type your message..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={
                !selectedPolicy || !selectedAgent || !selectedActor || isLoading
              }
            />
            <Button
              onClick={sendMessage}
              disabled={
                !selectedPolicy || !selectedAgent || !selectedActor || isLoading
              }
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
