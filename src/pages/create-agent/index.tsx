// import { z } from "zod";
// import { useForm } from "react-hook-form";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { motion } from "framer-motion";
// import { useState, useEffect, useCallback, useRef, RefObject } from "react";
// import { useNavigate, useParams, useLocation } from "react-router-dom";
// import { Button } from "@/components/custom/button";
// import {
//   Code,
//   Copy,
//   Check,
//   ArrowLeft,
//   TriangleAlert,
//   Clock8,
// } from "lucide-react";
// import { Separator } from "@/components/ui/separator";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
// import { buttonVariants } from "@/components/custom/button";
// import { BasicDetails } from "./components/basic-details";
// import { Features } from "./components/features";
// import Inference from "./components/inference";
// import { Form } from "@/components/ui/form";
// import useStore from "@/lib/store";
// import { useAgentBuilder } from "../agent-builder/agent-builder.service";
// import { useToast } from "@/components/ui/use-toast";
// import { useModel } from "../configure/models/model-service";
// import { IAgent, IPolicy, IProvider, ITeamMember, Path } from "@/lib/types";
// import axios from "axios";
// import { useCurrentUser } from "@/hooks/useCurrentUser";
// import mixpanel from "mixpanel-browser";
// import { Agent, FormValues, ToolResponse } from "./types";
// import { isMixpanelActive } from "@/lib/constants";
// import { useOrganization } from "../organization/org.service";
// import { useAuth } from "@/contexts/AuthContext";
// import { useManageAdminStore } from "../manage-admin/manage-admin.store";
// import { cn } from "@/lib/utils";
// import AgentApiDialog from "./components/agent-api-dialog";
// // Removed unused CodeEditor import
// import Loader from "@/components/loader";
// import { isValidJson, formatDate } from "@/lib/utils";
// import VersionHistory from "@/pages/create-agent/components/version-history";
// import { useAgentVersionsService } from "./version-history.service";
// import {
//   AlertDialog,
//   AlertDialogContent,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";

// const formSchema = ({ scrollRef }: { scrollRef: RefObject<HTMLDivElement> }) =>
//   z
//     .object({
//       name: z.string().min(1, "Name is required"),
//       description: z.string().optional(),
//       agent_goal: z.string().optional(),
//       agent_role: z.string().optional(),
//       agent_instructions: z.string().optional(),
//       optional_examples: z.string().optional(),
//       features: z
//         .array(
//           z.object({
//             type: z.string(),
//             config: z.record(z.any()).refine((config) => {
//               if (
//                 config.type === "KNOWLEDGE_BASE" &&
//                 config.lyzr_rag &&
//                 (!config.lyzr_rag.rag_id || config.lyzr_rag.rag_id === "")
//               ) {
//                 return false;
//               }
//               return true;
//             }, "RAG ID is required for knowledge base"),
//             priority: z.number(),
//           }),
//         )
//         .default([]),
//       tools: z
//         .array(
//           z.object({
//             name: z.string(),
//             usage_description: z.string(),
//           }),
//         )
//         .default([]),
//       provider_id: z.string().min(1, "Provider is required"),
//       model: z.string().optional(),
//       temperature: z.number().min(0).max(1),
//       top_p: z.number().min(0).max(1),
//       llm_credential_id: z.string().optional(),
//       examples: z.string().optional().nullable(),
//       examples_visible: z.boolean().optional(),
//       managed_agents: z
//         .array(
//           z.object({
//             id: z.string(),
//             name: z.string(),
//             usage_description: z.string(),
//           }),
//         )
//         .optional(),
//       response_format: z.enum(["text", "json_object"]).optional(),
//     })
//     .superRefine((data, ctx) => {
//       if (data.provider_id && !data.model) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Model is required",
//           path: ["model"],
//         });
//       }

//       if (
//         data.response_format === "json_object" &&
//         data?.examples?.length &&
//         data?.examples_visible &&
//         !isValidJson(data?.examples ?? "")
//       ) {
//         ctx.addIssue({
//           code: z.ZodIssueCode.custom,
//           message: "Provide a valid json",
//           path: ["examples"],
//         });
//         scrollRef.current?.scrollIntoView({
//           behavior: "smooth",
//           block: "end",
//           inline: "nearest",
//         });
//       }
//     });

// export default function CreateAgent() {
//   const location = useLocation();
//   const { agentId } = useParams();
//   const { getToken } = useAuth();
//   const isLaunched = location.state?.isLaunched;
//   const appId = location.state?.appId;
//   const navigate = useNavigate();
//   const { toast } = useToast();
//   const { currentUser, userId } = useCurrentUser();
//   const userName = currentUser?.auth?.email ?? "";
//   const scrollRef = useRef<HTMLDivElement>(null);

//   const apiKey = useStore((state) => state.api_key);
//   const updateStore = useStore((state: any) => state.updateAgent);
//   const addAgent = useStore((state: any) => state.addAgent);

//   const [, setCreatedAgent] = useState<Agent | null>(null);
//   const [, setEnabledFeaturesCount] = useState<number>(0);
//   const [, setEnabledToolsCount] = useState<number>(0);
//   const [apiTools, setApiTools] = useState<ToolResponse[]>([]);
//   const [userTools, setUserTools] = useState<string[]>([]);
//   const [toolsLoading, setToolsLoading] = useState(true);
//   const [lastSubmittedValues, setLastSubmittedValues] =
//     useState<FormValues | null>(null);
//   const [activeTab, setActiveTab] = useState("api");
//   const [isCopied, setIsCopied] = useState(false);
//   const [providers, setProviders] = useState<IProvider[]>([]);
//   const [models, setModels] = useState<{ [key: string]: string[] }>({});
//   const [initialValuesSet, setInitialValuesSet] = useState(false);
//   const [isModelFieldLoading, setIsModelFieldLoading] = useState(false);
//   const [agent, setAgent] = useState<Partial<IAgent>>({});
//   const [sessionId, setSessionId] = useState("");
//   // Removed unused state variables
//   // State variable used, but setter currently unused
//   const [isFetchingAgentById, _setIsFetchingAgentById] = useState(false);

//   const [isHistoryOn, setIsHistoryOn] = useState(false);
//   const [isReadOnly, setIsReadOnly] = useState(false);
//   const [selectedVersion, setSelectedVersion] = useState<{
//     timestamp: string;
//     config: any;
//     version_id: string;
//   } | null>(null);
//   const [showRestoreDialog, setShowRestoreDialog] = useState(false);
//   const [showVersionHeader, setShowVersionHeader] = useState(false);
//   const [initialValues, setInitialValues] = useState<FormValues | null>(null);
//   const { isActivatingVersion, setVersionActive } = useAgentVersionsService({
//     apiKey,
//     agentId,
//   });

//   const getCurlCommand = (
//     agentId: string | undefined,
//     apiKey: string,
//     userName: string,
//   ) => {
//     return agentId
//       ? `curl -X POST '${import.meta.env.VITE_BASE_URL}/v3/inference/chat/' \\
//       -H 'Content-Type: application/json' \\
//       -H 'x-api-key: ${apiKey}' \\
//       -d '{
//         "user_id": "${userName}",
//         "agent_id": "${agentId}",
//         "session_id": "${sessionId}",
//         "message": ""
//         }'`
//       : "Please create your agent first to get the Inference endpoint";
//   };

//   const current_organization = useManageAdminStore(
//     (state) => state.current_organization,
//   );
//   const { getLyzrProviders } = useModel({ apiKey });
//   const { createAgent, updateAgent, isCreatingAgent, isUpdatingAgent } =
//     useAgentBuilder({ apiKey });
//   const { getCurrentOrgMembers, isFetchingCurrentOrgMembers } = useOrganization(
//     {
//       token: getToken(),
//       current_organization,
//     },
//   );
//   const { getAgentPolicy, isFetchingAgentPolicies } = useAgentBuilder({
//     apiKey,
//     permission_type: "agent",
//   });

//   useEffect(() => {
//     // on mount, generate session id
//     setSessionId(`${agentId}-${Math.random().toString(36).substring(2, 15)}`);
//   }, []);

//   useEffect(() => {
//     const fetchProvidersAndModels = async () => {
//       try {
//         const lyzrProvidersResponse = await getLyzrProviders();
//         const providersResponse: { data: IProvider[] } = { data: [] };

//         const lyzrProviders = lyzrProvidersResponse.data ?? [];
//         const additionalProviders = (providersResponse.data ?? []).filter(
//           (p: IProvider) => p.provider_id !== "openai",
//         );

//         const combinedProviders = [
//           ...lyzrProviders,
//           ...additionalProviders.filter(
//             (p: IProvider) =>
//               !lyzrProviders.some(
//                 (lp: IProvider) => lp.provider_id === p.provider_id,
//               ),
//           ),
//         ];

//         setProviders(combinedProviders);
//         const modelsMap = combinedProviders.reduce(
//           (acc: Record<string, string[]>, provider: IProvider) => {
//             const modelNames = (provider.meta_data.models || []).map(
//               (model: any) => {
//                 if (Array.isArray(model)) {
//                   return typeof model[0] === "string" ? model[0] : model[0][0];
//                 }
//                 return model;
//               },
//             );
//             acc[provider.provider_id] = modelNames;
//             return acc;
//           },
//           {},
//         );
//         setModels(modelsMap);
//       } catch (error) {
//         console.error("Error fetching providers:", error);
//         toast({
//           title: "Error fetching providers",
//           description: "Unable to load providers. Please try again.",
//           variant: "destructive",
//         });
//       }
//     };

//     if (apiKey) fetchProvidersAndModels();
//   }, [getLyzrProviders, apiKey]);

//   const form = useForm<FormValues>({
//     resolver: zodResolver(formSchema({ scrollRef })),
//     defaultValues: {
//       name: "",
//       description: "",
//       agent_role: "",
//       agent_instructions: "",
//       examples: "",
//       features: [],
//       tools: [{ name: "", usage_description: "" }],
//       provider_id: "OpenAI",
//       temperature: 0.7,
//       top_p: 0.9,
//       llm_credential_id: "",
//     },
//     mode: "onSubmit",
//     reValidateMode: "onSubmit",
//   });

//   const handleRestoreVersion = async () => {
//     if (!selectedVersion) return;
//     if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
//       mixpanel.track("Confirm restore clicked");
//     try {
//       await setVersionActive(selectedVersion.version_id);
//       form.reset(selectedVersion.config);
//       setIsReadOnly(false);
//       setIsHistoryOn(false);
//       setShowVersionHeader(false);
//       setSelectedVersion(null);
//       toast({ title: "Version restored and activated successfully" });
//     } catch (error) {
//       toast({
//         title: "Failed to restore version",
//         description: "Please try again later.",
//         variant: "destructive",
//       });
//     } finally {
//       setShowRestoreDialog(false);
//     }
//   };

//   const handleHistoryVersion = () => {
//     if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
//       mixpanel.track("Version history clicked");
//     setInitialValues(form.getValues());
//     setIsHistoryOn(true);
//     setShowVersionHeader(true);
//   };

//   const handleVersionSelect = (version: any) => {
//     if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
//       mixpanel.track("Version clicked");
//     const config = { ...version.config };
//     const normalizedConfig: FormValues = {
//       ...config,
//       response_format:
//         typeof config.response_format === "object"
//           ? config.response_format?.type || "text"
//           : config.response_format || "text",

//       examples_visible: !!config.examples && config.examples.length > 0,
//     };
//     setSelectedVersion({
//       config: normalizedConfig,
//       version_id: version.id,
//       timestamp: version.timestamp,
//     });
//     form.reset(normalizedConfig, {
//       keepDirty: false,
//       keepTouched: false,
//     });
//     setIsReadOnly(true);
//   };

//   useEffect(() => {
//     const fetchAgentData = async () => {
//       if (!agentId || !apiKey || initialValuesSet) return;

//       try {
//         const response = await axios.get(
//           `${import.meta.env.VITE_BASE_URL}/v3/agents/${agentId}`,
//           {
//             headers: {
//               accept: "application/json",
//               "x-api-key": apiKey,
//             },
//           },
//         );
//         setAgent(response.data);

//         if (
//           response.data &&
//           providers.length > 0 &&
//           Object.keys(models).length > 0
//         ) {
//           const agent = response.data;

//           let toolsData = [];
//           if (
//             agent.tool &&
//             typeof agent.tool === "string" &&
//             !Array.isArray(agent.tools)
//           ) {
//             toolsData = [
//               {
//                 name: agent.tool,
//                 usage_description: agent.tool_usage_description || "",
//               },
//             ];
//           } else if (Array.isArray(agent.tools) && agent.tools.length > 0) {
//             const toolDescriptionMap = {};
//             if (agent.tool_usage_description) {
//               const descriptionLines = agent.tool_usage_description.split("\n");
//               // @ts-ignore
//               descriptionLines.forEach((line) => {
//                 const match = line.match(/^([^:]+):\s*(.*)/);
//                 if (match && match.length >= 3) {
//                   const toolName = match[1].trim();
//                   const description = match[2].trim();
//                   // @ts-ignore
//                   toolDescriptionMap[toolName] = description;
//                 }
//               });
//             }
//             // @ts-ignore
//             toolsData = agent.tools.map((toolName) => ({
//               name: toolName,
//               // @ts-ignore
//               usage_description: toolDescriptionMap[toolName] || "",
//             }));
//           }

//           const managedAgentsData = Array.isArray(agent.managed_agents)
//             ? agent.managed_agents.map((managedAgent: any) => ({
//                 id: managedAgent.id || "",
//                 name: managedAgent.name || "",
//                 usage_description: managedAgent.usage_description || "",
//               }))
//             : [];

//           const initialValues = {
//             name: agent.name,
//             description: agent.description,
//             agent_role: agent.agent_role,
//             agent_goal: agent.agent_goal,
//             agent_instructions: agent.agent_instructions,
//             examples: agent.examples,
//             features: agent.features,
//             tools: toolsData,
//             provider_id: agent.provider_id,
//             temperature: parseFloat(agent.temperature),
//             top_p: parseFloat(agent.top_p),
//             llm_credential_id: agent.llm_credential_id,
//             managed_agents: managedAgentsData,
//             response_format: agent?.response_format?.type,
//             examples_visible: agent?.examples?.length > 0,
//           };

//           form.reset(initialValues);

//           setIsModelFieldLoading(true);
//           setTimeout(() => {
//             form.setValue("model", agent.model);
//             setIsModelFieldLoading(false);
//           }, 1000);

//           setLastSubmittedValues({ ...initialValues, model: agent.model });
//           setInitialValuesSet(true);

//           setEnabledFeaturesCount(agent.features?.length || 0);
//           setEnabledToolsCount(agent.tools?.length || 0);
//         }
//       } catch (error) {
//         console.error("Error fetching agent data:", error);
//         toast({
//           title: "Error fetching agent data",
//           description: "Unable to load agent details. Please try again.",
//           variant: "destructive",
//         });
//       }
//     };

//     if (providers.length > 0 && Object.keys(models).length > 0) {
//       fetchAgentData();
//     }
//   }, [agentId, apiKey, providers, models, initialValuesSet]);

//   useEffect(() => {
//     if (
//       location.state?.agent &&
//       providers.length > 0 &&
//       Object.keys(models).length > 0 &&
//       !initialValuesSet
//     ) {
//       const agent = location.state.agent;
//       setAgent(agent);

//       let toolsData = [];
//       if (
//         agent.tool &&
//         typeof agent.tool === "string" &&
//         !Array.isArray(agent.tools)
//       ) {
//         toolsData = [
//           {
//             name: agent.tool,
//             usage_description: agent.tool_usage_description || "",
//           },
//         ];
//       } else if (Array.isArray(agent.tools) && agent.tools.length > 0) {
//         const toolDescriptionMap = {};
//         if (agent.tool_usage_description) {
//           const descriptionLines = agent.tool_usage_description.split("\n");
//           // @ts-ignore
//           descriptionLines.forEach((line) => {
//             const match = line.match(/^([^:]+):\s*(.*)/);
//             if (match && match.length >= 3) {
//               const toolName = match[1].trim();
//               const description = match[2].trim();
//               // @ts-ignore
//               toolDescriptionMap[toolName] = description;
//             }
//           });
//         }
//         // @ts-ignore
//         toolsData = agent.tools.map((toolName) => ({
//           name: toolName,
//           // @ts-ignore
//           usage_description: toolDescriptionMap[toolName] || "",
//         }));
//       }

//       const initialValues = {
//         name: agent.name,
//         description: agent.description,
//         agent_role: agent.agent_role,
//         agent_goal: agent.agent_goal,
//         agent_instructions: agent.agent_instructions,
//         examples: agent.examples,
//         features: agent.features,
//         tools: toolsData,
//         provider_id: agent.provider_id,
//         temperature: parseFloat(agent.temperature),
//         top_p: parseFloat(agent.top_p),
//         llm_credential_id: agent.llm_credential_id,
//         model: agent.model,
//         response_format: agent?.response_format?.type,
//         examples_visible: agent?.examples?.length > 0,
//       };

//       form.reset(initialValues);
//       setLastSubmittedValues(initialValues);
//       setInitialValuesSet(true);

//       setEnabledFeaturesCount(agent.features?.length || 0);
//       setEnabledToolsCount(agent.tools?.length || 0);
//     }
//   }, [location.state, providers, models, initialValuesSet]);

//   useEffect(() => {
//     const fetchTeam = async () => {
//       const res = await getCurrentOrgMembers();
//       const team = res.data;
//       const policyRes = await getAgentPolicy();
//       const agentPolicies = policyRes.data?.filter(
//         (policy: IPolicy) => policy?.resource_id === agentId,
//       );

//       const sharedEmails = team
//         ?.filter((member: ITeamMember) =>
//           agentPolicies
//             ?.map((p: IPolicy) => p?.user_id)
//             .includes(member?.user_id),
//         )
//         ?.map((member: ITeamMember) => member?.email);

//       const userHasPermission =
//         sharedEmails?.length > 0
//           ? sharedEmails?.includes(currentUser?.auth?.email)
//           : false;
//       const userIsOwner = agent.api_key === apiKey;
//       if (!(userHasPermission || userIsOwner)) {
//         navigate(Path.NOT_FOUND);
//       }
//     };
//     if (current_organization?.org_id && agent?.api_key) {
//       fetchTeam();
//     }
//   }, [currentUser?.auth?.email, current_organization?.org_id, agent?.api_key]);

//   const onSubmit = async (values: FormValues) => {
//     const hasInvalidRagFeature = values.features.some(
//       (feature) =>
//         feature.type === "KNOWLEDGE_BASE" &&
//         feature.config.lyzr_rag &&
//         (!feature.config.lyzr_rag.rag_id ||
//           feature.config.lyzr_rag.rag_id === ""),
//     );

//     const hasInvalidRAIFeature = values.features.some(
//       (feature) =>
//         feature.type === "RESPONSIBLE_AI" && !!feature?.config?.policy_id,
//     );

//     if (hasInvalidRagFeature) {
//       toast({
//         title: "Please select a Knowledge Base",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (hasInvalidRAIFeature) {
//       toast({
//         title: "Please select an RAI policy",
//         variant: "destructive",
//       });
//       return;
//     }

//     if (!values.provider_id || !values.model) {
//       toast({
//         title: "Validation Error",
//         description: "Provider and Model are required fields",
//         variant: "destructive",
//       });
//       return;
//     }

//     try {
//       let endpoint;
//       let payload: any;

//       const validTools = values.tools.filter((tool) => tool.name);
//       const concatenatedToolDescription =
//         validTools.length > 1
//           ? validTools
//               .map((t) => `${t.name}: ${t.usage_description || ""}`)
//               .join("\n")
//           : "";

//       const managedAgentsData =
//         values.managed_agents?.map((agent) => ({
//           id: agent.id,
//           name: agent.name || "",
//           usage_description: agent.usage_description,
//         })) || [];

//       if (validTools.length <= 1) {
//         endpoint = "/agents/template/single-task";
//         payload = {
//           name: values.name,
//           description: values.description || "",
//           agent_role: values.agent_role || "",
//           agent_goal: values.agent_goal || "",
//           agent_instructions: values.agent_instructions || "",
//           examples: values?.examples_visible ? values.examples : null,
//           tool: validTools.length === 1 ? validTools[0].name : "",
//           tool_usage_description:
//             validTools.length === 1 ? validTools[0].usage_description : "",
//           provider_id: values.provider_id,
//           model: values.model,
//           temperature: values.temperature,
//           top_p: values.top_p,
//           llm_credential_id: values.llm_credential_id || null,
//           features: values.features.map((feature) => ({
//             type: feature.type,
//             config: feature.config,
//             priority: feature.priority,
//           })),
//           managed_agents: managedAgentsData,
//           response_format: {
//             type: values?.examples_visible ? values.response_format : "text",
//           },
//         };
//       } else {
//         endpoint = "/agents/";
//         payload = {
//           name: values.name,
//           description: values.description || "",
//           agent_role: values.agent_role || "",
//           agent_goal: values.agent_goal || "",
//           agent_instructions: values.agent_instructions || "",
//           examples: values?.examples_visible ? values.examples : null,
//           tools: validTools.map((t) => t.name),
//           tool_usage_description: concatenatedToolDescription,
//           provider_id: values.provider_id,
//           model: values.model,
//           temperature: values.temperature,
//           top_p: values.top_p,
//           llm_credential_id: values.llm_credential_id || null,
//           response_format: {
//             type: values?.examples_visible ? values.response_format : "text",
//           },
//           features: values.features.map((feature) => ({
//             type: feature.type,
//             config: feature.config,
//             priority: feature.priority,
//           })),
//           managed_agents: managedAgentsData,
//         };
//       }

//       console.log("Submitting payload:", payload);

//       if (agentId) {
//         const updatedAgent = await updateAgent({
//           agentId,
//           endpoint:
//             validTools.length <= 1 ? "/agents/template/single-task" : "/agents",
//           // @ts-ignore
//           values: payload,
//         });
//         setCreatedAgent(updatedAgent.data);
//         updateStore({
//           _id: agentId,
//           ...payload,
//           updated_at: new Date().toISOString(),
//         });
//         setLastSubmittedValues({ ...values });
//         form.reset(values);
//         toast({
//           title: "Your agent has been updated!",
//         });

//         if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
//           mixpanel.track("Agent updated", payload);
//       } else {
//         const response = await createAgent({
//           endpoint,
//           // @ts-ignore
//           values: payload,
//         });
//         const newAgentId = response.data.agent_id;
//         if (!newAgentId) {
//           throw new Error("No agent ID returned from creation");
//         }

//         addAgent({
//           _id: newAgentId,
//           ...payload,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         });
//         if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
//           mixpanel.track("Agent created", payload);
//         setLastSubmittedValues(values);
//         navigate(`/agent-create/${newAgentId}`, {
//           replace: true,
//         });
//         toast({
//           title: "Your agent has been created!",
//         });
//       }
//     } catch (error) {
//       console.error("Error with agent => ", error);
//       toast({
//         title: `Error ${agentId ? "updating" : "creating"} agent`,
//         description: "Please try again",
//         variant: "destructive",
//       });
//     }
//   };

//   const hasRealChanges = useCallback((): boolean => {
//     const currentValues = form.getValues();
//     const originalValues: Partial<FormValues> = location.state?.agent
//       ? {
//           name: location.state.agent.name || "",
//           description: location.state.agent.description,
//           agent_role: location.state.agent.agent_role,
//           agent_instructions: location.state.agent.agent_instructions,
//           examples: location.state.agent.examples || "",
//           features: location.state.agent.features || [],
//           tools: location.state.agent.tools || [],
//           provider_id: location.state.agent.provider_id || "",
//           model: location.state.agent.model || "",
//           temperature: parseFloat(location.state.agent.temperature) || 0,
//           top_p: parseFloat(location.state.agent.top_p) || 0,
//         }
//       : (form.formState.defaultValues as Partial<FormValues>);

//     const compareValues = lastSubmittedValues || originalValues;

//     const isEqual = (a: any, b: any): boolean => {
//       if (Array.isArray(a) && Array.isArray(b)) {
//         if (a.length !== b.length) return false;

//         const sortedA = [...a].sort((x, y) => x?.type?.localeCompare(y.type));
//         const sortedB = [...b].sort((x, y) => x?.type?.localeCompare(y.type));

//         return JSON.stringify(sortedA) === JSON.stringify(sortedB);
//       }
//       if (typeof a === "object" && a !== null && b !== null) {
//         return JSON.stringify(a) === JSON.stringify(b);
//       }
//       if (typeof a === "number" || typeof b === "number") {
//         return Number(a) === Number(b);
//       }
//       return a === b;
//     };

//     if (!location.state?.agent && !lastSubmittedValues) {
//       return false;
//     }

//     return Object.keys(currentValues).some((field) => {
//       const current = currentValues[field as keyof FormValues];
//       const initial = compareValues?.[field as keyof FormValues];
//       return !isEqual(current, initial);
//     });
//   }, [form, lastSubmittedValues, location.state?.agent]);

//   const getAgentAPIJson = () => {
//     const formValues = form.getValues();
//     let formattedValues = { ...formValues };

//     // Removed unused managedAgentsData and references to non-existent managed_agents property
//     if (formValues.tools && formValues.tools.length > 0) {
//       const toolNames = formValues.tools.map((t) => t.name);
//       const toolDescriptions = formValues.tools
//         .filter((t) => t.name)
//         .map((t) => `${t.name}: ${t.usage_description || ""}`)
//         .join("\n");

//       formattedValues = {
//         ...formattedValues,
//         // @ts-ignore
//         tools: toolNames.filter((name) => name),
//         tool_usage_description: toolDescriptions,
//       };
//     }

//     return JSON.stringify(
//       {
//         ...formattedValues,
//         response_format: {
//           type: formattedValues?.examples_visible
//             ? formattedValues?.response_format
//             : "text",
//         },
//         examples: formattedValues?.examples_visible
//           ? formattedValues?.examples
//           : null,
//         temperature: formattedValues.temperature?.toString() ?? "",
//         top_p: formattedValues.top_p?.toString() ?? "",
//       },
//       null,
//       2,
//     );
//   };

//   const handleCopy = async () => {
//     const formValues = form.getValues();

//     let formattedValues = { ...formValues };

//     if (formValues.tools && formValues.tools.length > 0) {
//       const toolNames = formValues.tools.map((t) => t.name);

//       const toolDescriptions = formValues.tools
//         .map((t) => `${t.name}: ${t.usage_description || ""}`)
//         .join("\n");

//       formattedValues = {
//         ...formattedValues,
//         // @ts-ignore
//         tools: toolNames,
//         tool_usage_description: toolDescriptions,
//       };
//     }

//     const contentToCopy =
//       activeTab === "api"
//         ? getAgentAPIJson()
//         : getCurlCommand(agentId, apiKey, userName);

//     try {
//       await navigator.clipboard.writeText(contentToCopy);
//       setIsCopied(true);
//       if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
//         mixpanel.track(`User copied ${activeTab}`);
//       setTimeout(() => setIsCopied(false), 2000);
//     } catch (err) {
//       toast({
//         title: "Failed to copy",
//         variant: "destructive",
//       });
//     }
//   };

//   useEffect(() => {
//     const fetchTools = async () => {
//       if (!apiKey) {
//         setToolsLoading(false);
//         return;
//       }

//       setToolsLoading(true);
//       try {
//         const userToolsResponse = await axios.get(
//           `${import.meta.env.VITE_BASE_URL}/v3/tools/composio/user`,
//           {
//             headers: {
//               accept: "application/json",
//               "x-api-key": apiKey,
//             },
//           },
//         );

//         if (Array.isArray(userToolsResponse.data)) {
//           setApiTools([]);
//           setUserTools(userToolsResponse.data);
//         }
//       } catch (error) {
//         console.error("Error fetching tools:", error);
//       } finally {
//         setToolsLoading(false);
//       }
//     };

//     fetchTools();
//   }, [apiKey]);

//   if (isFetchingCurrentOrgMembers || isFetchingAgentPolicies) {
//     return <Loader loadingText="Loading ..." />;
//   }

//   // Removed undefined onLoad function call

//   console.log("create agent rerender");
//   return (
//     <>
//       <motion.div
//         initial={{ opacity: 0, x: 10 }}
//         animate={{ opacity: 1, x: 0 }}
//         exit={{ opacity: 0, x: -10 }}
//         className="flex h-screen overflow-hidden"
//       >
//         {/* Main content section */}
//         <div
//           className={cn(
//             "flex h-full flex-1 flex-col overflow-hidden",
//             (isFetchingAgentById ||
//               isFetchingAgentPolicies ||
//               isFetchingCurrentOrgMembers) &&
//               "shimmer",
//           )}
//         >
//           <AgentApiDialog
//             agentId={agentId}
//             apiKey={apiKey}
//             payload={form.getValues() as any}
//             sessionId={sessionId}
//             userName={userName}
//             hasUnsavedChanges={!!Object.keys(form.formState.dirtyFields).length}
//           />
//           <div className="flex h-full flex-1 flex-col overflow-hidden">
//             <div className="flex-none p-4">
//               <div className="flex justify-between pr-4">
//                 <div className="flex gap-2">
//                   <ArrowLeft
//                     onClick={() => navigate(-1)}
//                     className="mr-2 mt-1 cursor-pointer"
//                   />
//                   <p className="text-2xl font-medium">
//                     {agentId ? "Manage Agent" : "Create Agent"}
//                   </p>
//                 </div>
//                 {!showVersionHeader ? (
//                   <div className="flex items-center">
//                     <Button
//                       variant="outline"
//                       size="default"
//                       className="mr-2"
//                       onClick={handleHistoryVersion}
//                     >
//                       <Clock8 className="mr-2 h-5 w-5" />
//                       Version History
//                     </Button>
//                     <Dialog>
//                       <DialogTrigger
//                         className={buttonVariants({ variant: "outline" })}
//                       >
//                         <Code className="mr-2 size-4" />
//                         Agent API
//                       </DialogTrigger>
//                       <DialogContent className="top-[50%] max-w-xl">
//                         <DialogHeader>
//                           <DialogTitle className="flex items-center justify-between">
//                             <p>Agent API</p>
//                             <Button
//                               variant="outline"
//                               size="sm"
//                               onClick={handleCopy}
//                             >
//                               {isCopied ? (
//                                 <>
//                                   <Check className="mr-1 size-4" /> Copied
//                                 </>
//                               ) : (
//                                 <>
//                                   <Copy className="mr-2 size-4" /> Copy
//                                 </>
//                               )}
//                             </Button>
//                           </DialogTitle>
//                         </DialogHeader>
//                         <Tabs defaultValue="api" onValueChange={setActiveTab}>
//                           <TabsList className="grid w-full grid-cols-2">
//                             <TabsTrigger value="api">Agent JSON</TabsTrigger>
//                             <TabsTrigger value="inference">
//                               Inference
//                             </TabsTrigger>
//                           </TabsList>
//                           <TabsContent
//                             value="api"
//                             className="h-[60vh] overflow-auto"
//                           >
//                             <div className="h-[60vh] overflow-auto rounded-md border bg-secondary p-2">
//                               <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
//                                 {getAgentAPIJson()}
//                               </pre>
//                             </div>
//                           </TabsContent>
//                           <TabsContent
//                             value="inference"
//                             className="h-[60vh] overflow-auto"
//                           >
//                             <div className="h-[60vh] overflow-auto rounded-md border bg-secondary p-2">
//                               <pre className="overflow-auto whitespace-pre-wrap text-xs leading-relaxed">
//                                 {getCurlCommand(agentId, apiKey, userName)}
//                               </pre>
//                             </div>
//                           </TabsContent>
//                         </Tabs>
//                       </DialogContent>
//                     </Dialog>
//                   </div>
//                 ) : selectedVersion ? (
//                   <div className="flex items-center space-x-4 rounded-md px-4 py-2">
//                     <span className="text-sm">
//                       Viewing previous version:{" "}
//                       {formatDate(selectedVersion.timestamp)}
//                     </span>
//                     <Button
//                       variant="default"
//                       onClick={() => {
//                         if (
//                           mixpanel.hasOwnProperty("cookie") &&
//                           isMixpanelActive
//                         )
//                           mixpanel.track("Restore clicked");
//                         setShowRestoreDialog(true);
//                       }}
//                     >
//                       Restore
//                     </Button>
//                   </div>
//                 ) : null}
//               </div>
//             </div>

//             <Form {...form}>
//               <form
//                 onSubmit={form.handleSubmit(onSubmit)}
//                 className="flex h-[calc(100%-5rem)] flex-col overflow-hidden"
//               >
//                 <fieldset
//                   disabled={isReadOnly}
//                   className="scrollable-fieldset flex h-full flex-col"
//                 >
//                   <div className="flex h-full flex-1 gap-2 overflow-hidden">
//                     {/* Basic Details */}
//                     <div className="no-scrollbar h-full w-8/12 overflow-y-auto p-4">
//                       <BasicDetails
//                         form={form}
//                         scrollRef={scrollRef}
//                         providers={providers.sort(
//                           (firstEl, secondEl) =>
//                             firstEl.priority - secondEl.priority,
//                         )}
//                         models={models}
//                         setModels={setModels}
//                         apiTools={apiTools}
//                         userTools={userTools}
//                         setApiTools={setApiTools}
//                         setUserTools={setUserTools}
//                         toolsLoading={toolsLoading}
//                         isExistingAgent={!!location.state?.agent}
//                         isModelFieldLoading={isModelFieldLoading}
//                       />
//                     </div>
//                     <div className="h-full w-px bg-border" />
//                     {/* Features and Tools Tabs */}
//                     <div className="w-4/12 overflow-hidden py-4">
//                       <Features
//                         // @ts-ignore
//                         form={form}
//                         onEnabledCountChange={setEnabledFeaturesCount}
//                       />
//                     </div>
//                   </div>
//                   {/* Bottom buttons */}
//                   <div className="flex justify-end space-x-2 border-t p-4">
//                     {agentId && (
//                       <>
//                         {!!Object.keys(form.formState.dirtyFields).length &&
//                           hasRealChanges() && (
//                             <div className="flex items-center text-yellow-500">
//                               <TriangleAlert className="mr-2 h-5 w-5" />
//                               <span className="mr-4 text-sm">
//                                 You have unsaved changes
//                               </span>
//                             </div>
//                           )}
//                         <Button type="submit" loading={isUpdatingAgent}>
//                           Update
//                         </Button>
//                       </>
//                     )}
//                   </div>
//                 </fieldset>
//               </form>
//             </Form>
//           </div>
//         </div>

//         <Separator orientation="vertical" />

//         {/* Inference section */}
//         <div className="h-full w-1/3 overflow-y-auto p-4">
//           {!isHistoryOn ? (
//             <Inference
//               agentId={agentId}
//               isLaunched={isLaunched}
//               appId={appId}
//               agentUserId={location.state?.agent?.api_key}
//               currentUser={currentUser}
//               userId={userId}
//               onSubmit={form.handleSubmit(onSubmit)}
//               isCreating={isCreatingAgent}
//               features={form.watch("features")}
//               // @ts-ignore
//               tool={form.watch("tool")}
//               tools={form.watch("tools")}
//               managedAgents={form.watch("managed_agents")}
//             />
//           ) : (
//             <VersionHistory
//               onSelect={handleVersionSelect}
//               onClose={() => {
//                 if (initialValues) {
//                   form.reset(initialValues);
//                 }
//                 setIsReadOnly(false);
//                 setIsHistoryOn(false);
//                 setShowVersionHeader(false);
//                 setSelectedVersion(null);
//               }}
//             />
//           )}
//         </div>
//       </motion.div>
//       <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Confirm Restore</AlertDialogTitle>
//             <p className="mt-2 text-sm text-muted-foreground">
//               Are you sure you want to restore this version? This will overwrite
//               the current form values. It can not be undone.
//             </p>
//           </AlertDialogHeader>
//           <div className="mt-4 flex justify-end gap-4">
//             <Button
//               variant="outline"
//               onClick={() => setShowRestoreDialog(false)}
//             >
//               Cancel
//             </Button>
//             <Button
//               loading={isActivatingVersion}
//               onClick={handleRestoreVersion}
//             >
//               Yes, Restore
//             </Button>
//           </div>
//         </AlertDialogContent>
//       </AlertDialog>
//     </>
//   );
// }
