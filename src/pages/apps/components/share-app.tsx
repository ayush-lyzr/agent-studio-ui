import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  Check,
  Clipboard,
  ClipboardCheck,
  Link,
  TriangleAlert,
  Users2,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";
import { MultiSelect } from "@/components/ui/multi-select";
import { CurrentUserProps, ITeamMember } from "@/lib/types";
import { cn, isOrgMode } from "@/lib/utils";
import { useAgentBuilder } from "@/pages/agent-builder/agent-builder.service";
import { useOrganization } from "@/pages/organization/org.service";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { PlanType } from "@/lib/constants";

type IPolicy = { user_id: string; resource_id: string };

const ShareApp: React.FC<
  {
    open: boolean;
    onOpen: Dispatch<SetStateAction<boolean>>;
    agent_id: string;
  } & Partial<CurrentUserProps>
> = ({ open, onOpen, agent_id }) => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState<boolean>(false);
  const [emails, setEmails] = useState<string[]>([]);
  const [team, setTeam] = useState<ITeamMember[]>([]);
  const [agentPolicies, setAgentPolicies] = useState<IPolicy[]>([]);

  const apiKey = useStore((state) => state.api_key);
  const { usage_data, current_organization } = useManageAdminStore(
    (state) => state,
  );
  const {
    shareResource,
    isSharingAgent,
    getAgentPolicy,
    isFetchingAgentPolicies,
  } = useAgentBuilder({ apiKey, permission_type: "app" });
  const { getCurrentOrgMembers, isFetchingCurrentOrgMembers } = useOrganization(
    { token: getToken() ?? "", current_organization },
  );

  const onCopy = () => {
    navigator.clipboard.writeText(
      `${window.location.origin}/agent/${agent_id}`,
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const onInvite = async () => {
    try {
      if (isOrgMode(usage_data?.plan_name)) {
        const res = await shareResource({
          email_ids: emails,
          resource_id: agent_id,
          resource_type: "app",
        });
        if (res.data) {
          toast({
            title: "Success",
            description: `Invitation is sent!`,
          });
        }
      } else {
        onCopy();
      }
    } catch (error) {}
  };

  const fetchData = async () => {
    try {
      const res = await getCurrentOrgMembers();
      setTeam(res.data);
      const userMap: { [key: string]: string } = {};
      res.data?.map((member: ITeamMember) => {
        if (member?.user_id) userMap[member?.user_id] = member?.email;
      });
      const policyRes = await getAgentPolicy();
      setAgentPolicies(
        policyRes.data?.filter(
          (policy: IPolicy) => policy?.resource_id === agent_id,
        ),
      );
      setEmails(
        team
          .filter((member) =>
            agentPolicies?.map((p) => p.user_id).includes(member?.user_id),
          )
          .map((member) => member?.email),
      );
    } catch (error) {}
  };

  useEffect(() => {
    if (isOrgMode(usage_data?.plan_name)) fetchData();
    return () => {
      setEmails([]);
    };
  }, [agent_id]);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share App</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="space-y-4">
          {[PlanType.Community, PlanType.Starter].includes(
            usage_data?.plan_name as PlanType,
          ) ? (
            <span className="inline-flex items-center justify-between break-all rounded-md bg-secondary px-4 py-2 text-sm font-medium">
              <p>{`${window.location.origin}/agent/${agent_id}`}</p>
              <Button variant="ghost">
                {copied ? (
                  <ClipboardCheck className="size-4 text-green-500" />
                ) : (
                  <Clipboard className="size-4" />
                )}
              </Button>
            </span>
          ) : (
            <>
              <Alert className="bg-neutral-100">
                <TriangleAlert className="size-4" />
                <AlertTitle />
                <AlertDescription>
                  Sharing agents gives users edit access.
                </AlertDescription>
              </Alert>

              <Tabs defaultValue="people">
                <div className="flex items-center justify-between">
                  <TabsList>
                    <TabsTrigger
                      value="people"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Users2 className="mr-1 size-4" />
                      People
                    </TabsTrigger>
                  </TabsList>
                  <Button
                    size="sm"
                    variant="link"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/agent/${agent_id}`,
                      );
                      toast({
                        title: "Copied",
                        description: "Copied the shareable link to clipboard!",
                      });
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                  >
                    {copied ? (
                      <Check className="text-green-500" />
                    ) : (
                      <Link className="mr-1 size-4" />
                    )}
                    Copy Link
                  </Button>
                </div>
                <TabsContent value="people" className="w-full">
                  <p className="mb-1 text-sm text-muted-foreground">Share</p>
                  <MultiSelect
                    defaultValue={emails}
                    options={team?.map((member) => ({
                      label: member?.name ?? member?.email,
                      value: member?.email,
                    }))}
                    placeholder="Select people"
                    disabled={
                      isFetchingCurrentOrgMembers || isFetchingAgentPolicies
                    }
                    className={cn(
                      (isFetchingAgentPolicies ||
                        isFetchingCurrentOrgMembers) &&
                        "shimmer",
                    )}
                    onValueChange={(value) => {
                      console.log(value);
                      setEmails(value);
                    }}
                  />
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
        <Separator />
        <DialogFooter>
          <DialogClose className={buttonVariants({ variant: "secondary" })}>
            Cancel
          </DialogClose>
          <Button onClick={onInvite} loading={isSharingAgent}>
            Invite
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareApp;
