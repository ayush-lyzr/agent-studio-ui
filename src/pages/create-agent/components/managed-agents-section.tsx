import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFieldArray, UseFormReturn } from "react-hook-form";
import {
  Plus,
  RefreshCw,
  X,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Check,
} from "lucide-react";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import useStore from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { IAgent } from "@/lib/types";
import { useAgentBuilder } from "@/pages/agent-builder/agent-builder.service";

interface ManagedAgentsSectionProps {
  form: UseFormReturn<any>;
  selectedAgents: string[];
  setSelectedAgents: (agents: string[]) => void;
  onReset?: () => void;
  setIsManagerAgent: (value: boolean) => void;
}

interface ManagedAgent {
  id: string;
  name: string;
  usage_description: string;
}

const ManagedAgentsSection: React.FC<ManagedAgentsSectionProps> = ({
  form,
  onReset,
  setIsManagerAgent,
}) => {
  const [agents, setAgents] = useState<IAgent[]>([]);
  const [managedAgents, setManagedAgents] = React.useState<ManagedAgent[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [openPopovers, setOpenPopovers] = React.useState<boolean[]>([]);
  const apiKey = useStore((state) => state.api_key);

  const { isFetchingAgents, getAgents } = useAgentBuilder({ apiKey });

  const {
    fields: formA2ATools,
    append: addA2ARow,
    remove: removeA2ARow,
  } = useFieldArray({
    name: "a2a_tools",
    control: form.control,
  });

  const resetManagedAgents = () => {
    if (managedAgents.length === 0 && formA2ATools.length === 0)
      setManagedAgents([{ id: "", name: "", usage_description: "" }]);
    onReset?.();
  };

  const handleRefresh = async () => {
    // Fetch agents
    const agentsRes = await getAgents();
    setAgents(agentsRes.data);
  };

  const handleAgentSelect = (value: string, index: number) => {
    const selectedAgent = agents?.find((agent) => agent._id === value);
    const newAgents = [...managedAgents];
    newAgents[index] = {
      ...managedAgents[index],
      id: value,
      name: selectedAgent?.name || "",
      usage_description: managedAgents[index].usage_description,
    };
    setManagedAgents(newAgents);

    // Close the popover for this index
    const newOpenPopovers = [...openPopovers];
    newOpenPopovers[index] = false;
    setOpenPopovers(newOpenPopovers);
  };

  useEffect(() => {
    if (!isInitialized) return;

    const validAgents = managedAgents.filter(
      (agent) => agent.id || agent.usage_description,
    );
    const formattedAgents = validAgents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      usage_description: agent.usage_description,
    }));

    if (validAgents.length > 0 || managedAgents.length === 0) {
      form.setValue("managed_agents", formattedAgents, { shouldDirty: true });
    }
  }, [managedAgents, form, isInitialized]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const formManagedAgents = form.getValues("managed_agents");
      if (Array.isArray(formManagedAgents) && formManagedAgents.length > 0) {
        const validAgents = formManagedAgents
          .filter((agent) => agent && (agent.id || agent.usage_description))
          .map((agent) => ({
            id: agent.id || "",
            name: agent.name || "",
            usage_description: agent.usage_description || "",
          }));

        if (validAgents.length > 0) {
          setManagedAgents(validAgents);
        }
      }
      setIsInitialized(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, [form]);

  useEffect(() => {
    handleRefresh();
    return () => {
      resetManagedAgents();
    };
  }, []);

  useEffect(() => {
    if (
      isInitialized &&
      managedAgents.length === 0 &&
      formA2ATools.length === 0
    ) {
      onReset?.();
      // setIsManagerAgent(false);
    }
  }, [managedAgents.length, isInitialized, onReset, setIsManagerAgent]);

  // Initialize popover state when managedAgents changes
  useEffect(() => {
    setOpenPopovers(new Array(managedAgents.length).fill(false));
  }, [managedAgents.length]);

  return (
    <FormField
      control={form.control}
      name="managed_agents"
      render={() => (
        <FormItem className="mt-4">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            <p className="text-xs text-yellow-500">
              Manager agents perform best with high-reasoning models (e.g., Gemini 2.5+, Claude 4 series, GPT-5 series)
            </p>
          </div>
          <div className="space-y-4">
            {managedAgents.length > 0 && (
              <fieldset className="grid gap-2 rounded-lg border p-2">
                <legend className="text-xxs">Agents</legend>
                {managedAgents.map((agent, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={handleRefresh}
                        disabled={isFetchingAgents}
                        className="h-9"
                      >
                        <RefreshCw
                          className={cn(
                            "h-4 w-4",
                            isFetchingAgents && "animate-spin",
                          )}
                        />
                      </Button>
                      <div className="w-[200px]">
                        <Popover
                          open={openPopovers[index] || false}
                          onOpenChange={(open) => {
                            const newOpenPopovers = [...openPopovers];
                            newOpenPopovers[index] = open;
                            setOpenPopovers(newOpenPopovers);
                          }}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="h-9 w-[200px] justify-between"
                              type="button"
                            >
                              <span className="w-[90%] truncate">
                                {agent.name || "Select an agent"}
                              </span>
                              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>

                          <PopoverContent className="w-[260px] p-0">
                            <Command>
                              <CommandInput placeholder="Search agents..." />

                              <CommandList>
                                <CommandEmpty className="p-2 text-sm text-gray-500">
                                  No agents found.
                                </CommandEmpty>

                                <CommandGroup>
                                  {agents?.map((storeAgent) => (
                                    <CommandItem
                                      key={storeAgent._id}
                                      onSelect={() => {
                                        handleAgentSelect(
                                          storeAgent._id,
                                          index,
                                        );
                                      }}
                                      className="flex items-center justify-between"
                                      value={storeAgent.name}
                                    >
                                      <span className="truncate">
                                        {storeAgent.name}
                                      </span>
                                      {agent.id === storeAgent._id && (
                                        <Check className="h-4 w-4 text-green-600" />
                                      )}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                      {/* <Select
                    value={agent.id}
                    onValueChange={(value) => handleAgentSelect(value, index)}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select an agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {storeAgents?.map((storeAgent) => (
                        <SelectItem key={storeAgent._id} value={storeAgent._id}>
                          {storeAgent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select> */}
                    </div>
                    <div className="flex flex-1 gap-2">
                      <div className="relative flex-1">
                        <Input
                          className="w-full pr-6"
                          placeholder="How would you use this agent?"
                          value={agent.usage_description}
                          onChange={(e) => {
                            const newAgents = [...managedAgents];
                            newAgents[index] = {
                              ...agent,
                              usage_description: e.target.value,
                            };
                            setManagedAgents(newAgents);
                          }}
                        />
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link
                            to={`/agent-create/${agent.id}`}
                            target="_blank"
                            className={buttonVariants({
                              variant: "outline",
                              size: "icon",
                            })}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>View Agent</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            className="group"
                            onClick={() => {
                              setManagedAgents(
                                managedAgents.filter((_, i) => i !== index),
                              );
                            }}
                          >
                            <X className="h-4 w-4 group-hover:text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove Agent</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </fieldset>
            )}
            {formA2ATools.length > 0 && (
              <fieldset className="grid gap-2 rounded-lg border p-2">
                <legend className="text-xxs">A2A</legend>
                {formA2ATools?.map((field, idx) => (
                  <div key={field.id} className="flex gap-4">
                    <div className="flex flex-1 gap-2">
                      <div className="relative flex-1">
                        <FormField
                          name={`a2a_tools.${idx}.base_url`}
                          render={({ field: subField }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  className="w-full pr-6"
                                  placeholder="Enter your A2A server url"
                                  {...subField}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            variant="outline"
                            size="icon"
                            type="button"
                            className="group"
                            onClick={() => removeA2ARow(idx)}
                          >
                            <X className="h-4 w-4 group-hover:text-destructive" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Remove Agent</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))}
              </fieldset>
            )}

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="w-full items-center justify-center"
                size="sm"
                onClick={() => {
                  setManagedAgents([
                    ...managedAgents.filter((a) => a.id),
                    { id: "", name: "", usage_description: "" },
                  ]);
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Agent
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full items-center justify-center"
                size="sm"
                onClick={() => {
                  addA2ARow({ base_url: "" });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add A2A server
              </Button>
            </div>
          </div>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default ManagedAgentsSection;
