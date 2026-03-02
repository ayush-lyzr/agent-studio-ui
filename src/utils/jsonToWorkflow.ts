import {
  WorkflowNode,
  WorkflowEdge,
  Workflow,
  NodeType,
  NodeParams,
} from "@/types/workflow";
import { v4 as uuidv4 } from "uuid";

/**
 * Converts a workflow JSON string to nodes and edges for ReactFlow
 */
export const jsonToWorkflow = (
  jsonString: string,
): {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  flowName: string;
  runName: string;
  defaultInputs: Record<string, any>;
  fileMapping?: Record<string, { name: string; type: string; size: number }>;
} => {
  try {
    // Parse the JSON string
    const workflow: Workflow = JSON.parse(jsonString);

    // Extract file mapping from default inputs if it exists
    const fileMapping = workflow.default_inputs?._file_mapping;

    // Create cleaned default inputs without the file mapping
    const cleanedDefaultInputs = { ...workflow.default_inputs };
    if (cleanedDefaultInputs._file_mapping) {
      delete cleanedDefaultInputs._file_mapping;
    }

    // Initialize the result
    const result = {
      nodes: [] as WorkflowNode[],
      edges: [] as WorkflowEdge[],
      flowName: workflow.flow_name || "New Workflow",
      runName: workflow.run_name || "Run 1",
      defaultInputs: cleanedDefaultInputs || {},
      fileMapping: fileMapping as
        | Record<string, { name: string; type: string; size: number }>
        | undefined,
    };

    // Process inputs if they exist (excluding file mapping)
    if (Object.keys(cleanedDefaultInputs || {}).length > 0) {
      // Create an inputs node
      const inputsNodeId = uuidv4();
      const keys: Record<string, any> = {};

      // Add each input key to the node's params (excluding file mapping)
      Object.entries(cleanedDefaultInputs || {}).forEach(([key, value]) => {
        keys[key] = value;
      });

      // Add the inputs node to the result
      result.nodes.push({
        id: inputsNodeId,
        type: "inputs" as NodeType,
        position: { x: 100, y: 100 }, // Default position
        data: {
          name: `inputs_${inputsNodeId.slice(0, 4)}`,
          tag: "Default Inputs",
          function: "default_inputs",
          params: { keys },
        },
      });
    }

    // Create a mapping of task names to node IDs
    const taskNameToNodeId: Record<string, string> = {};

    // First pass: create nodes and record dependencies
    const dependencies: Record<string, string[]> = {};
    const reverseDependencies: Record<string, string[]> = {};

    // Process tasks (first pass to create nodes without positioning)
    workflow.tasks.forEach((task) => {
      const nodeId = uuidv4();
      taskNameToNodeId[task.name] = nodeId;
      dependencies[task.name] = [];
      reverseDependencies[task.name] = [];

      // Determine node type based on function
      let nodeType: NodeType = "api";

      if (task.function === "call_lyzr_agent") {
        nodeType = "agent";
      } else if (task.function === "gpt_conditional_block") {
        nodeType = "gpt_conditional";
      } else if (task.function === "gpt_router") {
        nodeType = "gpt_router";
      } else if (task.function === "default_inputs") {
        nodeType = "inputs";
      } else if (task.function === "a2a") {
        nodeType = "a2a";
      }

      // Create a copy of params without dependency references
      const cleanParams: NodeParams = {};

      // Process params to handle dependencies
      Object.entries(task.params || {}).forEach(([key, value]) => {
        // Check if this is a simple dependency reference (only has 'depends' property)
        // vs a complex config object that happens to contain a 'depends' field
        // vs agent mapping objects with 'depends' and 'mapping' properties
        const isDependencyReference =
          typeof value === "object" &&
          value !== null &&
          "depends" in value &&
          Object.keys(value).length === 1 && // Only has the 'depends' property
          Object.keys(value)[0] === "depends";

        // Don't treat agent mapping configs as simple dependencies
        const isAgentMappingConfig =
          typeof value === "object" &&
          value !== null &&
          "depends" in value &&
          "mapping" in value;

        if (isDependencyReference && !isAgentMappingConfig) {
          // Record dependencies for later layout analysis
          let sourceName = value.depends as string;

          // Clean any .context suffixes first
          if (
            typeof sourceName === "string" &&
            sourceName.endsWith(".context")
          ) {
            sourceName = sourceName.replace(".context", "");
          }

          // Add to dependencies list
          dependencies[task.name].push(sourceName);
          if (!reverseDependencies[sourceName]) {
            reverseDependencies[sourceName] = [];
          }
          reverseDependencies[sourceName].push(task.name);
        } else if (isAgentMappingConfig) {
          // Handle agent mapping configs - preserve them and track dependencies
          cleanParams[key] = value;

          let sourceName = value.depends as string;
          if (
            typeof sourceName === "string" &&
            sourceName.endsWith(".context")
          ) {
            sourceName = sourceName.replace(".context", "");
          }

          dependencies[task.name].push(sourceName);
          if (!reverseDependencies[sourceName]) {
            reverseDependencies[sourceName] = [];
          }
          reverseDependencies[sourceName].push(task.name);
        } else {
          cleanParams[key] = value;
        }
      });

      // Add the task node to the result (without position yet)
      result.nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: 0, y: 0 }, // Temporary position, will be updated
        data: {
          name: task.name,
          tag: task.tag,
          function: task.function,
          params: cleanParams,
        },
      });
    });

    // Second pass: analyze explicit edges and add to dependencies
    if (workflow.edges && workflow.edges.length > 0) {
      workflow.edges.forEach((edge) => {
        if (!dependencies[edge.target]) {
          dependencies[edge.target] = [];
        }
        dependencies[edge.target].push(edge.source);

        if (!reverseDependencies[edge.source]) {
          reverseDependencies[edge.source] = [];
        }
        reverseDependencies[edge.source].push(edge.target);
      });
    }

    // Third pass: calculate node levels (topological sort)
    const nodeLevels: Record<string, number> = {};
    const visited: Set<string> = new Set();
    const levelCounts: Record<number, number> = {};

    // Find nodes with no dependencies (roots)
    const roots = workflow.tasks
      .map((task) => task.name)
      .filter((name) => dependencies[name].length === 0);

    // Assign level 0 to input nodes if they exist
    if (Object.keys(workflow.default_inputs || {}).length > 0) {
      // Find the inputs node
      const inputsNode = result.nodes.find((node) => node.type === "inputs");
      if (inputsNode) {
        nodeLevels["inputs"] = 0;
        levelCounts[0] = 1;
      }
    }

    // Helper function for topological sort
    function assignLevels(nodeName: string, level: number) {
      if (visited.has(nodeName)) return;
      visited.add(nodeName);

      // Update node level (take max level if already assigned)
      nodeLevels[nodeName] = Math.max(level, nodeLevels[nodeName] || 0);

      // Count nodes at each level
      levelCounts[level] = (levelCounts[level] || 0) + 1;

      // Process children
      const children = reverseDependencies[nodeName] || [];
      children.forEach((child) => {
        assignLevels(child, level + 1);
      });
    }

    // Process all root nodes
    roots.forEach((root) => {
      assignLevels(root, nodeLevels["inputs"] !== undefined ? 1 : 0);
    });

    // Handle any disconnected nodes
    workflow.tasks.forEach((task) => {
      if (!visited.has(task.name)) {
        const level = Object.keys(levelCounts).length; // Put disconnected nodes at the end
        nodeLevels[task.name] = level;
        levelCounts[level] = (levelCounts[level] || 0) + 1;
      }
    });

    // Fourth pass: position nodes based on saved positions or level
    const HORIZONTAL_SPACING = 300;
    const CENTER_Y = 250; // Center line for zigzag pattern
    const VERTICAL_PADDING = 100; // Padding above/below center line
    const levelPositions: Record<number, number> = {};

    // Check if we have saved positions
    const savedPositions = workflow.flow_data?.node_positions;

    // Position nodes based on their level or saved positions
    result.nodes.forEach((node) => {
      const nodeName = node.data.name;

      // First, check if we have a saved position for this node
      if (savedPositions && savedPositions[nodeName]) {
        node.position = {
          x: savedPositions[nodeName].x,
          y: savedPositions[nodeName].y,
        };
        return;
      }

      // For inputs node, use saved position or default
      if (node.type === "inputs") {
        // Position inputs node at the start
        node.position = { x: 100, y: CENTER_Y };
        return;
      }

      const level = nodeLevels[nodeName];

      if (level !== undefined) {
        // Calculate horizontal position based on level
        const x = 400 + level * HORIZONTAL_SPACING;

        // Initialize position counter for this level if needed
        if (!levelPositions[level]) {
          levelPositions[level] = 0;
        }

        // Calculate vertical position with alternating above/below pattern
        // Even positions go above the center line, odd positions go below
        const isEvenPosition = levelPositions[level] % 2 === 0;
        const y = isEvenPosition
          ? CENTER_Y - VERTICAL_PADDING
          : CENTER_Y + VERTICAL_PADDING;

        // Increment position counter for this level
        levelPositions[level]++;

        // Update node position
        node.position = { x, y };
      }
    });

    // Process implicit edges (dependencies in params)
    workflow.tasks.forEach((task) => {
      const targetNodeId = taskNameToNodeId[task.name];

      Object.entries(task.params || {}).forEach(([_paramKey, paramValue]) => {
        if (
          typeof paramValue === "object" &&
          paramValue !== null &&
          "depends" in paramValue
        ) {
          let sourceName = paramValue.depends as string;

          // Remove .context suffix if present
          if (sourceName.endsWith(".context")) {
            sourceName = sourceName.replace(".context", "");
          }

          const sourceNodeId = taskNameToNodeId[sourceName];

          if (sourceNodeId && targetNodeId) {
            // Check if this connection already exists as an explicit edge
            const existingEdge = result.edges.find(
              (edge) =>
                edge.source === sourceNodeId && edge.target === targetNodeId,
            );

            // Only create dependency-based edge if no explicit edge exists
            const sourceNode = result.nodes.find(
              (node) => node.id === sourceNodeId,
            );
            if (
              !existingEdge &&
              sourceNode &&
              sourceNode.type !== "gpt_router"
            ) {
              const edgeId = `e${sourceNodeId}-${targetNodeId}`;

              result.edges.push({
                id: edgeId,
                source: sourceNodeId,
                target: targetNodeId,
                animated: true,
                style: { strokeWidth: 2 },
                markerEnd: { type: "arrowclosed" },
                data: {},
              });
            }
          }
        }
      });
    });

    // Process explicit edges (for conditional flows)
    if (workflow.edges && workflow.edges.length > 0) {
      workflow.edges.forEach((edge) => {
        const sourceNodeId = taskNameToNodeId[edge.source];
        const targetNodeId = taskNameToNodeId[edge.target];

        if (sourceNodeId && targetNodeId) {
          const edgeId = `e${sourceNodeId}-${targetNodeId}-${edge.condition || ""}`;

          // Find source node to determine its type
          const sourceNode = result.nodes.find(
            (node) => node.id === sourceNodeId,
          );

          if (sourceNode) {
            let sourceHandle: string | null = null;
            let label: string | null = null;

            // Handle conditional and router nodes specifically
            if (sourceNode.type === "gpt_conditional" && edge.condition) {
              sourceHandle = edge.condition === "true" ? "true" : "false";
              label = edge.condition === "true" ? "If True" : "If False";

              // Also update the source node's params to include the true/false path
              const updatedNodes = result.nodes.map((node) => {
                if (node.id === sourceNodeId) {
                  return {
                    ...node,
                    data: {
                      ...node.data,
                      params: {
                        ...node.data.params,
                        [sourceHandle as string]: edge.target, // Set the target node name
                      },
                    },
                  };
                }
                return node;
              });
              result.nodes = updatedNodes;
            } else if (sourceNode.type === "gpt_router" && edge.condition) {
              // Extract route name from condition like "route == 'route_name'"
              const routeMatch = edge.condition.match(
                /route\s*==\s*['"]([^'"]+)['"]/,
              );
              if (routeMatch && routeMatch[1]) {
                sourceHandle = routeMatch[1];
                label = `Route: ${routeMatch[1]}`;
              }
            }

            result.edges.push({
              id: edgeId,
              source: sourceNodeId,
              target: targetNodeId,
              sourceHandle,
              label: label || undefined, // Convert null to undefined
              animated: true,
              style: { strokeWidth: 2 },
              markerEnd: { type: "arrowclosed" },
              data: {},
              condition: edge.condition,
            });
          }
        }
      });
    }

    // Process input connections to handle 'input' references in params
    workflow.tasks.forEach((task) => {
      const targetNodeId = taskNameToNodeId[task.name];

      Object.entries(task.params || {}).forEach(([_paramKey, paramValue]) => {
        if (
          typeof paramValue === "object" &&
          paramValue !== null &&
          "input" in paramValue
        ) {
          const inputKey = paramValue.input as string;

          // Find the inputs node
          const inputsNode = result.nodes.find(
            (node) => node.type === "inputs",
          );

          if (inputsNode && targetNodeId) {
            const edgeId = `e${inputsNode.id}-${targetNodeId}-${inputKey}`;

            result.edges.push({
              id: edgeId,
              source: inputsNode.id,
              target: targetNodeId,
              sourceHandle: inputKey,
              animated: true,
              style: { strokeWidth: 2 },
              markerEnd: { type: "arrowclosed" },
              data: {},
            });
          }
        }
      });
    });

    return result;
  } catch (error) {
    console.error("Error converting JSON to workflow:", error);
    throw new Error(
      `Failed to convert JSON to workflow: ${(error as Error).message}`,
    );
  }
};
