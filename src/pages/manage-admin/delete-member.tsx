import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Minus } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "../organization/org.service";
import { useToast } from "@/components/ui/use-toast";
import { useManageAdminStore } from "./manage-admin.store";

type ITeamMember = {
  current_org_id: string;
  name: string;
  email: string;
  user_id: string;
  _id: string;
};

const DeleteMember: React.FC<{
  member: Partial<ITeamMember>;
  fetchTeamMembers: () => void;
}> = ({ member, fetchTeamMembers }) => {
  const { toast } = useToast();
  const { getToken } = useAuth();

  const [dialogVisible, setDialogVisible] = useState<boolean>(false);
  const { current_organization } = useManageAdminStore((state) => state);
  const { removeUser, isRemovingUser } = useOrganization({
    token: getToken() ?? "",
    current_organization,
  });

  const onRemoveUser = async () => {
    try {
      const res = await removeUser({ user_id: member?.user_id ?? "" });
      if (res.data) {
        toast({
          title: "Success",
          description: "Removed the user from your organization",
        });
        setDialogVisible(false);
        fetchTeamMembers?.();
      }
    } catch (error) {}
  };

  return (
    <AlertDialog open={dialogVisible} onOpenChange={setDialogVisible}>
      <AlertDialogTrigger className="inline-flex items-center text-sm text-destructive hover:text-destructive/80">
        <Minus className="mr-2 size-4" />
        <p>Remove</p>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Confirm removal. You cannot undo this action.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <Separator />
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            loading={isRemovingUser}
            onClick={onRemoveUser}
          >
            {isRemovingUser ? "Removing" : "Remove"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default DeleteMember;
