import { Dispatch, SetStateAction } from "react";
import { Trash2 } from "lucide-react";
import axios from "axios";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import useStore from "@/lib/store";
import { Group } from "@/services/groupsApiService";
import { removeAssetFromGroup } from "@/services/groupsApiService";

export const DeleteKnowledgeBase: React.FC<{
  open?: boolean;
  onOpenChange?: Dispatch<SetStateAction<boolean>>;
  data?: any;
  apiKey: string;
  currentGroup?: Group | null;
  onSuccess: () => void;
}> = ({ open, onOpenChange, data, apiKey, onSuccess, currentGroup }) => {
  const { toast } = useToast();
  const setRag = useStore((state: any) => state.setRag);
  const rags = useStore((state: any) => state.rags);
  const token = useStore((state) => state.app_token);

  const handleDelete = async () => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_RAG_URL}/v3/rag/${data._id}/`,
        {
          headers: {
            accept: "application/json",
            "x-api-key": apiKey,
          },
        },
      );

      const updatedRags = rags.filter((rag: any) => rag.id !== data.id);
      setRag(updatedRags);
      onSuccess();

      toast({
        title: "Success",
        description: "Knowledge base deleted successfully",
      });
      if (currentGroup){
        await removeAssetFromGroup(
          currentGroup?.group_name,
          currentGroup?.group_type,
          data._id,
          currentGroup?.organization_id,
          token,
        );
        toast({
          title: "Success",
          description: "Knowledge base removed from group successfully",
        }); 
      }
    } catch (error) {
      console.error("Error deleting knowledge base:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete knowledge base",
      });
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger></AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete this
            knowledge base.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            <Trash2 className="mr-1 size-4" /> Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
