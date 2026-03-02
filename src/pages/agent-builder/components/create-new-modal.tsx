import { useEffect, useState } from "react";
import {
  Check,
  MessagesSquare,
  Network,
  Sparkles,
  Workflow,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Path } from "@/lib/types";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";

type AgentType = "all" | "agent" | "workflow" | "managerial-agent";

interface AgentOption {
  id: AgentType;
  title: string;
  badge: string;
  icon: "sparkles" | "zap" | "workflow";
  iconBg: string;
  features: string[];
  image: string;
}

const agentOptions: AgentOption[] = [
  {
    id: "agent",
    title: "Single Agent",
    badge: "Basic",
    icon: "sparkles",
    iconBg: "bg-emerald-100 text-emerald-800",
    features: ["Easy to get started", "Standalone agent"],
    image: "/agent-builder/agent.png",
  },
  {
    id: "managerial-agent",
    title: "Managerial Orchestration",
    badge: "Badge",
    icon: "zap",
    iconBg: "bg-pink-100 text-pink-800",
    features: [
      "Multi-agent setup where a Manager supervises other agents",
      "Truly agentic, flexible, and non-deterministic",
      "Requires individual agents to be created beforehand",
    ],
    image: "/agent-builder/manager.png",
  },
  {
    id: "workflow",
    title: "Workflows",
    badge: "Badge",
    icon: "workflow",
    iconBg: "bg-indigo-100 text-indigo-800",
    features: [
      "Multi-agent system following a predefined, structured path",
      "Ideal for predictable, repeatable processes",
      "Requires individual agents to be created beforehand",
    ],
    image: "/agent-builder/workflow.png",
  },
];

const iconMap = {
  sparkles: MessagesSquare,
  zap: Network,
  workflow: Workflow,
};

interface CreateNewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent_type: AgentType;
  currentGroupName?: string | null;
}

export function CreateNewModal({
  open,
  onOpenChange,
  agent_type,
  currentGroupName,
}: CreateNewModalProps) {
  const navigate = useNavigate();
  const [selectedOption, setSelectedOption] = useState<AgentType>("agent");

  const trackEvent = (type: AgentType) => {
    if (!mixpanel.hasOwnProperty("cookie") || !isMixpanelActive) return;

    switch (type) {
      case "all":
      case "agent":
        mixpanel.track("New agent clicked");
        break;
      case "managerial-agent":
        mixpanel.track("New manager agent clicked");
        break;
      case "workflow":
        mixpanel.track("New workflow clicked");
        break;
      default:
        break;
    }
  };

  const handleCreate = () => {
    trackEvent(selectedOption);
    const groupParam = currentGroupName ? `?group_name=${currentGroupName}` : '';
    switch (selectedOption) {
      case "all":
      case "agent":
        navigate(`${Path.AGENT_CREATE}${groupParam}`);
        break;
      case "managerial-agent":
        navigate(`${Path.ORCHESTRATION}${groupParam}`);
        break;
      case "workflow":
        navigate(`${Path.NEW_WORKFLOW_BUILDER}${groupParam}`);
        break;
      default:
        navigate(`${Path.AGENT_CREATE}${groupParam}`);
        break;
    }
  };

  useEffect(() => {
    setSelectedOption(agent_type);
  }, [agent_type]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl gap-0 p-0">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle className="text-xl font-semibold">
            Create New
          </DialogTitle>
        </DialogHeader>

        <div className="flex">
          {/* Left side - Options */}
          <div className="flex-1 space-y-3 p-6">
            <RadioGroup
              value={selectedOption}
              onValueChange={(value) => setSelectedOption(value as AgentType)}
            >
              {agentOptions.map((option) => {
                const Icon = iconMap[option.icon];
                const isSelected = selectedOption === option.id;

                return (
                  <Label
                    key={option.id}
                    className={cn(
                      "cursor-pointer gap-4 rounded-lg border-2 border-border p-4 transition-all",
                      isSelected ? "bg-accent/50" : "",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "flex size-6 flex-shrink-0 items-center justify-center rounded-sm",
                            option.iconBg,
                          )}
                        >
                          <Icon className="size-3" />
                        </div>
                        <h3 className="text-sm font-semibold">
                          {option.title}
                        </h3>
                      </div>
                      {/* Radio button */}
                      <RadioGroupItem
                        value={option.id}
                        className="flex-shrink-0"
                      />
                    </div>

                    {/* Content */}
                    <div className="mt-2 min-w-0 flex-1">
                      <div className="space-y-1">
                        {option.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                            <span className="text-xs leading-relaxed text-muted-foreground">
                              {feature}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Label>
                );
              })}
            </RadioGroup>

            <Link to={Path.BLUEPRINTS}>
              <Button size="sm" variant="ghost" asChild className="mt-2">
                <Sparkles className="mr-1 size-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No ideas? Check out our blueprints
                </p>
              </Button>
            </Link>
          </div>

          {/* Right side - Preview */}
          <div className="grid w-[55%] place-items-center border-l p-6">
            <div className="overflow-hidden rounded-lg border bg-card shadow-sm animate-in animate-out slide-in-from-bottom-4 slide-out-to-top-4">
              <motion.img
                key={selectedOption}
                src={agentOptions.find((a) => a.id === selectedOption)?.image}
                alt="Agent Builder Preview"
                className="h-full w-full object-cover"
                initial={{ y: 5, opacity: 0.5 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -5, opacity: 0.5 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t bg-muted/30 px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate}>Create</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
