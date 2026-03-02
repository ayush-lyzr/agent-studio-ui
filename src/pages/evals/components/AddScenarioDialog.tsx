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

interface AddScenarioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  scenario: { name: string; description: string };
  onScenarioChange: (scenario: { name: string; description: string }) => void;
  onAdd: () => void;
  isCreating: boolean;
}

export const AddScenarioDialog: React.FC<AddScenarioDialogProps> = ({
  isOpen,
  onClose,
  scenario,
  onScenarioChange,
  onAdd,
  isCreating
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Custom Scenario</DialogTitle>
          <DialogDescription>
            Create a new scenario for your agent to be tested in.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="scenario-name">Name</Label>
            <Input
              id="scenario-name"
              value={scenario.name}
              onChange={(e) => onScenarioChange({ ...scenario, name: e.target.value })}
              placeholder="e.g., Customer Support"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="scenario-description">Description</Label>
            <Textarea
              id="scenario-description"
              value={scenario.description}
              onChange={(e) => onScenarioChange({ ...scenario, description: e.target.value })}
              placeholder="Describe what this scenario involves..."
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
            disabled={!scenario.name || !scenario.description || isCreating}
          >
            {isCreating ? "Adding..." : "Add Scenario"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};