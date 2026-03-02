import { useState, useEffect } from "react";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

interface ConfigureGroundednessProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: Record<string, any>,
  ) => void;
  featureName: string;
  openDialog?: boolean;
  initialConfig?: Record<string, any>;
}

export const ConfigureGroundedness = ({
  updateFeatures,
  featureName,
  openDialog = false,
  initialConfig,
}: ConfigureGroundednessProps) => {
  const [isOpen, setIsOpen] = useState(openDialog);
  const [facts, setFacts] = useState<string[]>([""]);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    if (initialConfig?.facts) {
      setFacts(initialConfig.facts);
      setIsConfigured(true);
    }
  }, [initialConfig]);

  useEffect(() => {
    setIsOpen(openDialog);
  }, [openDialog]);

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
    if (!isOpen && !isConfigured) {
      updateFeatures(featureName, false);
    }
  };

  const handleAddFact = () => {
    setFacts([...facts, ""]);
  };

  const handleRemoveFact = (index: number) => {
    setFacts(facts.filter((_, i) => i !== index));
  };

  const handleFactChange = (index: number, value: string) => {
    const newFacts = [...facts];
    newFacts[index] = value;
    setFacts(newFacts);
  };

  const handleSave = () => {
    const validFacts = facts.filter((fact) => fact.trim() !== "");
    if (validFacts.length === 0) return;

    const config = {
      facts: validFacts,
    };
    setIsConfigured(true);
    updateFeatures(featureName, true, undefined, undefined, config);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (!isConfigured) {
      updateFeatures(featureName, false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        <DialogTrigger
          className={cn(
            buttonVariants({ variant: "link" }),
            "p-0 text-indigo-600 animate-in slide-in-from-top-2 hover:text-indigo-500",
          )}
        >
          Configure
          <ArrowTopRightIcon className="size-4" />
        </DialogTrigger>
        {isConfigured ? (
          <Badge variant="outline" className="rounded-md">
            {facts.filter((f) => f.trim() !== "").length}{" "}
            {facts.filter((f) => f.trim() !== "").length === 1
              ? "fact"
              : "facts"}
          </Badge>
        ) : (
          <Badge variant="destructive">Not Configured</Badge>
        )}
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Configure Groundedness Facts</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add facts that will be used to ensure responses are grounded in
              truth.
            </p>
            {facts.map((fact, index) => (
              <div key={index} className="flex items-start gap-2">
                <Textarea
                  value={fact}
                  onChange={(e) => handleFactChange(index, e.target.value)}
                  placeholder={`Fact ${index + 1}`}
                  className="flex-1"
                />
                {facts.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFact(index)}
                  >
                    <X className="size-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAddFact}
            >
              <Plus className="mr-2 size-4" />
              Add Fact
            </Button>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!facts.some((fact) => fact.trim() !== "")}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
