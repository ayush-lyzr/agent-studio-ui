import { Trash2 } from "lucide-react";
import { useState } from "react";

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
import useStore from "@/lib/store";
import { useModel } from "./model-service";
import { Button } from "@/components/custom/button";
import { ICredential } from "@/lib/types";

export const DeleteKey: React.FC<{
  data: ICredential;
  onDelete?: (credentialId: string) => void;
}> = ({ data, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const apiKey = useStore((state) => state.api_key);

  const { deleteCredential, deleteRagCredential, isDeletingCredential } = useModel({ apiKey });

  const handleDelete = async () => {
    try {
      // Delete RAG credential first if it exists
      const ragCredId = data?.meta_data?.rag_cred_id as string | undefined;
      if (ragCredId) {
        try {
          await deleteRagCredential({ credential_id: ragCredId });
          console.log("RAG credential deleted successfully:", ragCredId);
        } catch (error) {
          console.error("Error deleting RAG credential:", error);
        }
      }

      // Delete the main credential
      await deleteCredential({ credential_id: data?.credential_id });
      setIsOpen(false);
      onDelete?.(data.credential_id);
    } catch (error) {
      console.error("Error deleting credential:", error);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger>
        <Trash2 className="size-4 text-destructive" />
      </AlertDialogTrigger>
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
            loading={isDeletingCredential}
            onClick={handleDelete}
          >
            <Trash2 className="mr-1 size-5" /> Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
