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
import useStore from "@/lib/store";
import { Button } from "@/components/custom/button";
import { useChatService } from "../chat.api";
import { useToast } from "@/components/ui/use-toast";
import { useChatStore } from "../chat.store";
import { useNavigate } from "react-router-dom";
import { Path } from "@/lib/types";

export const DeleteSession: React.FC<{
  session_id: string;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ session_id, open, onOpen }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);
  const { agent } = useChatStore();

  const { deleteSessionDetails, isDeletingSessionDetails, refetchSessions } =
    useChatService({
      apiKey,
      session_id,
    });

  const handleDelete = async () => {
    try {
      await deleteSessionDetails({ session_id });
      onOpen(false);
      await refetchSessions();
      navigate(`${Path.AGENT}/${agent?.id}`);
    } catch (error: any) {
      console.error("Error deleting credential:", error);
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            session and conversation history.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            loading={isDeletingSessionDetails}
            onClick={handleDelete}
          >
            <Trash2 className="mr-1 size-5" /> Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
