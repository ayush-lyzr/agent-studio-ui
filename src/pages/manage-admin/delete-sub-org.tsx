import React from "react";
import { AlertTriangle } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";
import { useSubOrganizationService } from "@/services/subOrganizationService";

type DeleteSubOrgProps = {
  open: boolean;
  onOpen: (open: boolean) => void;
  subOrgId: string;
};

export const DeleteSubOrg: React.FC<DeleteSubOrgProps> = ({
  open,
  onOpen,
  subOrgId,
}) => {
  const { toast } = useToast();
  const token = useStore((state) => state.app_token);
  const { deleteSubOrganization, isDeletingSubOrg, fetchCurrentOrg } =
    useSubOrganizationService({ token });

  const onDelete = async () => {
    try {
      if (!subOrgId) {
        toast({
          variant: "destructive",
          description: "Organization ID is missing",
        });
      }
      const res = await deleteSubOrganization({ subOrgId });
      await fetchCurrentOrg();
      onOpen(false);
      toast({
        title: res.status === 200 ? "Success" : "Error",
        description:
          res.status === 200
            ? "Deleted Sub-Account successfully."
            : "Error deleting sub-account",
        variant: res.status === 200 ? "default" : "destructive",
      });
    } catch (error) {}
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your
            account and remove your data from our servers.
          </AlertDialogDescription>
          <Alert variant="destructive" className="bg-destructive/5">
            <div className="flex items-center gap-4">
              <AlertTriangle />
              <AlertDescription>
                The agents created in this organization will be lost...
              </AlertDescription>
            </div>
          </Alert>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              loading={isDeletingSubOrg}
              onClick={onDelete}
            >
              {isDeletingSubOrg ? "Deleting ..." : "Delete"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogHeader>
      </AlertDialogContent>
    </AlertDialog>
  );
};
