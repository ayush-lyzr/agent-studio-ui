import { Key, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import Configure from "./configure";
import Jdisplay from "./json-display";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordian";
import ConfigureLLM from "./llm-configure";
import { LinkedInLogoIcon } from "@radix-ui/react-icons";
import { Mail, ParkingCircle } from "lucide-react";
import { Check, ChevronsUpDown } from "lucide-react";
import useStore from "@/lib/store";
import { Input } from "@/components/ui/input";
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
import ToolsTab from "./tools";

const updateJsonData = (modules: any[], rags: any[]) => {
  return modules
    .filter((module) => module.enabled)
    .map((module) => {
      const baseModule: any = {
        type: module.type,
        priority: module.priority,
      };

      if (module.type === "KNOWLEDGE_BASE") {
        const ragName = module.config.lyzr_rag.value;
        const ragId = rags.find((rag) => rag.name === ragName)?.id;
        baseModule.config = {
          lyzr_rag: {
            base_url: `${import.meta.env.VITE_RAG_URL}`,
            rag_id: ragId?.toString(),
          },
        };
      } else if (module.type === "TOOL_CALLING") {
        baseModule.config = {
          max_tries: 5,
        };
      } else if (module.config !== null) {
        baseModule.config = module.config;
      }

      return baseModule;
    });
};

export default function EnvironmentTab() {
  const rags = useStore((state: any) => state.rags);
  // console.log(ragsArray);

  const default_modules = [
    {
      name: "Tool Calling",
      type: "TOOL_CALLING",
      priority: 0,
      config: {
        max_tries: {
          name: "Max Tries",
          type: "input",
        },
      },
      sn: "Sync",
      configurable: true,
      enabled: false,
    },
    {
      name: "Short-term Memory",
      type: "SHORT_TERM_MEMORY",
      description: "Adds recent contextual memory",
      priority: 0,
      config: null,
      sn: "Sync",
      configurable: false,
      enabled: false,
    },
    {
      name: "Long-term Memory",
      type: "LONG_TERM_MEMORY",
      description:
        "Adds long contextual memory using multiple retrieval and summarization strategies",
      priority: 0,
      config: null,
      sn: "Sync",
      configurable: false,
      enabled: false,
    },
    {
      name: "RAG Knowledge Base",
      type: "KNOWLEDGE_BASE",
      description:
        "Adds Lyzr RAG capabilities with fully customizable retriever configurations",
      priority: 0,
      config: {
        lyzr_rag: {
          name: "RAG Store ID",
          type: "select",
          options: rags.map((rag: any) => rag.name),
        },
      },
      sn: "Sync",
      configurable: true,
      enabled: false,
    },
    {
      name: "Humanizer",
      type: "HUMANIZER",
      description: "Adds human-like responses to the agent",
      priority: 0,
      config: null,
      sn: "Sync",
      configurable: false,
      enabled: false,
    },
    {
      name: "OpenAI Retrieval",
      type: "OPEN_AI_RETRIEVAL_ASSISTANT",
      description: "Adds retrieval capabilities using OpenAI's retriever",
      priority: 0,
      config: null,
      sn: "Sync",
      configurable: false,
      enabled: false,
    },
  ];

  const [modules, setModules] = useState(default_modules);

  const default_tools = [
    {
      name: "Perplexity Tool",
      logo: <ParkingCircle />,
      enabled: false,
      desc: "Provides ability to search the internet",
      id: "perplexity_search",
      config: {
        api_key: "",
        model: "",
      },
    },
    {
      name: "LinkedIn Tool",
      logo: <LinkedInLogoIcon />,
      enabled: false,
      desc: "Provides ability to post on linkedin",
      id: "post_image_and_text_linkedin",
      config: {
        token: "",
      },
    },
    {
      name: "Mail Tool",
      logo: <Mail />,
      enabled: false,
      desc: "Provides ability to send an email",
      id: "send_email",
      config: {
        username: "",
        password: "",
        host: "",
        port: "",
        sender_email: "",
        reply_to_email: "",
      },
    },
  ];

  // const api_key = useStore((state: any) => state.api_key);
  // const setApiKey = useStore((state: any) => state.setApiKey);

  const environments = useStore((state: any) => state.environments);
  // const setEnvironments = useStore((state: any) => state.setEnvironments);

  // const agents = useStore((state: any) => state.agents);
  // const setAgents = useStore((state: any) => state.setAgents);

  const [env, setEnv] = useState({
    name: "",
    _id: "new",
    provider: "openai",
    llm_api_key: "",
    AWS_ACCESS_KEY_ID: "",
    AWS_SECRET_ACCESS_KEY: "",
    AWS_REGION_NAME: "",
    temperature: 0.5,
    top_p: 0.9,
    model: "gpt-4o-mini",
  });

  // const [openAIKey, setOpenAIKey] = useState("")

  const [nameError, setNameError] = useState<string | null>(null);

  const [tools, setTools] = useState(default_tools);

  function enabledTools(tools: string[], toolList: any[]) {
    return toolList.map((tool: any) => {
      if (tools.includes(tool.id)) {
        return { ...tool, enabled: true };
      }
      return { ...tool, enabled: false };
    });
  }

  function enabledModules(modules: any[], moduleList: any[]) {
    return moduleList.map((module: any) => {
      const foundModule = modules.find((m: any) => m.type === module.type);
      if (foundModule) {
        return { ...module, enabled: true };
      }
      return { ...module, enabled: false };
    });
  }

  const setSelectedConfig = (env: any) => {
    const updatedTools = enabledTools(env.tools, default_tools);
    setTools(updatedTools);

    const updatedModules = enabledModules(env.features, default_modules);

    const isAnyToolEnabled = updatedTools.some((tool) => tool.enabled);
    const finalModules = updatedModules.map((module) => {
      if (module.type === "TOOL_CALLING") {
        return { ...module, enabled: isAnyToolEnabled };
      }
      if (module.type === "KNOWLEDGE_BASE") {
        const envKnowledgeBase = env.features.find(
          (f: any) => f.type === "KNOWLEDGE_BASE",
        );
        if (
          envKnowledgeBase &&
          envKnowledgeBase.config &&
          envKnowledgeBase.config.lyzr_rag
        ) {
          const ragId = envKnowledgeBase.config.lyzr_rag.rag_id;
          const ragName = rags.find(
            (rag: any) => rag.id.toString() === ragId,
          )?.name;
          return {
            ...module,
            enabled: true,
            config: {
              ...module.config,
              lyzr_rag: {
                ...module.config.lyzr_rag,
                value: ragName || "",
              },
            },
          };
        }
      }
      return module;
    });

    setModules(finalModules);

    setEnv({
      ...env,
      temperature: env.llm_config?.config?.temperature || 0.5,
      top_p: env.llm_config?.config?.top_p || 0.9,
      provider: env.llm_config?.provider || "openai",
      model: env.llm_config?.model || "",
      llm_api_key: env.llm_config?.env?.OPENAI_API_KEY || "",
      AWS_ACCESS_KEY_ID: env.llm_config?.env?.AWS_ACCESS_KEY_ID || "",
      AWS_SECRET_ACCESS_KEY: env.llm_config?.env?.AWS_SECRET_ACCESS_KEY || "",
      AWS_REGION_NAME: env.llm_config?.env?.AWS_REGION_NAME || "",
    });
  };

  const setNewConfig = () => {
    setModules(default_modules);
    setTools(default_tools);
    setEnv({
      name: "",
      _id: "new",
      provider: "openai",
      llm_api_key: "",
      AWS_ACCESS_KEY_ID: "",
      AWS_SECRET_ACCESS_KEY: "",
      AWS_REGION_NAME: "",
      temperature: 0,
      top_p: 0.9,
      model: "",
    });
  };

  const handleSwitchChange = (index: any) => {
    setModules((prevModules) =>
      prevModules.map((module, i) =>
        i === index ? { ...module, enabled: !module.enabled } : module,
      ),
    );
  };

  const HandleToolSwitchChange = (index: any) => {
    setTools((prevTools) => {
      const newTools = prevTools.map((tool, i) =>
        i === index ? { ...tool, enabled: !tool.enabled } : tool,
      );

      const isAnyToolEnabled = newTools.some((tool) => tool.enabled);

      setModules((prevModules) =>
        prevModules.map((module) =>
          module.type === "TOOL_CALLING"
            ? { ...module, enabled: isAnyToolEnabled }
            : module,
        ),
      );

      return newTools;
    });
  };

  const setModuleConfig = (module_type: any, config: any) => {
    setModules((prevModules) =>
      prevModules.map((module) =>
        module.type === module_type ? { ...module, config } : module,
      ),
    );
  };

  const setAIConfig = (data: any) => {
    setEnv({
      ...env,
      provider: data.modelVendor,
      llm_api_key: data.apiKey,
      AWS_ACCESS_KEY_ID: data.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: data.AWS_SECRET_ACCESS_KEY,
      AWS_REGION_NAME: data.AWS_REGION_NAME,
      temperature: data.temperature,
      top_p: data.top_p,
      model: data.model,
    });
  };

  const setEnvId = (id: string) => {
    setEnv((prevEnv) => ({ ...prevEnv, _id: id }));
  };

  const validateEnvironmentName = () => {
    const trimmedName = env.name.trim();
    if (trimmedName === "") {
      setNameError("Please provide a unique name for the environment.");
      return false;
    }

    const isDuplicate = environments.some(
      (existingEnv: any) =>
        existingEnv.name === trimmedName && existingEnv._id !== env._id,
    );

    if (isDuplicate) {
      setNameError(
        "An environment with this name already exists. Please choose a unique name.",
      );
      return false;
    }

    setNameError(null);
    return true;
  };

  const updateToolConfig = (index: number, config: any) => {
    setTools((prevTools) =>
      prevTools.map((tool, i) =>
        i === index ? { ...tool, config: { ...tool.config, ...config } } : tool,
      ),
    );
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEnv({ ...env, name: e.target.value });
    if (nameError) {
      setNameError(null);
    }
  };

  useEffect(() => {
    setJsonData((prevData) => ({
      ...prevData,
      _id: env._id,
    }));
  }, [env._id]);

  const [envSection, setEnvSection] = useState(0);

  const [jsonData, setJsonData] = useState({
    name: env.name || "",
    features: updateJsonData(modules, rags),
    tools: tools.filter((tool) => tool.enabled).map((tool) => tool.id),
    llm_config: {
      provider: env.provider,
      model: env.model,
      config: {
        temperature: env.temperature,
        top_p: env.top_p,
      },
      env:
        env.provider === "openai"
          ? {
              OPENAI_API_KEY: env.llm_api_key,
            }
          : {
              AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
              AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
              AWS_REGION_NAME: env.AWS_REGION_NAME,
            },
    },
  });

  useEffect(() => {
    const newJsonData = {
      name: env.name || "",
      features: updateJsonData(modules, rags),
      tools: tools.filter((tool) => tool.enabled).map((tool) => tool.id),
      llm_config: {
        provider: env.provider,
        model: env.model,
        config: {
          temperature: env.temperature,
          top_p: env.top_p,
        },
        env:
          env.provider === "openai"
            ? {
                OPENAI_API_KEY: env.llm_api_key,
              }
            : {
                AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
                AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
                AWS_REGION_NAME: env.AWS_REGION_NAME,
              },
      },
    };

    if (JSON.stringify(newJsonData) !== JSON.stringify(jsonData)) {
      setJsonData(newJsonData);
    }
  }, [env, modules, tools, rags]);

  const [open, setOpen] = useState(false);

  return (
    <TabsContent value="environment" className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="mt-4 w-full justify-between md:mt-8"
            >
              {env.name || "Select environment or Create new..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[90vw] rounded-lg bg-opacity-20 p-0 shadow-lg backdrop-blur-lg backdrop-filter md:w-[40rem]">
            <Command className="max-h-[50vh] overflow-hidden md:max-h-[300px]">
              <CommandInput
                placeholder="Search environment..."
                className="h-9"
              />
              <CommandEmpty>No environment found.</CommandEmpty>
              <div className="max-h-[45vh] overflow-y-auto md:max-h-[300px]">
                <CommandGroup>
                  <CommandItem
                    onSelect={() => {
                      setNewConfig();
                      setOpen(false);
                    }}
                    className="font-bold"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        env._id === "new" ? "opacity-100" : "opacity-0",
                      )}
                    />
                    Create new environment +
                  </CommandItem>
                  <Separator className="my-2" />
                  {environments.map(
                    (curEnv: { _id: Key | null | undefined; name: any }) => (
                      <CommandItem
                        key={curEnv._id}
                        onSelect={() => {
                          setSelectedConfig(curEnv);
                          setOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            env._id === curEnv._id
                              ? "opacity-100"
                              : "opacity-0",
                          )}
                        />
                        {curEnv.name || "Untitled"}
                      </CommandItem>
                    ),
                  )}
                </CommandGroup>
              </div>
            </Command>
          </PopoverContent>
        </Popover>
        <div>
          <p className="font-semibold">Environment Name:</p>
          <Input
            className={cn(
              "mt-2",
              nameError && "border-red-500 focus-visible:ring-red-500",
            )}
            value={env.name}
            onChange={handleNameChange}
            placeholder="Untitled"
          />
          {nameError && (
            <p className="mt-1 text-sm text-red-500">{nameError}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="col-span-1 space-y-4">
          <div className="mb-[-1rem] mt-4 grid grid-cols-3 gap-2 md:gap-4">
            {["LLM", "Modules", "Tools"].map((title, index) => (
              <Card
                key={index}
                className={cn(
                  "relative mb-4 flex cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-muted text-center shadow-md transition duration-300 sm:h-[50%]",
                  envSection === index
                    ? "dark:border-primary-dark border-2 border-primary"
                    : "dark:hover:border-primary-dark hover:border-primary",
                )}
                onClick={() => setEnvSection(index)}
              >
                <CardContent
                  className="flex h-full flex-col items-center justify-center p-2 md:p-4"
                  style={{ position: "relative", zIndex: 2 }}
                >
                  <div className="text-sm font-bold text-opacity-50 md:text-xl">
                    {title}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {envSection === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                  Configure your LLM:
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ConfigureLLM
                  key={env._id}
                  config={{
                    modelVendor: env.provider,
                    apiKey: env.llm_api_key,
                    AWS_ACCESS_KEY_ID: env.AWS_ACCESS_KEY_ID,
                    AWS_SECRET_ACCESS_KEY: env.AWS_SECRET_ACCESS_KEY,
                    AWS_REGION_NAME: env.AWS_REGION_NAME,
                    temperature: env.temperature,
                    top_p: env.top_p,
                    model: env.model,
                  }}
                  setAIConfig={setAIConfig}
                />
              </CardContent>
            </Card>
          )}

          {envSection === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">
                  Enable Modules for extra functionality:
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible>
                  {modules.map((module, index) => {
                    if (module.name === "Tool Calling") {
                      return null;
                    }

                    return (
                      <Card key={index} className="mt-4">
                        <AccordionItem value={`item-${index}`}>
                          <div className="flex flex-col items-start justify-between rounded-md bg-muted p-2 md:flex-row md:items-center md:p-4">
                            <div className="mb-2 flex flex-col items-start md:mb-0 md:flex-row md:items-center">
                              <div>
                                <div className="flex flex-col items-start md:flex-row md:items-center">
                                  <p className="mb-1 font-bold md:mb-0 md:mr-2">
                                    {module.name}
                                  </p>
                                  <Card className="px-2 py-1 text-xs md:text-sm">
                                    <p>{module.sn}</p>
                                  </Card>
                                </div>
                                <p className="mt-1 text-sm text-gray-400 md:mt-0">
                                  {module.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex w-full items-center justify-end md:w-auto">
                              {module.configurable && (
                                <AccordionTrigger className="flex-grow">
                                  Configure
                                </AccordionTrigger>
                              )}
                              <Switch
                                className="ml-4"
                                checked={module.enabled}
                                onCheckedChange={() =>
                                  handleSwitchChange(index)
                                }
                              />
                            </div>
                          </div>
                          <AccordionContent className="mt-2">
                            {module.configurable ? (
                              <Configure
                                config={module.config}
                                type={module.type}
                                setModuleConfig={setModuleConfig}
                              />
                            ) : (
                              <div className="pt-4 text-center">
                                Configuration Not Available
                              </div>
                            )}
                          </AccordionContent>
                        </AccordionItem>
                      </Card>
                    );
                  })}
                </Accordion>
              </CardContent>
            </Card>
          )}

          {envSection === 2 && (
            <ToolsTab
              tools={tools}
              handleToolSwitchChange={HandleToolSwitchChange}
              updateToolConfig={updateToolConfig}
            />
          )}
        </div>

        <div className="mt-4 md:mt-0">
          <Jdisplay
            title={"Environment Configuration:"}
            setNewId={setEnvId}
            key={env._id}
            id={env._id}
            endpoint="/v2/environment"
            jsonData={jsonData}
            setEnvSection={setEnvSection}
            currentSection={envSection}
            isSingleSection={false}
            validateBeforeNext={validateEnvironmentName}
          />
        </div>
      </div>
    </TabsContent>
  );
}
