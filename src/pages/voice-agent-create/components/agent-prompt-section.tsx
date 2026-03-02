import React, { useEffect, useState } from "react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { WandSparkles, Maximize2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UseFormReturn } from "react-hook-form";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { ConversationAgentDialog } from "./conversation-agent-dialog";
import AgentMentionTextarea from "./AgentMentionTextarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import ManagedAgentsSection from "./managed-agents-section";
import { isMixpanelActive } from "@/lib/constants";
import mixpanel from "mixpanel-browser";

interface AgentPromptSectionProps {
  form: UseFormReturn<any>;
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

const AgentPromptSection: React.FC<AgentPromptSectionProps> = ({ form }) => {
  const [expandedField, setExpandedField] = useState<
    "agent_role" | "agent_goal" | "agent_instructions" | null
  >(null);
  const [isConversationAgent, setIsConversationAgent] = useState(false);
  const getInitialManagedAgentIds = () => {
    const managedAgents = form.getValues("managed_agents");
    return Array.isArray(managedAgents)
      ? managedAgents
          .filter((agent) => agent && agent.id)
          .map((agent) => agent.id)
      : [];
  };
  const [selectedAgents, setSelectedAgents] = useState<string[]>(() =>
    getInitialManagedAgentIds(),
  );
  const [isManagerAgent, setIsManagerAgent] = useState(
    () => getInitialManagedAgentIds().length > 0,
  );
  const managedAgents = form.watch("managed_agents");

  useEffect(() => {
    const list = Array.isArray(managedAgents)
      ? managedAgents.filter((agent) => agent && agent.id)
      : [];
    setSelectedAgents(list.map((agent) => agent.id));
    if (list.length > 0) {
      setIsManagerAgent(true);
    }
  }, [managedAgents]);

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

  return (
    <div className="space-y-3 rounded-lg border p-3">
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
              <span className="text-sm">Agent Goal</span>
            </LabelWithTooltip>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="Your goal is to address and resolve customer inquiries."
                  className="h-9 border pr-10 text-sm transition-all duration-300"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex h-7 w-7 items-center justify-center"
                    onClick={() => setExpandedField("agent_goal")}
                  >
                    <Maximize2 className="h-3 w-3" />
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
                  <span className="text-sm">Agent Role</span>
                </LabelWithTooltip>
              </FormLabel>
              <Button
                variant="outline"
                type="button"
                size="sm"
                onClick={() => setIsConversationAgent(true)}
              >
                <WandSparkles className="mr-1 h-3 w-3 text-primary" />
                <span className="text-xs">Generate with AI</span>
              </Button>
            </div>
            <FormControl>
              <div className="relative">
                <Input
                  {...field}
                  placeholder="You are an expert customer support agent."
                  className="h-9 border pr-10 text-sm transition-all duration-300"
                />
                <div className="absolute right-1 top-1/2 -translate-y-1/2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="flex h-7 w-7 items-center justify-center"
                    onClick={() => setExpandedField("agent_role")}
                  >
                    <Maximize2 className="h-3 w-3" />
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
                <span className="text-sm">Agent Instructions</span>
              </LabelWithTooltip>
            </FormLabel>
            <div className="relative">
              <FormControl>
                <div className="relative">
                  <AgentMentionTextarea
                    value={field.value || ""}
                    onChange={field.onChange}
                    onAgentMention={handleAgentMention}
                    rows={12}
                    placeholder="LISTEN to the customer's concern & GATHER all relevant information needed for resolution. PROVIDE clear and concise answers to the customer."
                    className="h-[100px] resize-none border text-sm transition-all duration-300"
                  />
                  <div className="absolute bottom-2 right-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="right-2 h-7 w-7"
                      onClick={() => setExpandedField("agent_instructions")}
                    >
                      <Maximize2 className="h-3 w-3" />
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
                  Prerequisite: Agents used as sub-agents to be created prior to
                  be added to the manager agent. Note: Only non-voice agents can
                  be managed.
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
        placeholder="LISTEN to the customer's concern & GATHER all relevant information needed for resolution. PROVIDE clear and concise answers to the customer."
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
