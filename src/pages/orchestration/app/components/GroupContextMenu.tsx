import React from 'react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { 
  Group, 
  Ungroup, 
  Edit2, 
  Palette, 
  Trash2, 
  MoreVertical 
} from 'lucide-react';

interface GroupContextMenuProps {
  selectedNodes: string[];
  onCreateGroup: () => void;
  onEditGroup?: () => void;
  onChangeGroupColor?: () => void;
  onDeleteGroup?: () => void;
  onUngroupNodes?: () => void;
  hasGrouped?: boolean;
  className?: string;
}

const GroupContextMenu: React.FC<GroupContextMenuProps> = ({
  selectedNodes,
  onCreateGroup,
  onEditGroup,
  onChangeGroupColor,
  onDeleteGroup,
  onUngroupNodes,
  hasGrouped = false,
  className,
}) => {
  const canCreateGroup = selectedNodes.length >= 2;
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={className}
        >
          <MoreVertical className="h-4 w-4" />
          <span className="sr-only">Group actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {canCreateGroup && !hasGrouped && (
          <>
            <DropdownMenuItem onClick={onCreateGroup}>
              <Group className="mr-2 h-4 w-4" />
              Create Group
            </DropdownMenuItem>
            <DropdownMenuSeparator />
          </>
        )}
        
        {hasGrouped && (
          <>
            {onEditGroup && (
              <DropdownMenuItem onClick={onEditGroup}>
                <Edit2 className="mr-2 h-4 w-4" />
                Edit Group
              </DropdownMenuItem>
            )}
            
            {onChangeGroupColor && (
              <DropdownMenuItem onClick={onChangeGroupColor}>
                <Palette className="mr-2 h-4 w-4" />
                Change Color
              </DropdownMenuItem>
            )}
            
            {onUngroupNodes && (
              <DropdownMenuItem onClick={onUngroupNodes}>
                <Ungroup className="mr-2 h-4 w-4" />
                Ungroup Nodes
              </DropdownMenuItem>
            )}
            
            <DropdownMenuSeparator />
            
            {onDeleteGroup && (
              <DropdownMenuItem 
                onClick={onDeleteGroup}
                className="text-red-600 focus:text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Group
              </DropdownMenuItem>
            )}
          </>
        )}
        
        {!canCreateGroup && !hasGrouped && (
          <DropdownMenuItem disabled>
            <Group className="mr-2 h-4 w-4 opacity-50" />
            Select 2+ nodes to group
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default GroupContextMenu;