import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface AddPersonaDialogProps {
  isOpen: boolean;
  onClose: () => void;
  persona: { name: string; description: string };
  onPersonaChange: (persona: { name: string; description: string }) => void;
  onAdd: () => void;
  isCreating: boolean;
}

export const AddPersonaDialog: React.FC<AddPersonaDialogProps> = ({
  isOpen,
  onClose,
  persona,
  onPersonaChange,
  onAdd,
  isCreating
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Persona</DialogTitle>
          <DialogDescription>
            Create a new user persona for testing scenarios.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="persona-name">Name</Label>
            <Input
              id="persona-name"
              value={persona.name}
              onChange={(e) => onPersonaChange({ ...persona, name: e.target.value })}
              placeholder="e.g., New User"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="persona-description">Description</Label>
            <Textarea
              id="persona-description"
              value={persona.description}
              onChange={(e) => onPersonaChange({ ...persona, description: e.target.value })}
              placeholder="Describe this user type..."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={onAdd} 
            disabled={!persona.name || !persona.description || isCreating}
          >
            {isCreating ? "Adding..." : "Add Persona"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};