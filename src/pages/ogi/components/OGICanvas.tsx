import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Node,
  NodeTypes,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { CustomNode } from './nodes/CustomNode';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, Trash2 } from 'lucide-react';

// Define custom node types
const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { label: 'Start Node', description: 'This is where you begin' },
  },
];

const initialEdges: Edge[] = [];

interface OGICanvasProps {
  onAddNode?: () => void;
}

export function OGICanvas({ onAddNode }: OGICanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  const onSave = useCallback(() => {
    const flow = { nodes, edges };
    localStorage.setItem('ogi-flow', JSON.stringify(flow));
    console.log('Flow saved:', flow);
  }, [nodes, edges]);

  const onRestore = useCallback(() => {
    const restoreFlow = async () => {
      const flow = JSON.parse(localStorage.getItem('ogi-flow') || '{}');

      if (flow.nodes && flow.edges) {
        setNodes(flow.nodes || []);
        setEdges(flow.edges || []);
      }
    };

    restoreFlow();
  }, [setNodes, setEdges]);

  const onClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, [setNodes, setEdges]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="bg-gray-50 dark:bg-gray-900"
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />

        {/* Toolbar Panel */}
        <Panel position="top-right" className="space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={onAddNode}
            className="bg-white dark:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Node
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onSave}
            className="bg-white dark:bg-gray-800"
          >
            <Download className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onRestore}
            className="bg-white dark:bg-gray-800"
          >
            <Upload className="h-4 w-4 mr-1" />
            Load
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onClear}
            className="bg-white dark:bg-gray-800"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        </Panel>
      </ReactFlow>
    </div>
  );
}
