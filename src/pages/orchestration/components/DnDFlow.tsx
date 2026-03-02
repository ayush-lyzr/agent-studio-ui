import React, {
  useCallback,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Background,
  useReactFlow,
  reconnectEdge,
  Node,
  Edge,
  Connection,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import useStore from "@/lib/store";
import { v4 as uuidv4 } from "uuid";
import Sidebar from "./Sidebar";
import CustomNode from "./CustomNode";
import CustomEdge from "./CustomEdge";

const flowKey = "orchestration-flow";

const DnDFlow = forwardRef((_, ref) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState<any>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<any>([]);
  const { screenToFlowPosition } = useReactFlow();
  const edgeReconnectSuccessful = useRef(true);
  const [rfInstance, setRfInstance] = useState<any>(null);
  const agents = useStore((state: any) => state.agents);

  const onConnect = useCallback(
    (params: Connection) => setEdges((els) => addEdge(params, els)),
    [setEdges],
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const agentData = event.dataTransfer.getData("agent");

      if (!type || !agentData) {
        return;
      }

      const agent = JSON.parse(agentData);
      const position = screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: agent.id,
        type: "custom",
        position,
        data: { label: agent.name },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges],
  );

  const onReconnectEnd = useCallback(
    (_: any, edge: any) => {
      if (!edgeReconnectSuccessful.current) {
        setEdges((eds) => eds.filter((e: any) => e.id !== edge.id));
      }
      edgeReconnectSuccessful.current = true;
    },
    [setEdges],
  );

  const onSave = useCallback(() => {
    if (rfInstance) {
      const flow = rfInstance.toObject();
      localStorage.setItem(flowKey, JSON.stringify(flow));

      const workflowData = {
        workflow_id: uuidv4(),
        tasks: nodes.map((node: any) => {
          const incomingEdges = edges.filter(
            (edge: any) => edge.target === node.id,
          );
          return {
            task_id: node.id,
            task_payload: {
              user_id: "default_user",
              session_id: `task_${node.id}`,
              agent_id:
                agents.find((agent: any) => agent.name === node.data.label)
                  ?.id || "",
              message: node.data.message || undefined,
            },
            dependencies: incomingEdges.map((edge: any) => edge.source),
          };
        }),
      };

      console.log("Workflow Data:", workflowData);
    }
  }, [rfInstance, nodes, edges, agents]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem(flowKey) || "{}");
      if (flow) {
        const { x = 0, y = 0, zoom = 1 } = flow.viewport || {};
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
        rfInstance?.setViewport({ x, y, zoom });
      }
    };
    restoreFlow();
  }, [setNodes, setEdges, rfInstance]);

  const onReset = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  useImperativeHandle(ref, () => ({
    onSave,
    onRestore,
    onReset,
  }));

  const onNodeDelete = useCallback(
    (nodeId: string) => {
      setNodes((nds: any) => nds.filter((node: any) => node.id !== nodeId));
      setEdges((eds) =>
        eds.filter(
          (edge: any) => edge.source !== nodeId && edge.target !== nodeId,
        ),
      );
    },
    [setNodes, setEdges],
  );

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-grow" ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes.map((node: any) => ({
            ...node,
            data: {
              ...node.data,
              onDelete: onNodeDelete,
            },
          }))}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onReconnect={onReconnect}
          onReconnectStart={onReconnectStart}
          onReconnectEnd={onReconnectEnd}
          onInit={setRfInstance}
          fitView
          nodeTypes={{ custom: CustomNode }}
          edgeTypes={{ default: CustomEdge }}
        >
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
});

DnDFlow.displayName = "DnDFlow";

export default DnDFlow;
