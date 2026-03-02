// DeleteGroupDialog.tsx
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Group, deleteGroup } from "@/services/groupsApiService";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import useStore from "@/lib/store";

interface DeleteGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSuccess?: () => void;
}

export function DeleteGroupDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: DeleteGroupDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const token = useStore((state) => state.app_token);
  const { current_organization } = useManageAdminStore();

  const handleDelete = async () => {
    if (!group) return;
    const orgId = current_organization?._id;
    if (!orgId) {
      toast.error("Organization not found");
      return;
    }

    try {
      setIsDeleting(true);
      await deleteGroup(group.group_name, group.group_type, orgId, token);
      toast.success("Folder deleted successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to delete folder:", error);
      toast.error("Failed to delete folder");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Folder</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          Are you sure you want to delete the folder
          <strong> "{group?.group_name}"</strong>? This action cannot be undone.
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
