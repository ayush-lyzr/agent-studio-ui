import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface CustomNodeData {
  label?: string;
  description?: string;
}

export const CustomNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as CustomNodeData;

  return (
    <Card
      className={cn(
        'min-w-[200px] px-4 py-3 shadow-md rounded-lg border-2 bg-white dark:bg-gray-800 transition-all',
        selected
          ? 'border-blue-500 shadow-lg'
          : 'border-gray-200 dark:border-gray-700',
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-500"
      />

      <div className="space-y-1">
        <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          {nodeData?.label || 'Untitled Node'}
        </div>
        {nodeData?.description && (
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {nodeData.description}
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-500"
      />
    </Card>
  );
});

CustomNode.displayName = 'CustomNode';
