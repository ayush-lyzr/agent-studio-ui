import React, { useMemo, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Bot, Wrench, Users } from 'lucide-react';

interface TreeNode {
  id: string;
  position: { x: number; y: number };
  data: {
    name: string;
    template_type?: string;
    agent_role?: string;
  };
}

interface TreeEdge {
  id: string;
  source: string;
  target: string;
}

interface SimpleTreeRendererProps {
  nodes: TreeNode[];
  edges: TreeEdge[];
  width?: number;
  height?: number;
  className?: string;
  forceTheme?: 'light' | 'dark';
}

const SimpleTreeRenderer: React.FC<SimpleTreeRendererProps> = ({
  nodes,
  edges,
  width = 400,
  height = 250,
  className,
  forceTheme
}) => {
  // Default to light mode, check for dark mode
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  useEffect(() => {
    if (forceTheme) {
      setIsDarkMode(forceTheme === 'dark');
      return;
    }
    
    // Initial check
    const checkDarkMode = () => {
      // Check multiple ways to detect dark mode
      const htmlDark = document.documentElement.classList.contains('dark');
      const bodyDark = document.body.classList.contains('dark');
      
      // Only set dark mode if explicitly set via class
      setIsDarkMode(htmlDark || bodyDark);
    };
    
    checkDarkMode();
    
    // Watch for changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    // Also observe body
    observer.observe(document.body, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, [forceTheme]);
  const { normalizedNodes, normalizedEdges, viewBox, scale } = useMemo(() => {
    if (nodes.length === 0) {
      return { normalizedNodes: [], normalizedEdges: [], viewBox: '0 0 400 250', scale: 1 };
    }

    // Build parent-child relationships to determine levels
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string>();
    
    // Build relationship maps
    edges.forEach(edge => {
      if (!childrenMap.has(edge.source)) {
        childrenMap.set(edge.source, []);
      }
      childrenMap.get(edge.source)!.push(edge.target);
      parentMap.set(edge.target, edge.source);
    });
    
    // Find root nodes (nodes with no parents)
    const rootNodes = nodes.filter(n => !parentMap.has(n.id));
    
    // Determine node levels
    const nodeLevels = new Map<string, number>();
    const queue = rootNodes.map(n => ({ id: n.id, level: 0 }));
    
    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      nodeLevels.set(id, level);
      
      const children = childrenMap.get(id) || [];
      children.forEach(childId => {
        queue.push({ id: childId, level: level + 1 });
      });
    }
    
    // Filter nodes to show only first 3 levels
    const visibleNodes = nodes.filter(node => {
      const level = nodeLevels.get(node.id) || 0;
      return level <= 2; // Level 0, 1, and 2
    });
    
    // Amplify spacing while preserving original layout structure
    const spacingMultiplier = 1.8; // Amplify distances by 80%
    const minVerticalGap = 60; // Minimum vertical gap between levels
    
    // Find original level positions to maintain relative positioning
    const levelYPositions = new Map<number, number[]>();
    visibleNodes.forEach(node => {
      const level = nodeLevels.get(node.id) || 0;
      if (!levelYPositions.has(level)) {
        levelYPositions.set(level, []);
      }
      levelYPositions.get(level)!.push(node.position.y);
    });
    
    // Calculate average Y position for each level from original data
    const levelAverages = new Map<number, number>();
    levelYPositions.forEach((yPositions, level) => {
      const avgY = yPositions.reduce((sum, y) => sum + y, 0) / yPositions.length;
      levelAverages.set(level, avgY);
    });
    
    // Amplify spacing based on original positions
    const adjustedNodes = visibleNodes.map(node => {
      const level = nodeLevels.get(node.id) || 0;
      const levelAvgY = levelAverages.get(level) || node.position.y;
      const offsetFromLevelCenter = node.position.y - levelAvgY;
      
      return {
        ...node,
        position: {
          x: node.position.x * spacingMultiplier, // Amplify horizontal spacing too
          y: (levelAvgY + level * minVerticalGap) + (offsetFromLevelCenter * spacingMultiplier)
        }
      };
    });
    
    // Filter edges to show connections between visible nodes and hint at level 3
    const visibleNodeIds = new Set(adjustedNodes.map(n => n.id));
    const visibleEdges = edges.filter(edge => {
      const sourceVisible = visibleNodeIds.has(edge.source);
      const targetLevel = nodeLevels.get(edge.target) || 0;
      
      // Show edge if source is visible and target is at most level 3
      return sourceVisible && targetLevel <= 3;
    });

    // Find bounds of adjusted nodes
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    adjustedNodes.forEach(node => {
      minX = Math.min(minX, node.position.x);
      maxX = Math.max(maxX, node.position.x);
      minY = Math.min(minY, node.position.y);
      maxY = Math.max(maxY, node.position.y);
    });

    // Add padding with better vertical spacing
    const padding = 40; // Increased padding for better spacing
    const contentWidth = maxX - minX + padding * 2;
    const contentHeight = maxY - minY + padding * 2;

    // Scale to fit ensuring proper spacing - prioritize spacing over node size
    const scaleX = (width * 0.90) / contentWidth; // Use 90% of width for maximum fit
    const scaleY = (height * 0.80) / contentHeight; // Use 80% of height for maximum fit
    const scale = Math.min(scaleX, scaleY, 0.15); // Very aggressive scaling to ensure good spacing

    // Calculate centering offsets
    const scaledWidth = contentWidth * scale;
    const scaledHeight = contentHeight * scale;
    const offsetX = (width - scaledWidth) / 2;
    const offsetY = (height - scaledHeight) / 2;

    // Normalize positions with centering
    const normalizedNodes = adjustedNodes.map(node => ({
      ...node,
      position: {
        x: (node.position.x - minX + padding) * scale + offsetX,
        y: (node.position.y - minY + padding) * scale + offsetY
      }
    }));

    // Create a map for quick node lookup
    const normalizedNodeMap = new Map(normalizedNodes.map(node => [node.id, node]));

    // Create normalized edges with path data
    const normalizedEdges = visibleEdges.map(edge => {
      const sourceNode = normalizedNodeMap.get(edge.source);
      const targetNode = normalizedNodeMap.get(edge.target);
      const targetLevel = nodeLevels.get(edge.target) || 0;

      if (!sourceNode) {
        return null;
      }

      // For edges going to level 3 nodes (not visible), create a partial edge
      if (!targetNode && targetLevel === 3) {
        return {
          ...edge,
          sourcePos: sourceNode.position,
          targetPos: {
            x: sourceNode.position.x,
            y: sourceNode.position.y + 30 // Short edge pointing down
          },
          isPartial: true
        };
      }

      if (!targetNode) {
        return null;
      }

      return {
        ...edge,
        sourcePos: sourceNode.position,
        targetPos: targetNode.position,
        isPartial: false
      };
    }).filter(Boolean);

    const viewBox = `0 0 ${width} ${height}`;

    return { normalizedNodes, normalizedEdges, viewBox, scale };
  }, [nodes, edges, width, height]);

  const getNodeStyle = (node: TreeNode, isDark: boolean) => {
    const isManager = node.data.template_type === 'MANAGER' || 
                     node.data.agent_role?.toLowerCase().includes('manager');
    const isTool = node.data.agent_role === 'Tool';
    
    // Base background color
    const bgColor = isDark ? '#1f2937' : '#ffffff';
    
    if (isTool) {
      return {
        fill: isDark ? '#064e3b' : '#dcfce7', // Slight green tint for tool nodes
        fillOpacity: 1,
        stroke: '#22c55e',
        strokeOpacity: 0.8,
        accentColor: '#22c55e',
        icon: 'tool',
        size: 'small'
      };
    }
    
    if (isManager) {
      return {
        fill: bgColor,
        fillOpacity: 1,
        stroke: '#a855f7',
        strokeOpacity: 0.5,
        accentColor: '#a855f7',
        icon: 'manager',
        size: 'normal'
      };
    }
    
    return {
      fill: bgColor,
      fillOpacity: 1,
      stroke: '#3b82f6',
      strokeOpacity: 0.5,
      accentColor: '#3b82f6',
      icon: 'worker',
      size: 'normal'
    };
  };

  return (
    <svg
      width={width}
      height={height}
      viewBox={viewBox}
      className={cn("w-full h-full", className)}
    >
      {/* Background pattern - dots like orchestration */}
      <defs>
        <pattern id="dots" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill={isDarkMode ? '#374151' : '#d1d5db'} opacity="0.5" />
        </pattern>
      </defs>
      <rect width={width} height={height} fill="url(#dots)" />

      {/* Render edges first (so they appear behind nodes) */}
      <g className="edges">
        {normalizedEdges.map((edge: any) => {
          if (!edge) return null;

          // Simple bezier curve from source bottom to target top
          // Adjust for actual node heights
          const sourceNode = nodes.find(n => n.id === edge.source);
          const targetNode = nodes.find(n => n.id === edge.target);
          const sourceIsTool = sourceNode?.data.agent_role === 'Tool';
          const targetIsTool = targetNode?.data.agent_role === 'Tool';
          
          const sourceNodeHeight = sourceIsTool ? Math.max(16, 24 * Math.min(scale * 4, 1)) : Math.max(24, 36 * Math.min(scale * 3, 1));
          const targetNodeHeight = targetIsTool ? Math.max(16, 24 * Math.min(scale * 4, 1)) : Math.max(24, 36 * Math.min(scale * 3, 1));
          
          const sourceY = edge.sourcePos.y + (sourceNodeHeight / 2);
          const targetY = edge.targetPos.y - (targetNodeHeight / 2);
          const controlPointOffset = Math.max(20, (targetY - sourceY) * 0.6); // Better control point spacing

          return (
            <g key={edge.id}>
              {/* Edge path with orchestration style */}
              <path
                d={edge.isPartial 
                  ? `M ${edge.sourcePos.x} ${sourceY} L ${edge.targetPos.x} ${edge.targetPos.y}`
                  : `M ${edge.sourcePos.x} ${sourceY} C ${edge.sourcePos.x} ${sourceY + controlPointOffset} ${edge.targetPos.x} ${targetY - controlPointOffset} ${edge.targetPos.x} ${targetY}`
                }
                fill="none"
                stroke={isDarkMode ? '#4b5563' : '#9ca3af'}
                strokeWidth="1"
                strokeDasharray={edge.isPartial ? "2,2" : "4,2"}
                opacity={edge.isPartial ? 0.5 : 1}
              />
              {/* Small circle at connection point or dots for partial edges */}
              {edge.isPartial ? (
                <>
                  <circle
                    cx={edge.targetPos.x}
                    cy={edge.targetPos.y}
                    r="2"
                    fill={isDarkMode ? '#4b5563' : '#9ca3af'}
                  />
                  <circle
                    cx={edge.targetPos.x}
                    cy={edge.targetPos.y + 6}
                    r="1.5"
                    fill={isDarkMode ? '#4b5563' : '#9ca3af'}
                  />
                  <circle
                    cx={edge.targetPos.x}
                    cy={edge.targetPos.y + 11}
                    r="1"
                    fill={isDarkMode ? '#4b5563' : '#9ca3af'}
                  />
                </>
              ) : (
                <circle
                  cx={edge.targetPos.x}
                  cy={targetY}
                  r="3"
                  fill={isDarkMode ? '#4b5563' : '#9ca3af'}
                />
              )}
            </g>
          );
        })}
      </g>

      {/* Render nodes */}
      <g className="nodes">
        {normalizedNodes.map(node => {
          const style = getNodeStyle(node, isDarkMode);
          const isTool = style.size === 'small';
          // Adaptive node sizing based on scale - smaller nodes for complex graphs
          const baseWidthTool = Math.max(16, 24 * Math.min(scale * 4, 1));
          const baseHeightTool = Math.max(16, 24 * Math.min(scale * 4, 1));
          const baseWidthNormal = Math.max(60, 100 * Math.min(scale * 3, 1));
          const baseHeightNormal = Math.max(24, 36 * Math.min(scale * 3, 1));
          
          const nodeWidth = isTool ? baseWidthTool : baseWidthNormal;
          const nodeHeight = isTool ? baseHeightTool : baseHeightNormal;

          return (
            <g key={node.id} transform={`translate(${node.position.x - nodeWidth/2}, ${node.position.y - nodeHeight/2})`}>
              {/* Node shadow */}
              <rect
                x="1"
                y="1"
                width={nodeWidth}
                height={nodeHeight}
                rx={isTool ? "6" : "8"}
                fill={isDarkMode ? 'black' : 'black'}
                opacity={isDarkMode ? '0.3' : '0.1'}
              />
              
              {/* Node background */}
              <rect
                width={nodeWidth}
                height={nodeHeight}
                rx={isTool ? "6" : "8"}
                fill={style.fill}
                fillOpacity={style.fillOpacity}
                stroke={style.stroke}
                strokeOpacity={style.strokeOpacity}
                strokeWidth="1"
                className="transition-all"
              />
              
              {/* Node content */}
              {isTool ? (
                // Tool node - icon only in the box, name beside it
                <>
                  {/* Icon centered in the tool box */}
                  <g transform={`translate(${nodeWidth/2}, ${nodeHeight/2})`}>
                    <foreignObject x="-6" y="-6" width="12" height="12">
                      <Wrench size={12} color={style.accentColor} />
                    </foreignObject>
                  </g>
                  
                  {/* Tool name displayed to the right of the box */}
                  <text
                    x={nodeWidth + 4}
                    y={nodeHeight / 2}
                    dominantBaseline="middle"
                    textAnchor="start"
                    fill={isDarkMode ? '#9ca3af' : '#6b7280'}
                    fontSize={Math.max(6, 8 * Math.min(scale * 4, 1))}
                    fontWeight="400"
                    className="select-none"
                  >
                    {node.data.name?.length > Math.floor(8 * Math.min(scale * 4, 1))
                      ? node.data.name.substring(0, Math.floor(8 * Math.min(scale * 4, 1))) + '...' 
                      : node.data.name || 'Tool'}
                  </text>
                </>
              ) : (
                // Regular node - icon and text
                <>
                  {/* Icon */}
                  <g transform={`translate(8, ${nodeHeight/2})`}>
                    {style.icon === 'manager' ? (
                      <foreignObject x="-6" y="-6" width="12" height="12">
                        <Users size={12} color={style.accentColor} />
                      </foreignObject>
                    ) : (
                      <foreignObject x="-6" y="-6" width="12" height="12">
                        <Bot size={12} color={style.accentColor} />
                      </foreignObject>
                    )}
                  </g>
                  
                  {/* Text */}
                  <text
                    x={22}
                    y={nodeHeight / 2}
                    dominantBaseline="middle"
                    textAnchor="start"
                    fill={isDarkMode ? '#d1d5db' : '#374151'}
                    fontSize={Math.max(7, 9 * Math.min(scale * 4, 1))}
                    fontWeight="500"
                    className="select-none"
                  >
                    {node.data.name?.length > Math.floor(12 * Math.min(scale * 4, 1))
                      ? node.data.name.substring(0, Math.floor(12 * Math.min(scale * 4, 1))) + '...' 
                      : node.data.name}
                  </text>
                  
                  {/* Badge for manager nodes - removed for space */}
                </>
              )}
              
              {/* Connection handles */}
              <circle
                cx={nodeWidth / 2}
                cy="0"
                r="3"
                fill={isDarkMode ? '#1f2937' : 'white'}
                stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                strokeWidth="1"
              />
              <circle
                cx={nodeWidth / 2}
                cy={nodeHeight}
                r="3"
                fill={isDarkMode ? '#1f2937' : 'white'}
                stroke={isDarkMode ? '#4b5563' : '#d1d5db'}
                strokeWidth="1"
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export default SimpleTreeRenderer;