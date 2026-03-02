import { Trash2 } from "lucide-react";
import { Dispatch, SetStateAction } from "react";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/custom/button";
import { IRAIPolicy } from "@/lib/types";
import { useRAIPolicy } from "../rai.service";

export const DeletePolicy: React.FC<{
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  data: Partial<IRAIPolicy>;
  onRefresh: () => void;
}> = ({ data, onRefresh, open, onOpen }) => {
  const { deletePolicy, isDeletingPolicy } = useRAIPolicy();

  const handleDelete = async () => {
    try {
      await deletePolicy({ policy_id: data?._id ?? "" });
      onOpen(false);
      onRefresh();
    } catch (error) {
      console.error("Error deleting credential:", error);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            credential.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            loading={isDeletingPolicy}
            onClick={handleDelete}
          >
            <Trash2 className="mr-1 size-5" /> Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
