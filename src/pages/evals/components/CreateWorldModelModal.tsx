import React, { useState } from "react";
import { Agent } from "../../agent-eval/types/agent";
import { CreateWorldModelRequest } from "../types/worldModel";
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
import { Loader2, Globe } from "lucide-react";

interface CreateWorldModelModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAgent: Agent | null;
  onCreateWorldModel: (request: CreateWorldModelRequest) => Promise<void>;
  isCreating?: boolean;
}

export const CreateWorldModelModal: React.FC<CreateWorldModelModalProps> = ({
  isOpen,
  onClose,
  selectedAgent,
  onCreateWorldModel,
  isCreating = false,
}) => {
  const [modelName, setModelName] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAgent || !modelName.trim()) {
      return;
    }

    try {
      await onCreateWorldModel({
        source_agent_id: selectedAgent._id,
        name: modelName.trim(),
      });
      
      // Reset form and close modal
      setModelName("");
      onClose();
    } catch (error) {
      console.error("Failed to create environment:", error);
    }
  };

  const handleClose = () => {
    setModelName("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="size-5 text-purple-600" />
            <span>Create Environment</span>
          </DialogTitle>
          <DialogDescription>
            Create a new Environment for {selectedAgent?.name}. This will clone the agent and set up a testing environment.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Enter environment name"
                className="col-span-3"
                disabled={isCreating}
                required
              />
            </div>
            
            {selectedAgent && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-sm text-gray-500">
                  Agent
                </Label>
                <div className="col-span-3 text-sm text-gray-700">
                  {selectedAgent.name}
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isCreating || !modelName.trim()}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Environment'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};