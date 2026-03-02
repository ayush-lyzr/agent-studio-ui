import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { buttonVariants } from "@/components/custom/button";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { MultiSelect } from "@/components/ui/multi-select";
import { ITeamMember } from "@/lib/types";
import { useOrganization } from "../../organization/org.service";
import { cn } from "@/lib/utils";
import { useManageAdminStore } from "../../manage-admin/manage-admin.store";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { shareWorkflow, unShareWorkflow } from "@/services/workflowApiService";
import { toast } from "sonner";

type IPolicy = { user_id: string; resource_id: string };

const ShareWorkflow: React.FC<{
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  workflow_id: string;
  team: ITeamMember[];
  workflowPolicies: IPolicy[];
  onShareComplete?: () => void;
}> = ({ open, onOpen, workflow_id, team, workflowPolicies, onShareComplete }) => {
  const { getToken } = useAuth();
  const { currentUser } = useCurrentUser();
  const [emails, setEmails] = useState<string[]>([]);
  const [emailsCopy, setEmailsCopy] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  const { current_organization } = useManageAdminStore((state) => state);
  const { isFetchingCurrentOrgMembers } = useOrganization({
    token: getToken() ?? "",
    current_organization,
  });

  const onShare = async () => {
    try {
      setIsSharing(true);
      const addedUsers = emails.filter(
        (email) => email && !emailsCopy.includes(email),
      );
      const removedUsers = emailsCopy.filter(
        (email) => email && !emails.includes(email),
      );
      
      if (removedUsers?.length > 0) {
        await unShareWorkflow(
          workflow_id,
          removedUsers,
          current_organization?.org_id || "",
          getToken() || "",
          current_organization?.admin_user_id || ""
        );
      }
      
      if (addedUsers?.length > 0) {
        await shareWorkflow(
          workflow_id,
          emails,
          current_organization?.org_id || "",
          getToken() || ""
        );
      }
      
      if (addedUsers?.length > 0 || removedUsers?.length > 0) {
        toast.success("Workflow sharing updated successfully!");
      }
      
      // Notify parent component about the sharing completion
      onShareComplete?.();
      onOpen(false);
    } catch (error) {
      toast.error("Failed to update workflow sharing");
      console.error("Error updating workflow sharing:", error);
    } finally {
      setIsSharing(false);
    }
  };

  useEffect(() => {
    // Only process when we have both team and workflowPolicies data
    if (team && workflowPolicies && open) {
      const res = team
        ?.filter((member: ITeamMember) =>
          workflowPolicies
            ?.map((p: IPolicy) => p?.user_id)
            .includes(member?.user_id),
        )
        ?.map((member: ITeamMember) => member?.email);
      
      console.log('ShareWorkflow: Setting emails from policies', { 
        workflow_id, 
        teamCount: team?.length, 
        policiesCount: workflowPolicies?.length, 
        resultEmails: res 
      });
      
      setEmails(res || []);
      setEmailsCopy(res || []);
    }

    return () => {
      if (!open) {
        setEmails([]);
        setEmailsCopy([]);
      }
    };
  }, [workflow_id, team, workflowPolicies, open]);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Workflow</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="space-y-4">
          <Alert className="bg-neutral-100">
            <TriangleAlert className="size-4" />
            <AlertTitle />
            <AlertDescription>
              Sharing workflows gives users access to view and use the workflow.
            </AlertDescription>
          </Alert>
          <div key={`${workflow_id}-${emails?.join(',')}`}>
            <MultiSelect
              modalPopover
              value={emails}
              defaultValue={emails}
              options={team?.map((member) => ({
                label: member?.name ?? member?.email,
                value: member?.email,
                disabled: member?.email === currentUser?.auth?.email,
              }))}
              placeholder="Select people"
              disabled={isFetchingCurrentOrgMembers}
              className={cn(isFetchingCurrentOrgMembers && "shimmer")}
              onValueChange={(value) => setEmails(value)}
            />
          </div>
        </div>
        <Separator />
        <DialogFooter>
          <DialogClose className={buttonVariants({ variant: "secondary" })}>
            Cancel
          </DialogClose>
          <Button
            onClick={onShare}
            loading={isSharing}
          >
            {workflowPolicies?.length > 0 ? "Update" : "Share"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareWorkflow;