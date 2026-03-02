import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  ClipboardPaste,
  Copy,
  Check,
  Settings,
  Code,
  ArrowLeft,
} from "lucide-react";
import axios, { AxiosResponse } from "axios";
import useStore from "@/lib/store";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import mixpanel from "mixpanel-browser";
import { BASE_URL, isDevEnv, isMixpanelActive } from "@/lib/constants";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTools } from "./tools-service";
import { OptionCard } from "@/components/ui/option-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ACI_EXAMPLES as ACI_EXAMPLES_DATA,
  type AciExampleValue,
} from "./aci-examples";

const formSchema = z
  .object({
    toolType: z.enum(["custom", "aci"]).default("custom"),
    tool_set_name: z.string().optional(),
    openApiSchema: z.string().optional(),
    defaultHeaders: z
      .string()
      .default("{}")
      .refine((value) => {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          return false;
        }
      }, "Invalid JSON format"),
    defaultQueryParams: z
      .string()
      .default("{}")
      .refine((value) => {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          return false;
        }
      }, "Invalid JSON format"),
    defaultBodyParams: z
      .string()
      .default("{}")
      .refine((value) => {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          return false;
        }
      }, "Invalid JSON format"),
    endpointDefaults: z
      .string()
      .default("{}")
      .refine((value) => {
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          return false;
        }
      }, "Invalid JSON format"),
    enhanceDescriptions: z.boolean().default(false),
    appJson: z.string().optional(),
    functionJson: z.string().optional(),
    secrets: z
      .string()
      .default("")
      .refine((value) => {
        if (!value || value.trim() === "") {
          return true;
        }
        try {
          JSON.parse(value);
          return true;
        } catch (e) {
          return false;
        }
      }, "Invalid JSON format"),
  })
  .refine(
    (data) => {
      if (data.toolType === "custom") {
        if (!data.tool_set_name || data.tool_set_name.trim() === "") {
          return false;
        }
        if (!/^[a-z0-9_]*$/.test(data.tool_set_name)) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Tool set name is required and must contain only lowercase letters, numbers, and underscores.",
      path: ["tool_set_name"],
    },
  )
  .refine(
    (data) => {
      if (data.toolType === "custom") {
        if (!data.openApiSchema || data.openApiSchema.trim() === "") {
          return false;
        }
        try {
          JSON.parse(data.openApiSchema);
        } catch (e) {
          return false;
        }
      }
      return true;
    },
    {
      message: "OpenAPI schema is required and must be valid JSON.",
      path: ["openApiSchema"],
    },
  )
  .refine(
    (data) => {
      if (data.toolType === "aci") {
        if (!data.appJson || data.appJson.trim() === "") {
          return false;
        }
        try {
          JSON.parse(data.appJson);
        } catch (e) {
          return false;
        }
      }
      return true;
    },
    {
      message: "App JSON is required and must be valid JSON for ACI tools.",
      path: ["appJson"],
    },
  )
  .refine(
    (data) => {
      if (data.toolType === "aci") {
        if (!data.functionJson || data.functionJson.trim() === "") {
          return false;
        }
        try {
          JSON.parse(data.functionJson);
        } catch (e) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Function JSON is required and must be valid JSON for ACI tools.",
      path: ["functionJson"],
    },
  );

type CustomToolDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  isLimitReached?: boolean;
  remainingSlots?: number;
};

export function CustomToolDialog({
  open,
  onOpenChange,
  onSuccess,
  isLimitReached = false,
  remainingSlots = 0,
}: CustomToolDialogProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [pasteSuccess, setPasteSuccess] = useState(false);
  const [currentStep, setCurrentStep] = useState<"selection" | "form">(
    "selection",
  );
  const apiKey = useStore((state) => state.api_key);
  const userEmail = useStore((state) => state.userEmail);
  const { createCustomAciTool, isCreatingCustomAciTool, createOpenAPITool } =
    useTools({ apiKey });
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      toolType: "custom",
      tool_set_name: "",
      openApiSchema: JSON.stringify(
        {
          openapi: "3.0.0",
          info: {
            title: "Sample API",
            version: "1.0.0",
            description: "A sample API specification",
          },
          servers: [
            {
              url: "https://api.example.com/v1",
              description: "Production server",
            },
          ],
          paths: {
            "/users": {
              get: {
                summary: "Get all users",
                description: "Retrieve a list of users",
                operationId: "getUsers",
                parameters: [
                  {
                    name: "limit",
                    in: "query",
                    description: "Maximum number of users to return",
                    required: false,
                    schema: {
                      type: "integer",
                      format: "int32",
                    },
                  },
                ],
                responses: {
                  "200": {
                    description: "Successful response",
                    content: {
                      "application/json": {
                        schema: {
                          type: "array",
                          items: {
                            type: "object",
                            required: ["id", "name", "email"],
                            properties: {
                              id: {
                                type: "integer",
                                format: "int64",
                                description: "The unique identifier for a user",
                              },
                              name: {
                                type: "string",
                                description: "The name of the user",
                              },
                              email: {
                                type: "string",
                                format: "email",
                                description: "The email address of the user",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  "400": {
                    description: "Bad request",
                  },
                },
              },
            },
          },
        },
        null,
        2,
      ),
      defaultHeaders: JSON.stringify(
        {
          "Content-Type": "application/json",
        },
        null,
        2,
      ),
      defaultQueryParams: "{}",
      defaultBodyParams: "{}",
      endpointDefaults: "{}",
      enhanceDescriptions: true,
      appJson: "",
      functionJson: "",
      secrets: "",
    },
  });

  const input = form.watch("openApiSchema");

  const handleClose = () => {
    onOpenChange(false);
    setCurrentStep("selection");
  };

  const handleBackToSelection = () => {
    setCurrentStep("selection");
  };

  const handleToolTypeSelect = (toolType: "custom" | "aci") => {
    form.setValue("toolType", toolType);
    setCurrentStep("form");
  };

  const handleLoadExample = (example: AciExampleValue) => {
    const data = ACI_EXAMPLES_DATA.find((e) => e.value === example);
    if (!data) return;
    form.setValue("appJson", JSON.stringify(data.appJson, null, 2));
    form.setValue("functionJson", JSON.stringify(data.functionJson, null, 2));
    form.setValue("secrets", JSON.stringify(data.secrets, null, 2));
  };

  const { mutateAsync: convertSchema, isPending: isConvertingSchema } =
    useMutation({
      mutationFn: () =>
        axios.post(
          `/v3/inference/chat/`,
          {
            user_id: "studio",
            agent_id: isDevEnv
              ? "68cce28e2b34e0a6dca5182a"
              : "68df92e74ff50f8d1e964669",
            message: input,
            session_id: isDevEnv
              ? "68cce28e2b34e0a6dca5182a-cgeo6ugkdlm"
              : "68df92e74ff50f8d1e964669-qxd8h10qud",
          },
          {
            baseURL: BASE_URL,
            headers: {
              accept: "application/json",
              "x-api-key": apiKey,
              "Content-Type": "application/json",
            },
          },
        ),
      onSuccess: (res: AxiosResponse) => {
        form.setValue("openApiSchema", res.data?.response);
      },
    });

  const handleReset = () => {
    const currentToolType = form.getValues("toolType");
    form.reset({
      toolType: currentToolType,
      tool_set_name: "",
      openApiSchema: JSON.stringify(
        {
          openapi: "3.0.0",
          info: {
            title: "Sample API",
            version: "1.0.0",
            description: "A sample API specification",
          },
          servers: [
            {
              url: "https://api.example.com/v1",
              description: "Production server",
            },
          ],
          paths: {
            "/users": {
              get: {
                summary: "Get all users",
                description: "Retrieve a list of users",
                operationId: "getUsers",
                parameters: [
                  {
                    name: "limit",
                    in: "query",
                    description: "Maximum number of users to return",
                    required: false,
                    schema: {
                      type: "integer",
                      format: "int32",
                    },
                  },
                ],
                responses: {
                  "200": {
                    description: "Successful response",
                    content: {
                      "application/json": {
                        schema: {
                          type: "array",
                          items: {
                            type: "object",
                            required: ["id", "name", "email"],
                            properties: {
                              id: {
                                type: "integer",
                                format: "int64",
                                description: "The unique identifier for a user",
                              },
                              name: {
                                type: "string",
                                description: "The name of the user",
                              },
                              email: {
                                type: "string",
                                format: "email",
                                description: "The email address of the user",
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                  "400": {
                    description: "Bad request",
                  },
                },
              },
            },
          },
        },
        null,
        2,
      ),
      defaultHeaders: JSON.stringify(
        {
          "Content-Type": "application/json",
        },
        null,
        2,
      ),
      defaultQueryParams: "{}",
      defaultBodyParams: "{}",
      endpointDefaults: "{}",
      enhanceDescriptions: true,
      appJson: "",
      functionJson: "",
      secrets: "",
    });
  };

  useEffect(() => {
    if (!open) {
      setCurrentStep("selection");
      form.reset({
        toolType: "custom",
        tool_set_name: "",
        openApiSchema: JSON.stringify(
          {
            openapi: "3.0.0",
            info: {
              title: "Sample API",
              version: "1.0.0",
              description: "A sample API specification",
            },
            servers: [
              {
                url: "https://api.example.com/v1",
                description: "Production server",
              },
            ],
            paths: {
              "/users": {
                get: {
                  summary: "Get all users",
                  description: "Retrieve a list of users",
                  operationId: "getUsers",
                  parameters: [
                    {
                      name: "limit",
                      in: "query",
                      description: "Maximum number of users to return",
                      required: false,
                      schema: {
                        type: "integer",
                        format: "int32",
                      },
                    },
                  ],
                  responses: {
                    "200": {
                      description: "Successful response",
                      content: {
                        "application/json": {
                          schema: {
                            type: "array",
                            items: {
                              type: "object",
                              required: ["id", "name", "email"],
                              properties: {
                                id: {
                                  type: "integer",
                                  format: "int64",
                                  description:
                                    "The unique identifier for a user",
                                },
                                name: {
                                  type: "string",
                                  description: "The name of the user",
                                },
                                email: {
                                  type: "string",
                                  format: "email",
                                  description: "The email address of the user",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                    "400": {
                      description: "Bad request",
                    },
                  },
                },
              },
            },
          },
          null,
          2,
        ),
        defaultHeaders: JSON.stringify(
          {
            "Content-Type": "application/json",
          },
          null,
          2,
        ),
        defaultQueryParams: "{}",
        defaultBodyParams: "{}",
        endpointDefaults: "{}",
        enhanceDescriptions: true,
        appJson: "",
        functionJson: "",
        secrets: "",
      });
    }
  }, [open, form]);

  async function handlePaste() {
    try {
      const text = await navigator.clipboard.readText();
      try {
        JSON.parse(text);
        form.setValue("openApiSchema", text);
        setPasteSuccess(true);
        setTimeout(() => setPasteSuccess(false), 2000);
      } catch (e) {
        form.setError("openApiSchema", {
          type: "manual",
          message: "Invalid JSON format",
        });
      }
    } catch (err) {
      console.error("Failed to read clipboard:", err);
    }
  }
  const HTTP_METHODS = [
    "get",
    "post",
    "put",
    "patch",
    "delete",
    "options",
    "head",
    "trace",
  ];

  const countCustomTools = (jsonString: string): number => {
    try {
      const spec = JSON.parse(jsonString);
      if (!spec?.paths || typeof spec.paths !== "object") return 0;
      let count = 0;
      for (const path of Object.keys(spec.paths)) {
        const item = spec.paths[path];
        if (!item || typeof item !== "object") continue;
        for (const method of HTTP_METHODS) {
          if (item[method]) count++;
        }
      }
      return count;
    } catch {
      return 0;
    }
  };

  async function handleCopy() {
    try {
      const schemaValue = form.getValues("openApiSchema");
      if (schemaValue) {
        await navigator.clipboard.writeText(schemaValue);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      setIsValidating(true);
      if (values.toolType === "custom") {
        const ops = countCustomTools(values.openApiSchema || "");

        if (ops > remainingSlots) {
          form.setError("openApiSchema", {
            type: "manual",
            message:
              "Your current plan doesn't allow adding more tools. Upgrade your plan to increase your tool limit.",
          });
          return;
        }

        const requestBody = {
          tool_set_name: values.tool_set_name,
          openapi_schema: JSON.parse(values.openApiSchema || "{}"),
          default_headers: JSON.parse(values.defaultHeaders),
          default_query_params: JSON.parse(values.defaultQueryParams),
          default_body_params: JSON.parse(values.defaultBodyParams),
          endpoint_defaults: JSON.parse(values.endpointDefaults),
          enhance_descriptions: values.enhanceDescriptions,
          user_id: userEmail,
        };

        await createOpenAPITool(requestBody);
        toast.success("Custom tool created successfully");
      } else {
        const parsedAppJson = JSON.parse(values.appJson || "{}");
        const parsedFunctionJson = JSON.parse(values.functionJson || "{}");
        let parsedSecrets = {};

        if (values.secrets.trim()) {
          parsedSecrets = JSON.parse(values.secrets);
        }

        await createCustomAciTool({
          app_json: parsedAppJson,
          functions_json: parsedFunctionJson,
          secrets: parsedSecrets,
        });

        toast.success("Custom ACI tool created successfully");
      }

      onSuccess?.();
      onOpenChange(false);
      setCurrentStep("selection");
    } catch (error) {
      if (error instanceof SyntaxError) {
        const fieldName =
          values.toolType === "custom" ? "openApiSchema" : "appJson";
        form.setError(fieldName, {
          type: "manual",
          message: "Invalid JSON format",
        });
      } else {
        console.error("Failed to add tool:", error);
      }
    } finally {
      setIsValidating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="inline-flex items-center gap-2 font-semibold">
            {currentStep === "form" && (
              <ArrowLeft
                className="size-4 cursor-pointer"
                onClick={handleBackToSelection}
              />
            )}
            Add Custom Tool
          </DialogTitle>
          <DialogDescription className="flex gap-2">
            {currentStep === "selection" && (
              <>
                Connect agents to external API.
                <Link
                  to="https://www.avanade.com/en-gb/services"
                  target="_blank"
                  className="flex items-center text-link underline-offset-4 hover:underline"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("Docs-clicked", {
                        feature: "Add Custom Tools",
                      });
                  }}
                >
                  Docs
                  <ArrowTopRightIcon className="ml-1 size-3" />
                </Link>
                <Link
                  to="https://www.avanade.com/en-gb/services"
                  target="_blank"
                  className="flex items-center text-link underline-offset-4 hover:underline"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("API-clicked", {
                        feature: "Add Custom Tools",
                      });
                  }}
                >
                  API
                  <ArrowTopRightIcon className="ml-1 size-3" />
                </Link>
                <Link
                  to="https://www.youtube.com/watch?v=35ps6gzIPTE"
                  target="_blank"
                  className="flex items-center text-link underline-offset-4 hover:underline"
                  onClick={() => {
                    if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
                      mixpanel.track("Video-clicked", {
                        feature: "Add Custom Tools",
                      });
                  }}
                >
                  Video
                  <ArrowTopRightIcon className="ml-1 size-3" />
                </Link>
              </>
            )}
            {currentStep === "form" && (
              <span>
                Click on examples to view the required input format. We support
                No-Auth, OAuth and API key methods.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <Separator />
        {currentStep === "selection" ? (
          <div className="space-y-4">
            <OptionCard
              icon={<Settings className="size-5 text-muted-foreground" />}
              title="Custom Tool (OpenAPI)"
              description={[
                "Recommended for static APIs that need no auth",
                "Easy to add and faster execution",
                "Follows OpenAPI schema format to connect APIs",
              ]}
              onClick={() => handleToolTypeSelect("custom")}
            />
            <OptionCard
              icon={<Code className="size-5 text-muted-foreground" />}
              title="Custom ACI Tool"
              description={[
                "Built in-house using ACI.dev (open-source)",
                "Supports custom OAuth",
                "Secure system for storing and refreshing tokens",
              ]}
              onClick={() => handleToolTypeSelect("aci")}
            />
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="no-scrollbar mt-2 h-full max-h-[60vh] space-y-6 overflow-y-auto px-1"
            >
              {form.watch("toolType") === "custom" && (
                <>
                  <FormField
                    control={form.control}
                    name="tool_set_name"
                    render={({ field }) => (
                      <FormItem>
                        <LabelWithTooltip
                          tooltip="A unique name to identify this tool set"
                          required={true}
                        >
                          Tool Set Name
                        </LabelWithTooltip>
                        <FormControl>
                          <input
                            {...field}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:border-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="openApiSchema"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center justify-between">
                          <LabelWithTooltip
                            tooltip="The OpenAPI/Swagger specification that defines your API endpoints"
                            required={true}
                          >
                            OpenAPI Schema
                          </LabelWithTooltip>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleCopy}
                              className="w-24"
                            >
                              {copySuccess ? (
                                <>
                                  <Check className="mr-1 h-4 w-4 text-green-500" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="mr-1 h-4 w-4" />
                                  Copy
                                </>
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handlePaste}
                              className="w-24"
                            >
                              {pasteSuccess ? (
                                <>
                                  <Check className="mr-1 h-4 w-4 text-green-500" />
                                  Pasted!
                                </>
                              ) : (
                                <>
                                  <ClipboardPaste className="mr-1 h-4 w-4" />
                                  Paste
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                        <FormControl>
                          <Textarea
                            className="min-h-[200px] font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <span className="text-xs">
                          Not sure what OpenAPI format is?
                        </span>
                        <Button
                          variant="link"
                          type="button"
                          loading={isConvertingSchema}
                          disabled={!Boolean(input?.length)}
                          onClick={() => convertSchema()}
                          className="text-xs text-link underline"
                        >
                          Convert API details in one click
                        </Button>
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="defaultHeaders"
                      render={({ field }) => (
                        <FormItem>
                          <LabelWithTooltip
                            tooltip="Default HTTP headers to be sent with every request"
                            required={false}
                          >
                            Default Headers (JSON)
                          </LabelWithTooltip>
                          <FormControl>
                            <Textarea
                              className="h-[4.5rem] font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultQueryParams"
                      render={({ field }) => (
                        <FormItem>
                          <LabelWithTooltip
                            tooltip="Default query parameters to be included in every request URL"
                            required={false}
                          >
                            Default Query Parameters (JSON)
                          </LabelWithTooltip>
                          <FormControl>
                            <Textarea
                              className="h-[4.5rem] font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="defaultBodyParams"
                      render={({ field }) => (
                        <FormItem>
                          <LabelWithTooltip
                            tooltip="Default parameters to be included in every request body"
                            required={false}
                          >
                            Default Body Parameters (JSON)
                          </LabelWithTooltip>
                          <FormControl>
                            <Textarea
                              className="h-[4.5rem] font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endpointDefaults"
                      render={({ field }) => (
                        <FormItem>
                          <LabelWithTooltip
                            tooltip="Default configurations for specific endpoints"
                            required={false}
                          >
                            Endpoint Defaults (JSON)
                          </LabelWithTooltip>
                          <FormControl>
                            <Textarea
                              className="h-[4.5rem] font-mono text-xs"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="enhanceDescriptions"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="h-4 w-4"
                          />
                        </FormControl>
                        <LabelWithTooltip
                          tooltip="Enable AI-powered enhancement of endpoint descriptions"
                          required={false}
                        >
                          Enhance Descriptions
                        </LabelWithTooltip>
                      </FormItem>
                    )}
                  />
                </>
              )}
              {form.watch("toolType") === "aci" && (
                <>
                  <FormField
                    control={form.control}
                    name="appJson"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center justify-between p-1">
                          <LabelWithTooltip
                            tooltip="Add your App JSON configuration."
                            required={true}
                          >
                            App JSON
                          </LabelWithTooltip>
                          <div className="w-56">
                            <Select
                              onValueChange={(e) => handleLoadExample(e as any)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select example" />
                              </SelectTrigger>
                              <SelectContent>
                                {ACI_EXAMPLES_DATA.map((ex) => (
                                  <SelectItem key={ex.value} value={ex.value}>
                                    {ex.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <FormControl>
                          <Textarea
                            className="min-h-[200px] font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="functionJson"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center justify-between">
                          <LabelWithTooltip
                            tooltip="Add your Function JSON configuration."
                            required={true}
                          >
                            Function JSON
                          </LabelWithTooltip>
                        </div>
                        <FormControl>
                          <Textarea
                            className="min-h-[200px] font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="secrets"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <div className="flex items-center justify-between">
                          <LabelWithTooltip
                            tooltip="Add secrets configuration for your ACI tool"
                            required={false}
                          >
                            Secrets
                          </LabelWithTooltip>
                        </div>
                        <FormControl>
                          <Textarea
                            className="min-h-[100px] font-mono text-xs"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              <Separator />
              <div className="flex justify-between gap-2">
                <Button type="button" variant="outline" onClick={handleReset}>
                  Reset
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      isValidating || isCreatingCustomAciTool || isLimitReached
                    }
                  >
                    {isValidating || isCreatingCustomAciTool
                      ? "Adding..."
                      : "Add Tool"}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
