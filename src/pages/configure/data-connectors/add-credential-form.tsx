import { z, ZodError } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink, XCircle } from "lucide-react";
import React, {
  useMemo,
  useCallback,
  Dispatch,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import mixpanel from "mixpanel-browser";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DataConnector } from "@/lib/types";
import { isMixpanelActive } from "@/lib/constants";
import { useToast } from "@/components/ui/use-toast";
import { useDataConnector } from "./data-connector.service";
import useStore from "@/lib/store";
import { DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn, readFileAsync } from "@/lib/utils";
import { Upload } from "@/components/custom/upload";
import { PasswordInput } from "@/components/custom/password-input";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type FieldConfig = {
  field_id: string;
  field_name: string;
  field_value: string;
  field_type: string;
  field_accepted_formats?: string[];
  field_multiple?: boolean;
  field_description?: string;
  required: boolean;
};

type IProps = {
  savedConfig: Record<string, string> | undefined;
  config: FieldConfig[];
  provider: DataConnector;
  closeDialog: () => void;
  defaultValues?:
    | Partial<{ name: string } & Record<string, any>>
    | { [x: string]: string | undefined; name?: string | undefined }
    | undefined;
  setIsTableView: Dispatch<SetStateAction<boolean>>;
  refreshCredentials: () => void;
};

const AddCredentialsForm: React.FC<IProps> = ({
  provider,
  config,
  defaultValues,
  closeDialog,
  setIsTableView,
  refreshCredentials,
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<string[]>([]);
  const [isOAuthEnabled, setIsOAuthEnabled] = useState<boolean>(false);
  const apiKey = useStore((state) => state.api_key);
  const {
    saveCredentials,
    saveFileCredentials,
    updateCredentials,
    updateFileCredentials,
    isUpdingFileCredential,
    isSavingFileCredential,
    isUpdatingCredential,
  } = useDataConnector({ apiKey });

  const typeMap = (field: FieldConfig): { [key: string]: any } => {
    return {
      string: field.required ? z.string() : z.string().optional(),
      integer: field.required
        ? z.coerce.number()
        : z.coerce.number().optional(),
      file:
        provider.provider_id === "file_upload" && defaultValues?.credential_id
          ? z.array(z.instanceof(File)).optional()
          : z.array(z.instanceof(File)),
    };
  };

  const formSchema = useMemo(
    () =>
      z.object({
        name:
          provider.provider_id === "file_upload"
            ? z
                .string()
                .min(1, "Name is required")
                .regex(
                  /^[a-z0-9_]*$/,
                  "Name can only contain lowercase letters, numbers, and underscores",
                )
            : z.string().min(1, "Name is required"),
        ...Object.fromEntries(
          config.map((field) => {
            // For Azure SQL OAuth, port field should be treated as string (tenant_id) and is required
            if (
              provider.provider_id === "azuresql" &&
              isOAuthEnabled &&
              field.field_id === "port"
            ) {
              return [field.field_id, z.string().min(1, "Tenant ID is required")];
            }
            return [field?.field_id, typeMap(field)[field.field_type]];
          }),
        ),
      }),
    [config, isOAuthEnabled],
  );

  // Big Query Service Account schema
  const bigquerySASchema = z.object({
    type: z.string(),
    project_id: z.string(),
    private_key_id: z.string(),
    private_key: z.string(),
    client_email: z.string(),
    client_id: z.string(),
    auth_uri: z.string().nullable(),
    token_uri: z.string().nullable(),
    auth_provider_x509_cert_url: z.string().nullable(),
    client_x509_cert_url: z.string().nullable(),
    universe_domain: z.string().nullable(),
  });

  const form = useForm<
    z.infer<typeof formSchema> & Record<string, string | Record<string, string>>
  >({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name,
      // @ts-ignore
      ...(provider.provider_id === "file_upload"
        ? {}
        : provider.provider_id === "azuresql" &&
            defaultValues?.credentials &&
            (defaultValues.credentials.tenant_id ||
              defaultValues.credentials.client_id ||
              defaultValues.credentials.client_secret)
          ? {
              ...defaultValues.credentials,
              user: defaultValues.credentials.client_id,
              password: defaultValues.credentials.client_secret,
              port: defaultValues.credentials.tenant_id,
            }
          : (defaultValues?.credentials ?? {})),
    },
  });

  const getFormField = (props: {
    id: string;
    type: string;
    name: string;
    multiple?: boolean;
    accepted_formats?: string[];
    formField: any;
  }) => {
    const currentFiles = Array.from((form.getValues(props?.id) as any) ?? []);
    const isUpdateFileField =
      provider.provider_id === "file_upload" && defaultValues?.credential_id;

    // Get the display label for OAuth fields
    const displayLabel = getFieldLabel(props.id, props.name);

    switch (props.type) {
      case "string":
        if (
          props.name === "Password" ||
          (provider.provider_id === "azuresql" &&
            isOAuthEnabled &&
            props.id === "password")
        ) {
          return (
            <PasswordInput
              {...props.formField}
              placeholder={`Enter ${displayLabel}`}
            />
          );
        }
        return (
          <Input
            {...props.formField}
            placeholder={
              props.id === "connection_kwargs"
                ? `{"option":"value"}`
                : `Enter ${displayLabel}`
            }
            className="border"
          />
        );
      case "integer":
        // For Azure SQL OAuth, port becomes tenant_id (string)
        if (
          provider.provider_id === "azuresql" &&
          isOAuthEnabled &&
          props.id === "port"
        ) {
          return (
            <Input
              {...props.formField}
              placeholder={`Enter ${displayLabel}`}
              className="border"
            />
          );
        }
        return (
          <Input
            type="number"
            {...props.formField}
            placeholder={`Enter ${displayLabel}`}
            className="border"
          />
        );
      case "file":
        return (
          <div>
            <Upload
              loading={form.formState.isSubmitting}
              acceptedFileFormats={props?.accepted_formats ?? []}
              multiple={props?.multiple}
              onFilesDrop={(files) => props.formField.onChange(files)}
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {isUpdateFileField &&
                // @ts-ignore
                files?.map((file: any) => (
                  <Badge
                    key={file}
                    className="cursor-pointer gap-2 rounded-full border-primary bg-background text-primary hover:bg-secondary"
                  >
                    {file}
                    <XCircle
                      className="size-3 cursor-pointer"
                      onClick={() =>
                        setFiles((prev) => prev.filter((f: any) => f !== file))
                      }
                    />
                  </Badge>
                ))}
              {provider.provider_id !== "bigquery" &&
                (props.formField?.value ?? [])?.map((file: any) => (
                  <Badge
                    key={file?.name}
                    className="cursor-pointer gap-2 rounded-full border-primary bg-background text-primary hover:bg-secondary"
                  >
                    {file?.name}
                    <XCircle
                      className="size-3 cursor-pointer"
                      onClick={() =>
                        props.formField.onChange(
                          currentFiles.filter(
                            (f: any) => f?.name !== file?.name,
                          ),
                        )
                      }
                    />
                  </Badge>
                ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const validateSAJson = async (
    payload: z.infer<typeof formSchema> & Record<string, any>,
  ) => {
    const file = payload?.credentials?.sa_dict[0];
    const result = await readFileAsync(file);
    return result;
  };

  const onSubmit = useCallback(
    async (values: z.infer<typeof formSchema> & Record<string, any>) => {
      try {
        const { name: uniqueName, ...rest } = values;
        const filteredPayload = Object.fromEntries(
          Object.entries(rest).filter(([_, v]) => Boolean(v)),
        );

        let credentials = { ...filteredPayload };

        // Transform credentials for Azure SQL OAuth
        if (provider?.provider_id === "azuresql" && isOAuthEnabled) {
          credentials = {
            ...credentials,
            client_id: credentials.user,
            client_secret: credentials.password,
            tenant_id: credentials.port,
          };
          // Remove the old field names
          delete credentials.user;
          delete credentials.password;
          delete credentials.port;
        }

        let payload: any = {
          name: uniqueName,
          provider_id: provider?.provider_id,
          type: provider?.type,
          credentials,
          meta_data: { name: uniqueName },
        };

        if (provider?.provider_id === "bigquery") {
          const res = await validateSAJson(payload);
          bigquerySASchema.parse(res);
          payload = {
            ...payload,
            credentials: {
              ...payload?.credentials,
              sa_dict: res,
            },
          };
        }

        if (provider?.provider_id === "file_upload" && !defaultValues?.name) {
          await saveFileCredentials({ ...payload, files: values?.files });
        } else if (
          provider?.provider_id === "file_upload" &&
          !!defaultValues?.credential_id
        ) {
          await updateFileCredentials({
            credential_id: defaultValues?.credential_id,
            ...{
              ...payload,
              user_id: apiKey,
              credential_id: defaultValues?.credential_id,
              credentials: {
                files,
              },
            },
            files: values?.files,
          });
        } else if (defaultValues?.credential_id) {
          await updateCredentials({
            credential_id: defaultValues?.credential_id,
            user_id: defaultValues?.user_id,
            ...payload,
          });
        } else {
          await saveCredentials(payload);
        }

        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track(
            defaultValues?.credential_id
              ? "Added credential"
              : "Updated credential",
            payload,
          );

        toast({
          title: "Success",
          description: `${provider?.form?.title} connection ${defaultValues?.credential_id ? "updated" : "added"} successfully`,
        });
        refreshCredentials();
        closeDialog();
      } catch (error: any) {
        if (error instanceof ZodError) {
          console.error("Error saving data connector:", error);
          toast({
            title: "Error",
            description: `Failed to configure data connector. ${provider?.provider_id === "bigquery" ? "Might be invalid service account json file" : ""}`,
            variant: "destructive",
          });
        }
      }
    },
    [
      provider?.provider_id,
      saveCredentials,
      toast,
      files,
      defaultValues,
      isOAuthEnabled,
    ],
  );

  useEffect(() => {
    if (
      provider.provider_id === "file_upload" &&
      defaultValues?.credential_id
    ) {
      setFiles(defaultValues?.credentials?.files ?? []);
    }

    // Check if OAuth fields exist in defaultValues for Azure SQL
    if (provider.provider_id === "azuresql" && defaultValues?.credentials) {
      const hasOAuthFields =
        defaultValues.credentials.tenant_id ||
        defaultValues.credentials.client_id ||
        defaultValues.credentials.client_secret;
      if (hasOAuthFields) {
        setIsOAuthEnabled(true);
      }
    }

    return () => {
      form.reset({});
    };
  }, [defaultValues, provider, files?.length]);

  // Helper function to get field label based on OAuth state
  const getFieldLabel = (fieldId: string, fieldName: string) => {
    if (provider.provider_id === "azuresql" && isOAuthEnabled) {
      const labelMap: Record<string, string> = {
        user: "Client ID",
        password: "Client Secret",
        port: "Tenant ID",
      };
      return labelMap[fieldId] || fieldName;
    }
    return fieldName;
  };

  // Helper function to check if field is required
  const isFieldRequired = (fieldId: string) => {
    if (
      provider.provider_id === "azuresql" &&
      isOAuthEnabled &&
      fieldId === "port"
    ) {
      return true;
    }
    return (
      provider.provider_id !== "file_upload" &&
      !defaultValues?.name &&
      provider?.form?.required?.includes(fieldId)
    );
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-4"
        >
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="col-span-2">
                <FormLabel>
                  Unique Name
                  <span className="ml-1 text-sm text-destructive">*</span>
                </FormLabel>
                {provider.provider_id === "file_upload" && (
                  <FormDescription>
                    Enter a name using only letters, numbers, and underscores
                  </FormDescription>
                )}
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Give this connection a name"
                    className="border"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {provider.provider_id === "azuresql" && (
            <div className="col-span-2 flex items-center space-x-2">
              <Switch
                id="oauth-mode"
                checked={isOAuthEnabled}
                onCheckedChange={setIsOAuthEnabled}
              />
              <Label htmlFor="oauth-mode" className="cursor-pointer">
                Entra ID
              </Label>
            </div>
          )}
          {config.map((field) => (
            <FormField
              key={field.field_id}
              control={form.control}
              name={field.field_id}
              render={({ field: formField }) => (
                <FormItem
                  className={cn(
                    ["user", "host", "port", "password"].includes(
                      field.field_id,
                    )
                      ? "col-span-1"
                      : "col-span-2",
                  )}
                >
                  {field.field_id === "connection_kwargs" ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <FormLabel>
                          {getFieldLabel(field?.field_id, field?.field_name)}
                          {isFieldRequired(field?.field_id) && (
                            <span className="ml-1 text-sm text-destructive">
                              *
                            </span>
                          )}
                        </FormLabel>
                      </TooltipTrigger>

                      <TooltipContent
                        className="relative left-[25%] w-1/2"
                        side="top"
                      >
                        Add your connection options (e.g. authSource,
                        directConnection) in JSON format. Visit this{" "}
                        <Link to="https://pymongo.readthedocs.io/en/stable/api/pymongo/mongo_client.html#pymongo.mongo_client.mongoclient">
                          link
                        </Link>{" "}
                        for all available options
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    <FormLabel>
                      {getFieldLabel(field?.field_id, field?.field_name)}
                      {isFieldRequired(field?.field_id) && (
                        <span className="ml-1 text-sm text-destructive">
                          *
                        </span>
                      )}
                    </FormLabel>
                  )}
                  <FormControl>
                    {getFormField({
                      id: field?.field_id,
                      type: field?.field_type,
                      name: field?.field_name,
                      multiple: field?.field_multiple,
                      accepted_formats: field?.field_accepted_formats,
                      formField,
                    })}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
          <div className="col-span-2 flex flex-col gap-2 text-xxs text-muted-foreground">
            <p>
              By uploading documents to Lyzr, you confirm that you have the
              right to share the information contained within them. You must not
              upload any documents that contain sensitive personal data (such as
              health records, financial information, government IDs) unless you
              have obtained the necessary consents and comply with all
              applicable data protection laws.
            </p>
            <p>
              By using this service, you agree to indemnify and hold harmless,
              Lyzr.ai and its affiliates, officers, employees, and agents from
              any claims, liabilities, damages, losses, or expenses (including
              legal fees) arising from your failure to comply with this policy,
              including but not limited to the unauthorized upload of sensitive
              personal data.
            </p>
            {provider?.provider_id !== "file_upload" && (
              <div className="mt-2 flex items-center justify-between">
                <a
                  href={provider.form.help_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="size-3" />
                  View Documentation
                </a>
              </div>
            )}
          </div>
          <Separator className="col-span-2" />
          <DialogFooter className="col-span-2 sm:justify-between">
            <span className="inline-flex items-baseline gap-1">
              <p className="text-destructive">*</p>
              <p className="text-sm">marked as required</p>
            </span>
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => setIsTableView(true)}>
                Cancel
              </Button>
              <Button
                loading={
                  form.formState.isSubmitting ||
                  isUpdatingCredential ||
                  isSavingFileCredential ||
                  isUpdingFileCredential
                }
              >
                Submit
              </Button>
            </div>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
};

export default AddCredentialsForm;
