import React from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export interface EditToolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  isLoading: boolean;
  isSubmitting?: boolean;
  openApiConfig: string;
  onChangeOpenApiConfig: (value: string) => void;
  toolDetails: string;
  onChangeToolDetails: (value: string) => void;
  onConfirm: () => void;
}

export const EditToolDialog: React.FC<EditToolDialogProps> = ({
  open,
  onOpenChange,
  name,
  isLoading,
  isSubmitting = false,
  openApiConfig,
  onChangeOpenApiConfig,
  toolDetails,
  onChangeToolDetails,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tool</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-2">
              <p className="text-foreground">
                Update details for <span className="font-medium">{name}</span>.
              </p>

              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                  <span className="ml-2">Loading tool data...</span>
                </div>
              ) : (
                <>
                  <div className="text-foreground">OpenAPI Config</div>
                  <Textarea
                    value={openApiConfig}
                    onChange={(e) => onChangeOpenApiConfig(e.target.value)}
                    placeholder="Enter OpenAPI config..."
                    className="min-h-[140px] resize-none text-foreground"
                  />
                  <div className="text-foreground">Tool Details</div>
                  <Textarea
                    value={toolDetails}
                    onChange={(e) => onChangeToolDetails(e.target.value)}
                    placeholder="Enter tool details..."
                    className="min-h-[140px] resize-none text-foreground"
                  />
                </>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading || isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button
            onClick={onConfirm}
            loading={isSubmitting}
            disabled={isLoading}
          >
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditToolDialog;
