import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { deleteWorkflow } from "@/services/workflowApiService";

type DeleteWorkflowProps = {
  id: string;
  open: boolean;
  onOpen: (open: boolean) => void;
  onDelete: () => void;
};

export const DeleteWorkflow: React.FC<DeleteWorkflowProps> = ({
  open,
  onOpen,
  id,
  onDelete,
}) => {
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const handleDelete = async () => {
    if (id) {
      setIsDeleting(true);
      try {
        await deleteWorkflow(id);
        toast({
          title: "Workflow deleted successfully",
        });

        onDelete();
      } catch (error) {
        toast({
          title: "Error deleting workflow",
        });
        console.error("Error deleting workflow:", error);
      }
      setIsDeleting(false);
    }
  };
  return (
    <AlertDialog open={open} onOpenChange={onOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this workflow? This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive"
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
