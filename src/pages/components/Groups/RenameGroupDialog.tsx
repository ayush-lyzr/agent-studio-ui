import { useState, useEffect } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { renameGroup, Group } from "@/services/groupsApiService";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import useStore from "@/lib/store";

interface RenameGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: Group | null;
  onSuccess?: () => void;
}

export function RenameGroupDialog({
  open,
  onOpenChange,
  group,
  onSuccess,
}: RenameGroupDialogProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);

  const token = useStore((state) => state.app_token);
  const { current_organization } = useManageAdminStore();

  useEffect(() => {
    if (open && group) {
      setNewGroupName(group.group_name);
    }
  }, [open, group]);

  const handleRename = async () => {
    if (!newGroupName.trim() || !group) {
      toast.error("Group name is required");
      return;
    }

    if (newGroupName.trim() === group.group_name) {
      toast.error("New name must be different from the current name");
      return;
    }

    const orgId = current_organization?._id;
    if (!orgId) {
      toast.error("Organization not found");
      return;
    }

    try {
      setIsRenaming(true);
      await renameGroup(
        group.group_name,
        group.group_type,
        orgId,
        { new_group_name: newGroupName.trim() },
        token,
      );

      toast.success("Group renamed successfully");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to rename group:", error);
      toast.error("Failed to rename group");
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Folder</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newGroupName">New Folder Name</Label>
            <Input
              id="newGroupName"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="Enter new folder name"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isRenaming) {
                  handleRename();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isRenaming}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRename}
            disabled={isRenaming || !newGroupName.trim()}
          >
            {isRenaming ? "Renaming..." : "Rename"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
