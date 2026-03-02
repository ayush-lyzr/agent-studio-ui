import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface CloneBlueprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClone: (blueprintName: any) => void;
  initialName?: string;
  isCloning: boolean;
  setIsCloning: (value: boolean) => void;
}

export function CloneBlueprintDialog({
  open,
  onOpenChange,
  onClone,
  initialName = "",
  isCloning,
  setIsCloning,
}: CloneBlueprintDialogProps) {
  const [inputValue, setInputValue] = useState(initialName);

  const handleClone = async () => {
    setIsCloning(true);
    try {
      onClone(inputValue.trim());
    } catch (error) {
      setIsCloning(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  useEffect(() => {
    if (open) {
      const nameWithClone = initialName ? `${initialName} - (clone)` : "";
      setInputValue(nameWithClone);
    }
  }, [open, initialName]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provide a name to blueprint.</DialogTitle>
          <DialogDescription>
            You'll get a copy of the agent that you can tailor to your needs.
          </DialogDescription>
        </DialogHeader>
        <div className="my-4">
          <Input
            required
            placeholder="Type your blueprint name..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleClone}
            disabled={!inputValue.trim() || isCloning}
          >
            {isCloning && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {isCloning ? "Cloning..." : "Clone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
