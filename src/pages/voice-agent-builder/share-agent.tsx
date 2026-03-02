import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";

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
import { useAgentBuilder } from "./agent-builder.service";
import useStore from "@/lib/store";
import { MultiSelect } from "@/components/ui/multi-select";
import { ITeamMember } from "@/lib/types";
import { useOrganization } from "../organization/org.service";
import { cn } from "@/lib/utils";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";

type IPolicy = { user_id: string; resource_id: string };

const ShareAgent: React.FC<{
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  agent_id: string;
  team: ITeamMember[];
  agentPolicies: IPolicy[];
}> = ({ open, onOpen, agent_id, team, agentPolicies }) => {
  const [emails, setEmails] = useState<string[]>([]);
  const [emailsCopy, setEmailsCopy] = useState<string[]>([]);

  const apiKey = useStore((state) => state.api_key);
  const token = useStore((state) => state.app_token);
  const { current_organization, current_user: currentUser } =
    useManageAdminStore((state) => state);
  const { shareResource, isSharingAgent, unShareResource, isUnSharingAgent } =
    useAgentBuilder({ apiKey, permission_type: "agent" });
  const { isFetchingCurrentOrgMembers } = useOrganization({
    token,
    current_organization,
  });

  const onInvite = async () => {
    try {
      const addedUsers = emails.filter(
        (email) => email && !emailsCopy.includes(email),
      );
      const removedUsers = emailsCopy.filter(
        (email) => email && !emails.includes(email),
      );
      if (removedUsers?.length > 0) {
        await unShareResource({
          email_ids: removedUsers,
          resource_id: agent_id,
          resource_type: "agent",
        });
      }
      if (addedUsers?.length > 0) {
        await shareResource({
          email_ids: emails,
          resource_id: agent_id,
          resource_type: "agent",
        });
      }
      onOpen(false);
    } catch (error) {}
  };

  useEffect(() => {
    const res = team
      ?.filter((member: ITeamMember) =>
        agentPolicies
          ?.map((p: IPolicy) => p?.user_id)
          .includes(member?.user_id),
      )
      ?.map((member: ITeamMember) => member?.email);
    setEmails(res);
    setEmailsCopy(res);

    return () => {
      setEmails([]);
    };
  }, [agent_id]);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Agent</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="space-y-4">
          <Alert className="bg-secondary">
            <TriangleAlert className="size-4" />
            <AlertTitle />
            <AlertDescription>
              Sharing agents gives users edit access.
            </AlertDescription>
          </Alert>
          <div key={emails?.[0]}>
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
            onClick={onInvite}
            loading={isSharingAgent || isUnSharingAgent}
          >
            {emailsCopy?.length > 0 ? "Update" : "Invite"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareAgent;
