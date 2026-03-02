export interface TreeNode {
  id: string;
  parentId?: string;
  children: TreeNode[];
  width: number;
  height: number;
  x?: number;
  y?: number;
  level?: number;
  mod?: number; // modifier for positioning
  thread?: TreeNode; // thread for tree traversal
  ancestor?: TreeNode; // ancestor for tree positioning
  prelim?: number; // preliminary x coordinate
  change?: number; // change value for positioning
  shift?: number; // shift value for positioning
}

export interface LayoutConfig {
  nodeWidth: number;
  nodeHeight: number;
  horizontalSpacing: number;
  verticalSpacing: number;
  toolOffset: number;
  toolSpacing: number;
  siblingSpacing: number; // minimum spacing between sibling nodes
  subtreeSpacing: number; // minimum spacing between subtrees
}

export const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeWidth: 280,
  nodeHeight: 120,
  horizontalSpacing: 150, // Increased horizontal spacing
  verticalSpacing: 200,   // Increased vertical spacing
  toolOffset: 400,       // Increased tool offset
  toolSpacing: 160,      // Increased tool spacing
  siblingSpacing: 100,   // Increased sibling spacing
  subtreeSpacing: 200,   // Increased subtree spacing
};

// Original complex tree layout functions (Reingold-Tilford algorithm) kept intact for reference and fallback

// Improved simple tree layout with better spacing
export function calculateSimpleTreeLayout(
  nodes: TreeNode[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): TreeNode[] {
  if (nodes.length === 0) return [];

  // Find root nodes
  const rootNodes = nodes.filter(node => !node.parentId);
  
  // Build tree structure
  const nodeMap = new Map<string, TreeNode>();
  const positionedNodes: TreeNode[] = [];
  
  nodes.forEach(node => {
    nodeMap.set(node.id, { ...node, children: [] });
  });

  // Establish parent-child relationships
  nodes.forEach(node => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      const child = nodeMap.get(node.id);
      if (parent && child) {
        parent.children.push(child);
      }
    }
  });

  let currentTreeX = 0;

  rootNodes.forEach((rootNode, rootIndex) => {
    const root = nodeMap.get(rootNode.id);
    if (root) {
      const treeNodes = layoutTreeImproved(root, currentTreeX, 0, config);
      positionedNodes.push(...treeNodes);
      
      // Calculate tree width for next tree positioning with better spacing
      const treeMinX = Math.min(...treeNodes.map(n => n.x || 0));
      const treeMaxX = Math.max(...treeNodes.map(n => (n.x || 0) + n.width));
      const treeWidth = treeMaxX - treeMinX;
      
      // Add extra spacing between root trees
      currentTreeX += treeWidth + config.subtreeSpacing + (rootIndex > 0 ? 100 : 0);
    }
  });

  return positionedNodes;
}

function layoutTreeImproved(
  node: TreeNode, 
  baseX: number, 
  level: number, 
  config: LayoutConfig
): TreeNode[] {
  const result: TreeNode[] = [];
  node.level = level;
  
  if (node.children.length === 0) {
    // Leaf node
    node.x = baseX;
    node.y = level * config.verticalSpacing;
    result.push(node);
  } else {
    // Sort children to ensure consistent positioning
    const sortedChildren = [...node.children].sort((a, b) => a.id.localeCompare(b.id));
    
    // Calculate subtree widths with improved spacing
    const childSubtrees = sortedChildren.map(child => {
      const subtreeWidth = calculateSubtreeWidthImproved(child, config);
      return { child, width: subtreeWidth };
    });
    
    // Calculate total width needed for all children with proper spacing
    const totalChildrenWidth = childSubtrees.reduce((sum, { width }, index) => {
      return sum + width + (index > 0 ? config.siblingSpacing : 0);
    }, 0);
    
    // Position children with better distribution
    let currentChildX = baseX - totalChildrenWidth / 2;
    
    childSubtrees.forEach(({ child, width }, index) => {
      const childCenterX = currentChildX + width / 2;
      
      const childNodes = layoutTreeImproved(child, childCenterX, level + 1, config);
      result.push(...childNodes);
      
      currentChildX += width;
      if (index < childSubtrees.length - 1) {
        currentChildX += config.siblingSpacing;
      }
    });
    
    // Position parent node
    node.x = baseX;
    node.y = level * config.verticalSpacing;
    result.push(node);
  }
  
  return result;
}

function calculateSubtreeWidthImproved(node: TreeNode, config: LayoutConfig): number {
  if (node.children.length === 0) {
    return config.nodeWidth;
  }
  
  // Calculate width needed for all children with proper spacing
  const childrenWidths = node.children.map(child => 
    calculateSubtreeWidthImproved(child, config)
  );
  
  const totalChildrenWidth = childrenWidths.reduce((sum, width, index) => 
    sum + width + (index > 0 ? config.siblingSpacing : 0), 0
  );
  
  // Return the maximum of node width and total children width
  return Math.max(totalChildrenWidth, config.nodeWidth);
}

export function calculateToolPositions(
  agentNode: { x: number; y: number },
  toolCount: number,
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): Array<{ x: number; y: number }> {
  const positions: Array<{ x: number; y: number }> = [];
  
  // Calculate tool positions with better spacing
  const toolStartX = agentNode.x + config.toolOffset;
  const toolY = agentNode.y + (config.nodeHeight / 4);
  
  for (let i = 0; i < toolCount; i++) {
    positions.push({
      x: toolStartX + (i * config.toolSpacing),
      y: toolY,
    });
  }
  
  return positions;
}

export function groupNodesByLevel(nodes: TreeNode[]): Map<number, TreeNode[]> {
  const levelMap = new Map<number, TreeNode[]>();
  
  nodes.forEach(node => {
    const level = node.level ?? 0;
    if (!levelMap.has(level)) {
      levelMap.set(level, []);
    }
    levelMap.get(level)!.push(node);
  });
  
  return levelMap;
}

// The following helper functions are kept as stubs or minimal implementations
// since the improved layout uses a simpler approach and does not rely on them heavily

// Original complex tree layout functions (Reingold-Tilford algorithm) and helpers

export function calculateTreeLayout(
  nodes: TreeNode[],
  config: LayoutConfig = DEFAULT_LAYOUT_CONFIG
): TreeNode[] {
  if (nodes.length === 0) return [];

  // Find root nodes (nodes without parents)
  const rootNodes = nodes.filter(node => !node.parentId);
  
  // Build tree structure
  const nodeMap = new Map<string, TreeNode>();
  nodes.forEach(node => {
    nodeMap.set(node.id, { 
      ...node, 
      children: [],
      mod: 0,
      prelim: 0,
      change: 0,
      shift: 0
    });
  });

  // Establish parent-child relationships
  nodes.forEach(node => {
    if (node.parentId) {
      const parent = nodeMap.get(node.parentId);
      const child = nodeMap.get(node.id);
      if (parent && child) {
        parent.children.push(child);
      }
    }
  });

  const positionedNodes: TreeNode[] = [];
  let currentRootX = 0;

  rootNodes.forEach(rootNode => {
    const root = nodeMap.get(rootNode.id);
    if (root) {
      // First pass: calculate preliminary positions
      firstWalk(root, config);
      
      // Second pass: calculate final positions
      secondWalk(root, 0, 0, config);
      
      // Collect all nodes from this tree
      const treeNodes = collectTreeNodes(root);
      
      // Adjust positions to avoid overlapping with previous trees
      if (currentRootX > 0) {
        treeNodes.forEach(node => {
          if (node.x !== undefined) {
            node.x += currentRootX;
          }
        });
      }
      
      positionedNodes.push(...treeNodes);
      
      // Calculate the width of this tree for next tree positioning
      const treeWidth = getTreeWidth(treeNodes);
      currentRootX += treeWidth + config.subtreeSpacing;
    }
  });

  return positionedNodes;
}

function firstWalk(node: TreeNode, config: LayoutConfig): void {
  node.level = node.level || 0;
  
  if (node.children.length === 0) {
    // Leaf node
    if (node.level === 0) {
      node.prelim = 0;
    } else {
      // Find left sibling
      const parent = getParent(node);
      if (parent) {
        const siblings = parent.children;
        const nodeIndex = siblings.indexOf(node);
        if (nodeIndex > 0) {
          const leftSibling = siblings[nodeIndex - 1];
          node.prelim = (leftSibling.prelim || 0) + config.nodeWidth + config.siblingSpacing;
        } else {
          node.prelim = 0;
        }
      }
    }
  } else {
    // Internal node
    let defaultAncestor = node.children[0];
    
    // Process children first
    node.children.forEach((child, _index) => {
      child.level = (node.level || 0) + 1;
      firstWalk(child, config);
      defaultAncestor = apportion(child, defaultAncestor, config);
    });
    
    executeShifts(node);
    
    // Calculate midpoint of children
    const leftmostChild = node.children[0];
    const rightmostChild = node.children[node.children.length - 1];
    const midpoint = ((leftmostChild.prelim || 0) + (rightmostChild.prelim || 0)) / 2;
    
    // Find left sibling
    const parent = getParent(node);
    if (parent) {
      const siblings = parent.children;
      const nodeIndex = siblings.indexOf(node);
      if (nodeIndex > 0) {
        const leftSibling = siblings[nodeIndex - 1];
        node.prelim = (leftSibling.prelim || 0) + config.nodeWidth + config.siblingSpacing;
        node.mod = (node.prelim || 0) - midpoint;
      } else {
        node.prelim = midpoint;
      }
    } else {
      node.prelim = midpoint;
    }
  }
}

function secondWalk(node: TreeNode, m: number, depth: number, config: LayoutConfig): void {
  node.x = (node.prelim || 0) + m;
  node.y = depth * config.verticalSpacing;
  
  node.children.forEach(child => {
    secondWalk(child, m + (node.mod || 0), depth + 1, config);
  });
}

function apportion(node: TreeNode, defaultAncestor: TreeNode, config: LayoutConfig): TreeNode {
  const leftSibling = getLeftSibling(node);
  if (leftSibling) {
    let vInnerRight = node;
    let vOuterRight = node;
    let vInnerLeft = leftSibling;
    let vOuterLeft = getLeftmostSibling(vInnerRight) || vInnerRight;
    
    let sInnerRight = vInnerRight.mod || 0;
    let sOuterRight = vOuterRight.mod || 0;
    let sInnerLeft = vInnerLeft.mod || 0;
    let sOuterLeft = vOuterLeft.mod || 0;
    
    while (nextRight(vInnerLeft) && nextLeft(vInnerRight)) {
      vInnerLeft = nextRight(vInnerLeft)!;
      vInnerRight = nextLeft(vInnerRight)!;
      vOuterLeft = nextLeft(vOuterLeft)!;
      vOuterRight = nextRight(vOuterRight)!;
      
      setAncestor(vOuterRight, node);
      
      const shift = ((vInnerLeft.prelim || 0) + sInnerLeft) - 
                   ((vInnerRight.prelim || 0) + sInnerRight) + 
                   config.nodeWidth + config.siblingSpacing;
      
      if (shift > 0) {
        moveSubtree(getAncestor(vInnerLeft, node, defaultAncestor), node, shift);
        sInnerRight += shift;
        sOuterRight += shift;
      }
      
      sInnerLeft += vInnerLeft.mod || 0;
      sInnerRight += vInnerRight.mod || 0;
      sOuterLeft += vOuterLeft.mod || 0;
      sOuterRight += vOuterRight.mod || 0;
    }
    
    if (nextRight(vInnerLeft) && !nextRight(vOuterRight)) {
      setThread(vOuterRight, nextRight(vInnerLeft)!);
      vOuterRight.mod = (vOuterRight.mod || 0) + sInnerLeft - sOuterRight;
    }
    
    if (nextLeft(vInnerRight) && !nextLeft(vOuterLeft)) {
      setThread(vOuterLeft, nextLeft(vInnerRight)!);
      vOuterLeft.mod = (vOuterLeft.mod || 0) + sInnerRight - sOuterLeft;
      defaultAncestor = node;
    }
  }
  
  return defaultAncestor;
}

function executeShifts(node: TreeNode): void {
  let shift = 0;
  let change = 0;
  
  for (let i = node.children.length - 1; i >= 0; i--) {
    const child = node.children[i];
    child.prelim = (child.prelim || 0) + shift;
    child.mod = (child.mod || 0) + shift;
    change += child.change || 0;
    shift += (child.shift || 0) + change;
  }
}

function moveSubtree(wLeft: TreeNode, wRight: TreeNode, shift: number): void {
  const subtrees = getSubtreeCount(wRight) - getSubtreeCount(wLeft);
  wRight.change = (wRight.change || 0) - shift / subtrees;
  wRight.shift = (wRight.shift || 0) + shift;
  wLeft.change = (wLeft.change || 0) + shift / subtrees;
  wRight.prelim = (wRight.prelim || 0) + shift;
  wRight.mod = (wRight.mod || 0) + shift;
}

// Helper functions
function getParent(_node: TreeNode): TreeNode | null {
  // This would need to be implemented based on your tree structure
  // For now, returning null as we don't have parent references
  return null;
}

function getLeftSibling(_node: TreeNode): TreeNode | null {
  // Implementation depends on how you track siblings
  return null;
}

function getLeftmostSibling(_node: TreeNode): TreeNode | null {
  // Implementation depends on your sibling tracking
  return null;
}

function nextLeft(node: TreeNode): TreeNode | null {
  return node.children.length > 0 ? node.children[0] : node.thread || null;
}

function nextRight(node: TreeNode): TreeNode | null {
  return node.children.length > 0 ? 
    node.children[node.children.length - 1] : 
    node.thread || null;
}

function setAncestor(node: TreeNode, ancestor: TreeNode): void {
  node.ancestor = ancestor;
}

function getAncestor(node: TreeNode, _defaultNode: TreeNode, defaultAncestor: TreeNode): TreeNode {
  return node.ancestor || defaultAncestor;
}

function setThread(node: TreeNode, thread: TreeNode): void {
  node.thread = thread;
}

function getSubtreeCount(_node: TreeNode): number {
  // Simple implementation - you might want to cache this
  return 1;
}

function collectTreeNodes(root: TreeNode): TreeNode[] {
  const nodes: TreeNode[] = [root];
  root.children.forEach(child => {
    nodes.push(...collectTreeNodes(child));
  });
  return nodes;
}

function getTreeWidth(nodes: TreeNode[]): number {
  if (nodes.length === 0) return 0;
  
  const minX = Math.min(...nodes.map(n => n.x || 0));
  const maxX = Math.max(...nodes.map(n => (n.x || 0) + n.width));
  
  return maxX - minX;
}
