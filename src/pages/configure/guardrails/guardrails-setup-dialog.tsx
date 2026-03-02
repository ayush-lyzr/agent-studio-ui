import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { Settings2, ExternalLink, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/custom/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import {
  DynamicFormFields,
  createDynamicFormSchema,
  createDefaultValues,
} from "@/components/custom/dynamic-form-field";
import { useGuardrails } from "./guardrails-service";
import type { IGuardrailProvider } from "./types";

interface GuardrailsSetupDialogProps {
  provider: IGuardrailProvider;
}

type ViewMode = "list" | "add";

export const GuardrailsSetupDialog: React.FC<GuardrailsSetupDialogProps> = ({
  provider,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    credentials = [],
    isFetchingCredentials,
    createCredential,
    isCreatingCredential,
    deleteCredential,
    isDeletingCredential,
    registerRoleWithLambda,
  } = useGuardrails({
    enabled: isDialogOpen && viewMode === "list",
    providerId: provider.provider_id,
  });

  // Form schema for credential creation
  const formSchema = useMemo(() => {
    return createDynamicFormSchema(provider.form.fields, {
      name: z
        .string()
        .min(1, "Name is required")
        .refine(
          (name) =>
            !credentials.some(
              (cred) => cred.name.toLowerCase() === name.toLowerCase(),
            ),
          "A credential with this name already exists",
        ),
    });
  }, [provider.form.fields, credentials]);

  const defaultValues = useMemo(() => {
    return createDefaultValues(provider.form.fields, { name: "" });
  }, [provider.form.fields]);

  const rhfForm = useForm({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const handleSubmitCredential = async (
    values: z.infer<typeof formSchema>,
  ) => {
    try {
      const { name, ...fieldValues } = values;
      const credentialsObj: Record<string, any> = {};
      provider.form.fields.forEach((field) => {
        if (fieldValues[field.name] !== undefined) {
          credentialsObj[field.name] = fieldValues[field.name];
        }
      });

      // Create credential
      await createCredential({
        name,
        type: "guardrail",
        meta_data: {},
        credentials: credentialsObj,
        provider_id: provider.provider_id,
      });

      // Register role ARN with Lambda (for AWS Bedrock cross-account access)
      if (
        provider.meta_data.lambda_registration_required &&
        credentialsObj.aws_role_name
      ) {
        try {
          await registerRoleWithLambda(credentialsObj.aws_role_name);
        } catch (error) {
          console.error("Error calling Lambda:", error);
        }
      }

      rhfForm.reset();
      queryClient.invalidateQueries({
        queryKey: ["getGuardrailCredentials"],
      });
      setViewMode("list");
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error?.response?.data?.detail || "Failed to create credential",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCredential = async (credentialId: string) => {
    try {
      await deleteCredential({ credential_id: credentialId });
      toast({ title: "Credential deleted successfully" });
      queryClient.invalidateQueries({
        queryKey: ["getGuardrailCredentials"],
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete credential",
        variant: "destructive",
      });
    }
  };

  const handleClose = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setViewMode("list");
      rhfForm.reset();
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings2 className="mr-1 size-4" />
          Setup
        </Button>
      </DialogTrigger>
      <DialogContent className="flex h-[450px] max-w-3xl flex-col overflow-hidden !rounded-xl bg-background">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between pr-4">
            <span>
              {viewMode === "list" ? "Credentials" : "Add Credential"}
            </span>
            {viewMode === "list" && (
              <Button
                onClick={() => setViewMode("add")}
                size="sm"
                className="gap-2"
              >
                <Plus className="size-4" />
                Add New
              </Button>
            )}
          </DialogTitle>
          <DialogDescription>
            {provider.form.description}
            {provider.meta_data.documentation_url && (
              <span className="inline-flex items-center space-x-1">
                <span>Follow the</span>
                <Link
                  to={provider.meta_data.documentation_url}
                  target="_blank"
                  className="text-link underline-offset-4 hover:underline"
                >
                  documentation
                </Link>
                {provider.meta_data.lambda_registration_required && (
                  <>
                    <span>and</span>
                    <Link
                      download
                      to="/lyzr-bedrock-guardrails-iam.yaml"
                      target="_blank"
                      className="text-link underline-offset-4 hover:underline"
                    >
                      download the IAM template
                    </Link>
                  </>
                )}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Separator />

        <div className="flex-1 overflow-y-auto">
          {/* List View - Show existing credentials */}
          {viewMode === "list" && (
            <div className="space-y-2 p-2">
              {isFetchingCredentials ? (
                <div className="flex items-center justify-center py-8">
                  <span className="text-muted-foreground">
                    Loading credentials...
                  </span>
                </div>
              ) : credentials.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground">
                    No guardrail credentials configured
                  </p>
                  <Button
                    variant="link"
                    onClick={() => setViewMode("add")}
                    className="mt-2"
                  >
                    Add your first credential
                  </Button>
                </div>
              ) : (
                credentials.map((cred) => (
                  <div
                    key={cred.credential_id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{cred.name}</p>
                      {cred.credentials.aws_region_name && (
                        <p className="text-sm text-muted-foreground">
                          Region: {cred.credentials.aws_region_name}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleDeleteCredential(cred.credential_id)
                        }
                        disabled={isDeletingCredential}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Add View - Create new credential */}
          {viewMode === "add" && (
            <Form {...rhfForm}>
              <form
                onSubmit={rhfForm.handleSubmit(handleSubmitCredential)}
                className="no-scrollbar flex h-full flex-col overflow-y-auto"
              >
                <div className="flex-1 space-y-4 pb-16">
                  <DynamicFormFields
                    control={rhfForm.control}
                    fields={provider.form.fields}
                  />
                </div>

                {/* Footer with actions */}
                <div className="absolute bottom-0 left-0 right-0 border-t bg-background p-4">
                  <div className="flex items-center justify-between">
                    {provider.meta_data.documentation_url && (
                      <a
                        href={provider.meta_data.documentation_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                      >
                        <ExternalLink className="size-3" />
                        View Documentation
                      </a>
                    )}
                    <DialogFooter className="items-center sm:justify-end">
                      <span className="inline-flex items-baseline gap-1">
                        <p className="text-destructive">*</p>
                        <p className="text-xs">marked as required</p>
                      </span>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setViewMode("list")}
                      >
                        Back
                      </Button>
                      <Button type="submit" loading={isCreatingCredential}>
                        Save
                      </Button>
                    </DialogFooter>
                  </div>
                </div>
              </form>
            </Form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
