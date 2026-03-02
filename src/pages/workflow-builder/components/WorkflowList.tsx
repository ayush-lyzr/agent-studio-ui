import React, { useState, useEffect } from "react";
import { listWorkflows, deleteWorkflow } from "@/services/workflowApiService";
import { WorkflowResponse } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2, Play } from "lucide-react";

interface WorkflowListProps {
  onSelectWorkflow: (workflow: WorkflowResponse) => void;
  onRunWorkflow: (flowId: string) => void;
}

export const WorkflowList: React.FC<WorkflowListProps> = ({
  onSelectWorkflow,
  onRunWorkflow,
}) => {
  const [workflows, setWorkflows] = useState<WorkflowResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [open, setOpen] = useState<boolean>(false);

  const fetchWorkflows = async () => {
    setLoading(true);
    try {
      const data = await listWorkflows();
      setWorkflows(data);
    } catch (error) {
      toast.error("Failed to load workflows");
      console.error("Error loading workflows:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchWorkflows();
    }
  }, [open]);

  const handleDelete = async (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this workflow?")) {
      try {
        await deleteWorkflow(flowId);
        toast.success("Workflow deleted successfully");
        fetchWorkflows(); // Refresh the list
      } catch (error) {
        toast.error("Failed to delete workflow");
        console.error("Error deleting workflow:", error);
      }
    }
  };

  const handleEdit = (workflow: WorkflowResponse) => {
    onSelectWorkflow(workflow);
    setOpen(false);
  };

  const handleRun = (flowId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onRunWorkflow(flowId);
    setOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        My Workflows
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>My Workflows</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading workflows...</span>
            </div>
          ) : workflows.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No workflows found. Create and save a workflow to see it here.
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="p-2 text-left">Name</th>
                    <th className="p-2 text-left">Created</th>
                    <th className="p-2 text-left">Updated</th>
                    <th className="p-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((workflow) => (
                    <tr
                      key={workflow.flow_id}
                      className="cursor-pointer border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                      onClick={() => handleEdit(workflow)}
                    >
                      <td className="p-2">{workflow.flow_name}</td>
                      <td className="p-2 text-sm">
                        {formatDate(workflow.created_at)}
                      </td>
                      <td className="p-2 text-sm">
                        {formatDate(workflow.updated_at)}
                      </td>
                      <td className="p-2 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleRun(workflow.flow_id, e)}
                          title="Run workflow"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={(e) => handleDelete(workflow.flow_id, e)}
                          title="Delete workflow"
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-4 flex justify-end">
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default WorkflowList;
