import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WandSparkles, Maximize2 } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UseFormReturn } from "react-hook-form";
import { Switch } from "@/components/ui/switch";
import ManagedAgentsSection from "./managed-agents-section";
import { BASE_URL, isDevEnv, isMixpanelActive } from "@/lib/constants";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { Link, useLocation } from "react-router-dom";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { ConversationAgentDialog } from "./conversation-agent-dialog";
import AgentMentionTextarea from "./AgentMentionTextarea";
import mixpanel from "mixpanel-browser";

interface AgentPromptSectionProps {
  form: UseFormReturn<any>;
  apiKey: string;
}

export const ExpandFieldDialog: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: "agent_role" | "agent_goal" | "agent_instructions";
  title: string;
  placeholder?: string;
  form: UseFormReturn<any>;
  onAgentMention: (agentId: string, agentName: string) => void;
}> = ({
  open,
  onOpenChange,
  name,
  title,
  placeholder,
  form,
  onAgentMention,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <FormField
          control={form.control}
          name={name}
          render={({ field }) => (
            <AgentMentionTextarea
              value={field.value || ""}
              onChange={field.onChange}
              onAgentMention={onAgentMention}
              rows={15}
              placeholder={placeholder}
              className="min-h-[300px] w-full"
            />
          )}
        />

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AgentPromptSection: React.FC<AgentPromptSectionProps> = ({
  form,
  apiKey,
}) => {
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const location = useLocation();
  const [isPromptImproved, setIsPromptImproved] = useState(false);
  const [expandedField, setExpandedField] = useState<
    "agent_role" | "agent_goal" | "agent_instructions" | null
  >(null);
  const [isNewAgent, setIsNewAgent] = useState(true);
  const [isManagerAgent, setIsManagerAgent] = useState(
    location.state?.isManagerAgent ?? false,
  );
  const [, setFormInitialized] = useState(false);

  const [selectedAgents, setSelectedAgents] = useState<string[]>(() => {
    const managedAgents = form.getValues("managed_agents");
    return Array.isArray(managedAgents)
      ? managedAgents
          .filter((agent) => agent && agent.id)
          .map((agent) => agent.id)
      : [];
  });
  const [isConversationAgent, setIsConversationAgent] = useState(false);

  // Handle agent mention - add to managed_agents when agent is mentioned with @
  const handleAgentMention = (agentId: string, agentName: string) => {
    const currentManagedAgents = form.getValues("managed_agents") || [];

    // Check if agent is already in managed_agents
    const isAlreadyAdded = currentManagedAgents.some(
      (agent: any) => agent.id === agentId,
    );

    if (!isAlreadyAdded) {
      const newManagedAgent = {
        id: agentId,
        name: agentName,
        usage_description: `Referenced via @mention in instructions`,
      };

      const updatedManagedAgents = [...currentManagedAgents, newManagedAgent];

      form.setValue("managed_agents", updatedManagedAgents, {
        shouldDirty: true,
        shouldValidate: true,
      });

      // Update selected agents state
      setSelectedAgents((prev) => [...prev, agentId]);

      // Automatically enable manager agent mode
      setIsManagerAgent(true);

      console.log(`Added agent ${agentName} to managed_agents via @mention`);
    }
  };

  const agentRole = form.watch("agent_role") ?? "";
  const agentGoal = form.watch("agent_goal") ?? "";
  const agentInstructions = form.watch("agent_instructions") ?? "";

  const hasContent =
    (agentRole && agentRole.length > 0) ||
    (agentGoal && agentGoal.length > 0) ||
    (agentInstructions && agentInstructions.length > 0);

  useEffect(() => {
    if (hasContent) {
      setIsNewAgent(false);
    }
  }, [hasContent]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const managedAgents = form.getValues("managed_agents");
      const managedA2ATools = form.getValues("a2a_tools");
      if (Array.isArray(managedAgents) && managedAgents.length > 0) {
        const hasValidAgents = managedAgents.some(
          (agent) => agent && (agent.id || agent.usage_description),
        );

        if (hasValidAgents) {
          setIsManagerAgent(true);
        }
      }
      if (Array.isArray(managedA2ATools) && managedA2ATools.length > 0) {
        setIsManagerAgent(true);
      }
      setFormInitialized(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [form, form.getValues("managed_agents")]);

  const improvePrompt = async () => {
    setIsImprovingPrompt(true);
    setIsPromptImproved(false);
    try {
      const roleAndInstructions = `
        Agent Role : ${form.getValues("agent_role")}
        Agent Goal : ${form.getValues("agent_goal")}
        Agent Instructions : ${form.getValues("agent_instructions")}
      `;

      const response = await axios.post(
        `/v3/inference/chat/`,
        {
          user_id: "studio",
          agent_id: isDevEnv
            ? "6822ea3b8ee3fcec7d31c9c1"
            : "682d6c9dced2bfaff52a78e3",
          message: roleAndInstructions,
          session_id: isDevEnv
            ? "6822ea3b8ee3fcec7d31c9c1-ycsl1paihbe"
            : "682d6c9dced2bfaff52a78e3-9orjfopy1gg",
        },
        {
          baseURL: BASE_URL,
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
            "Content-Type": "application/json",
          },
        },
      );

      const responseText = response.data.response;
      const roleMatch = responseText.match(/ROLE:(.*?)(?=INSTRUCTIONS:|$)/s);
      const instructionsMatch = responseText.match(/INSTRUCTIONS:(.*?)$/s);

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Improve prompt clicked");
      if (roleMatch && instructionsMatch) {
        form.setValue("agent_role", roleMatch[1].trim());
        form.setValue("agent_instructions", instructionsMatch[1].trim());
        setIsPromptImproved(true);
        setIsNewAgent(false);
      } else {
        toast({
          title: "Invalid response format from the improvement service.",
        });
      }
    } catch (error) {
      console.error("Error:", error);
      toast({
        title: "There was an issue improving the prompt. Please try again.",
      });
    } finally {
      setIsImprovingPrompt(false);
    }
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={form.control}
        name="agent_role"
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between">
              <FormLabel>
                <LabelWithTooltip
                  align="start"
                  tooltip="Define the primary role of your agent."
                  tooltipExample="Example: You are an
                      expert customer support agent. Your role is to understand
                      customer queries and provide the right answers. Focus on
                      solving problems."
                >
                  Agent Role
                </LabelWithTooltip>
              </FormLabel>
              <Button
                variant="outline"
                type="button"
                onClick={() => setIsConversationAgent(true)}
              >
                <WandSparkles className="mr-2 h-4 w-4 text-primary" />
                Generate with AI
              </Button>
            </div>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="You are an expert customer support agent."
                  className={cn(
                    "border pr-10 transition-all duration-300",
                    isImprovingPrompt ? "opacity-50" : "",
                    isPromptImproved ? "success-border" : "",
                  )}
                  disabled={isImprovingPrompt}
                />
                {isImprovingPrompt && (
                  <div
                    className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                    style={{
                      backgroundSize: "200% 100%",
                      animation: "shimmer 2s infinite",
                    }}
                  />
                )}
                {isPromptImproved && (
                  <div className="success-glow pointer-events-none absolute inset-0" />
                )}
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex h-8 w-8 items-center justify-center"
                    onClick={() => setExpandedField("agent_role")}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="agent_goal"
        render={({ field }) => (
          <FormItem>
            <LabelWithTooltip
              align="start"
              tooltip="Defines what the agent is expected to achieve."
              tooltipExample="Example: Your goal is to address and resolve the customer inquiry."
            >
              Agent Goal
            </LabelWithTooltip>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="Your goal is to address and resolve customer inquiries."
                  className="border pr-10 transition-all duration-300"
                  disabled={isImprovingPrompt}
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex h-8 w-8 items-center justify-center"
                    onClick={() => setExpandedField("agent_goal")}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="agent_instructions"
        render={({ field }) => (
          <FormItem>
            <FormLabel>
              <LabelWithTooltip
                align="start"
                tooltip="Define the instructions for your agent. This could include providing context, listing tasks the agent should perform, setting any constraints or guardrails, and specifying the desired tone and style of response."
                tooltipExample="Example: Listen to the customer's concern and gather relevant information needed for resolution. Provide clear and concise action steps for the customer. Use a professional and soothing tone to answer."
              >
                Agent Instructions
              </LabelWithTooltip>
            </FormLabel>
            <div className="relative">
              <FormControl>
                <div className="relative">
                  <AgentMentionTextarea
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAgentMention={handleAgentMention}
                    rows={4}
                    placeholder="LISTEN to the customer's concern & GATHER all relevant information needed for resolution. PROVIDE clear and concise answers to the customer. Type @ to mention other agents."
                    className={`resize-none border
                      ${isImprovingPrompt ? "opacity-50" : ""}
                      ${isPromptImproved ? "success-border" : ""}
                      transition-all duration-300`}
                    disabled={isImprovingPrompt}
                  />
                  {isImprovingPrompt && (
                    <div
                      className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
                      style={{
                        backgroundSize: "200% 100%",
                        animation: "shimmer 2s infinite",
                      }}
                    />
                  )}
                  {isPromptImproved && (
                    <div className="success-glow pointer-events-none absolute inset-0" />
                  )}
                  <div className="absolute bottom-2 right-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="right-2"
                      onClick={() => setExpandedField("agent_instructions")}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </FormControl>
            </div>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Switch
            id="manager-agent"
            checked={isManagerAgent}
            onCheckedChange={(checked) => {
              setIsManagerAgent(checked);
              if (!checked) {
                form.setValue("managed_agents", [], { shouldDirty: true });
              }
            }}
          />
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="inline-flex cursor-help items-center gap-2">
                  <label
                    htmlFor="manager-agent"
                    className="cursor-help text-sm font-medium underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground"
                  >
                    Manager Agent
                  </label>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="max-w-[280px]"
              >
                <p>
                  A Manager Agent coordinates multiple sub-agents to execute
                  complex, multi-step tasks. It handles task delegation and
                  ensures end-to-end completion. Use it when your workflow
                  involves several agents with distinct responsibilities. <br />
                </p>
                <p className="mt-2 italic">
                  Prerequisite: Agents used as a sub-agents to be created prior
                  to be added to the manager agent
                </p>
                <p className="mt-2 italic">
                  Example: A Product Manager Agent can oversee drafting
                  requirements, creating user stories, prioritizing them, and
                  updating Slack and Notion—all through its sub-agents.
                </p>
                <Link
                  to={"https://www.avanade.com/en-gb/services"}
                  target="_blank"
                  className="ml-2 mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("Docs-clicked", {
                        feature: "Manager Agent",
                      });
                  }}
                >
                  Docs
                  <ArrowTopRightIcon className="ml-1 size-3" />
                </Link>
                <Link
                  to={"https://www.avanade.com/en-gb/services"}
                  target="_blank"
                  className="ml-2 mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("API-clicked", {
                        feature: "Manager Agent",
                      });
                  }}
                >
                  API
                  <ArrowTopRightIcon className="ml-1 size-3" />
                </Link>
                <Link
                  to={"https://www.youtube.com/watch?v=NwmG-jPZu-g"}
                  target="_blank"
                  className="ml-2 mt-3 inline-flex items-center text-xs text-link underline-offset-4 hover:underline"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("Video-clicked", {
                        feature: "Manager Agent",
                      });
                  }}
                >
                  Video
                  <ArrowTopRightIcon className="ml-1 size-3" />
                </Link>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <Button
          type="button"
          onClick={improvePrompt}
          disabled={isImprovingPrompt}
          variant="link"
          size="sm"
          className={cn(
            "underline underline-offset-4 transition-all duration-300",
            isNewAgent &&
              hasContent &&
              "animate-shine border-primary/20 bg-gradient-to-r from-transparent via-primary/10 to-transparent",
          )}
        >
          {isImprovingPrompt ? "Improving..." : "Improve prompt"}
        </Button>
      </div>

      {isManagerAgent && (
        <ManagedAgentsSection
          form={form}
          selectedAgents={selectedAgents}
          setSelectedAgents={setSelectedAgents}
          onReset={() => setSelectedAgents([])}
          setIsManagerAgent={setIsManagerAgent}
        />
      )}

      <ExpandFieldDialog
        open={expandedField === "agent_role"}
        onOpenChange={(open) => setExpandedField(open ? "agent_role" : null)}
        name="agent_role"
        title="Agent Role"
        placeholder="You are an expert customer support agent."
        form={form}
        onAgentMention={handleAgentMention}
      />

      <ExpandFieldDialog
        open={expandedField === "agent_goal"}
        onOpenChange={(open) => setExpandedField(open ? "agent_goal" : null)}
        name="agent_goal"
        title="Agent Goal"
        placeholder="Your goal is to address and resolve customer inquiries."
        form={form}
        onAgentMention={handleAgentMention}
      />

      <ExpandFieldDialog
        open={expandedField === "agent_instructions"}
        onOpenChange={(open) =>
          setExpandedField(open ? "agent_instructions" : null)
        }
        name="agent_instructions"
        title="Agent Instructions"
        placeholder="LISTEN to the customer's concern & GATHER all relevant information needed for resolution. PROVIDE clear and concise answers to the customer. Type @ to mention other agents."
        form={form}
        onAgentMention={handleAgentMention}
      />

      <ConversationAgentDialog
        isOpen={isConversationAgent}
        onClose={() => setIsConversationAgent(false)}
        onAgentGenerated={(agent) => {
          const fieldMap: Record<string, string> = {
            agent_role: "agent_role",
            agent_goal: "agent_goal",
            agent_instructions: "agent_instructions",
            agent_name: "name",
            agent_description: "description",
          };

          Object.entries(fieldMap).forEach(([agentKey, formKey]) => {
            const value = agent[agentKey as keyof typeof agent];
            if (value) {
              form.setValue(formKey as any, value, { shouldDirty: true });
            }
          });
        }}
      />
    </div>
  );
};

export default AgentPromptSection;
