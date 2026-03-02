import {
  WorkflowNode,
  WorkflowEdge,
  DefaultInput,
  Workflow,
  WorkflowTask,
  NodeParams,
  ParamValue,
  WorkflowEdgeDefinition,
} from "@/types/workflow";

/**
 * Generates a unique ID for a new node
 */
export const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * Generates a random workflow name
 */
export const generateRandomWorkflowName = (): string => {
  const adjectives = [
    "Rapid",
    "Dynamic",
    "Smart",
    "Automated",
    "Efficient",
    "Intelligent",
    "Advanced",
    "Streamlined",
    "Optimized",
    "Agile",
    "Innovative",
    "Powerful",
    "Productive",
    "Responsive",
    "Strategic",
  ];

  const nouns = [
    "Workflow",
    "Process",
    "Pipeline",
    "Automation",
    "Orchestration",
    "Integration",
    "Operation",
    "Solution",
    "System",
    "Engine",
    "Framework",
    "Sequence",
    "Dataflow",
    "Transformation",
    "Protocol",
  ];

  const randomAdjective =
    adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

  return `${randomAdjective} ${randomNoun}`;
};

/**
 * Formats the workflow JSON for display
 */
export const formatWorkflowJson = (workflow: Workflow): string => {
  return JSON.stringify(workflow, null, 2);
};

/**
 * Generates a unique name for a node based on its type
 */
export const generateUniqueName = (
  nodes: WorkflowNode[],
  nodeType: string,
  baseName: string,
): string => {
  // Get all existing names for the node type
  const existingNames = nodes
    .filter((node) => node.type === nodeType)
    .map((node) => node.data.name);

  // If base name doesn't exist yet, use it
  if (!existingNames.includes(baseName)) {
    return baseName;
  }

  // Otherwise find a unique name with an incrementing number
  let counter = 1;
  let newName = `${baseName}_${counter}`;

  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName}_${counter}`;
  }

  return newName;
};

/**
 * Removes sensitive information from the workflow tasks before sending it
 */
const removeSensitiveInfo = (tasks: WorkflowTask[]): WorkflowTask[] => {
  return tasks.map((task) => {
    // Create a deep copy of the task to avoid modifying the original
    const sanitizedTask: WorkflowTask = {
      ...task,
      params: { ...task.params },
    };

    // Remove the OpenAI API key from any tasks that might contain it
    if (sanitizedTask.params.openai_api_key) {
      delete sanitizedTask.params.openai_api_key;
    }

    // Check for nested openai_api_key in config objects
    if (
      sanitizedTask.params.config &&
      typeof sanitizedTask.params.config === "object"
    ) {
      const configCopy = { ...(sanitizedTask.params.config as object) };
      if ("openai_api_key" in configCopy) {
        delete (configCopy as any).openai_api_key;
      }
      sanitizedTask.params.config = configCopy;
    }

    return sanitizedTask;
  });
};

/**
 * Extracts all default inputs from the input nodes
 */
export const extractDefaultInputs = (
  nodes: WorkflowNode[],
): Record<string, DefaultInput> => {
  const inputs: Record<string, DefaultInput> = {};

  // Find all input nodes
  const inputNodes = nodes.filter((node) => node.type === "inputs");

  // Collect all keys from all input nodes
  inputNodes.forEach((node) => {
    if (node.data.params?.keys) {
      Object.entries(node.data.params.keys).forEach(([key, value]) => {
        inputs[key] = value;
      });
    }
  });

  return inputs;
};

/**
 * Converts the React Flow nodes and edges to a workflow JSON structure
 */
export const convertToWorkflow = (
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  defaultInputs: Record<string, DefaultInput> | null,
  flowName: string,
  runName: string,
  fileMapping?: Record<string, { name: string; type: string; size: number }>,
): Workflow => {
  console.log('🔥 === convertToWorkflow CALLED ===');
  console.log('🔥 API node params at start:', nodes.filter(n => n.type === 'api').map(n => ({
    name: n.data.name,
    params: n.data.params
  })));
  // Always get fresh default inputs from input nodes
  const inputsFromNodes = extractDefaultInputs(nodes);

  // Combine with provided default inputs (if any)
  const combinedDefaultInputs = defaultInputs
    ? { ...inputsFromNodes, ...defaultInputs }
    : inputsFromNodes;

  // Add file mapping to default inputs if provided (only for workflow builder UI)
  const finalDefaultInputs = fileMapping && Object.keys(fileMapping).length > 0
    ? { ...combinedDefaultInputs, _file_mapping: fileMapping }
    : combinedDefaultInputs;

  // Filter out input nodes for tasks (they don't become tasks)
  const filteredNodes = nodes.filter((node) => node.type !== "inputs");

  // Convert nodes to tasks with clean params (no dependencies)
  const tasks: WorkflowTask[] = filteredNodes.map((node) => ({
    name: node.data.name,
    tag: node.data.tag,
    function: node.data.function,
    params: { ...node.data.params }, // Create a copy to avoid modifying the original
  }));

  // Clear existing dependencies before analyzing edges
  // This ensures we don't keep old connections when nodes are restructured
  tasks.forEach((task) => {
    // Create a clean params object without dependency keys
    const cleanParams: NodeParams = {};

    // Only keep params that aren't dependency references
    Object.entries(task.params).forEach(([key, value]) => {
      // Check if this is a simple dependency reference (only has 'depends' property)
      // vs a complex config object that happens to contain a 'depends' field
      // vs an API mapping object with 'depends' and 'mapping' properties
      const isSimpleDependencyReference = 
        typeof value === "object" && 
        value !== null && 
        "depends" in value &&
        Object.keys(value).length === 1 && // Only has the 'depends' property
        Object.keys(value)[0] === "depends";
      
      const isApiMappingReference = 
        typeof value === "object" && 
        value !== null && 
        "depends" in value &&
        "mapping" in value &&
        Object.keys(value).length === 2; // Only has 'depends' and 'mapping' properties
      
      // Special handling for UI-configured API mapping (preserve it)
      const isUiConfiguredApiMapping = key === "config" && 
        typeof value === "object" && 
        value !== null && 
        "depends" in value &&
        "mapping" in value &&
        "default" in value;
      
      // Keep the parameter if it's not a simple dependency reference 
      // and not an API mapping reference that will be regenerated
      // but always preserve UI-configured API mappings
      if (!isSimpleDependencyReference && (!isApiMappingReference || isUiConfiguredApiMapping)) {
        cleanParams[key] = value;
      }
    });

    // Special case: If this is an API task with a UI-configured mapping,
    // remove any individual agent parameters that might conflict
    if (task.function === "api_call" && 
        cleanParams.config && 
        typeof cleanParams.config === "object" && 
        "depends" in cleanParams.config && 
        "mapping" in cleanParams.config && 
        "default" in cleanParams.config) {
      
      // This task has a UI-configured mapping, remove individual agent parameters
      const filteredParams: NodeParams = {};
      Object.entries(cleanParams).forEach(([key, value]) => {
        // Keep config and non-agent parameters, but remove individual agent dependency objects
        if (key === "config" || 
            !(typeof value === "object" && value !== null && "depends" in value)) {
          filteredParams[key] = value;
        }
      });
      task.params = filteredParams;
    } else {
      // Replace the task's params with the clean version
      task.params = cleanParams;
    }
  });

  // Prepare edge definitions for conditional workflows
  const workflowEdges: WorkflowEdgeDefinition[] = [];
  // Comment out unused variable but keep for future reference
  // const conditionalNodeExists = nodes.some(node => node.type === 'gpt_conditional' || node.type === 'gpt_router');

  // Create a map to track which nodes are targets of router edges
  const routerTargets: Record<string, string> = {};

  // First pass: identify all nodes connected to router nodes
  edges.forEach((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    if (sourceNode && targetNode && sourceNode.type === "gpt_router") {
      // Store the source router name for this target node
      routerTargets[targetNode.id] = sourceNode.data.name;
    }
  });

  // Analyze edges to determine dependencies, adding them fresh each time
  edges.forEach((edge) => {
    const sourceNode = nodes.find((node) => node.id === edge.source);
    const targetNode = nodes.find((node) => node.id === edge.target);

    if (sourceNode && targetNode) {
      // Skip input nodes as they don't create dependencies
      if (sourceNode.type === "inputs") {
        return;
      }

      const sourceName = sourceNode.data.name;
      // Find the corresponding task for the target node
      const targetTask = tasks.find(
        (task) => task.name === targetNode.data.name,
      );

      // Handle router nodes
      if (sourceNode.type === "gpt_router") {
        // Add to workflowEdges for router workflows
        if (edge.sourceHandle) {
          // Use "route == 'route_name'" condition format for router edges
          workflowEdges.push({
            source: sourceName,
            target: targetNode.data.name,
            condition: `route == '${edge.sourceHandle}'`, // Use the sourceHandle as the route name
          });

          // Add context parameter to the target task - MODIFIED: removed .context
          if (targetTask) {
            targetTask.params.context = { depends: `${sourceName}` };
          }
        }
      }
      // Handle conditional edges
      else if (sourceNode.type === "gpt_conditional") {
        // Add to workflowEdges for conditional workflows
        if (edge.sourceHandle === "true" || edge.sourceHandle === "false") {
          workflowEdges.push({
            source: sourceName,
            target: targetNode.data.name,
            condition: edge.sourceHandle,
          });
        }
      } else if (targetTask) {
        // Handle API nodes with agent connections
        if (targetNode.type === "api") {
          // Check if there are multiple agents connected to this API node
          const connectedAgents = edges.filter(e => e.target === targetNode.id && 
            nodes.find(n => n.id === e.source)?.type === "agent");
          
          if (connectedAgents.length > 1) {
            // Multiple agents - create individual parameter blocks but preserve existing mappings
            const agentParamName = `${sourceName}_data`;
            
            // Check if there's an existing agent parameter mapping configuration
            // First check for existing parameter block (agent_name_data), then agent-specific config (agent_name)
            const existingParamBlock = targetNode.data.params?.[agentParamName];
            const existingAgentConfig = targetNode.data.params?.[sourceName];
            
            // Debug: Check what we're looking for vs what's actually there
            console.log(`🔍 MAPPING CHECK for ${sourceName}:`);
            console.log(`🔍 Available params keys:`, Object.keys(targetNode.data.params || {}));
            console.log(`🔍 Existing param block (${agentParamName}):`, existingParamBlock);
            console.log(`🔍 Agent-specific config (${sourceName}):`, existingAgentConfig);
            console.log(`🔍 General config:`, targetNode.data.params?.config);
            
            // Skip if this agent parameter block already exists and has mapping (prevent overwriting)
            if (targetTask.params[agentParamName]) {
              console.log(`⏭️ Skipping ${sourceName} - parameter block already exists:`, targetTask.params[agentParamName]);
            } else if (existingParamBlock && typeof existingParamBlock === 'object' && 'mapping' in existingParamBlock) {
              // Use the existing parameter block mapping (most common case for saved workflows)
              targetTask.params[agentParamName] = {
                depends: sourceName,
                mapping: existingParamBlock.mapping
              };
              console.log(`✅ Using existing parameter block mapping for ${sourceName}:`, existingParamBlock.mapping);
            } else if (existingAgentConfig && typeof existingAgentConfig === 'object' && 'mapping' in existingAgentConfig) {
              // Use the existing configured mapping for this specific agent (alternative location)
              targetTask.params[agentParamName] = {
                depends: sourceName,
                mapping: existingAgentConfig.mapping
              };
              console.log(`✅ Using configured mapping for ${sourceName}:`, existingAgentConfig.mapping);
            } else {
              // Check if this agent's mapping is in the general config (for first agent)
              const generalConfig = targetNode.data.params?.config;
              const isGeneralConfigAgent = generalConfig && 
                typeof generalConfig === 'object' && 
                'depends' in generalConfig && 
                generalConfig.depends === sourceName;
              
              if (isGeneralConfigAgent && 
                  typeof generalConfig === 'object' && 
                  'mapping' in generalConfig && 
                  generalConfig.mapping) {
                // Use mapping from general config
                targetTask.params[agentParamName] = {
                  depends: sourceName,
                  mapping: generalConfig.mapping
                };
                console.log(`✅ Using general config mapping for ${sourceName}:`, generalConfig.mapping);
              } else {
                // Only create default mapping if no configuration exists at all
                targetTask.params[agentParamName] = {
                  depends: sourceName,
                  mapping: {
                    [`BODY_${sourceName}`]: "response"
                  }
                };
                console.log(`⚠️ Using default mapping for ${sourceName} (no configuration found)`);
              }
            }
            
            // Only create main config if it doesn't exist (preserve UI config)
            if (!targetTask.params.config) {
              targetTask.params.config = {
                default: {
                  url: "",
                  method: "GET", 
                  headers: {}
                },
                // No depends field for multi-agent - dependencies come from parameter blocks
              };
            }
          } else {
            // Single agent - use general config approach
            if (!targetTask.params.config) {
              targetTask.params.config = {
                depends: sourceName,
                default: {
                  url: "",
                  method: "GET", 
                  headers: {}
                },
                mapping: {
                  [`BODY_${sourceName}`]: "response"
                }
              };
            }
          }
        } else {
          // For non-API nodes, create dependencies as before
          // Generate a parameter name based on the source node's name or function
          // If the source node is an agent, use its name directly
          const paramName =
            sourceNode.type === "agent"
              ? sourceName
              : edge.sourceHandle ||
                sourceNode.data.function.toLowerCase().replace(/_/g, "") +
                  "_output";

          // Create a dependency parameter that refers to the output of the source node
          const dependencyParam: ParamValue = { depends: sourceName };

          // Add the parameter to the target task
          targetTask.params[paramName] = dependencyParam;
        }

        // If this target node is also a target of a router node (from another edge)
        // add the context parameter pointing to the router - MODIFIED: removed .context
        if (routerTargets[targetNode.id] && !targetTask.params.context) {
          targetTask.params.context = {
            depends: `${routerTargets[targetNode.id]}`,
          };
        }
      }
    }
  });

  // Final validation to ensure no .context suffix remains anywhere in the tasks
  tasks.forEach((task) => {
    Object.entries(task.params).forEach(([_key, value]) => {
      if (typeof value === "object" && value !== null && "depends" in value) {
        // Check if the depends string contains .context and remove it
        let dependsValue = value.depends as string;
        if (dependsValue.endsWith(".context")) {
          value.depends = dependsValue.replace(".context", "");
        }
      }
    });
  });

  // Remove sensitive information from tasks
  const sanitizedTasks = removeSensitiveInfo(tasks);

  // Extract node positions for flow_data
  const nodePositions: Record<string, { x: number; y: number }> = {};
  nodes.forEach(node => {
    nodePositions[node.data.name] = {
      x: node.position.x,
      y: node.position.y
    };
  });

  // Create the workflow object with ALWAYS an edges array
  const workflow: Workflow = {
    tasks: sanitizedTasks,
    default_inputs: finalDefaultInputs || {},
    flow_name: flowName,
    run_name: runName,
    edges: workflowEdges, // Always assign edges, even if empty
    flow_data: {
      node_positions: nodePositions
    }
  };

  return workflow;
};

// Let's also fix the validation logic to accept the route-based condition format
export const validateWorkflow = (
  workflow: Workflow,
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check if workflow has tasks
  if (!workflow.tasks || workflow.tasks.length === 0) {
    errors.push("Workflow must have at least one task");
  }

  // Check if all tasks have required properties
  workflow.tasks.forEach((task, index) => {
    if (!task.name) {
      errors.push(`Task ${index + 1} must have a name`);
    }
    if (!task.function) {
      errors.push(`Task ${task.name || index + 1} must have a function`);
    }

    // For API calls, check if config is specified
    if (task.function === "api_call") {
      if (!task.params || !task.params.config) {
        errors.push(`API task ${task.name} must have a config parameter`);
      }
    }

    // For agent calls, check if config is specified
    if (task.function === "call_lyzr_agent") {
      if (!task.params || !task.params.config) {
        errors.push(`Agent task ${task.name} must have a config parameter`);
      }
    }

    // For conditional blocks, check required parameters
    if (task.function === "gpt_conditional_block") {
      if (!task.params) {
        errors.push(`Conditional task ${task.name} is missing parameters`);
      } else {
        const requiredParams = ["condition", "model"];
        requiredParams.forEach((param) => {
          if (!task.params[param]) {
            errors.push(
              `Conditional task ${task.name} is missing required parameter: ${param}`,
            );
          }
        });
      }
    }
  });

  // Check for circular dependencies - TEMPORARILY DISABLED
  // TODO: Fix cycle detection logic for multi-agent API configurations
  /*
  const dependencyGraph: Record<string, string[]> = {};
  workflow.tasks.forEach((task) => {
    dependencyGraph[task.name] = [];

    if (task.params) {
      Object.values(task.params).forEach((param) => {
        if (typeof param === "object" && param && "depends" in param) {
          dependencyGraph[task.name].push(param.depends as string);
        }
      });
    }
  });
  */

  // Check conditional edges for valid target references
  if (workflow.edges && workflow.edges.length > 0) {
    const allTaskNames = workflow.tasks.map((task) => task.name);

    workflow.edges.forEach((edge, index) => {
      if (!allTaskNames.includes(edge.source)) {
        errors.push(`Edge ${index} has an invalid source: ${edge.source}`);
      }
      if (!allTaskNames.includes(edge.target)) {
        errors.push(`Edge ${index} has an invalid target: ${edge.target}`);
      }

      // FIXED: Update validation to allow router-specific condition formats
      if (!edge.condition) {
        errors.push(`Edge ${index} has no condition`);
      } else {
        // Check if source is a router node
        const sourceTask = workflow.tasks.find(
          (task) => task.name === edge.source,
        );
        if (sourceTask && sourceTask.function === "gpt_router") {
          // For router nodes, accept route-based conditions
          if (!edge.condition.startsWith("route ==")) {
            errors.push(
              `Edge ${index} from router node should have condition like "route == 'route_name'", found: ${edge.condition}`,
            );
          }
        } else if (
          sourceTask &&
          sourceTask.function === "gpt_conditional_block"
        ) {
          // For conditional nodes, only accept "true" or "false"
          if (edge.condition !== "true" && edge.condition !== "false") {
            errors.push(
              `Edge ${index} from conditional node should have condition "true" or "false", found: ${edge.condition}`,
            );
          }
        }
      }
    });
  }

  // Cycle detection algorithm - TEMPORARILY DISABLED
  /*
  const visited: Record<string, boolean> = {};
  const recursionStack: Record<string, boolean> = {};

  const hasCycle = (node: string): boolean => {
    if (!visited[node]) {
      visited[node] = true;
      recursionStack[node] = true;

      for (const neighbor of dependencyGraph[node] || []) {
        if (!visited[neighbor] && hasCycle(neighbor)) {
          return true;
        } else if (recursionStack[neighbor]) {
          errors.push(`Circular dependency detected: ${node} -> ${neighbor}`);
          return true;
        }
      }
    }

    recursionStack[node] = false;
    return false;
  };

  Object.keys(dependencyGraph).forEach((node) => {
    if (!visited[node]) {
      hasCycle(node);
    }
  });
  */

  // Check for input references that don't exist
  workflow.tasks.forEach((task) => {
    if (task.params) {
      Object.entries(task.params).forEach(([_paramName, param]) => {
        if (typeof param === "object" && param && "input" in param) {
          const inputKey = param.input;
          if (!workflow.default_inputs[inputKey as string]) {
            errors.push(
              `Input reference "${inputKey}" in task "${task.name}" does not exist in default_inputs`,
            );
          }
        }
      });
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
};
