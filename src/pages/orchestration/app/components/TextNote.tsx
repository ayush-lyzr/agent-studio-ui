import React, { useState, useCallback, useRef, useEffect } from 'react';
import { NodeProps, NodeResizer } from '@xyflow/react';
import { Edit2, X, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

export interface TextNoteData extends Record<string, unknown> {
  id: string;
  text: string;
  color: string;
  width: number;
  height: number;
}

interface TextNoteProps extends NodeProps {
  data: TextNoteData;
  onUpdateNote: (noteId: string, updates: Partial<TextNoteData>) => void;
  onDeleteNote: (noteId: string) => void;
  selected: boolean;
  isPublicView?: boolean;
  canEdit?: boolean;
}

const NOTE_COLORS = [
  { name: 'Yellow', value: '#fbbf24' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Purple', value: '#8b5cf6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Orange', value: '#f59e0b' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Gray', value: '#6b7280' },
];

const TextNote: React.FC<TextNoteProps> = ({
  id,
  data,
  selected = false,
  onUpdateNote,
  onDeleteNote,
  isPublicView: _isPublicView = false,
  canEdit: _canEdit = true,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempText, setTempText] = useState(data.text);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleTextEdit = useCallback(() => {
    setIsEditing(true);
    setTempText(data.text);
  }, [data.text]);

  const handleTextSave = useCallback(() => {
    if (tempText !== data.text) {
      onUpdateNote(id, { text: tempText });
    }
    setIsEditing(false);
  }, [id, tempText, data.text, onUpdateNote]);

  const handleTextCancel = useCallback(() => {
    setTempText(data.text);
    setIsEditing(false);
  }, [data.text]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleTextCancel();
    }
    // Note: Don't save on Enter for textarea, let users add line breaks
  }, [handleTextCancel]);

  const handleColorChange = useCallback((color: string) => {
    onUpdateNote(id, { color });
    setShowColorPicker(false);
  }, [id, onUpdateNote]);

  const handleDelete = useCallback(() => {
    onDeleteNote(id);
  }, [id, onDeleteNote]);

  return (
    <div
      className="text-note"
      style={{
        width: data.width,
        height: data.height,
        background: `${data.color}20`, // 20% opacity background
        border: `2px solid ${data.color}80`, // 80% opacity border
        borderRadius: '8px',
        position: 'relative',
        padding: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
      onClick={(_e) => {
        // Don't prevent ReactFlow from handling the click
        console.log('Note clicked, selected:', selected, 'id:', id);
      }}
    >
      {/* NodeResizer for resize handles */}
      <NodeResizer
        isVisible={selected}
        minWidth={150}
        minHeight={100}
        handleStyle={{ 
          backgroundColor: data.color,
          border: '2px solid white',
          borderRadius: '3px',
          width: '8px',
          height: '8px'
        }}
        onResize={(_event, params) => {
          onUpdateNote(id, {
            width: params.width,
            height: params.height,
          });
        }}
      />

      {/* Control buttons - only show when selected */}
      {selected && (
        <div className="absolute -top-2 -right-2 flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-50"
            onClick={(e) => {
              e.stopPropagation();
              handleTextEdit();
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          
          <Popover open={showColorPicker} onOpenChange={setShowColorPicker}>
            <PopoverTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-gray-50"
                onClick={(e) => e.stopPropagation()}
              >
                <Palette className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-2">
              <div className="grid grid-cols-4 gap-2">
                {NOTE_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className="w-8 h-8 rounded border-2 hover:scale-110 transition-transform"
                    style={{ 
                      backgroundColor: color.value,
                      borderColor: data.color === color.value ? '#000' : '#e5e7eb'
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
            className="h-6 w-6 p-0 bg-white shadow-sm hover:bg-red-50 text-red-500 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Note content */}
      <div className="h-full w-full overflow-hidden">
        {isEditing ? (
          <Textarea
            ref={textareaRef}
            value={tempText}
            onChange={(e) => setTempText(e.target.value)}
            onBlur={handleTextSave}
            onKeyDown={handleKeyPress}
            className="h-full w-full resize-none border-none bg-transparent p-0 text-sm focus:ring-0 focus:outline-none"
            placeholder="Write your note here..."
            style={{ 
              color: data.color === '#fbbf24' ? '#92400e' : '#374151',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          <div
            className="h-full w-full cursor-text text-sm whitespace-pre-wrap"
            style={{ 
              color: data.color === '#fbbf24' ? '#92400e' : '#374151',
            }}
            onClick={handleTextEdit}
          >
            {data.text || 'Click to add note...'}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextNote;