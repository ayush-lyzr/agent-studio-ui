import { Dispatch, SetStateAction } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import KnowledgeBaseForm from "./knowledge-base-form";

interface KBFormDialog {
  data?: any;
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess: (rag: any) => void;
}

export default function KnowledgeBaseFormDialog({
  data,
  open,
  onOpen,
}: KBFormDialog) {
  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="top-[50%] max-w-2xl !rounded-xl data-[state=closed]:slide-out-to-bottom-[50%] data-[state=open]:slide-in-from-bottom-[50%]">
        <DialogHeader>
          <DialogTitle>{data ? "Update" : "Create"} Knowledge Base</DialogTitle>
        </DialogHeader>
        <Separator />
        <KnowledgeBaseForm
          asSemantic={data?.semantic_data_model}
          onCancel={() => onOpen(false)}
          data={data}
          asGraph={
            data?.vector_store_provider
              ?.toLowerCase()
              ?.includes("neo4j") ||
            data?.vector_store_provider
              ?.toLowerCase()
              ?.includes("neptune")
          }
        />
        <Separator />
      </DialogContent>
    </Dialog>
  );
}
