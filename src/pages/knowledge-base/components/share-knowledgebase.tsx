import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { TriangleAlert } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { buttonVariants } from "@/components/custom/button";
import { Button } from "@/components/ui/button";
import {
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import useStore from "@/lib/store";
import { MultiSelect } from "@/components/ui/multi-select";
import { IAgentPolicy, ITeamMember, MemberstackCurrentUser } from "@/lib/types";
import { useOrganization } from "@/pages/organization/org.service";
import { cn } from "@/lib/utils";
import { useAgentBuilder } from "@/pages/agent-builder/agent-builder.service";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

const ShareKnowledgeBase: React.FC<{
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  resource_id: string;
  agentPolicies: IAgentPolicy[];
  team: ITeamMember[];
  currentUser: Partial<MemberstackCurrentUser>;
}> = ({ open, onOpen, resource_id, team = [], agentPolicies, currentUser }) => {
  const { getToken } = useAuth();
  const [emails, setEmails] = useState<string[]>([]);
  const [emailsCopy, setEmailsCopy] = useState<string[]>([]);

  const apiKey = useStore((state) => state.api_key);
  const { current_organization } = useManageAdminStore((state) => state);
  const {
    shareResource,
    isSharingAgent,
    unShareResource,
    isUnSharingAgent,
    isFetchingAgentPolicies,
  } = useAgentBuilder({ apiKey, permission_type: "knowledge_base" });
  const { isFetchingCurrentOrgMembers } = useOrganization({
    token: getToken() ?? "",
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
          resource_id,
          resource_type: "knowledge_base",
        });
      }
      if (addedUsers?.length > 0) {
        await shareResource({
          email_ids: emails,
          resource_id,
          resource_type: "knowledge_base",
        });
      }
      onOpen(false);
    } catch (error) {}
  };

  const fetchData = async () => {
    try {
      const teamMap: { [key: string]: ITeamMember } = {};
      team.forEach((member) => {
        if (member?.user_id) teamMap[member?.user_id] = member;
      });
      const res = agentPolicies
        ?.filter((policy) => policy.resource_id === resource_id)
        .map((policy) => teamMap[policy?.user_id]?.email);

      setEmails(res);
      setEmailsCopy(res);
    } catch (error) {}
  };

  useEffect(() => {
    fetchData();
    return () => {
      setEmails([]);
    };
  }, [resource_id, team?.length]);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogTrigger></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Knowledge Base</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="space-y-4">
          <Alert className="bg-secondary">
            <TriangleAlert className="size-4" />
            <AlertTitle />
            <AlertDescription>
              Sharing knowledge base gives users edit access.
            </AlertDescription>
          </Alert>

          <div key={emails?.[0]?.length}>
            <MultiSelect
              value={emails}
              defaultValue={emails}
              modalPopover
              options={team?.map((member) => ({
                label: member?.name ?? member?.email,
                value: member?.email,
                disabled: member?.email === currentUser?.auth?.email,
              }))}
              placeholder={
                isFetchingAgentPolicies || isFetchingCurrentOrgMembers
                  ? "Loading ..."
                  : "Select people"
              }
              disabled={isFetchingCurrentOrgMembers || isFetchingAgentPolicies}
              className={cn(
                (isFetchingAgentPolicies || isFetchingCurrentOrgMembers) &&
                  "shimmer",
              )}
              onValueChange={(value) => {
                setEmails(value);
              }}
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

export default ShareKnowledgeBase;
