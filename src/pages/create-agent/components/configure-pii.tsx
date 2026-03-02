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
import { Input } from "@/components/ui/input";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { z } from "zod";

interface ConfigurePiiProps {
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

interface Mapping {
  key: string;
  value: string;
  keyError?: string;
  valueError?: string;
}

const mappingSchema = z.object({
  key: z.string().min(1, "Key is required"),
  value: z.string().min(1, "Value is required"),
});

export const ConfigurePii = ({
  updateFeatures,
  featureName,
  openDialog = false,
  initialConfig,
}: ConfigurePiiProps) => {
  const [isOpen, setIsOpen] = useState(openDialog);
  const [configuredKeys, setConfiguredKeys] = useState(0);
  const [mappings, setMappings] = useState<Mapping[]>([
    { key: "", value: "", keyError: undefined, valueError: undefined },
  ]);

  useEffect(() => {
    if (openDialog) {
      setIsOpen(true);
    }
  }, [openDialog]);

  useEffect(() => {
    if (initialConfig?.mapping) {
      const mappingEntries = Object.entries(initialConfig.mapping);
      if (mappingEntries.length > 0) {
        const initialMappings = mappingEntries.map(([key, value]) => ({
          key,
          value: value as string,
          keyError: undefined,
          valueError: undefined,
        }));
        setMappings(initialMappings);
        setConfiguredKeys(initialMappings.length);
        if (initialMappings.length === 0) {
          setMappings([
            { key: "", value: "", keyError: undefined, valueError: undefined },
          ]);
        }
      }
    }
  }, [initialConfig]);

  const handleOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
    if (!isOpen && configuredKeys === 0) {
      updateFeatures(featureName, false);
    }
  };

  const handleAddMapping = () => {
    setMappings([
      ...mappings,
      { key: "", value: "", keyError: undefined, valueError: undefined },
    ]);
  };

  const handleRemoveMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  const handleUpdateMapping = (
    index: number,
    field: "key" | "value",
    value: string,
  ) => {
    const newMappings = [...mappings];
    newMappings[index][field] = value;
    newMappings[index][`${field}Error`] = undefined;
    setMappings(newMappings);
  };

  const validateMappings = () => {
    const newMappings = [...mappings];
    let hasErrors = false;
    const seenKeys = new Set<string>();

    newMappings.forEach((mapping) => {
      mapping.keyError = undefined;
      mapping.valueError = undefined;
    });

    newMappings.forEach((mapping) => {
      const result = mappingSchema.safeParse(mapping);
      if (!result.success) {
        hasErrors = true;
        result.error.errors.forEach((error) => {
          if (error.path.includes("key")) {
            mapping.keyError = error.message;
          }
          if (error.path.includes("value")) {
            mapping.valueError = error.message;
          }
        });
      }

      const trimmedKey = mapping.key.trim();
      if (trimmedKey && seenKeys.has(trimmedKey)) {
        mapping.keyError = "Duplicate key";
        hasErrors = true;
      }
      seenKeys.add(trimmedKey);
    });

    setMappings(newMappings);
    return !hasErrors;
  };

  const handleSave = () => {
    if (!validateMappings()) {
      return;
    }

    const validMappings = mappings.filter(
      (m) => m.key.trim() && m.value.trim(),
    );

    if (validMappings.length === 0) {
      return;
    }

    const config = {
      mapping: validMappings.reduce(
        (acc, { key, value }) => ({
          ...acc,
          [key.trim()]: value.trim(),
        }),
        {},
      ),
    };

    setConfiguredKeys(validMappings.length);
    updateFeatures(featureName, true, undefined, undefined, config);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setIsOpen(false);
    if (configuredKeys === 0) {
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
        {configuredKeys > 0 ? (
          <Badge variant="outline" className="rounded-md">
            {configuredKeys} {configuredKeys === 1 ? "key" : "keys"}
          </Badge>
        ) : (
          <Badge variant="destructive">Not Configured</Badge>
        )}
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure PII Mappings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Add key-value pairs for personally identifiable information. For
              example, map "email" to "[EMAIL]" or "phone" to "[PHONE_NUMBER]".
            </p>
            {mappings.map((mapping, index) => (
              <div key={index} className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Key"
                      value={mapping.key}
                      onChange={(e) =>
                        handleUpdateMapping(index, "key", e.target.value)
                      }
                      className={cn(mapping.keyError && "border-red-500")}
                    />
                    {mapping.keyError && (
                      <p className="px-2 text-xs text-red-500">
                        {mapping.keyError}
                      </p>
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <Input
                      placeholder="Value"
                      value={mapping.value}
                      onChange={(e) =>
                        handleUpdateMapping(index, "value", e.target.value)
                      }
                      className={cn(mapping.valueError && "border-red-500")}
                    />
                    {mapping.valueError && (
                      <p className="px-2 text-xs text-red-500">
                        {mapping.valueError}
                      </p>
                    )}
                  </div>
                  {index > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveMapping(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleAddMapping}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Mapping
            </Button>
          </div>
          <DialogFooter className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!mappings.some((m) => m.key.trim() && m.value.trim())}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
