import { useCallback, useMemo } from 'react';
import { Node } from '@xyflow/react';
import { GroupData } from '../components/GroupLayer';

export interface GroupNode extends Node<GroupData> {
  type: 'group';
  data: GroupData;
}

interface UseGroupingReturn {
  groups: GroupNode[];
  createGroup: (selectedNodeIds: string[], title?: string) => void;
  updateGroup: (groupId: string, updates: Partial<GroupData>) => void;
  deleteGroup: (groupId: string) => void;
  addNodesToGroup: (groupId: string, nodeIds: string[]) => void;
  removeNodesFromGroup: (groupId: string, nodeIds: string[]) => void;
  getGroupsFromBlueprintData: (blueprintData: any) => GroupNode[];
  saveBlueprintGroups: (blueprintData: any) => any;
}

const DEFAULT_GROUP_COLOR = '#3b82f6';
const DEFAULT_GROUP_SIZE: { x?: number; y?: number; width: number; height: number } = { width: 300, height: 200 };

export const useGrouping = (
  nodes: Node[],
  setNodes: (nodes: Node[] | ((nodes: Node[]) => Node[])) => void
): UseGroupingReturn => {
  
  const groups = useMemo(() => {
    return nodes.filter((node): node is GroupNode => node.type === 'group');
  }, [nodes]);

  const calculateGroupBounds = useCallback((nodeIds: string[]) => {
    const groupNodes = nodeIds.map(id => {
      return nodes.find(node => node.id === id);
    }).filter((node): node is Node => node !== undefined);
    
    if (groupNodes.length === 0) return DEFAULT_GROUP_SIZE;

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    groupNodes.forEach(node => {
      const x = node.position.x;
      const y = node.position.y;
      const width = ('width' in node && typeof node.width === 'number') ? node.width : 
                    (node.measured?.width || 200);
      const height = ('height' in node && typeof node.height === 'number') ? node.height : 
                     (node.measured?.height || 100);
      
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + width);
      maxY = Math.max(maxY, y + height);
    });

    return {
      x: minX - 20,
      y: minY - 40, // Extra space for title
      width: Math.max(maxX - minX + 40, 300),
      height: Math.max(maxY - minY + 60, 200),
    };
  }, [nodes]);

  const createGroup = useCallback((selectedNodeIds: string[], title = 'New Group') => {
    if (selectedNodeIds.length === 0) return;

    const bounds = calculateGroupBounds(selectedNodeIds);
    const groupId = `group_${Date.now()}`;
    
    const newGroup: GroupNode = {
      id: groupId,
      type: 'group',
      position: { x: bounds.x || 0, y: bounds.y || 0 },
      data: {
        id: groupId,
        title,
        color: DEFAULT_GROUP_COLOR,
        nodeIds: selectedNodeIds,
        width: bounds.width,
        height: bounds.height,
      },
      selectable: true, // Enable ReactFlow selection for resize handles
      draggable: true,
      style: {
        zIndex: -1, // Place groups behind regular nodes
      },
    };

    setNodes((prevNodes) => [...prevNodes, newGroup as Node]);
  }, [calculateGroupBounds, setNodes]);

  const updateGroup = useCallback((groupId: string, updates: Partial<GroupData>) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === groupId && node.type === 'group') {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const deleteGroup = useCallback((groupId: string) => {
    setNodes((prevNodes) => prevNodes.filter((node) => node.id !== groupId));
  }, [setNodes]);

  const addNodesToGroup = useCallback((groupId: string, nodeIds: string[]) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === groupId && node.type === 'group') {
          const groupNode = node as GroupNode;
          const updatedNodeIds = [...new Set([...groupNode.data.nodeIds, ...nodeIds])];
          const bounds = calculateGroupBounds(updatedNodeIds);
          
          return {
            ...node,
            position: { x: bounds.x || 0, y: bounds.y || 0 },
            data: {
              ...groupNode.data,
              nodeIds: updatedNodeIds,
              width: bounds.width,
              height: bounds.height,
            },
          };
        }
        return node;
      })
    );
  }, [setNodes, calculateGroupBounds]);

  const removeNodesFromGroup = useCallback((groupId: string, nodeIds: string[]) => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.id === groupId && node.type === 'group') {
          const groupNode = node as GroupNode;
          const updatedNodeIds = groupNode.data.nodeIds.filter((id: string) => !nodeIds.includes(id));
          
          // If no nodes left, delete the group
          if (updatedNodeIds.length === 0) {
            return null;
          }
          
          const bounds = calculateGroupBounds(updatedNodeIds);
          
          return {
            ...node,
            position: { x: bounds.x || 0, y: bounds.y || 0 },
            data: {
              ...groupNode.data,
              nodeIds: updatedNodeIds,
              width: bounds.width,
              height: bounds.height,
            },
          };
        }
        return node;
      }).filter((node): node is Node => node !== null)
    );
  }, [setNodes, calculateGroupBounds]);

  const getGroupsFromBlueprintData = useCallback((blueprintData: any): GroupNode[] => {
    if (!blueprintData?.groups) return [];
    
    return blueprintData.groups.map((groupData: any) => ({
      id: groupData.id,
      type: 'group',
      position: { x: groupData.x, y: groupData.y },
      data: {
        id: groupData.id,
        title: groupData.title,
        color: groupData.color,
        nodeIds: groupData.nodeIds,
        width: groupData.width,
        height: groupData.height,
      },
      selectable: true, // Enable ReactFlow selection for resize handles
      draggable: true,
      style: {
        zIndex: -1,
      },
    }));
  }, []);

  const saveBlueprintGroups = useCallback((blueprintData: any) => {
    const groupsData = groups.map(group => ({
      id: group.data.id,
      title: group.data.title,
      color: group.data.color,
      nodeIds: group.data.nodeIds,
      x: group.position.x,
      y: group.position.y,
      width: group.data.width,
      height: group.data.height,
    }));

    return {
      ...blueprintData,
      groups: groupsData,
    };
  }, [groups]);

  return {
    groups,
    createGroup,
    updateGroup,
    deleteGroup,
    addNodesToGroup,
    removeNodesFromGroup,
    getGroupsFromBlueprintData,
    saveBlueprintGroups,
  };
};

export default useGrouping;