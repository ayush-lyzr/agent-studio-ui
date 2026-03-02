import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createGroup } from "@/services/groupsApiService";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import useStore from "@/lib/store";

interface CreateGroupDialogProps {
  open: boolean;
  group_type: string;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateGroupDialog({
  open,
  group_type,
  onOpenChange,
  onSuccess,
}: CreateGroupDialogProps) {
  const [groupName, setGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const token = useStore((state) => state.app_token);
  const { current_organization } = useManageAdminStore();

  const handleCreate = async () => {
    if (!groupName.trim()) {
      toast.error("Group name is required");
      return;
    }

    const orgId = current_organization?._id;
    if (!orgId) {
      toast.error("Organization not found");
      return;
    }

    try {
      setIsCreating(true);
      await createGroup(
        {
          group_name: groupName.trim(),
          group_type: group_type,
          organization_id: orgId,
        },
        token,
      );

      toast.success("Group created successfully");
      setGroupName("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to create group:", error);
      toast.error("Failed to create group");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogDescription>
            Create a folder to organize your agents
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="group-name">Folder Name</Label>
            <Input
              id="group-name"
              placeholder="Enter folder name"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setGroupName("");
              onOpenChange(false);
            }}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || !groupName.trim()}
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            {isCreating ? "Creating..." : "Create Folder"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
