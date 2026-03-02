
import React, { useState } from 'react';
import { X, Edit, Trash2 } from 'lucide-react';
import { Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface EdgeEditPanelProps {
  edge: Edge;
  onClose: () => void;
  onUpdate: (edgeId: string, description: string) => void;
  onDelete?: (edgeId: string) => void;
}

const EdgeEditPanel: React.FC<EdgeEditPanelProps> = ({
  edge,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [description, setDescription] = useState(
    (edge.data?.usageDescription as string) || (typeof edge.label === 'string' ? edge.label : '') || ''
  );

  const handleSave = () => {
    onUpdate(edge.id, description);
    onClose();
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(edge.id);
      onClose();
    }
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-card border border-border rounded-lg shadow-xl z-50">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <Edit className="w-4 h-4 text-primary" />
          <h3 className="font-medium text-foreground">Edit Connection</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <Label htmlFor="description" className="text-sm text-foreground">
            Usage Description
          </Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe how this connection is used..."
            className="mt-1 bg-secondary border-border text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">
            This description will be sent to the parent agent to understand how to use the connected agent.
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex space-x-2">
            <Button onClick={handleSave} className="flex-1 bg-primary hover:bg-primary/90">
              Save Changes
            </Button>
            <Button variant="outline" onClick={onClose} className="border-border">
              Cancel
            </Button>
          </div>
          
          {onDelete && (
            <Button 
              onClick={handleDelete} 
              variant="destructive" 
              className="w-full flex items-center justify-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Connection</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EdgeEditPanel;
