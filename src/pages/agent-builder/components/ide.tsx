import { useEffect, useState } from "react";
import WebIDE from "./WebIDE";
import { IAgent, Path } from "@/lib/types";
import { useAgentBuilder } from "../agent-builder.service";
import useStore from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import {
  deleteWorkflow,
  listWorkflows,
  updateWorkflow,
} from "@/services/workflowApiService";
import mixpanel from "mixpanel-browser";
import { isMixpanelActive } from "@/lib/constants";
import { useNavigate } from "react-router-dom";

const IDE = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isIdeOpen, setIsIdeOpen] = useState(true);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [agents, setAgents] = useState<IAgent[]>([]);

  const apiKey = useStore((state) => state.api_key);

  const {
    getAgents,
    deleteAgent,
    updateAgent,
    // isUpdatingAgent, // Commented out as it's unused
  } = useAgentBuilder({ apiKey });

  const handleRefresh = async () => {
    try {
      // Fetch agents
      const agentsRes = await getAgents();
      setAgents(agentsRes.data);

      // Make sure to fetch workflows on every refresh
      // const workflowData = await fetchWorkflows();
      // console.log("Workflows after refresh:", workflowData?.length || 0);

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("User refreshed web ide page");
    } catch (error) { }
  };

  const fetchWorkflows = async () => {
    try {
      // Loading workflows
      // Get the current API key that's being used
      const apiKey = useStore.getState().api_key;
      console.log(
        "Using API key for workflows (masked):",
        apiKey ? `${apiKey.substring(0, 4)}...` : "None",
      );

      const workflowList = await listWorkflows();
      console.log("Fetched workflows (count):", workflowList?.length || 0);
      console.log("Workflow data sample:", workflowList?.[0] || "No workflows");

      if (workflowList && Array.isArray(workflowList)) {
        setWorkflows(workflowList);
        return workflowList; // Return the workflow list for use by other functions
      } else {
        console.error("Workflow data is not in expected format:", workflowList);
        setWorkflows([]); // Set to empty array if data is invalid
        return [];
      }
    } catch (error) {
      console.error("Error fetching workflows:", error);
      toast({
        title: "Error",
        description: "Failed to load workflows",
        variant: "destructive",
      });
      return []; // Return empty array on error
    } finally {
      // Finished loading workflows
    }
  };

  useEffect(() => {
    handleRefresh();
  }, []);

  return (
    <div>
      <WebIDE
        isOpen={isIdeOpen}
        onClose={() => {
          setIsIdeOpen(false);
          navigate(Path.AGENT_BUILDER);
        }}
        agentData={null}
        allAgents={agents}
        allWorkflows={workflows}
        onSaveAgentData={async (updatedAgentData: any, agentId: string) => {
          try {
            // Check if this is a delete operation
            if (updatedAgentData._delete === true) {
              // Delete the agent
              await deleteAgent(agentId);
              toast({
                title: "Success",
                description: "Agent deleted successfully",
              });
            } else {
              // Regular update
              await updateAgent({
                agentId: agentId,
                endpoint: "/agents",
                values: updatedAgentData,
              });
              toast({
                title: "Success",
                description: "Agent updated successfully",
              });
            }
            handleRefresh();
          } catch (error) {
            console.error("Error updating agent:", error);
            toast({
              title: "Error",
              description: "Failed to update agent",
            });
          }
        }}
        onSaveWorkflowData={async (
          updatedWorkflowData: any,
          workflowId: string,
        ) => {
          try {
            // Check if this is a delete operation
            if (updatedWorkflowData._delete === true) {
              // Delete the workflow
              await deleteWorkflow(workflowId);
              toast({
                title: "Success",
                description: "Workflow deleted successfully",
              });
            } else {
              // Regular update
              await updateWorkflow(
                workflowId,
                updatedWorkflowData.flow_name,
                updatedWorkflowData,
              );
              toast({
                title: "Success",
                description: "Workflow updated successfully",
              });
            }
            // Refresh workflows after update
            await fetchWorkflows();
          } catch (error) {
            console.error("Error updating workflow:", error);
            toast({
              title: "Error",
              description: "Failed to update workflow",
            });
          }
        }}
      />
    </div>
  );
};

export default IDE;
