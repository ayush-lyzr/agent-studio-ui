
import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Zap, Wrench, Play } from 'lucide-react';
import { Agent } from '../types/agent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface AgentNodeProps {
  data: Agent & {
    isToolNode?: boolean;
    provider_id?: string;
    providerLogo?: string;
    providerName?: string;
  };
  onPlayClick?: (agent: Agent) => void;
  isPublicView?: boolean;
  canEdit?: boolean;
}

const AgentNode: React.FC<AgentNodeProps> = ({
  data,
  onPlayClick,
  isPublicView: _isPublicView = false,
  canEdit: _canEdit = true,
}) => {
  const isManager = data.managed_agents && data.managed_agents.length > 0;
  const isToolNode = data.isToolNode || data.agent_role === 'Tool' || data.agent_role === 'Tool Action';

  // Simple tool node design
  if (isToolNode) {
    return (
      <div className="flex flex-col items-center min-w-32">
        {/* Input Handle */}
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-muted border-2 border-border"
        />

        {/* Tool Square */}
        <div className="w-16 h-16 bg-green-500/20 dark:bg-green-500/10 border-2 border-green-500/50 dark:border-green-500/30 rounded-lg flex items-center justify-center mb-2">
          {data.providerLogo ? (
            <img
              src={data.providerLogo}
              alt={data.providerName || 'Tool provider'}
              className="w-10 h-10 rounded object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.setAttribute('style', 'display: flex');
              }}
            />
          ) : null}
          <div
            className="w-10 h-10 rounded bg-green-600 dark:bg-green-700 flex items-center justify-center"
            style={{ display: data.providerLogo ? 'none' : 'flex' }}
          >
            {data.providerName ? (
              <span className="text-xs text-foreground font-semibold">
                {data.providerName.charAt(0).toUpperCase()}
              </span>
            ) : (
              <Wrench className="w-6 h-6 text-foreground" />
            )}
          </div>
        </div>

        {/* Action Name */}
        <div className="text-center text-xs text-foreground font-medium px-2 max-w-32">
          {data.name}
        </div>
      </div>
    );
  }

  // Regular agent node design
  return (
    <div className={`
      relative min-w-64 p-6 rounded-lg border bg-card shadow-lg
      ${isManager
        ? 'border-purple-500/50'
        : 'border-blue-500/50'
      }
      hover:shadow-xl transition-shadow duration-200
    `}>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 bg-muted border-2 border-border"
      />

      {/* Worker Badge - Bottom Right Corner */}
      {!isManager && (
        <div className="absolute bottom-3 right-3 z-10">
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-blue-500/20 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 border-blue-500/30 dark:border-blue-700/50 hover:bg-blue-500/20 dark:hover:bg-blue-900/50 pointer-events-none">
            Sub Agent
          </Badge>
        </div>
      )}

      {/* Manager Badge - Bottom Right Corner */}
      {isManager && (
        <div className="absolute bottom-3 right-3 z-10">
          <Badge variant="secondary" className="text-xs px-2 py-1 bg-purple-500/20 dark:bg-purple-900/50 text-purple-600 dark:text-purple-300 border-purple-500/30 dark:border-purple-700/50 hover:bg-purple-500/20 dark:hover:bg-purple-900/50 pointer-events-none">
            Manager
          </Badge>
        </div>
      )}

      {/* Green Play Button - Top Right Corner */}
      <div className="absolute top-3 right-3 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPlayClick?.(data);
          }}
          className="h-8 w-8 p-0 bg-green-500/20 hover:bg-green-500/30 border border-green-500/50 rounded-full transition-all duration-200 hover:scale-110 flex items-center justify-center"
        >
          <Play className="h-4 w-4 text-green-600 dark:text-green-400 fill-current ml-0.5" />
        </Button>
      </div>

      {/* Node Header */}
      <div className="flex items-start gap-3 mb-3">
        <div className={`
          p-2 rounded-md flex-shrink-0
          ${isManager
            ? 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
            : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
          }
        `}>
          {isManager ? (
            <Zap className="w-4 h-4" />
          ) : (
            <Bot className="w-4 h-4" />
          )}
        </div>
        <div className="flex-1 min-w-0 pr-8">
          <h3 className="font-medium text-foreground text-sm mb-2 truncate">
            {data.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {data.description || data.agent_role || 'No description available'}
          </p>
          {data.provider_id && (
            <p className="text-xs text-muted-foreground mt-1">
              Provider: {data.provider_id}
            </p>
          )}
        </div>
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 bg-muted border-2 border-border"
      />
    </div>
  );
};

export default AgentNode;
