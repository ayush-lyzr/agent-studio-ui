import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Edit2, X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface GroupData extends Record<string, unknown> {
  id: string;
  title: string;
  color: string;
  nodeIds: string[];
  width: number;
  height: number;
}

interface GroupLayerProps extends NodeProps {
  data: GroupData;
  onUpdateGroup: (groupId: string, updates: Partial<GroupData>) => void;
  onDeleteGroup: (groupId: string) => void;
}

const GROUP_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Indigo', value: '#6366f1' },
];

const GroupLayer: React.FC<GroupLayerProps> = ({
  id,
  data,
  selected = false, // Default to false since we disabled ReactFlow selection
  onUpdateGroup,
  onDeleteGroup,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempTitle, setTempTitle] = useState((data as GroupData).title);
  const [showColorPicker, setShowColorPicker] = useState(false);
  // const [isResizing, setIsResizing] = useState(false);
  // const [resizeStart, setResizeStart] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleTitleEdit = useCallback(() => {
    setIsEditing(true);
    setTempTitle((data as GroupData).title);
  }, [(data as GroupData).title]);

  const handleTitleSave = useCallback(() => {
    if (tempTitle.trim() && tempTitle !== (data as GroupData).title) {
      onUpdateGroup(id, { title: tempTitle.trim() });
    }
    setIsEditing(false);
  }, [id, tempTitle, (data as GroupData).title, onUpdateGroup]);

  const handleTitleCancel = useCallback(() => {
    setTempTitle((data as GroupData).title);
    setIsEditing(false);
  }, [(data as GroupData).title]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleSave();
    } else if (e.key === 'Escape') {
      handleTitleCancel();
    }
  }, [handleTitleSave, handleTitleCancel]);

  const handleColorChange = useCallback((color: string) => {
    onUpdateGroup(id, { color });
    setShowColorPicker(false);
  }, [id, onUpdateGroup]);

  const handleDelete = useCallback(() => {
    onDeleteGroup(id);
  }, [id, onDeleteGroup]);

  // const handleResizeStart = useCallback((e: React.MouseEvent, corner: string) => {
  //   e.stopPropagation();
  //   setIsResizing(true);
    
  //   // Use local variable instead of state to avoid closure issues
  //   const startData = {
  //     x: e.clientX,
  //     y: e.clientY,
  //     width: (data as GroupData).width,
  //     height: (data as GroupData).height
  //   };
    
  //   setResizeStart(startData);

  //   const handleMouseMove = (moveEvent: MouseEvent) => {
  //     const deltaX = moveEvent.clientX - startData.x;
  //     const deltaY = moveEvent.clientY - startData.y;
      
  //     let newWidth = startData.width;
  //     let newHeight = startData.height;
      
  //     if (corner.includes('e')) newWidth = Math.max(200, startData.width + deltaX);
  //     if (corner.includes('w')) newWidth = Math.max(200, startData.width - deltaX);
  //     if (corner.includes('s')) newHeight = Math.max(150, startData.height + deltaY);
  //     if (corner.includes('n')) newHeight = Math.max(150, startData.height - deltaY);
      
  //     console.log('Resizing:', { newWidth, newHeight, corner, deltaX, deltaY });
  //     onUpdateGroup(id, { width: newWidth, height: newHeight });
  //   };

  //   const handleMouseUp = () => {
  //     console.log('Resize ended');
  //     setIsResizing(false);
  //     setResizeStart(null);
  //     document.removeEventListener('mousemove', handleMouseMove);
  //     document.removeEventListener('mouseup', handleMouseUp);
  //   };

  //   document.addEventListener('mousemove', handleMouseMove);
  //   document.addEventListener('mouseup', handleMouseUp);
  // }, [id, onUpdateGroup, (data as GroupData).width, (data as GroupData).height]);

  return (
    <div
      className="group-layer"
      style={{
        width: (data as GroupData).width,
        height: (data as GroupData).height,
        background: `${(data as GroupData).color}15`, // 15% opacity
        border: `2px dashed ${(data as GroupData).color}60`, // 60% opacity for border
        borderRadius: '12px',
        position: 'relative',
        padding: '8px',
      }}
      onClick={(_e) => {
        // DON'T stopPropagation - let ReactFlow handle the click
        console.log('Group clicked, selected:', selected, 'id:', id);
      }}
    >
      {/* Use ReactFlow's built-in NodeResizer - only show when selected */}
      <NodeResizer
        isVisible={!!selected}
        minWidth={200}
        minHeight={150}
        handleStyle={{ 
          backgroundColor: '#3b82f6',
          border: '2px solid white',
          borderRadius: '50%',
          width: '12px',
          height: '12px'
        }}
        lineStyle={{
          borderColor: '#3b82f6',
          borderWidth: '2px'
        }}
        onResize={(_event, params) => {
          console.log('ReactFlow resize:', params);
          onUpdateGroup(id, {
            width: params.width,
            height: params.height,
          });
        }}
      />
      {/* Group Header */}
      <div className="absolute -top-8 left-0 right-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isEditing ? (
            <Input
              ref={inputRef}
              value={tempTitle}
              onChange={(e) => setTempTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={handleKeyPress}
              className="h-6 px-2 text-sm font-medium"
              style={{ color: (data as GroupData).color, minWidth: '120px' }}
            />
          ) : (
            <span
              className="text-sm font-medium cursor-pointer hover:opacity-80 px-2 py-1 rounded"
              style={{ 
                color: (data as GroupData).color,
                backgroundColor: `${(data as GroupData).color}10`
              }}
              onClick={handleTitleEdit}
            >
              {data.title}
            </span>
          )}
        </div>

        {selected && (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={handleTitleEdit}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
            
            <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                >
                  <Palette className="h-3 w-3" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-2">
                <div className="grid grid-cols-4 gap-2">
                  {GROUP_COLORS.map((color) => (
                    <button
                      key={color.value}
                      className="w-8 h-8 rounded-full border-2 border-gray-200 hover:scale-110 transition-transform"
                      style={{ 
                        backgroundColor: color.value,
                        borderColor: (data as GroupData).color === color.value ? color.value : '#e5e7eb'
                      }}
                      onClick={() => handleColorChange(color.value)}
                      title={color.name}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              onClick={handleDelete}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupLayer;