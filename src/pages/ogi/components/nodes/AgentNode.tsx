import { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AgentNodeData {
  name: string;
  description?: string;
  agent_role?: string;
  model?: string;
}

// Color variations for different agents - darker shades matching reference
const agentColors = [
  'from-slate-600 to-slate-700',
  'from-gray-600 to-gray-700',
  'from-zinc-600 to-zinc-700',
  'from-neutral-600 to-neutral-700',
  'from-stone-600 to-stone-700',
  'from-slate-700 to-slate-800',
];

export const AgentNode = memo(({ data, selected, id }: NodeProps) => {
  const nodeData = data as unknown as AgentNodeData;

  // Assign color based on node id for consistency
  const colorIndex = parseInt(id?.slice(-1) || '0', 16) % agentColors.length;
  const colorGradient = agentColors[colorIndex];

  // Random pulse delay for organic feel
  const pulseDelay = Math.random() * 2;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
      }}
      transition={{
        scale: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
          delay: Math.random() * 0.3,
        },
        opacity: {
          duration: 0.4,
          delay: Math.random() * 0.3,
        },
      }}
      className="relative"
    >
      <Handle
        type="target"
        position={Position.Top}
        className="w-2 h-2 !bg-transparent border-0 opacity-0"
      />

      {/* Outer glow ring */}
      <motion.div
        className={cn(
          'absolute inset-0 rounded-full bg-gradient-to-br blur-lg -z-10',
          colorGradient
        )}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: pulseDelay,
        }}
      />

      {/* Main circular node */}
      <motion.div
        className={cn(
          'relative w-16 h-16 rounded-full bg-gradient-to-br flex items-center justify-center',
          'shadow-2xl border-4 border-gray-800 dark:border-gray-600',
          colorGradient,
          selected && 'ring-4 ring-blue-500/50'
        )}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: pulseDelay,
        }}
        whileHover={{ scale: 1.1 }}
      >
        {/* Inner pulse dot - green active indicator */}
        <motion.div
          className="w-3 h-3 rounded-full bg-green-400"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Activity indicator ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-white/40"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.6, 0, 0.6],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </motion.div>

      {/* Agent name label */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 whitespace-nowrap">
        <div className={cn(
          'px-3 py-1.5 rounded-lg text-sm font-medium',
          'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
          'shadow-lg border border-gray-200 dark:border-gray-700'
        )}>
          {nodeData?.name || 'Agent'}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="w-2 h-2 !bg-transparent border-0 opacity-0"
      />
    </motion.div>
  );
});

AgentNode.displayName = 'AgentNode';
