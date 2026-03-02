import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "@/lib/axios";
import { MAIA_URL } from "@/lib/constants";
import { motion } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  useNavigate,
  useParams,
  useLocation,
  useBlocker,
  useSearchParams,
} from "react-router-dom";
import {
  TriangleAlert,
  ArrowLeft,
  Clock8,
  TelescopeIcon,
  EllipsisVerticalIcon,
} from "lucide-react";
import mixpanel from "mixpanel-browser";
import { Switch } from "@/components/ui/switch";

import { Button } from "@/components/custom/button";
import { Separator } from "@/components/ui/separator";
import { BasicDetails } from "./components/basic-details-optimized";
import { Features } from "./components/features";
import Inference from "./components/inference";
import { Form } from "@/components/ui/form";
import useStore from "@/lib/store";
import {
  useAgentBuilder,
  useUserApps,
} from "../agent-builder/agent-builder.service";
import { useToast } from "@/components/ui/use-toast";
import { FormValues, Tool, ToolConfig } from "./types";
import { IAgent, Path } from "@/lib/types";
import { isMixpanelActive, IS_PROPHET_DEPLOYMENT } from "@/lib/constants";
import {
  cn,
  convertToJSONString,
  convertJSONStringToArray,
  formatDate,
  isStringifiedJSONString,
  hasPermission,
} from "@/lib/utils";
import AgentApiDialog from "./components/agent-api-dialog";
import VersionHistory from "@/pages/create-agent/components/version-history";
import { useAgentVersionsService } from "./version-history.service";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { Link } from "react-router-dom";
import { formSchema } from "./schema";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { addAssetToGroup } from "@/services/groupsApiService";
import { Slider } from "@/components/ui/slider";
import { useSchedulerService } from "./components/automation.service";
import { FEATURES_CONFIG, type FeatureDefinition } from "@/data/features";
// Comprehensive Zod schema for OpenAPI Schema Object (v3.0+)

export default function CreateAgent() {
  const location = useLocation();
  const { agentId } = useParams();
  const [params] = useSearchParams();
  // isLaunched and appId are accessed via location.state in isAgentLaunched() and Inference component
  const group_name = params.get("group_name");
  const navigate = useNavigate();
  const { toast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const apiKey = useStore((state) => state?.api_key ?? "");
  const addAgent = useStore((state: any) => state?.addAgent);
  const currentUser = useManageAdminStore((state) => state?.current_user);
  const current_organization = useManageAdminStore(
    (state) => state?.current_organization,
  );
  const userId = currentUser?.id ?? "";
  const userName = currentUser?.auth?.email ?? "";
  const [, setEnabledFeaturesCount] = useState<number>(0);
  const [agent, setAgent] = useState<Partial<IAgent>>({});
  const [agentAPI, setAgentAPI] = useState<Partial<IAgent>>({});
  const [sessionId, setSessionId] = useState("");
  const [isHistoryOn, setIsHistoryOn] = useState(false);
  const isSharedAgent = agent?.api_key ? agent?.api_key !== apiKey : false;

  // Check if user has permission to update agents
  const canUpdateAgent = hasPermission("agents:update", current_organization);
  const [isReadOnly, setIsReadOnly] = useState(!canUpdateAgent);

  const [selectedVersion, setSelectedVersion] = useState<{
    timestamp: string;
    config: any;
    version_id: string;
  } | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [showVersionHeader, setShowVersionHeader] = useState(false);
  const [initialValues, setInitialValues] = useState<FormValues | null>(null);
  const { isActivatingVersion, setVersionActive } = useAgentVersionsService({
    apiKey,
    agentId,
  });
  const [structuredOpErrors, setStructuredOpErrors] = useState<string[]>([]);

  const token = useStore((state) => state?.app_token ?? "");
  const { data: userApps = [] } = useUserApps(userId, token);

  interface AgentRegistryData {
    creator_id: string;
    agent_name: string;
    agent_description: string;
    agent_role: string;
    agent_goal: string;
    agent_instruction: string;
    tags: Record<string, string[]>;
    is_public: boolean;
    id: string;
    agent_id: string;
    is_present?: boolean;
    data?: string;
  }

  const { data: agentRegistryData, refetch: refetchRegistry } =
    useQuery<AgentRegistryData>({
      queryKey: ["agentRegistry", agentId],
      queryFn: async () => {
        const res = await axios.get(`/api/v1/agent-registry/${agentId}`, {
          baseURL: MAIA_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      },
      enabled: !!agentId && IS_PROPHET_DEPLOYMENT,
    });

  const {
    createAgent,
    updateAgent,
    getAgentById,
    isFetchingAgentById,
    isCreatingAgent,
    isUpdatingAgent,
  } = useAgentBuilder({
    apiKey,
    permission_type: "agent",
    agentId,
  });

  const { getScheduleByAgentId } = useSchedulerService({ apiKey });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema({ scrollRef, setStructuredOpErrors })),
    defaultValues: {
      name: "",
      description: "",
      agent_role: "",
      agent_instructions: "",
      examples: "",
      features: [],
      response_format: { type: "text" },
      tools: [],
      tool_configs: [],
      provider_id: "OpenAI",
      model: "gpt-5-mini",
      temperature: 0.7,
      top_p: 0.9,
      llm_credential_id: "lyzr_openai",
      store_messages: true,
      file_output: false,
      image_output_config: null,
      max_iterations: 25,
    },
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      Object.keys(form.formState.dirtyFields).length > 0 &&
      currentLocation.pathname !== nextLocation.pathname,
  );

  const fetchAgentData = useCallback(async () => {
    try {
      const response = await getAgentById();
      setAgent(response.data);
      setAgentAPI(response.data);
      setSessionId(`${agentId}-${Math.random().toString(36).substring(2, 15)}`);

      if (response.data) {
        const agent = response.data;

        const toolDescriptionMap = {};
        let toolsData = [];
        if (
          agent.tool &&
          typeof agent.tool === "string" &&
          !Array.isArray(agent.tools)
        ) {
          toolsData = [
            {
              name: agent.tool,
              usage_description: agent.tool_usage_description ?? "",
            },
          ];
        } else if (Array.isArray(agent.tools) && agent.tools.length > 0) {
          if (agent.tool_usage_description) {
            const descriptionLines = agent.tool_usage_description.split("\n");
            // @ts-ignore
            descriptionLines.forEach((line, index) => {
              const match = line.match(/^([^:]+):\s*(.*)/);
              if (match && match.length >= 3) {
                const description = match[2].trim();
                // @ts-ignore
                toolDescriptionMap[index] = description;
              }
            });
          }
        }

        if (isStringifiedJSONString(agent.tool_usage_description)) {
          // @ts-ignore
          toolsData = convertJSONStringToArray(agent.tool_usage_description);
        } else if (toolsData.length === 0 && agent?.tools?.length > 0) {
          // @ts-ignore
          toolsData = agent.tools.map((toolName, index) => ({
            name: toolName,
            // @ts-ignore
            usage_description: toolDescriptionMap[index] || "",
            tool_source: agent.tool_configs?.[index]?.tool_source ?? "",
            server_id: agent.tool_configs?.[index]?.server_id,
            persist_auth: agent.tool_configs?.[index]?.persist_auth ?? false,
            provider_uuid: agent.tool_configs?.[index]?.provider_uuid,
            credential_id: agent.tool_configs?.[index]?.credential_id,
          }));
        }

        // Handling new tools v2
        if (agent.tool_configs && agent.tool_configs.length > 0) {
          toolsData = agent.tool_configs.flatMap((tool: any) =>
            tool.action_names.map((action: any) => ({
              name: tool.tool_name,
              usage_description: action,
              tool_source: tool.tool_source,
              server_id: tool.server_id,
              persist_auth: tool.persist_auth ?? false,
              provider_uuid: tool.provider_uuid,
              credential_id: tool.credential_id,
            })),
          );
        }

        const managedAgentsData = Array.isArray(agent.managed_agents)
          ? agent.managed_agents.map((managedAgent: any) => ({
              id: managedAgent.id || "",
              name: managedAgent.name || "",
              usage_description: managedAgent.usage_description || "",
            }))
          : [];

        const a2aTools = Array.isArray(agent?.a2a_tools)
          ? agent?.a2a_tools
          : [];

        const handleStructuredOutput = () => {
          const response_format = agent?.response_format;

          if (response_format?.type === "json_schema") {
            if (agent?.response_format?.schema)
              return JSON.stringify(agent?.response_format?.schema, null, 2);
            return JSON.stringify(agent?.response_format?.json_schema, null, 2);
          }

          return null;
        };

        const hasPrevMemoryModule = (f: any) =>
          ["LONG_TERM_MEMORY", "SHORT_TERM_MEMORY"].includes(f.type);

        if (
          agent?.features?.length > 0 &&
          agent?.features?.some(hasPrevMemoryModule)
        ) {
          agent.features = agent?.features
            .filter(
              (f: any) =>
                !["LONG_TERM_MEMORY", "SHORT_TERM_MEMORY"].includes(f?.type),
            )
            .concat({
              type: "MEMORY",
              priority: 0,
              config: { max_messages_context_count: 10 },
            });
        }

        const hasSingleToolCall = (f: any) => f.type === "SINGLE_TOOL_CALL";

        if (
          agent?.features?.length > 0 &&
          agent?.features?.some(hasSingleToolCall)
        ) {
          agent.features = agent?.features
            .filter((f: any) => f.type !== "SINGLE_TOOL_CALL")
            .concat({
              type: "TOOL_CALLING",
              config: { max_tries: 3 },
              priority: 0,
            });
        }

        // Remove scheduler from features
        if (agent?.features?.length > 0) {
          agent.features = agent.features.filter(
            (f: any) => f.type !== "SCHEDULER",
          );
        }

        const initialValues = {
          ...agent,
          tools: toolsData,
          tool_configs: [],
          temperature: parseFloat(agent.temperature),
          top_p: parseFloat(agent.top_p),
          managed_agents: managedAgentsData,
          a2a_tools: a2aTools,
          examples_visible: agent?.examples?.length > 0,
          structured_output_visible: agent?.response_format?.type !== "text",
          structured_output: handleStructuredOutput(),
          store_messages: agent.hasOwnProperty("store_messages")
            ? agent.store_messages
            : true,
          image_output_config: agent?.image_output_config || null,
          max_iterations: agent?.max_iterations ?? 25,
        };
        console.log({ initialValues });
        form.reset(initialValues);

        if (agentId && apiKey) {
          try {
            const scheduleResponse = await getScheduleByAgentId({ agentId });
            const schedules = scheduleResponse?.data?.schedules || [];
            const webhooks = scheduleResponse?.data?.webhooks || [];

            // Only enable if at least one schedule is active
            const activeSchedules = schedules.filter(
              (s: any) => s.is_active !== false,
            );

            if (activeSchedules.length > 0) {
              const schedule = activeSchedules[0];
              const schedulerFeatureName = FEATURES_CONFIG.SCHEDULER.name;
              // @ts-ignore
              const isSchedulerEnabled = form.getValues(schedulerFeatureName);

              if (!isSchedulerEnabled) {
                const currentFeatures = form.getValues("features") || [];
                const featureConfig = Object.values(FEATURES_CONFIG).find(
                  (f: FeatureDefinition) => f.name === schedulerFeatureName,
                );

                if (featureConfig) {
                  const updatedFeatures = currentFeatures.filter(
                    (f) =>
                      f.type.toUpperCase() !== featureConfig.type.toUpperCase(),
                  );
                  updatedFeatures.push({
                    type: featureConfig.type,
                    priority: 0,
                    config: {
                      name: schedule.message || "",
                    },
                  });

                  // @ts-ignore
                  form.setValue(schedulerFeatureName, true, {
                    shouldDirty: false,
                  });
                  form.setValue("features", updatedFeatures, {
                    shouldDirty: false,
                  });
                }
              }
            }

            // Only enable if at least one webhook is active
            const activeWebhooks = webhooks.filter(
              (w: any) => w.is_active !== false,
            );

            if (activeWebhooks.length > 0) {
              const webhook = activeWebhooks[0];
              const triggerFeatureName = FEATURES_CONFIG.TRIGGER.name;
              // @ts-ignore
              const isTriggerEnabled = form.getValues(triggerFeatureName);

              if (!isTriggerEnabled) {
                const currentFeatures = form.getValues("features") || [];
                const featureConfig = Object.values(FEATURES_CONFIG).find(
                  (f: FeatureDefinition) => f.name === triggerFeatureName,
                );

                if (featureConfig) {
                  const updatedFeatures = currentFeatures.filter(
                    (f) =>
                      f.type.toUpperCase() !== featureConfig.type.toUpperCase(),
                  );
                  updatedFeatures.push({
                    type: featureConfig.type,
                    priority: 0,
                    config: {
                      webhook_url: webhook.webhook_url || "",
                    },
                  });

                  // @ts-ignore
                  form.setValue(triggerFeatureName, true, {
                    shouldDirty: false,
                  });
                  form.setValue("features", updatedFeatures, {
                    shouldDirty: false,
                  });
                }
              }
            }
          } catch (scheduleError) {
            console.error("Error checking for scheduler:", scheduleError);
          }
        }

        return agent;
      }
    } catch (error) {
      console.error("Error fetching agent data:", error);
      toast({
        title: "Error fetching agent data",
        description: "Unable to load agent details. Please try again.",
        variant: "destructive",
      });
    }
  }, [agentId, apiKey, getScheduleByAgentId]);

  const updateProphetRegistry = async (agentId: string, payload: any) => {
    try {
      const registryRes = await axios.get(`/api/v1/agent-registry/${agentId}`, {
        baseURL: MAIA_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      const hasChanges =
        agentRegistryData?.is_present &&
        (agentRegistryData.agent_name !== agent?.name ||
          agentRegistryData.agent_description !== agent?.description ||
          agentRegistryData.agent_role !== agent?.agent_role ||
          agentRegistryData.agent_goal !== (agent as any)?.agent_goal ||
          agentRegistryData.agent_instruction !== agent?.agent_instructions);

      if (registryRes.data?.is_present && hasChanges) {
        const registryData = registryRes.data;
        const updatePayload = {
          ...registryData?.data,
          agent_name: payload.name,
          description: payload.description,
          agent_role: payload.agent_role,
          agent_goal: payload.agent_goal,
          agent_instruction: payload.agent_instructions,
        };

        await axios.put(`/api/v1/agent-registry/${agentId}`, updatePayload, {
          baseURL: MAIA_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.error("Failed to update prophet registry:", error);
    }
  };

  const handleToolAdd = (tools: Tool[]): ToolConfig[] => {
    const toolMap = new Map<string, ToolConfig>();

    tools.forEach(
      ({
        name,
        usage_description,
        tool_source,
        server_id,
        persist_auth,
        provider_uuid,
        credential_id,
      }) => {
        const tool_name = name;
        const action_names = usage_description;
        if (!toolMap.has(tool_name)) {
          toolMap.set(tool_name, {
            tool_name,
            tool_source: tool_source ?? "",
            action_names: [action_names],
            persist_auth: persist_auth ?? false,
            server_id: server_id ?? undefined,
            provider_uuid: provider_uuid ?? "",
            credential_id: credential_id ?? "",
          });
        } else {
          const existing = toolMap.get(tool_name)!;
          if (!existing.action_names.includes(action_names)) {
            existing.action_names.push(action_names);
          }

          if (server_id && !existing.server_id) {
            existing.server_id = server_id;
          }

          if (persist_auth === true) {
            existing.persist_auth = true;
          }
        }
      },
    );

    return Array.from(toolMap.values());
  };

  const onSubmit = async (values: FormValues) => {
    const hasInvalidRagFeature = values.features.some(
      (feature) =>
        feature.type === "KNOWLEDGE_BASE" &&
        Object.values(feature.config.lyzr_rag).length === 0 &&
        Object.values(feature.config.agentic_rag).length === 0,
    );

    const hasInvalidRAIFeature = values.features.some(
      (feature) =>
        feature.type === "RESPONSIBLE_AI" && !!feature?.config?.policy_id,
    );

    if (hasInvalidRagFeature) {
      toast({
        title: "Please select valid Knowledge Base",
        variant: "destructive",
      });
      return;
    }

    if (hasInvalidRAIFeature) {
      toast({
        title: "Please select an RAI policy",
        variant: "destructive",
      });
      return;
    }

    if (!values.provider_id || !values.model) {
      toast({
        title: "Validation Error",
        description: "Provider and Model are required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // let endpoint;
      let payload: any;
      let agent_id: string;

      const validTools = values.tools.filter((tool) => tool.name);

      const tools_config = handleToolAdd(values.tools);
      const concatenatedToolDescription = validTools
        .map((t) => `${t.name}: ${t.usage_description || ""}`)
        .join("\n");
      const managedAgentsData =
        values.managed_agents?.map((agent) => ({
          id: agent.id,
          name: agent.name || "",
          usage_description: agent.usage_description,
        })) || [];

      const hasFileOutput =
        values.features.some((feature) => feature.type === "FILEASOUTPUT") ||
        values.file_output;

      const hasImageOutput = values.features.some(
        (feature) => feature.type === "IMAGEASOUTPUT",
      );
      const filteredFeatures = values.features
        .filter(
          (feature) =>
            feature.type !== "FILEASOUTPUT" &&
            feature.type !== "IMAGEASOUTPUT" &&
            feature.type !== "TOOL_CALLING" &&
            feature.type !== "SCHEDULER" &&
            feature.type !== "TRIGGER",
        )
        .map((feature) => ({
          type: feature.type,
          config: feature.config,
          priority: feature.priority,
        }));

      if (validTools.length > 0) {
        filteredFeatures.push({
          type: "TOOL_CALLING",
          config: { max_tries: 3 },
          priority: 0,
        });
      }

      let imageOutputConfig = null;
      if (hasImageOutput) {
        const imageConfigValue = values.features.find(
          (feature) => feature.type === "IMAGEASOUTPUT",
        )?.config;
        if (imageConfigValue) {
          try {
            const parsedConfig =
              typeof imageConfigValue === "string"
                ? JSON.parse(imageConfigValue)
                : imageConfigValue;
            if (parsedConfig) {
              imageOutputConfig = {
                model: parsedConfig.model,
                credential_id: parsedConfig.credential_id,
              };
            }
          } catch (error) {
            console.error("Error parsing image_output_config:", error);
          }
        }
      }

      // if (validTools.length <= 1) {
      //   endpoint = "/agents/template/single-task";
      //   payload = {
      //     name: values.name,
      //     description: values.description || "",
      //     agent_role: values.agent_role || "",
      //     agent_goal: values.agent_goal || "",
      //     agent_instructions: values.agent_instructions || "",
      //     examples: values?.examples_visible ? values.examples : null,
      //     tool: validTools.length === 1 ? validTools[0].name : "",
      //     tool_usage_description: convertToJSONString(
      //       concatenatedToolDescription,
      //     ),
      //     tool_configs: tools_config,
      //     provider_id: values.provider_id,
      //     model: values.model,
      //     temperature: values.temperature,
      //     top_p: values.top_p,
      //     llm_credential_id: values.llm_credential_id || null,
      //     features: filteredFeatures,
      //     managed_agents: managedAgentsData,
      //     a2a_tools: values?.a2a_tools ?? [],
      //     additional_model_params: values?.additional_model_params || null,
      //     response_format: values?.structured_output
      //       ? {
      //           type: "json_schema",
      //           json_schema: JSON.parse(values?.structured_output),
      //         }
      //       : { type: "text" },
      //     store_messages: values?.store_messages,
      //     file_output: hasFileOutput,
      //   };
      // } else {
      payload = {
        name: values.name,
        description: values.description || "",
        agent_role: values.agent_role || "",
        agent_goal: values.agent_goal || "",
        agent_instructions: values.agent_instructions || "",
        examples: values?.examples_visible ? values.examples : null,
        tools: validTools.map((t) => t.name),
        tool_usage_description: convertToJSONString(
          concatenatedToolDescription,
        ),
        tool_configs: tools_config,
        provider_id: values.provider_id?.split(" [")[0],
        model: values.model,
        temperature: values.temperature,
        top_p: values.top_p,
        llm_credential_id: values.llm_credential_id || null,
        features: filteredFeatures,
        managed_agents: managedAgentsData,
        a2a_tools: values?.a2a_tools ?? [],
        additional_model_params: values?.additional_model_params || null,
        response_format: values?.structured_output
          ? {
              type: "json_schema",
              json_schema: JSON.parse(values?.structured_output),
            }
          : { type: "text" },
        store_messages: values?.store_messages,
        file_output: hasFileOutput,
        image_output_config: imageOutputConfig,
        max_iterations: values?.max_iterations ?? 25,
      };
      // }

      console.log("Submitting payload:", payload);

      if (agentId) {
        agent_id = agentId;

        if (IS_PROPHET_DEPLOYMENT) {
          await updateProphetRegistry(agentId, payload);
        }

        await updateAgent({
          endpoint: "/agents",
          agentId,
          // endpoint:
          //   validTools.length <= 1 ? "/agents/template/single-task" : "/agents",
          // @ts-ignore
          values: payload,
        });

        setAgentAPI(payload);

        form.reset({
          ...values,
          response_format:
            values.structured_output_visible && values?.structured_output
              ? {
                  type: "json_schema",
                  json_schema: JSON.parse(values?.structured_output),
                }
              : { type: "text" },
        });
        toast({
          title: "Your agent has been updated!",
        });

        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track("Agent updated", payload);
      } else {
        const response = await createAgent({
          endpoint: "/agents/",
          // @ts-ignore
          values: payload,
        });
        const newAgentId = response.data.agent_id;
        agent_id = newAgentId;
        if (!newAgentId) {
          throw new Error("No agent ID returned from creation");
        }
        form.reset(undefined, {
          keepValues: true,
          keepDirty: false,
          keepDefaultValues: false,
        });
        blocker?.reset?.();
        addAgent({
          _id: newAgentId,
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track("Agent created", payload);
        setTimeout(
          () =>
            navigate(`/agent-create/${newAgentId}`, {
              replace: true,
            }),
          100,
        );

        toast({
          title: "Your agent has been created!",
        });
      }

      setAgent({ _id: agent._id, ...payload });

      if (group_name && current_organization?._id && !agentId) {
        await addAssetToGroup(
          group_name,
          "agent",
          current_organization?._id,
          {
            asset_id: agent_id,
            asset_type: "agent",
            asset_name: values?.name,
            metadata: {
              description: values?.description,
            },
          },
          token,
        );
      }
    } catch (error) {
      console.error("Error with agent => ", error);
      toast({
        title: `Error ${agentId ? "updating" : "creating"} agent`,
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleRestoreVersion = async () => {
    if (!selectedVersion) return;
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Confirm restore clicked");
    try {
      await setVersionActive(selectedVersion.version_id);
      form.reset(selectedVersion.config);
      setIsReadOnly(!canUpdateAgent); // Restore to permission-based state
      setIsHistoryOn(false);
      setShowVersionHeader(false);
      setSelectedVersion(null);
      toast({ title: "Version restored and activated successfully" });
    } catch (error) {
      toast({
        title: "Failed to restore version",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setShowRestoreDialog(false);
    }
  };

  const handleHistoryVersion = () => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Version history clicked");
    setInitialValues(form.getValues());
    setIsHistoryOn(true);
    setShowVersionHeader(true);
  };

  const handleVersionSelect = (version: any) => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Version clicked");
    const config = { ...version.config };
    const normalizedConfig: FormValues = {
      ...config,

      examples_visible: !!config.examples && config.examples.length > 0,
      structured_output_visible: !!config.response_format.strict,
    };
    setSelectedVersion({
      config: normalizedConfig,
      version_id: version.id,
      timestamp: version.timestamp,
    });
    form.reset(normalizedConfig, {
      keepDirty: false,
      keepTouched: false,
    });
    setIsReadOnly(true);
  };

  const isAgentLaunched = () => {
    if (location.state?.isLaunched) {
      return location.state?.isLaunched;
    } else {
      const foundIndex = userApps.findIndex(
        (app: any) => app.agent_id === agentId,
      );
      return foundIndex > 0;
    }
  };

  const getLaunchedAppId = () => {
    if (location.state?.appId) {
      return location.state?.appId;
    } else {
      const foundIndex = userApps.findIndex(
        (app: any) => app.agent_id === agentId,
      );
      if (foundIndex > 0) {
        const app = userApps[foundIndex];
        return app.id;
      }
      return null;
    }
  };

  const handleBackClick = () =>
    group_name
      ? navigate(`${Path.AGENT_BUILDER}?group_name=${group_name}`)
      : navigate(-1);

  useEffect(() => {
    const refresh = async () => {
      try {
        await fetchAgentData();
      } catch (error) {
        console.error("Error fetching agent data:", error);
        toast({
          title: "Error fetching agent data",
          description: "Unable to load agent details. Please try again.",
          variant: "destructive",
        });
      }
    };

    const onLoad = async () => {
      if (agentId) await refresh();
    };

    onLoad();

    return () => {
      blocker.reset?.();
    };
  }, [apiKey, agentId]);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        className="flex h-screen overflow-hidden"
      >
        {/* Main content section */}
        <div
          className={cn(
            "flex h-full flex-1 flex-col overflow-hidden",
            isFetchingAgentById && "shimmer",
          )}
        >
          <div className="flex justify-between">
            <div className="flex gap-2 p-4">
              <ArrowLeft
                onClick={handleBackClick}
                className="mr-2 mt-1 cursor-pointer"
              />
              <p className="text-2xl font-medium">
                {agentId ? "Manage Agent" : "Create Agent"}
              </p>
            </div>
            {!showVersionHeader ? (
              <div className="flex items-center">
                <>
                  {agentId && (
                    <>
                      <Button
                        variant="outline"
                        size="default"
                        className="mr-2"
                        onClick={() => {
                          if (
                            isMixpanelActive &&
                            mixpanel.hasOwnProperty("cookie")
                          ) {
                            mixpanel.track("Traces page clicked");
                          }
                        }}
                      >
                        <Link
                          to={`${Path.TRACES}/?tab=traces&agent_id=${agentId}`}
                          className="flex items-center"
                        >
                          <TelescopeIcon className="mr-2 h-5 w-5" />
                          <span>Traces</span>
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="default"
                        className="mr-2"
                        onClick={handleHistoryVersion}
                      >
                        <Clock8 className="mr-2 h-5 w-5" />
                        Version History
                      </Button>
                    </>
                  )}
                </>
                <div className="flex">
                  <AgentApiDialog
                    agentId={agentId}
                    apiKey={apiKey}
                    payload={agentAPI}
                    sessionId={sessionId}
                    userName={userName}
                    hasUnsavedChanges={
                      !!Object.keys(form.formState.dirtyFields).length
                    }
                  />
                  {/* Advanced Settings */}

                  <div className="flex items-center justify-center px-4">
                    <Popover>
                      <PopoverTrigger>
                        {/* <Settings2Icon className="size-4" /> */}
                        <EllipsisVerticalIcon className="size-4" />
                      </PopoverTrigger>
                      <PopoverContent className="space-y-4">
                        <div className="">
                          <h3 className="text-xs font-medium">
                            Advanced Settings
                          </h3>
                        </div>

                        <div className="flex items-center justify-between space-x-2">
                          <Tooltip delayDuration={300}>
                            <TooltipTrigger asChild>
                              <div className="inline-flex cursor-help items-center gap-2">
                                <Label
                                  htmlFor="manager-agent"
                                  className="cursor-help text-sm font-medium underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground"
                                >
                                  Store messages
                                </Label>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-[280px]"
                            >
                              <p>
                                Disabling “Store Messages” will stop tracking
                                your input and output messages, and they will
                                not appear in Traces
                              </p>
                            </TooltipContent>
                          </Tooltip>
                          <Switch
                            id="store_messages"
                            checked={form.watch("store_messages")}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                const features = form.getValues("features");
                                console.log("Features", features);

                                if (
                                  features?.some(
                                    (feature: any) => feature.type === "MEMORY",
                                  )
                                ) {
                                  toast({
                                    title: "Memory is enabled",
                                    description:
                                      'You cannot disable Store Messages, Disable memory feature to disable "Store messages"',
                                  });
                                  return;
                                }
                                form.setValue("store_messages", checked, {
                                  shouldDirty: true,
                                });
                                return;
                              } else {
                                form.setValue("store_messages", checked, {
                                  shouldDirty: true,
                                });
                              }
                            }}
                          />
                        </div>
                        <div className="items-center space-x-2">
                          <div className="flex items-center justify-between">
                            <Tooltip delayDuration={300}>
                              <TooltipTrigger asChild>
                                <div className="inline-flex cursor-help items-center gap-2">
                                  <Label className="cursor-help text-sm font-medium underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                                    Maximum iterations
                                  </Label>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                align="start"
                                className="max-w-[280px]"
                              >
                                <p>
                                  Sets the maximum number of iterations allowed
                                  per inference, including tool calls, sub-agent
                                  actions, artifact generation, and file or
                                  image creation.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                            <span>{form.watch("max_iterations") ?? 25}</span>
                          </div>
                          <div className="mt-2">
                            <Slider
                              value={[form.watch("max_iterations") ?? 25]}
                              onValueChange={([value]) =>
                                form.setValue("max_iterations", value, {
                                  shouldDirty: true,
                                })
                              }
                              min={1}
                              max={50}
                              step={1}
                            />
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            ) : selectedVersion ? (
              <div className="flex items-center space-x-4 rounded-md px-4 py-2 text-indigo-600">
                <span className="text-sm">
                  Viewing previous version:{" "}
                  {formatDate(selectedVersion.timestamp)}
                </span>
                {canUpdateAgent && (
                  <Button
                    variant="default"
                    onClick={() => {
                      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                        mixpanel.track("Restore clicked");
                      setShowRestoreDialog(true);
                    }}
                  >
                    Restore
                  </Button>
                )}
              </div>
            ) : null}
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex h-[calc(100%-5rem)] flex-col overflow-hidden"
            >
              <fieldset
                disabled={isReadOnly}
                className="scrollable-fieldset flex h-full flex-col"
              >
                <div className="flex h-full flex-1 gap-2 overflow-hidden">
                  {/* Basic Details */}
                  <div className="no-scrollbar h-full w-8/12 overflow-y-auto p-4">
                    <BasicDetails
                      // @ts-ignore
                      form={form}
                      agent={agent}
                      scrollRef={scrollRef}
                      structuredOpErrors={structuredOpErrors}
                      isExistingAgent={!!location.state?.agent}
                    />
                  </div>
                  <div className="h-full w-px bg-border" />
                  {/* Features and Tools Tabs */}
                  <div className="w-4/12 overflow-hidden py-4">
                    <Features
                      // @ts-ignore
                      form={form}
                      onEnabledCountChange={setEnabledFeaturesCount}
                      agentId={agentId}
                    />
                  </div>
                </div>

                {/* Bottom buttons */}
                <div className="flex justify-end space-x-2 border-t p-4">
                  {agentId && canUpdateAgent && (
                    <>
                      {!!Object.keys(form.formState.dirtyFields).length && (
                        <div className="flex items-center text-yellow-500">
                          <TriangleAlert className="mr-2 h-5 w-5" />
                          <span className="mr-4 text-sm">
                            You have unsaved changes
                          </span>
                        </div>
                      )}
                      <Button type="submit" loading={isUpdatingAgent}>
                        Update
                      </Button>
                    </>
                  )}
                  {agentId && !canUpdateAgent && (
                    <div className="flex items-center text-muted-foreground">
                      <span className="text-sm">
                        You don't have permission to update this agent
                      </span>
                    </div>
                  )}
                </div>
              </fieldset>
            </form>
          </Form>
        </div>

        <Separator orientation="vertical" />

        {/* Inference section */}
        <div className="h-full w-1/3 overflow-y-auto p-4">
          {!isHistoryOn ? (
            <Inference
              appId={getLaunchedAppId()}
              agent={agent}
              isLaunched={isAgentLaunched()}
              agentUserId={agent?.api_key}
              currentUser={currentUser}
              userId={userId}
              onSubmit={form.handleSubmit(onSubmit)}
              isCreating={isCreatingAgent}
              features={form.watch("features")}
              // @ts-ignore
              tool={form.watch("tool")}
              tools={form.watch("tools")}
              managedAgents={form.watch("managed_agents")}
              agentRegistryData={agentRegistryData}
              refetchRegistry={refetchRegistry}
              isSharedAgent={isSharedAgent}
            />
          ) : (
            <VersionHistory
              onSelect={handleVersionSelect}
              onClose={() => {
                if (initialValues) {
                  form.reset(initialValues);
                }
                setIsReadOnly(!canUpdateAgent); // Restore to permission-based state
                setIsHistoryOn(false);
                setShowVersionHeader(false);
                setSelectedVersion(null);
              }}
            />
          )}
        </div>
      </motion.div>
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to restore this version? This will overwrite
              the current form values. It can not be undone.
            </p>
          </AlertDialogHeader>
          <div className="mt-4 flex justify-end gap-4">
            <Button
              variant="outline"
              onClick={() => setShowRestoreDialog(false)}
            >
              Cancel
            </Button>
            <Button
              loading={isActivatingVersion}
              onClick={handleRestoreVersion}
            >
              Yes, Restore
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
      <Dialog
        open={blocker?.state === "blocked"}
        onOpenChange={() => blocker?.reset?.()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unsaved Changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. If you leave now, your changes will be
              lost. Would you like to save before exiting?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              loading={isUpdatingAgent}
              onClick={async () => {
                await form.handleSubmit(async (data) => {
                  await onSubmit(data);
                  blocker?.proceed?.();
                  // setShowAlert(false);
                  // navigate(-1);
                })();
              }}
            >
              Save & Exit
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                blocker?.proceed?.();
                // navigate(-1);
              }}
            >
              Discard & Exit
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
