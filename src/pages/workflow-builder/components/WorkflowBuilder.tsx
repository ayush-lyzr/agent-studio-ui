import React from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import { Loader2 } from "lucide-react";

// Import node types (these need to be implemented or migrated)
import {
  AgentNode,
  ApiNode,
  InputsNode,
  CustomEdge,
  GptConditionalNode,
  GptRouterNode,
  HumanApprovalNode,
  AgenttoAgentNode,
} from "./NodeTypes";
import Sidebar from "./Sidebar";
import Header from "./Header";
import NodeConfig from "./NodeConfig";
import RouterNodeConfig from "./RouterNodeConfig";
import AgentApiMappingModal from "./AgentApiMappingModal";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { WorkflowProvider } from "@/contexts/WorkflowContext";
import { ApiKeyProvider } from "@/contexts/ApiKeyContext";
import ChatBox from "./ChatBox"; // Add import for new ChatBox component

// Types
import {
  WorkflowNode,
  WorkflowEdge,
  DefaultInput,
  NodeType,
  Route,
  WorkflowResponse,
} from "@/types/workflow";

// Utilities
import {
  generateId,
  convertToWorkflow,
  formatWorkflowJson,
  validateWorkflow,
  generateUniqueName,
} from "@/utils/workflowUtils";
import { jsonToWorkflow } from "@/utils/jsonToWorkflow";
import {
  saveWorkflow as saveWorkflowToServer,
  getWorkflow,
  executeWorkflow,
  updateWorkflow,
} from "@/services/workflowApiService";
import { useApiKey, useGetWorkflowById } from "@/services/workflowService";
import WorkflowEvents from "./WorkflowEvents";
import { useNavigate, useParams } from "react-router-dom";

// Import custom styles
import "./WorkflowBuilder.css";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { Path } from "@/lib/types";

// Define node types
const nodeTypes = {
  api: ApiNode,
  agent: AgentNode,
  inputs: InputsNode,
  gpt_conditional: GptConditionalNode,
  gpt_router: GptRouterNode,
  approval_block: HumanApprovalNode,
  a2a: AgenttoAgentNode,
} as any; // Using 'as any' to bypass type checking for node types

// Define edge types
const edgeTypes = {
  custom: CustomEdge,
};

interface WorkflowBuilderProps {
  initialWorkflowName?: string;
  initialWorkflowId?: string;
}

// Main content of the workflow builder
// Generate a random workflow name for new workflows
const generateRandomWorkflowName = (): string => {
  const adjectives = [
    "Swift",
    "Clever",
    "Smart",
    "Quick",
    "Bright",
    "Bold",
    "Fresh",
    "Agile",
    "Sharp",
    "Rapid",
    "Smooth",
    "Prime",
    "Fast",
    "Clear",
    "Wise",
    "Great",
    "Keen",
    "Strong",
  ];

  const nouns = [
    "Flow",
    "Task",
    "Run",
    "Step",
    "Path",
    "Plan",
    "Move",
    "Mode",
    "Work",
    "Job",
    "Goal",
    "Way",
    "Feat",
    "Act",
    "Deed",
    "Turn",
    "Shift",
    "Play",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective}${noun}`;
};

// Generate a random run name using predefined adjectives and nouns
const generateRandomRunName = (): string => {
  const adjectives = [
    "Swift",
    "Clever",
    "Smart",
    "Quick",
    "Bright",
    "Bold",
    "Fresh",
    "Agile",
    "Sharp",
    "Rapid",
    "Smooth",
    "Prime",
    "Fast",
    "Clear",
    "Wise",
    "Great",
    "Keen",
    "Strong",
  ];

  const nouns = [
    "Flow",
    "Task",
    "Run",
    "Step",
    "Path",
    "Plan",
    "Move",
    "Mode",
    "Work",
    "Job",
    "Goal",
    "Way",
    "Feat",
    "Act",
    "Deed",
    "Turn",
    "Shift",
    "Play",
  ];

  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${adjective}${noun}`;
};

const WorkflowBuilderContent: React.FC<WorkflowBuilderProps> = ({
  initialWorkflowName,
}) => {
  // Get the URL parameter to check if we're creating a new workflow
  const { workflowName: urlWorkflowName } = useParams();

  const isNewWorkflow = urlWorkflowName === "new";
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<any>(null);
  const [nodes, setNodes, defaultOnNodesChange] = useNodesState<WorkflowNode>(
    [],
  );
  const [edges, setEdges, defaultOnEdgesChange] = useEdgesState<WorkflowEdge>(
    [],
  );
  const [selectedNode, setSelectedNode] = React.useState<WorkflowNode | null>(
    null,
  );
  const [flowName, setFlowName] = React.useState<string>(
    initialWorkflowName || "Untitled " + generateRandomWorkflowName(),
  );

  const [runName, setRunName] = React.useState<string>("Run 1");
  const [workflowJson, setWorkflowJson] = React.useState<string>("");
  const [defaultInputs, setDefaultInputs] = React.useState<
    Record<string, DefaultInput>
  >({});
  const [globalFileMapping, setGlobalFileMapping] = React.useState<
    Record<string, { name: string; type: string; size: number }>
  >({});
  const [isRunning, setIsRunning] = React.useState<boolean>(false);
  const [isRouterConfigOpen, setIsRouterConfigOpen] =
    React.useState<boolean>(false);
  const [selectedRouterId, setSelectedRouterId] = React.useState<string | null>(
    null,
  );
  // Agent-API mapping modal state
  const [isMappingModalOpen, setIsMappingModalOpen] =
    React.useState<boolean>(false);
  const [mappingAgentNode, setMappingAgentNode] =
    React.useState<WorkflowNode | null>(null);
  const [mappingApiNode, setMappingApiNode] =
    React.useState<WorkflowNode | null>(null);
  const [triggerSaveAfterMapping, setTriggerSaveAfterMapping] =
    React.useState<boolean>(false);
  const [triggerSaveAfterNodeConfig, setTriggerSaveAfterNodeConfig] =
    React.useState<boolean>(false);
  const navigate = useNavigate();

  // Function to open mapping modal from anywhere
  const openMappingModal = React.useCallback(
    (agentNode: WorkflowNode, apiNode: WorkflowNode) => {
      setMappingAgentNode(agentNode);
      setMappingApiNode(apiNode);
      setIsMappingModalOpen(true);
    },
    [],
  );

  // Set global function for NodeConfig to use
  React.useEffect(() => {
    (window as any).openMappingModal = openMappingModal;
    return () => {
      delete (window as any).openMappingModal;
    };
  }, [openMappingModal]);

  // Handle saving agent-API mapping
  const handleSaveMapping = React.useCallback(
    (mappingConfig: any) => {
      if (!mappingAgentNode || !mappingApiNode) return;

      console.log("Updating API node with mapping:", mappingConfig);

      // Update the API node with the mapping configuration
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === mappingApiNode.id) {
            const currentParams = node.data.params || {};
            const agentName = mappingAgentNode.data.name;
            const agentParamBlockName = `${agentName}_data`;
            const connectedAgents = edges
              .filter((edge) => edge.target === node.id)
              .map((edge) => nds.find((n) => n.id === edge.source))
              .filter((sourceNode) => sourceNode?.type === "agent");

            // Check if there's an existing parameter block for this agent
            const hasExistingParamBlock = currentParams[agentParamBlockName];
            const isSingleAgent = connectedAgents.length <= 1;
            let updatedParams = { ...currentParams };

            if (hasExistingParamBlock) {
              // Update the existing parameter block
              const existingBlock = currentParams[agentParamBlockName];
              updatedParams[agentParamBlockName] = {
                ...(typeof existingBlock === "object" && existingBlock !== null
                  ? existingBlock
                  : {}),
                mapping: mappingConfig.mapping,
                depends: mappingConfig.depends,
              };
              updatedParams.config = isSingleAgent
                ? mappingConfig
                : {
                    ...(typeof currentParams.config === "object" && currentParams.config !== null
                      ? currentParams.config
                      : {}),
                    default: mappingConfig.default,
                  };
            } else if (connectedAgents.length === 0) {
              updatedParams.config = mappingConfig;
            } else {
              updatedParams[agentParamBlockName] = {
                depends: mappingConfig.depends,
                mapping: mappingConfig.mapping,
              };
              updatedParams.config = isSingleAgent
                ? mappingConfig
                : {
                    ...(typeof currentParams.config === "object" && currentParams.config !== null
                      ? currentParams.config
                      : {}),
                    default: mappingConfig.default,
                  };
            }

            const updatedNode = {
              ...node,
              data: {
                ...node.data,
                params: updatedParams,
              },
            };
            console.log("Updated API node for agent:", agentName, updatedNode);
            return updatedNode;
          }
          return node;
        }),
      );

      // Create the edge between agent and API nodes
      const newEdge = {
        id: `e${mappingAgentNode.id}-${mappingApiNode.id}`,
        source: mappingAgentNode.id,
        target: mappingApiNode.id,
        animated: false,
        style: { strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          isAgentApiMapping: true,
        },
      };

      setEdges((eds) => addEdge(newEdge as any, eds));

      toast.success(
        `Created mapping from "${mappingAgentNode.data.tag}" to "${mappingApiNode.data.tag}"`,
      );

      // Reset modal state and close all other modals
      setIsMappingModalOpen(false);
      setMappingAgentNode(null);
      setMappingApiNode(null);

      // Close any other open modals/panels
      setSelectedNode(null);
      setIsRouterConfigOpen(false);
      setSelectedRouterId(null);
      setTriggerSaveAfterMapping(true);
    },
    [mappingAgentNode, mappingApiNode, edges, setNodes, setEdges],
  );
  const [isUpdatingFromJson, setIsUpdatingFromJson] =
    React.useState<boolean>(false);
  const [currentWorkflow, setCurrentWorkflow] =
    React.useState<WorkflowResponse | null>(null);
  // Add new state for OpenAI API key
  const [openAiKey, setOpenAiKey] = React.useState<string>(
    localStorage.getItem("openAiKey") || "",
  );

  // Update flowName when initialWorkflowName changes
  React.useEffect(() => {
    if (initialWorkflowName) {
      setFlowName(initialWorkflowName);
    }
  }, [initialWorkflowName]);

  // Get API key using our custom hook
  const apiKey = useApiKey();

  // Use the new hook to fetch workflow data
  const {
    workflow: fetchedWorkflow,
    loading,
    error: workflowError,
  } = useGetWorkflowById(
    initialWorkflowName && !initialWorkflowName.includes("Untitled")
      ? initialWorkflowName
      : null,
    apiKey,
  );

  // Show loading indicator when fetching workflow
  React.useEffect(() => {
    if (
      loading &&
      initialWorkflowName &&
      initialWorkflowName.includes("Untitled")
    ) {
      toast.info("Setting up things");
    }
  }, [loading, initialWorkflowName]);

  // Process the fetched workflow when it's available
  React.useEffect(() => {
    // Skip if no workflow is fetched or if initialWorkflowName is not set
    if (
      !fetchedWorkflow ||
      !initialWorkflowName ||
      initialWorkflowName === "new"
    ) {
      return;
    }

    try {
      if (fetchedWorkflow.flow_data) {
        const workflowData = fetchedWorkflow.flow_data;

        // Handle different formats of flow_data - it might be a string or an object
        try {
          // Convert workflowData to a string if it's an object
          // The workflowData from the API is already the correct structure
          const workflowString =
            typeof workflowData === "string"
              ? workflowData
              : JSON.stringify(workflowData);

          const {
            nodes: newNodes,
            edges: newEdges,
            flowName: newFlowName,
            runName: newRunName,
            defaultInputs: newDefaultInputs,
            fileMapping: loadedFileMapping,
          } = jsonToWorkflow(workflowString);

          setNodes(newNodes);
          setEdges(newEdges);
          setFlowName(
            fetchedWorkflow.flow_name || newFlowName || "New Workflow",
          );
          setRunName(newRunName || "Run 1");

          // Handle defaultInputs properly
          if (newDefaultInputs) {
            if (typeof newDefaultInputs === "string") {
              setDefaultInputs(jsonToInputs(newDefaultInputs));
            } else {
              setDefaultInputs(
                newDefaultInputs as Record<string, DefaultInput>,
              );
            }
          } else {
            setDefaultInputs({});
          }

          // Load file mapping if available
          if (loadedFileMapping) {
            setGlobalFileMapping(loadedFileMapping);
          } else {
            setGlobalFileMapping({});
          }

          setCurrentWorkflow(fetchedWorkflow);
          toast.success("Workflow loaded successfully");
        } catch (parseError: unknown) {
          const errorMessage =
            parseError instanceof Error
              ? parseError.message
              : "Unknown error parsing workflow data";
          console.error(`Failed to parse workflow data: ${errorMessage}`);

          // Only show error notification if not creating a new workflow
          if (!isNewWorkflow) {
            toast.error(`Failed to parse workflow data: ${errorMessage}`);
          }
        }
      }
    } catch (error: any) {
      console.error("Error processing workflow:", error);

      // Only show error notification if not creating a new workflow
      if (initialWorkflowName !== "new") {
        toast.error(`Error processing workflow: ${error.message}`);
      }
    }
  }, [
    fetchedWorkflow,
    initialWorkflowName,
    setNodes,
    setEdges,
    setFlowName,
    setRunName,
  ]);

  // Handle workflow loading error
  React.useEffect(() => {
    if (workflowError) {
      console.error("Error loading workflow:", workflowError);

      if (initialWorkflowName?.includes("Untitled")) {
        return;
      }

      // Only show error notification if not creating a new workflow
      if (initialWorkflowName !== "new") {
        toast.error(`Error loading workflow: ${workflowError.message}`);
      }

      // Fallback to the original method if the hook method fails
      if (initialWorkflowName && !isNewWorkflow) {
        const loadWorkflowFallback = async () => {
          try {
            const response = await getWorkflow(initialWorkflowName);
            if (response && response.flow_data) {
              // Process workflow data (same code as above)
              // This is a fallback mechanism
              const workflowData = response.flow_data;
              const workflowString =
                typeof workflowData === "string"
                  ? workflowData
                  : JSON.stringify(workflowData);

              const {
                nodes: newNodes,
                edges: newEdges,
                flowName: newFlowName,
                runName: newRunName,
                defaultInputs: newDefaultInputs,
                fileMapping: loadedFileMapping,
              } = jsonToWorkflow(workflowString);

              setNodes(newNodes);
              setEdges(newEdges);
              setFlowName(response.flow_name || newFlowName || "New Workflow");
              setRunName(newRunName || "Run 1");

              if (newDefaultInputs) {
                if (typeof newDefaultInputs === "string") {
                  setDefaultInputs(jsonToInputs(newDefaultInputs));
                } else {
                  setDefaultInputs(
                    newDefaultInputs as Record<string, DefaultInput>,
                  );
                }
              } else {
                setDefaultInputs({});
              }

              // Load file mapping if available
              if (loadedFileMapping) {
                setGlobalFileMapping(loadedFileMapping);
              } else {
                setGlobalFileMapping({});
              }

              setCurrentWorkflow(response);
              toast.success("Workflow loaded successfully (fallback)");
            }
          } catch (fallbackError: any) {
            console.error("Fallback also failed:", fallbackError);

            // Only show error notification if not creating a new workflow
            if (!isNewWorkflow) {
              toast.error(`All attempts to load workflow failed`);
            }
          }
        };

        loadWorkflowFallback();
      }
    }
  }, [workflowError, initialWorkflowName]);

  // Add the missing onDragOver handler
  const onDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [],
  );

  // This handler needs to be updated to use direct values for user_id and session_id
  const onDrop = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData(
        "application/reactflow",
      ) as NodeType;

      // Check if the dropped element is valid
      if (!type) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeId = generateId();
      let newNode: WorkflowNode;

      if (type === "api") {
        const baseName = `api_${nodeId.slice(0, 4)}`;
        const uniqueName = generateUniqueName(nodes, "api", baseName);

        newNode = {
          id: nodeId,
          type,
          position,
          data: {
            name: uniqueName,
            tag: "API Call",
            function: "api_call",
            params: {
              config: {
                url: "",
                method: "GET",
                headers: {},
              },
            },
          },
        };
      } else if (type === "agent") {
        // Generate random UUIDs for user_id and session_id
        const userId = uuidv4();
        // const sessionId = uuidv4();

        // Generate a unique name for the agent
        const baseName = `agent_${nodeId.slice(0, 4)}`;
        const uniqueName = generateUniqueName(nodes, "agent", baseName);

        newNode = {
          id: nodeId,
          type,
          position,
          data: {
            name: uniqueName,
            tag: "Select an agent",
            function: "call_lyzr_agent",
            params: {
              config: {
                // Use direct values without nested object
                user_id: userId,
                // session_id: sessionId, // commenting session id to generate for every new run
                api_key: "",
              },
              assets: [],
            },
          },
        };
      } else if (type === "gpt_conditional") {
        const baseName = `conditional_${nodeId.slice(0, 4)}`;
        const uniqueName = generateUniqueName(
          nodes,
          "gpt_conditional",
          baseName,
        );

        newNode = {
          id: nodeId,
          type,
          position,
          data: {
            name: uniqueName,
            tag: "Conditional",
            function: "gpt_conditional_block",
            params: {
              message: "",
              condition: "Is the user angry or frustrated?",
              openai_api_key: "",
              model: "gpt-3.5-turbo",
              temperature: 0.0,
              true: "",
              false: "",
            },
          },
        };
      } else if (type === "gpt_router") {
        // Add a new GPT Router node with default routes
        const baseName = `router_${nodeId.slice(0, 4)}`;
        const uniqueName = generateUniqueName(nodes, "gpt_router", baseName);

        newNode = {
          id: nodeId,
          type,
          position,
          data: {
            name: uniqueName,
            tag: "Router",
            function: "gpt_router",
            params: {
              message: "",
              openai_api_key: "",
              fallback_route: "general",
              routes: [] as Route[], // Explicitly initialize as an empty Route[] array
            },
          },
        };
      } else if (type === "inputs") {
        const baseName = `inputs_${nodeId.slice(0, 4)}`;
        const uniqueName = generateUniqueName(nodes, "inputs", baseName);

        newNode = {
          id: nodeId,
          type,
          position,
          data: {
            name: uniqueName,
            tag: "Default Inputs",
            function: "default_inputs",
            params: {
              keys: {},
            },
          },
        };
      } else if (type === ("approval_block" as string)) {
        // Generate a unique name for the approval node
        const baseName = `approval_${nodeId.slice(0, 4)}`;
        const uniqueName = generateUniqueName(
          nodes,
          "approval_block",
          baseName,
        );

        newNode = {
          id: nodeId,
          type,
          position,
          data: {
            name: uniqueName,
            tag: "Human Approval",
            function: "approval_block",
            params: {
              owner_user_id: "default_owner",
              approvals: [
                {
                  user_id: "",
                  user_email: "approver@example.com",
                  approval_status: "pending",
                },
              ],
            },
          },
        };
      } else if (type === "a2a") {
        const baseName = `a2a_${nodeId.slice(0, 4)}`;
        const uniqueName = generateUniqueName(nodes, "a2a", baseName);

        newNode = {
          id: nodeId,
          type,
          position,
          data: {
            name: uniqueName,
            tag: "Agent to Agent",
            function: "a2a",
            params: {
              base_url: "",
              message: "",
            },
          },
        };
      } else {
        // Default fallback (should not happen with proper typing)
        return;
      }

      // Add the new node with a smooth animation
      setNodes((nds) => [...nds, newNode]);

      // Automatically select the new node for editing
      setTimeout(() => {
        setSelectedNode(newNode);
      }, 100);
    },
    [nodes, reactFlowInstance, setNodes],
  );

  const onConnect = React.useCallback(
    (connection: any) => {
      // Get source and target nodes
      const sourceNode = nodes.find((node) => node.id === connection.source);
      const targetNode = nodes.find((node) => node.id === connection.target);

      if (sourceNode && targetNode) {
        // Handle agent to API connections - open mapping modal
        if (sourceNode.type === "agent" && targetNode.type === "api") {
          // Always open mapping modal for agent-to-API connections
          // This allows users to configure mappings for multi-agent scenarios
          setMappingAgentNode(sourceNode);
          setMappingApiNode(targetNode);
          setIsMappingModalOpen(true);
          // Don't create the edge yet - wait for mapping configuration
          return;
        }

        // If connecting from an inputs node, update the target node's params
        if (sourceNode.type === "inputs" && connection.sourceHandle) {
          // Update targetNode to include the input reference
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === targetNode.id) {
                // Add a parameter to the target node that references the input key
                const paramName = connection.sourceHandle;
                const updatedParams = {
                  ...node.data.params,
                  [paramName]: { input: connection.sourceHandle },
                };

                return {
                  ...node,
                  data: {
                    ...node.data,
                    params: updatedParams,
                  },
                };
              }
              return node;
            }),
          );

          // Update default inputs in workflow
          const inputKey = connection.sourceHandle;
          // Using 'as any' to avoid type error when accessing the keys property
          const inputValue =
            (sourceNode.data.params as any).keys?.[inputKey] || "";

          setDefaultInputs((current) => ({
            ...current,
            [inputKey]: inputValue,
          }));

          toast.success(
            `Connected input "${connection.sourceHandle}" to node "${targetNode.data.name}"`,
          );
        }

        // Handle connections from conditional nodes
        if (sourceNode.type === "gpt_conditional" && connection.sourceHandle) {
          // Get condition value (true or false) from the source handle
          const condition = connection.sourceHandle;

          // Update the conditional node to reference the target node for this condition path
          setNodes((nds) =>
            nds.map((node) => {
              if (node.id === sourceNode.id) {
                return {
                  ...node,
                  data: {
                    ...node.data,
                    params: {
                      ...node.data.params,
                      [condition]: targetNode.data.name, // Set the node name as the condition's target
                    },
                  },
                };
              }
              return node;
            }),
          );

          // Store condition info in edge data but don't add a visible label
          connection.data = { condition: condition, isConditionalEdge: true };

          toast.success(
            `Connected "${condition}" condition to "${targetNode.data.name}"`,
          );
        }
      }

      // Determine if this is a conditional edge (from router or conditional node)
      const isConditionalEdge =
        connection.sourceHandle &&
        (connection.sourceHandle === "true" ||
          connection.sourceHandle === "false" ||
          connection.label?.includes("Route"));

      const newEdge = {
        ...connection,
        id: `e${connection.source}-${connection.target}-${connection.sourceHandle || ""}`,
        animated: false, // Disable animation for all edges
        style: { strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
        data: {
          ...connection.data,
          isConditionalEdge,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [nodes, setNodes, setDefaultInputs],
  );

  // Utility function to fix dependency mismatches between agents and API nodes
  const fixDependencyMismatches = React.useCallback(
    (currentNodes: WorkflowNode[], currentEdges: WorkflowEdge[]) => {
      const updatedNodes = [...currentNodes];
      let hasChanges = false;

      // For each API node, check if its dependency matches the connected agent
      currentNodes.forEach((apiNode, index) => {
        if (apiNode.type === "api" && apiNode.data?.params?.config) {
          const config = apiNode.data.params.config;

          // Check if config has a depends field
          if (
            typeof config === "object" &&
            "depends" in config &&
            config.depends
          ) {
            // Find the agent connected to this API node via edges
            const connectedEdge = currentEdges.find(
              (edge) => edge.target === apiNode.id,
            );
            if (connectedEdge) {
              const connectedAgent = currentNodes.find(
                (node) => node.id === connectedEdge.source,
              );

              // If connected agent exists and names don't match, update the dependency
              if (
                connectedAgent?.type === "agent" &&
                connectedAgent.data.name !== config.depends
              ) {
                console.log(
                  `Auto-fixing dependency mismatch: API "${apiNode.data.name}" depends on "${config.depends}" but is connected to "${connectedAgent.data.name}"`,
                );

                updatedNodes[index] = {
                  ...apiNode,
                  data: {
                    ...apiNode.data,
                    params: {
                      ...apiNode.data.params,
                      config: {
                        ...(config as any),
                        depends: connectedAgent.data.name,
                      },
                    },
                  },
                };
                hasChanges = true;
              }
            }
          }
        }
      });

      // Apply changes if any were made
      if (hasChanges) {
        setNodes(updatedNodes);
      }
    },
    [setNodes],
  );

  // Custom edge change handler to update API node dependencies when agent connections change
  const onEdgesChange = React.useCallback(
    (changes: any[]) => {
      // First apply the default edge changes
      defaultOnEdgesChange(changes);

      // Check for edge removals that might affect API nodes with mapping configurations
      changes.forEach((change) => {
        if (change.type === "remove") {
          const removedEdge = edges.find((edge) => edge.id === change.id);
          if (removedEdge) {
            const sourceNode = nodes.find(
              (node) => node.id === removedEdge.source,
            );
            const targetNode = nodes.find(
              (node) => node.id === removedEdge.target,
            );

            // If this was an input-to-node connection, remove the input reference from target node params
            if (
              sourceNode?.type === "inputs" &&
              targetNode &&
              removedEdge.sourceHandle
            ) {
              const inputKey = removedEdge.sourceHandle;
              setNodes((nds) =>
                nds.map((node) => {
                  if (node.id === targetNode.id) {
                    const updatedParams = { ...node.data.params };
                    if (
                      updatedParams[inputKey] &&
                      typeof updatedParams[inputKey] === "object" &&
                      updatedParams[inputKey] !== null &&
                      "input" in updatedParams[inputKey] &&
                      (updatedParams[inputKey] as any).input === inputKey
                    ) {
                      delete updatedParams[inputKey];

                      return {
                        ...node,
                        data: {
                          ...node.data,
                          params: updatedParams,
                        },
                      };
                    }
                  }
                  return node;
                }),
              );
            }

            // If this was an agent-to-API connection, clear the mapping configuration
            if (sourceNode?.type === "agent" && targetNode?.type === "api") {
              console.log("Removing agent-API mapping due to edge removal");
              setNodes((nds) =>
                nds.map((node) => {
                  if (node.id === targetNode.id) {
                    const updatedNode = { ...node };
                    // Remove the config entirely since there's no agent connected
                    if (updatedNode.data?.params?.config) {
                      const { config, ...otherParams } =
                        updatedNode.data.params;
                      updatedNode.data = {
                        ...updatedNode.data,
                        params: otherParams,
                      };
                    }
                    return updatedNode;
                  }
                  return node;
                }),
              );
            }
          }
        }
      });

      // After edge changes, fix any dependency mismatches
      setTimeout(() => {
        fixDependencyMismatches(nodes, edges);
      }, 100);
    },
    [defaultOnEdgesChange, edges, nodes, setNodes, fixDependencyMismatches],
  );

  // Auto-fix dependency mismatches whenever nodes or edges change
  React.useEffect(() => {
    if (nodes.length > 0 && edges.length >= 0) {
      // Small delay to ensure all state updates have completed
      const timeoutId = setTimeout(() => {
        fixDependencyMismatches(nodes, edges);
      }, 200);

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, fixDependencyMismatches]);

  React.useEffect(() => {
    if (selectedNode) {
      const updatedNode = nodes.find((n) => n.id === selectedNode.id);
      if (
        updatedNode &&
        JSON.stringify(updatedNode.data) !== JSON.stringify(selectedNode.data)
      ) {
        setSelectedNode(updatedNode);
      }
    }
  }, [nodes, selectedNode]);

  React.useEffect(() => {
    // Find all input nodes
    const inputsNodes = nodes.filter((node) => node.type === "inputs");

    if (inputsNodes.length > 0) {
      // Build a new defaultInputs object from all inputs nodes
      const newDefaultInputs: Record<string, any> = {};

      inputsNodes.forEach((inputNode) => {
        const keys = inputNode.data.params?.keys || {};
        Object.entries(keys).forEach(([key, value]) => {
          newDefaultInputs[key] = value;
        });
      });

      const currentKeys = Object.keys(defaultInputs).sort().join(",");
      const newKeys = Object.keys(newDefaultInputs).sort().join(",");
      const currentValues = JSON.stringify(defaultInputs);
      const newValues = JSON.stringify(newDefaultInputs);

      if (currentKeys !== newKeys || currentValues !== newValues) {
        setDefaultInputs(newDefaultInputs);
      }
    } else if (Object.keys(defaultInputs).length > 0) {
      setDefaultInputs({});
    }
  }, [nodes, defaultInputs, setDefaultInputs]);

  // Custom node change handler to fix dependencies when node names change
  const onNodesChange = React.useCallback(
    (changes: any[]) => {
      const deletions = changes.filter((change) => change.type === "remove");

      if (deletions.length > 0) {
        deletions.forEach((deletion) => {
          const nodeToDelete = nodes.find((node) => node.id === deletion.id);
          if (!nodeToDelete) return;

          if (nodeToDelete.type === "inputs") {
            const inputKeys = nodeToDelete.data.params?.keys || {};

            setDefaultInputs((current) => {
              const updated = { ...current };
              Object.keys(inputKeys).forEach((key) => {
                delete updated[key];
              });
              return updated;
            });

            setNodes((nds) =>
              nds.map((node) => {
                if (node.id === deletion.id) return node;

                const updatedParams = { ...node.data.params };
                let hasChanges = false;
                Object.keys(inputKeys).forEach((inputKey) => {
                  // @ts-ignore
                  if (updatedParams[inputKey]?.input === inputKey) {
                    delete updatedParams[inputKey];
                    hasChanges = true;
                  }
                });

                if (hasChanges) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      params: updatedParams,
                    },
                  };
                }
                return node;
              }),
            );
          }

          if (nodeToDelete.type === "gpt_conditional") {
            setNodes((nds) =>
              nds.map((node) => {
                if (node.type === "gpt_conditional") {
                  const updatedParams = { ...node.data.params };

                  if (updatedParams.true === nodeToDelete.data.name) {
                    updatedParams.true = "";
                  }
                  if (updatedParams.false === nodeToDelete.data.name) {
                    updatedParams.false = "";
                  }

                  return {
                    ...node,
                    data: {
                      ...node.data,
                      params: updatedParams,
                    },
                  };
                }
                return node;
              }),
            );
          }
        });

        toast.success("Node deleted successfully");
      }

      defaultOnNodesChange(changes);

      // Check if any agent node names were changed
      const nameChanges = changes.filter(
        (change) =>
          change.type === "replace" &&
          change.item?.data?.name &&
          change.item?.type === "agent",
      );

      if (nameChanges.length > 0) {
        // After a brief delay, fix any dependency mismatches
        setTimeout(() => {
          fixDependencyMismatches(nodes, edges);
        }, 100);
      }
    },
    [
      defaultOnNodesChange,
      nodes,
      edges,
      fixDependencyMismatches,
      setDefaultInputs,
      setNodes,
    ],
  );

  const onNodeClick = React.useCallback(
    (_event: React.MouseEvent, node: WorkflowNode) => {
      // Don't open node configuration for inputs nodes
      // if (node.type === "inputs") {
      //   return;
      // }

      // For router nodes, open the router config modal
      if (node.type === "gpt_router") {
        setSelectedRouterId(node.id);
        setIsRouterConfigOpen(true);
        return;
      }

      setSelectedNode(node);
    },
    [],
  );

  const onNodeDragStart = React.useCallback(() => {
    // Close node config panel when dragging
    setSelectedNode(null);
  }, []);

  const onPaneClick = React.useCallback(() => {
    setSelectedNode(null);
  }, []);

  const onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string,
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  // Handle saving routes for a router node
  const handleSaveRoutes = (routes: Route[]) => {
    if (!selectedRouterId) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedRouterId) {
          // Update the router node with new routes
          return {
            ...node,
            data: {
              ...node.data,
              params: {
                ...node.data.params,
                routes: [...routes], // Ensure routes is always a Route[] by creating a new array
              },
            },
          };
        }
        return node;
      }),
    );

    // Close the router config modal
    setIsRouterConfigOpen(false);
    setSelectedRouterId(null);
    toast.success("Router routes updated successfully");
  };

  const updateNode = React.useCallback(
    (
      nodeId: string,
      data: any,
      fileMapping?: Record<
        string,
        { name: string; type: string; size: number }
      >,
    ) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            // Check if name is being changed
            if (data.name !== node.data.name) {
              // Ensure the new name is unique
              data.name = generateUniqueName(
                nds.filter((n) => n.id !== nodeId), // Exclude current node
                node.type,
                data.name,
              );
            }

            // If it's an inputs node, update the default inputs state as well
            if (node.type === "inputs" && data.params?.keys) {
              const oldKeys = node.data.params?.keys || {};
              const newKeys = data.params.keys;

              setDefaultInputs((current) => {
                const updated = { ...current };

                // Remove old key
                Object.keys(oldKeys).forEach((key) => {
                  if (!(key in newKeys)) {
                    delete updated[key];
                  }
                });

                // Add new key
                Object.entries(newKeys).forEach(([key, value]) => {
                  updated[key] = value as DefaultInput;
                });

                return updated;
              });
            }

            return {
              ...node,
              data: {
                ...data,
              },
            };
          }
          return node;
        }),
      );

      // Update global file mapping if provided
      if (fileMapping) {
        setGlobalFileMapping((prevMapping) => ({
          ...prevMapping,
          ...fileMapping,
        }));
      }

      setSelectedNode(null);
      toast.success("Node updated successfully");
    },
    [setNodes, setDefaultInputs],
  );

  const deleteNode = React.useCallback(
    (nodeId: string) => {
      // Get the node to be deleted
      const nodeToDelete = nodes.find((node) => node.id === nodeId);

      // Remove the node
      setNodes((nds) => nds.filter((node) => node.id !== nodeId));

      // Remove associated edges
      setEdges((eds) =>
        eds.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      );

      if (nodeToDelete && nodeToDelete.type === "inputs") {
        const inputKeys = nodeToDelete.data.params?.keys || {};

        setDefaultInputs((current) => {
          const updated = { ...current };
          Object.keys(inputKeys).forEach((key) => {
            delete updated[key];
          });
          return updated;
        });

        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === nodeId) return node;

            const updatedParams = { ...node.data.params };
            let hasChanges = false;
            Object.keys(inputKeys).forEach((inputKey) => {
              // @ts-ignore
              if (updatedParams[inputKey]?.input === inputKey) {
                delete updatedParams[inputKey];
                hasChanges = true;
              }
            });

            if (hasChanges) {
              return {
                ...node,
                data: {
                  ...node.data,
                  params: updatedParams,
                },
              };
            }
            return node;
          }),
        );
      }

      // If the deleted node is a conditional node, update any nodes that reference it
      if (nodeToDelete && nodeToDelete.type === "gpt_conditional") {
        // Find conditional nodes with true/false paths pointing to this node
        setNodes((nds) =>
          nds.map((node) => {
            if (node.type === "gpt_conditional") {
              const updatedParams = { ...node.data.params };

              // Clear references to the deleted node
              if (updatedParams.true === nodeToDelete.data.name) {
                updatedParams.true = "";
              }
              if (updatedParams.false === nodeToDelete.data.name) {
                updatedParams.false = "";
              }

              return {
                ...node,
                data: {
                  ...node.data,
                  params: updatedParams,
                },
              };
            }
            return node;
          }),
        );
      }

      setSelectedNode(null);
      toast.success("Node deleted successfully");
    },
    [nodes, setNodes, setEdges, setDefaultInputs],
  );

  const convertToWorkflowInputs = (
    inputs: Record<string, DefaultInput> | string | undefined,
  ): Record<string, DefaultInput> => {
    if (!inputs) return {};
    if (typeof inputs === "string") {
      try {
        return JSON.parse(inputs) as Record<string, DefaultInput>;
      } catch (e) {
        console.error("Error parsing inputs string:", e);
        return {};
      }
    }
    return inputs;
  };

  const jsonToInputs = (jsonData: string): Record<string, DefaultInput> => {
    try {
      return JSON.parse(jsonData) as Record<string, DefaultInput>;
    } catch (e) {
      console.error("Failed to parse JSON to inputs:", e);
      return {};
    }
  };

  const saveWorkflow = React.useCallback(async (opts?: { silent?: boolean }) => {
    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
      mixpanel.track("Save workflow clicked");
    try {
      const parsedInputs = convertToWorkflowInputs(defaultInputs);
      const workflow = convertToWorkflow(
        nodes,
        edges,
        parsedInputs,
        flowName,
        runName,
        globalFileMapping,
      );

      console.log("🚀 About to save workflow - checking API task:");
      const apiTask = workflow.tasks.find((t) => t.function === "api_call");
      if (apiTask) {
        console.log(
          "🚀 API task params before save:",
          JSON.stringify(apiTask.params, null, 2),
        );
      }

      // Validate the workflow before saving
      const validationResult = validateWorkflow(workflow);
      if (!validationResult.valid) {
        toast.error(`Invalid workflow: ${validationResult.errors.join(", ")}`);
        return;
      }

      let response;
      if (currentWorkflow?.flow_id) {
        // Update existing workflow
        response = await updateWorkflow(
          currentWorkflow.flow_id,
          flowName,
          workflow,
        );
      } else {
        // Create new workflow
        response = await saveWorkflowToServer(flowName, workflow);
        const workflowId = response.flow_id;
        if (workflowId) {
          setTimeout(() => {
            navigate(`${Path.WORKFLOW_BUILDER}/${workflowId}`, {
              replace: true,
            }),
              100;
          });
        }
      }

      console.log("🚀 Workflow saved to server, response:", response);

      setCurrentWorkflow(response);
      setWorkflowJson(formatWorkflowJson(workflow));
      if (!opts?.silent) {
        toast.success("Workflow saved successfully");
      }
    } catch (error: any) {
      toast.error(`Error saving workflow: ${error.message}`);
    }
  }, [
    nodes,
    edges,
    flowName,
    runName,
    defaultInputs,
    currentWorkflow,
    globalFileMapping,
  ]);

  React.useEffect(() => {
    if (triggerSaveAfterMapping && !isMappingModalOpen) {
      setTriggerSaveAfterMapping(false);
      saveWorkflow({ silent: true });
    }
  }, [triggerSaveAfterMapping, isMappingModalOpen, saveWorkflow]);

  React.useEffect(() => {
    if (triggerSaveAfterNodeConfig && !selectedNode) {
      setTriggerSaveAfterNodeConfig(false);
      saveWorkflow({ silent: true });
    }
  }, [triggerSaveAfterNodeConfig, selectedNode, saveWorkflow]);

  const updateWorkflowFromJson = React.useCallback(
    (json: string) => {
      try {
        setIsUpdatingFromJson(true);

        // Parse the workflow from JSON
        const {
          nodes: newNodes,
          edges: newEdges,
          flowName: newFlowName,
          runName: newRunName,
          defaultInputs: newDefaultInputs,
          fileMapping: loadedFileMapping,
        } = jsonToWorkflow(json);

        // Update the workflow state
        setNodes(newNodes);
        setEdges(newEdges);
        setFlowName(newFlowName);
        setRunName(newRunName);

        // Handle defaultInputs properly
        if (newDefaultInputs) {
          if (typeof newDefaultInputs === "string") {
            setDefaultInputs(jsonToInputs(newDefaultInputs));
          } else {
            setDefaultInputs(newDefaultInputs as Record<string, DefaultInput>);
          }
        } else {
          setDefaultInputs({});
        }

        // Load file mapping if available
        if (loadedFileMapping) {
          setGlobalFileMapping(loadedFileMapping);
        } else {
          setGlobalFileMapping({});
        }

        // Center the view on the new nodes
        if (reactFlowInstance) {
          setTimeout(() => {
            reactFlowInstance.fitView({ padding: 0.2 });
          }, 50);
        }

        setIsUpdatingFromJson(false);
        toast.success("Workflow updated from JSON");
      } catch (error) {
        setIsUpdatingFromJson(false);
        toast.error(
          `Error updating workflow from JSON: ${(error as Error).message}`,
        );
      }
    },
    [setNodes, setEdges, setFlowName, setRunName, reactFlowInstance],
  );

  const handleWorkflowLoaded = React.useCallback(
    (workflowResponse: WorkflowResponse) => {
      getWorkflow(workflowResponse.flow_id)
        .then((response) => {
          const workflowData = response.flow_data;
          // Convert workflowData to string if it's an object
          const workflowString =
            typeof workflowData === "string"
              ? workflowData
              : JSON.stringify(workflowData);

          const {
            nodes: newNodes,
            edges: newEdges,
            flowName: newFlowName,
            runName: newRunName,
            defaultInputs: newDefaultInputs,
            fileMapping: loadedFileMapping,
          } = jsonToWorkflow(workflowString);
          setNodes(newNodes);
          setEdges(newEdges);
          setFlowName(newFlowName || response.flow_name || "New Workflow");
          setRunName(newRunName || "Run 1");

          // Handle defaultInputs properly
          if (newDefaultInputs) {
            if (typeof newDefaultInputs === "string") {
              setDefaultInputs(jsonToInputs(newDefaultInputs));
            } else {
              setDefaultInputs(
                newDefaultInputs as Record<string, DefaultInput>,
              );
            }
          } else {
            setDefaultInputs({});
          }

          // Load file mapping if available
          if (loadedFileMapping) {
            setGlobalFileMapping(loadedFileMapping);
          } else {
            setGlobalFileMapping({});
          }

          setCurrentWorkflow(response);
          toast.success("Workflow loaded successfully");
        })
        .catch((error) => {
          toast.error(`Error loading workflow: ${error.message}`);
        });
    },
    [],
  );

  const newSessionIdsToAgent = (workflow: any) => {
    return {
      ...workflow,
      tasks: workflow.tasks.map((task: any) => {
        if (task.function === "call_lyzr_agent") {
          const sessionId = uuidv4();
          return {
            ...task,
            params: {
              ...task.params,
              config: {
                ...task.params.config,
                session_id: sessionId,
              },
            },
          };
        }
        return task;
      }),
    };
  };

  // const hasFirstNode = (
  //   data: any[],
  // ): { noUserMsg: boolean; hasSelectedTag: boolean } => {
  //   let noUserMsg = false;
  //   let hasSelectedTag = false;

  //   for (const obj of data) {
  //     const hasDepends = Object.values(obj.params || {}).some(
  //       (v) => v && typeof v === "object" && "depends" in v,
  //     );

  //     if (!hasDepends) {
  //       const userMsg = obj.params?.user_message?.value;
  //       const hasSelectTag = obj.tag === "Select an agent";
  //       if (hasSelectTag) {
  //         hasSelectedTag = true;
  //       }
  //       if (!userMsg) {
  //         noUserMsg = true;
  //       }
  //     }
  //   }

  //   return { noUserMsg, hasSelectedTag };
  // };

  const runWorkflowAction = React.useCallback(async () => {
    try {
      const newRunName = generateRandomRunName();
      setRunName(newRunName);

      const parsedInputs = convertToWorkflowInputs(defaultInputs);
      let workflow = convertToWorkflow(
        nodes,
        edges,
        parsedInputs,
        flowName,
        newRunName,
      );

      // const result = hasFirstNode(workflow.tasks);
      // if (result.hasSelectedTag) {
      //   toast.error("Please select an agent");
      //   return;
      // }
      // if (result.noUserMsg) {
      //   toast.error("First node must have a user message");
      //   return;
      // }
      await saveWorkflow();
      // New session Id for every run
      workflow = newSessionIdsToAgent(workflow);

      // Validate the workflow before running
      const validationResult = validateWorkflow(workflow);
      if (!validationResult.valid) {
        toast.error(`Invalid workflow: ${validationResult.errors.join(", ")}`);
        return;
      }

      setIsRunning(true);
      toast.info("Connecting to WebSocket server...");

      // First, connect to WebSocket before executing the workflow
      try {
        // Use the exposed WebSocket connection function
        // This is available via window global set in WorkflowEvents component
        if (typeof (window as any).connectWorkflowWebSocket === "function") {
          console.log("Connecting to WebSocket before running workflow...");
          const connectionResult = await (
            window as any
          ).connectWorkflowWebSocket();

          if (!connectionResult) {
            console.error(
              "Failed to establish WebSocket connection before running workflow",
            );
            toast.warning(
              "WebSocket connection failed. Workflow events may not be displayed in real-time.",
            );
            // We continue with the workflow execution even if WebSocket fails
            // This allows the workflow to run but with potentially delayed event reporting
          } else {
            console.log(
              "Successfully connected to WebSocket, proceeding with workflow execution",
            );
            toast.success("Connected to WebSocket server");
          }
        } else {
          console.warn("WebSocket connection function not available");
        }
      } catch (error: any) {
        console.error("Error connecting to WebSocket:", error);
        toast.warning(
          "Failed to connect to event server. Workflow events may be delayed.",
        );
        // Continue with workflow execution even if WebSocket connection fails
      }

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Run workflow clicked", {
          workflowId: initialWorkflowName,
          workflowName: currentWorkflow?.flow_name,
        });
      // Now execute the workflow
      toast.info("Running workflow...");

      try {
        // Call the API to run the workflow
        console.log("Sending workflow to execution server:", workflow);
        workflow.tasks = sortAgentsByDependency(workflow.tasks);
        const flowId = currentWorkflow?.flow_id || "";

        // Execute workflow with the right parameters
        const result = await executeWorkflow(flowId, workflow);

        console.log("Workflow execution result:", result);
        setWorkflowJson(formatWorkflowJson(workflow));

        // Rotate run name after successful execution
        // setRunName(generateRandomRunName());
      } catch (error: any) {
        console.error("Error executing workflow:", error);
        toast.error(`Error executing workflow: ${error.message}`);
      } finally {
        setIsRunning(false);
      }
    } catch (error: any) {
      console.error("Error preparing workflow for execution:", error);
      toast.error(`Error preparing workflow: ${error.message}`);
      setIsRunning(false);
    }
  }, [nodes, edges, defaultInputs, flowName, currentWorkflow]);

  // const exportWorkflow = React.useCallback(() => {
  //   saveWorkflow();
  //   // Open the JSON dialog (handled in Header component)
  // }, [saveWorkflow]);

  /**
   * Sorts agents so that any agent with a dependency (specified by a "depends" property)
   * appears after the agent it depends on.
   *
   * @param tasks - The array of Agent objects.
   * @returns The sorted array of Agent objects.
   * @throws An error if a dependency cycle is detected.
   */
  function sortAgentsByDependency(tasks: any[]): any[] {
    // Map each agent by its name for quick lookup.
    const agentMap = new Map<string, any>();
    tasks.forEach((agent) => agentMap.set(agent.name, agent));

    // Initialize the graph and in-degree maps.
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    tasks.forEach((agent) => {
      graph.set(agent.name, new Set());
      inDegree.set(agent.name, 0);
    });

    // Build the dependency graph.
    tasks.forEach((agent) => {
      for (const key in agent.params) {
        const value = agent.params[key];
        if (value && typeof value === "object" && "depends" in value) {
          const dependencyName: string = value.depends;
          // Only add the dependency if the referenced agent exists.
          if (agentMap.has(dependencyName)) {
            // Create an edge from the dependency to the current agent.
            graph.get(dependencyName)!.add(agent.name);
            inDegree.set(agent.name, inDegree.get(agent.name)! + 1);
          }
        }
      }
    });

    // Kahn's algorithm for topological sorting.
    const sortedAgents: any[] = [];
    const queue: string[] = [];

    // Start with all agents having no dependencies (in-degree 0).
    inDegree.forEach((degree, name) => {
      if (degree === 0) {
        queue.push(name);
      }
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      sortedAgents.push(agentMap.get(current)!);
      graph.get(current)!.forEach((dependent) => {
        inDegree.set(dependent, inDegree.get(dependent)! - 1);
        if (inDegree.get(dependent) === 0) {
          queue.push(dependent);
        }
      });
    }

    // If not all agents were sorted, a cycle exists in the dependency graph.
    // TEMPORARILY DISABLED: Allow workflow execution even with potential cycles
    // TODO: Fix cycle detection logic for multi-agent API configurations
    /*
    if (sortedAgents.length !== tasks.length) {
      throw new Error("Cycle detected in dependencies!");
    }
    */

    // Ensure all tasks are included, even if they couldn't be sorted
    if (sortedAgents.length !== tasks.length) {
      console.warn(
        `Only ${sortedAgents.length} of ${tasks.length} tasks were sorted. Including remaining tasks.`,
      );

      // Find tasks that weren't included in the sorted list
      const sortedTaskNames = new Set(sortedAgents.map((task) => task.name));
      const unsortedTasks = tasks.filter(
        (task) => !sortedTaskNames.has(task.name),
      );

      // Add the unsorted tasks to the end
      sortedAgents.push(...unsortedTasks);
      console.log(
        "Added unsorted tasks:",
        unsortedTasks.map((t) => t.name),
      );
    }

    return sortedAgents;
  }

  // Update workflow JSON whenever nodes or edges change
  React.useEffect(() => {
    if (nodes.length > 0 || edges.length > 0) {
      const parsedInputs = convertToWorkflowInputs(defaultInputs);
      const workflow = convertToWorkflow(
        nodes,
        edges,
        parsedInputs,
        flowName,
        runName,
      );
      setWorkflowJson(formatWorkflowJson(workflow));
    }
  }, [nodes, edges, flowName, runName, defaultInputs]);

  // Add handler for workflow generation from ChatBox
  const handleWorkflowGenerated = (workflowJson: string) => {
    try {
      // Log the workflow JSON for debugging
      console.log("WorkflowBuilder: Processing generated workflow JSON...");

      setIsUpdatingFromJson(true);
      const {
        nodes: newNodes,
        edges: newEdges,
        flowName: newFlowName,
        runName: newRunName,
        defaultInputs: newDefaultInputs,
        fileMapping: loadedFileMapping,
      } = jsonToWorkflow(workflowJson);

      console.log("WorkflowBuilder: Converted workflow to nodes and edges", {
        nodes: newNodes.length,
        edges: newEdges.length,
        flowName: newFlowName,
      });

      // Clear existing nodes and edges before setting the new ones
      setNodes([]);
      setEdges([]);

      // Use a timeout to ensure the state updates in sequence
      setTimeout(() => {
        setNodes(newNodes);
        setEdges(newEdges);
        setFlowName(newFlowName || generateRandomWorkflowName());
        setRunName(newRunName || generateRandomRunName());

        if (newDefaultInputs) {
          if (typeof newDefaultInputs === "string") {
            setDefaultInputs(jsonToInputs(newDefaultInputs));
          } else {
            setDefaultInputs(newDefaultInputs as Record<string, DefaultInput>);
          }
        }

        // Load file mapping if available
        if (loadedFileMapping) {
          setGlobalFileMapping(loadedFileMapping);
        } else {
          setGlobalFileMapping({});
        }

        toast.success("Workflow generated and loaded successfully");
        setIsUpdatingFromJson(false);
      }, 100);
    } catch (error: any) {
      console.error("Error loading generated workflow:", error);

      // Only show error notification if not creating a new workflow
      if (!isNewWorkflow) {
        toast.error(`Error loading workflow: ${error.message}`);
      }
      setIsUpdatingFromJson(false);
    }
  };

  // Add handler for agent creation
  const handleAgentCreated = (agent: any) => {
    console.log("Agent created:", agent);
    // We could add created agents to a list for easy access if needed
  };

  // Add handler for OpenAI key
  const handleSetOpenAiKey = (key: string) => {
    setOpenAiKey(key);
    localStorage.setItem("openAiKey", key);
  };

  return (
    <div className="flex h-screen w-full flex-col">
      <div className="flex items-center justify-between border-b border-slate-200 bg-card">
        <Header
          flowName={flowName}
          runName={runName}
          onFlowNameChange={setFlowName}
          onRunNameChange={setRunName}
          onSaveWorkflow={saveWorkflow}
          onRunWorkflow={runWorkflowAction}
          workflowJson={workflowJson}
          onUpdateFromJson={updateWorkflowFromJson}
          currentWorkflow={currentWorkflow}
          onWorkflowLoaded={handleWorkflowLoaded}
        />
        {/* <div className="px-4">
          <HeaderApiKey />
        </div> */}
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-shrink-0">
          <Sidebar
            onDragStart={onDragStart}
            // exportWorkflow={exportWorkflow}
          />
        </div>

        <div
          className="custom-scrollbar relative flex-1"
          ref={reactFlowWrapper}
        >
          {isUpdatingFromJson && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-100/70 backdrop-blur-sm dark:bg-slate-900/70">
              <div className="flex items-center space-x-3 rounded-xl border border-slate-200 bg-white/90 px-5 py-3 shadow-lg dark:border-slate-700 dark:bg-slate-800/90">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Updating workflow from JSON...
                </span>
              </div>
            </div>
          )}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onNodeDragStart={onNodeDragStart}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            deleteKeyCode={["Delete", "Backspace"]}
            fitView
            attributionPosition="bottom-right"
            defaultEdgeOptions={{
              type: "custom",
              animated: true,
              style: { strokeWidth: 2 },
            }}
          >
            <Background color="#aaa" gap={16} size={1} />
            <Controls />
            <MiniMap
              nodeStrokeWidth={3}
              zoomable
              pannable
              nodeColor="#cbd5e1"
            />

            {selectedNode && (
              <Panel position="top-right">
                <NodeConfig
                  node={selectedNode}
                  nodes={nodes}
                  edges={edges}
                  onUpdate={updateNode}
                  onClose={() => setSelectedNode(null)}
                  onSaveAndClose={() => {
                    setSelectedNode(null);
                    setTriggerSaveAfterNodeConfig(true);
                  }}
                  onDelete={deleteNode}
                  globalFileMapping={globalFileMapping}
                />
              </Panel>
            )}
          </ReactFlow>
          <ChatBox
            onAgentCreated={handleAgentCreated}
            onWorkflowGenerated={handleWorkflowGenerated}
            openAiKey={openAiKey}
            onSetOpenAiKey={handleSetOpenAiKey}
          />
        </div>
      </div>

      {isRouterConfigOpen && selectedRouterId && (
        <RouterNodeConfig
          isOpen={isRouterConfigOpen}
          onClose={() => {
            setIsRouterConfigOpen(false);
            setSelectedRouterId(null);
          }}
          routes={
            nodes.find((node) => node.id === selectedRouterId)?.data.params
              .routes &&
            Array.isArray(
              nodes.find((node) => node.id === selectedRouterId)?.data.params
                .routes,
            )
              ? (nodes.find((node) => node.id === selectedRouterId)?.data.params
                  .routes as Route[])
              : []
          }
          onSave={handleSaveRoutes}
          onDelete={deleteNode}
          nodeId={selectedRouterId}
        />
      )}

      {/* Add the WorkflowEvents component */}
      <WorkflowEvents
        flowName={flowName}
        runName={runName}
        isRunning={isRunning}
      />

      {/* Agent-API Mapping Modal */}
      {isMappingModalOpen && mappingAgentNode && mappingApiNode && (
        <AgentApiMappingModal
          isOpen={isMappingModalOpen}
          onClose={() => {
            setIsMappingModalOpen(false);
            setMappingAgentNode(null);
            setMappingApiNode(null);
          }}
          agentNode={mappingAgentNode}
          apiNode={mappingApiNode}
          onSaveMapping={handleSaveMapping}
        />
      )}
    </div>
  );
};

// This is the main component that can be imported in any project
const WorkflowBuilder: React.FC<WorkflowBuilderProps> = ({
  initialWorkflowName,
  initialWorkflowId,
}) => {
  const { workflowName } = useParams();
  const effectiveWorkflowName =
    workflowName === "new" ? undefined : initialWorkflowName || workflowName;
  const reactFlowWrapper = React.useRef<HTMLDivElement>(null);

  return (
    <div className="h-screen w-full bg-background">
      <ReactFlowProvider>
        <ApiKeyProvider>
          <WorkflowProvider>
            <TooltipProvider>
              <ThemeProvider>
                <div
                  className="flex h-full w-full flex-col overflow-hidden"
                  ref={reactFlowWrapper}
                >
                  <WorkflowBuilderContent
                    initialWorkflowName={
                      effectiveWorkflowName ||
                      "Untitled " + generateRandomWorkflowName()
                    }
                    initialWorkflowId={initialWorkflowId}
                  />
                </div>
              </ThemeProvider>
            </TooltipProvider>
          </WorkflowProvider>
        </ApiKeyProvider>
      </ReactFlowProvider>
    </div>
  );
};

export default WorkflowBuilder;
