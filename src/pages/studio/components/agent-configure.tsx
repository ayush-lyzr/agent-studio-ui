import axios from "axios";
import React, { useEffect, useState } from "react";
import { z, ZodSchema } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { Info, WandSparkles } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface AgentConfig {
  env_id: string;
  name: string;
  system_prompt: string;
  agent_description: string;
}

interface ConfigureAgentProps {
  config: AgentConfig & { env_name: string };
  setAgentConfig: (data: AgentConfig) => void;
  environments: Array<{ _id: string; name: string }>;
  nameError?: string | null;
}

const agentSchema: ZodSchema = z.object({
  env_name: z.string().min(1, { message: "Environment is required" }),
  name: z.string().min(1, { message: "Name is required" }),
  system_prompt: z.string().min(1, { message: "System Prompt is required" }),
  agent_description: z
    .string()
    .min(1, { message: "Agent Description is required" }),
});

const ConfigureAgent: React.FC<ConfigureAgentProps> = ({
  config,
  setAgentConfig,
  environments,
  nameError,
}) => {
  const [isImprovingPrompt, setIsImprovingPrompt] = useState(false);
  const [isPromptImproved, setIsPromptImproved] = useState(false);

  const form = useForm({
    resolver: zodResolver(agentSchema),
    defaultValues: config,
    mode: "onChange",
  });

  const envName = useWatch({
    control: form.control,
    name: "env_name",
  });

  useEffect(() => {
    const selectedEnv = environments.find((env) => env.name === envName);
    if (selectedEnv) {
      const updatedData: AgentConfig = {
        name: form.getValues("name"),
        system_prompt: form.getValues("system_prompt"),
        agent_description: form.getValues("agent_description"),
        env_id: selectedEnv._id,
      };
      setAgentConfig(updatedData);
    }
  }, [envName, environments, setAgentConfig, form]);

  function onSubmit(data: Omit<AgentConfig, "env_id"> & { env_name: string }) {
    const selectedEnv = environments.find((env) => env.name === data.env_name);
    const updatedData: AgentConfig = {
      name: data.name,
      system_prompt: data.system_prompt,
      agent_description: data.agent_description,
      env_id: selectedEnv ? selectedEnv._id : "",
    };
    setAgentConfig(updatedData);
  }

  const improvePrompt = async () => {
    setIsImprovingPrompt(true);
    try {
      const userInput = form.getValues("system_prompt");
      const id = "magic23509326";
      const response = await axios.post(
        `https://magic-prompt-lyzr.replit.app/generate_prompt/?user_input=${userInput}&id=${id}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      form.setValue("system_prompt", response.data.MagicPrompt);
      setIsPromptImproved(true);
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
    <div>
      <Form {...form}>
        <form onChange={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="px-4 pt-2">
            <div className="card-top-rectangle"></div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a unique name"
                        {...field}
                        className={cn(
                          "mt-1",
                          nameError &&
                            "border-red-500 focus-visible:ring-red-500",
                        )}
                      />
                    </FormControl>
                    {nameError && (
                      <p className="mt-1 text-sm text-red-500">{nameError}</p>
                    )}
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="env_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Environment</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select environment" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {environments.map((env) => (
                          <SelectItem
                            key={env._id}
                            value={env.name || "Untitled"}
                          >
                            {env.name || "Untitled"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="system_prompt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>System Prompt</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={6}
                        placeholder="Enter System Prompt"
                        className={
                          isPromptImproved
                            ? "h-64 resize-none"
                            : "h-32 resize-none"
                        }
                        {...field}
                      />
                    </FormControl>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={improvePrompt}
                        disabled={isImprovingPrompt}
                      >
                        <WandSparkles className="mr-2 h-4" />
                        {isImprovingPrompt ? "Improving..." : "Improve Prompt"}
                      </Button>
                      <div className="flex text-sm text-gray-500">
                        <Info className="h-4" />
                        Powered by Lyzr MagicPrompts
                      </div>
                    </div>

                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="agent_description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter Agent Description"
                        className="h-32 resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default ConfigureAgent;
