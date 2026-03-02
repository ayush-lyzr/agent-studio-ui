import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useReactFlow } from '@xyflow/react';
import {
  Box,
  Circle,
  Diamond,
  Square,
  Workflow,
  Database,
  Brain,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NodeTemplate {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const nodeTemplates: NodeTemplate[] = [
  {
    id: 'process',
    label: 'Process',
    description: 'A processing step',
    icon: <Box className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300',
  },
  {
    id: 'decision',
    label: 'Decision',
    description: 'Make a decision',
    icon: <Diamond className="h-5 w-5" />,
    color: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300',
  },
  {
    id: 'start',
    label: 'Start',
    description: 'Start point',
    icon: <Circle className="h-5 w-5" />,
    color: 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300',
  },
  {
    id: 'end',
    label: 'End',
    description: 'End point',
    icon: <Square className="h-5 w-5" />,
    color: 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300',
  },
  {
    id: 'workflow',
    label: 'Workflow',
    description: 'Sub-workflow',
    icon: <Workflow className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-300',
  },
  {
    id: 'data',
    label: 'Data',
    description: 'Data source',
    icon: <Database className="h-5 w-5" />,
    color: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300',
  },
  {
    id: 'ai',
    label: 'AI Agent',
    description: 'AI processing',
    icon: <Brain className="h-5 w-5" />,
    color: 'bg-pink-100 text-pink-600 dark:bg-pink-900 dark:text-pink-300',
  },
  {
    id: 'action',
    label: 'Action',
    description: 'Execute action',
    icon: <Zap className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-300',
  },
];

interface NodesSidebarProps {
  onAddNode?: (template: NodeTemplate) => void;
}

export function NodesSidebar({ onAddNode }: NodesSidebarProps) {
  const { screenToFlowPosition, addNodes } = useReactFlow();

  const onDragStart = (event: React.DragEvent, template: NodeTemplate) => {
    event.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleAddNode = (template: NodeTemplate) => {
    const position = screenToFlowPosition({
      x: Math.random() * 500 + 100,
      y: Math.random() * 300 + 100,
    });

    const newNode = {
      id: `node_${Date.now()}`,
      type: 'custom',
      position,
      data: {
        label: template.label,
        description: template.description,
      },
    };

    addNodes(newNode);
    if (onAddNode) onAddNode(template);
  };

  return (
    <Card className="h-full w-64 border-r rounded-none">
      <div className="p-4 border-b">
        <h3 className="font-semibold text-sm">Node Templates</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Drag and drop onto canvas
        </p>
      </div>

      <ScrollArea className="h-[calc(100%-73px)]">
        <div className="p-3 space-y-2">
          {nodeTemplates.map((template) => (
            <Card
              key={template.id}
              draggable
              onDragStart={(e) => onDragStart(e, template)}
              onClick={() => handleAddNode(template)}
              className={cn(
                'p-3 cursor-move hover:shadow-md transition-shadow border',
                'hover:border-blue-400 dark:hover:border-blue-600',
              )}
            >
              <div className="flex items-start gap-3">
                <div className={cn('p-2 rounded-md', template.color)}>
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {template.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {template.description}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
