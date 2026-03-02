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
} => {
  try {
    // Parse the JSON string
    const workflow: Workflow = JSON.parse(jsonString);

    // Initialize the result
    const result = {
      nodes: [] as WorkflowNode[],
      edges: [] as WorkflowEdge[],
      flowName: workflow.flow_name || "New Workflow",
      runName: workflow.run_name || "Run 1",
      defaultInputs: workflow.default_inputs || {},
    };

    // Process inputs if they exist
    if (Object.keys(workflow.default_inputs || {}).length > 0) {
      // Create an inputs node
      const inputsNodeId = uuidv4();
      const keys: Record<string, any> = {};

      // Add each input key to the node's params
      Object.entries(workflow.default_inputs || {}).forEach(([key, value]) => {
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

    // Initial x and y positions for automatic layout
    let xPos = 400;
    let yPos = 100;

    // Process tasks
    workflow.tasks.forEach((task) => {
      const nodeId = uuidv4();
      taskNameToNodeId[task.name] = nodeId;

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
      }

      // Create a copy of params without dependency references
      const cleanParams: NodeParams = {};

      // Process params to handle dependencies
      Object.entries(task.params || {}).forEach(([key, value]) => {
        if (typeof value === "object" && value !== null && "depends" in value) {
          // Skip dependency params, they'll be handled when creating edges
          // But clean any .context suffixes first
          if (
            typeof value.depends === "string" &&
            value.depends.endsWith(".context")
          ) {
            value.depends = value.depends.replace(".context", "");
          }
        } else {
          cleanParams[key] = value;
        }
      });

      // Add the task node to the result
      result.nodes.push({
        id: nodeId,
        type: nodeType,
        position: { x: xPos, y: yPos }, // Auto-position nodes in a grid
        data: {
          name: task.name,
          tag: task.tag,
          function: task.function,
          params: cleanParams,
        },
      });

      // Update positions for next node (simple grid layout)
      xPos += 300;
      if (xPos > 1200) {
        // Start a new row after 3 nodes
        xPos = 400;
        yPos += 200;
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
              condition: edge.condition,
              style: { strokeWidth: 2 },
              markerEnd: { type: "arrowclosed" },
              data: {},
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
