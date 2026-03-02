import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import ConfigureAgent from "./agent-configure";
import Jdisplay from "./json-display";
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
import { Separator } from "@/components/ui/separator";

export default function AgentTab() {
  const [open, setOpen] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);

  const newAgent = {
    id: "",
    name: "",
    system_prompt: "You are a helpful agent",
    agent_description: "A test agent",
    env_id: "",
  };
  const [agent, setAgent] = useState(newAgent);
  const [isNewAgent, setIsNewAgent] = useState(true);

  const environments = useStore((state: any) => state.environments);
  const agents = useStore((state: any) => state.agents);

  const setAgentConfig = (data: any) => {
    setAgent((prevAgent) => ({ ...prevAgent, ...data }));
    if (nameError) {
      // setNameError(null);
    }
  };

  const getEnvNameFromId = (envId: any) => {
    const env = environments.find((e: any) => e._id === envId);
    return env ? env.name : "";
  };

  useEffect(() => {
    setIsNewAgent(agent.id === "");
  }, [agent.id]);

  useEffect(() => {
    if (selectedAgentId) {
      const selectedAgent = agents.find((a: any) => a.id === selectedAgentId);
      if (selectedAgent) {
        setAgent(selectedAgent);
      }
    } else {
      setAgent(newAgent);
    }
  }, [selectedAgentId, agents]);

  const handleAgentSelect = (agentId: any) => {
    setSelectedAgentId(agentId);
    setOpen(false);
    setNameError(null);
  };

  const validateAgentName = () => {
    const trimmedName = agent.name.trim();
    if (trimmedName === "") {
      setNameError("Please provide a name for the agent.");
      return false;
    }

    const isDuplicate = agents.some(
      (existingAgent: any) =>
        existingAgent.name === trimmedName && existingAgent.id !== agent.id,
    );

    if (isDuplicate) {
      setNameError(
        "An agent with this name already exists. Please choose a unique name.",
      );
      return false;
    }

    setNameError(null);
    return true;
  };

  return (
    <TabsContent value="agent" className="space-y-4">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between sm:w-1/2"
          >
            {agent.name || "Select agent or Create new..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 sm:w-[40rem]">
          <Command className="max-h-[300px] overflow-hidden">
            <CommandInput placeholder="Search agent..." className="h-9" />
            <CommandEmpty>No agent found.</CommandEmpty>
            <div className="max-h-[300px] overflow-y-auto">
              <CommandGroup>
                <CommandItem
                  onSelect={() => handleAgentSelect("")}
                  className="font-bold"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      agent.id === "" ? "opacity-100" : "opacity-0",
                    )}
                  />
                  Create new agent +
                </CommandItem>
                <Separator className="my-2" />

                {agents.map((curAgent: any) => (
                  <CommandItem
                    key={curAgent.id}
                    onSelect={() => handleAgentSelect(curAgent.id)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        agent.id === curAgent.id ? "opacity-100" : "opacity-0",
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

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle>Configure your Agent here:</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            {agent && (
              <ConfigureAgent
                key={`config-${agent.id || "new"}`}
                config={{
                  env_id: agent.env_id,
                  env_name: getEnvNameFromId(agent.env_id),
                  name: agent.name,
                  system_prompt: agent.system_prompt,
                  agent_description: agent.agent_description,
                }}
                setAgentConfig={setAgentConfig}
                environments={environments}
                nameError={nameError}
              />
            )}
          </CardContent>
        </Card>
        <div className="col-span-1 lg:col-span-1">
          <Jdisplay
            setNewId={(newId: any) => {
              setAgent((prev) => ({ ...prev, id: newId }));
              setSelectedAgentId(newId);
            }}
            key={`display-${agent.id || "new"}`}
            id={agent.id}
            endpoint="/v2/agent"
            title={"Agent Configuration:"}
            jsonData={{
              ...(isNewAgent ? {} : { id: agent.id }),
              name: agent.name,
              system_prompt: agent.system_prompt,
              agent_description: agent.agent_description,
              env_id: agent.env_id,
            }}
            setEnvSection={() => {}}
            currentSection={3}
            isSingleSection={true}
            validateBeforeNext={validateAgentName}
          />
        </div>
      </div>
    </TabsContent>
  );
}
