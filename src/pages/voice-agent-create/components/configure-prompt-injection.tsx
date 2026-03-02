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
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

interface ConfigurePromptInjectionProps {
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

export const ConfigurePromptInjection = ({
  updateFeatures,
  featureName,
  openDialog = false,
  initialConfig,
}: ConfigurePromptInjectionProps) => {
  const [isOpen, setIsOpen] = useState(openDialog);
  const [threshold, setThreshold] = useState(1);
  const [isConfigured, setIsConfigured] = useState(false);

  useEffect(() => {
    setIsOpen(openDialog);
  }, [openDialog]);

  useEffect(() => {
    if (initialConfig?.threshold !== undefined) {
      setThreshold(initialConfig.threshold);
      setIsConfigured(true);
    }
  }, [initialConfig]);

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
    if (!isOpen && !isConfigured) {
      updateFeatures(featureName, false);
    }
  };

  const handleSave = () => {
    const config = {
      threshold: threshold,
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
            Threshold: {threshold}
          </Badge>
        ) : (
          <Badge variant="destructive">Not Configured</Badge>
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Prompt Injection Detection</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Set the threshold for prompt injection detection. Higher values
                mean stricter detection.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-medium">Threshold: {threshold}</p>
                <Slider
                  value={[threshold]}
                  onValueChange={(value) => setThreshold(value[0])}
                  step={0.1}
                  min={0}
                  max={1}
                />
              </div>
            </div>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
