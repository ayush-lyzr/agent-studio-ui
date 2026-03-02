import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import CreateAgentForm from "./CreateAgentForm";
import useStore from "@/lib/store";
import axios from "@/lib/axios";

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAgentCreated?: (agent: any) => void;
}

export default function CreateAgentModal({ isOpen, onClose, onAgentCreated }: CreateAgentModalProps) {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const apiKey = useStore((state) => state.api_key);

  const handleSubmit = async (formData: any) => {
    setIsCreating(true);
    
    try {
      console.log("Creating agent with data:", formData);
      
      // Create the agent using v3/agents API like in agent-builder
      const agentData = {
        name: formData.name,
        description: formData.description || "",
        agent_role: formData.agent_role || "",
        agent_goal: formData.agent_goal || "",
        agent_instructions: formData.agent_instructions || "",
        features: formData.features || [],
        provider_id: formData.provider_id,
        model: formData.model,
        temperature: formData.temperature,
        top_p: formData.top_p,
        llm_credential_id: formData.llm_credential_id || "",
        examples: formData.examples || "",
        response_format: formData.response_format === "json_object" 
          ? { type: "json_object" } 
          : { type: "text" },
        template_type: "STANDARD", // Default template type
      };

      console.log("Sending agent data to API:", agentData);

      const response = await axios.post("/agents/", agentData, {
        headers: { "x-api-key": apiKey },
      });

      console.log("Agent created successfully:", response.data);
      console.log("Agent response structure:", JSON.stringify(response.data, null, 2));

      const agentId = response.data.agent_id || response.data._id || response.data.id;
      
      if (!agentId) {
        throw new Error("No agent ID returned from API");
      }

      console.log("Fetching full agent data for ID:", agentId);
      
      // Fetch the complete agent data using the returned ID
      const fullAgentResponse = await axios.get(`/agents/${agentId}`, {
        headers: { "x-api-key": apiKey },
      });

      console.log("Full agent data:", fullAgentResponse.data);
      const createdAgent = fullAgentResponse.data;

      // Add a small delay to ensure the agent is fully processed
      setTimeout(() => {
        // Call parent callback if provided - this will add the agent to the canvas
        if (onAgentCreated) {
          console.log("Calling onAgentCreated with full agent data...");
          onAgentCreated(createdAgent);
        }
      }, 100);

      toast({
        title: "Success!",
        description: `Agent "${createdAgent.name}" created successfully and added to canvas`,
      });
      
      onClose();
    } catch (error: any) {
      console.error("Failed to create agent:", error);
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to create agent. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Create New Agent
            {/* <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button> */}
          </DialogTitle>
        </DialogHeader>
        
        <CreateAgentForm
          onSubmit={handleSubmit}
          isLoading={isCreating}
        />
      </DialogContent>
    </Dialog>
  );
}