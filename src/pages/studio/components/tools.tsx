import React, { useState } from "react";
import axios from "axios";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import useStore from "@/lib/store";

type ConfigField = {
  [key: string]: string | undefined;
};

interface Tool {
  name: string;
  logo: JSX.Element;
  enabled: boolean;
  desc: string;
  id: string;
  config: ConfigField | null;
}

interface ToolsTabProps {
  tools: Tool[];
  handleToolSwitchChange: (index: number) => void;
  updateToolConfig: (index: number, config: ConfigField) => void;
}

const emailConfigSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
  host: z.string().min(1, "Host is required"),
  port: z.string().regex(/^\d+$/, "Port must be a number"),
  sender_email: z.string().email("Invalid email format for sender email"),
  reply_to_email: z.string().email("Invalid email format for reply-to email"),
});

const perplexityConfigSchema = z.object({
  api_key: z.string().min(1, "API key is required"),
  model: z.string().min(1, "Model is required"),
});

const linkedInConfigSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

type EmailConfigFormData = z.infer<typeof emailConfigSchema>;
type PerplexityConfigFormData = z.infer<typeof perplexityConfigSchema>;
type LinkedInConfigFormData = z.infer<typeof linkedInConfigSchema>;

const ToolsTab: React.FC<ToolsTabProps> = ({
  tools,
  handleToolSwitchChange,
  updateToolConfig,
}) => {
  const [openDialog, setOpenDialog] = useState<number | null>(null);
  const { toast } = useToast();
  const api_key = useStore((state: any) => state.api_key);

  const getSchemaForTool = (toolId: string) => {
    switch (toolId) {
      case "send_email":
        return emailConfigSchema;
      case "perplexity_search":
        return perplexityConfigSchema;
      case "post_image_and_text_linkedin":
        return linkedInConfigSchema;
      default:
        return z.object({});
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<
    EmailConfigFormData | PerplexityConfigFormData | LinkedInConfigFormData
  >({
    resolver: zodResolver(getSchemaForTool(tools[openDialog || 0]?.id)),
  });

  const onSubmit = async (data: any, index: number) => {
    try {
      const tool = tools[index];

      let requestBody = {};

      switch (tool.id) {
        case "send_email":
          requestBody = {
            openapi: {
              openapi: "3.0.0",
              info: {
                title: "Email API",
                description: "API for sending emails.",
                version: "1.0.0",
              },
              servers: [
                {
                  url: "https://tools-server.lyzr.app",
                  description: "Avanade tools server",
                },
              ],
              components: {
                schemas: {
                  EmailRequest: {
                    type: "object",
                    properties: {
                      receiver_emails: {
                        type: "array",
                        description: "List of recipient email addresses",
                        items: {
                          type: "string",
                          description: "Email address of the recipient",
                        },
                      },
                      subject: {
                        type: "string",
                        description: "Subject of the email",
                      },
                      body: {
                        type: "string",
                        description: "Body is HTML content of the email",
                      },
                      username: {
                        type: "string",
                        description: "SMTP username",
                        default: data.username,
                      },
                      password: {
                        type: "string",
                        description: "SMTP password",
                        default: data.password,
                      },
                      host: {
                        type: "string",
                        description: "SMTP host",
                        default: data.host,
                      },
                      port: {
                        type: "string",
                        description: "SMTP port",
                        default: data.port,
                      },
                      sender_email: {
                        type: "string",
                        description: "Sender email address",
                        default: data.sender_email,
                      },
                      reply_to_email: {
                        type: "string",
                        description: "Reply-to email address",
                        default: data.reply_to_email,
                      },
                    },
                    required: ["receiver_emails", "subject", "body"],
                  },
                },
              },
              paths: {
                "/send_email/": {
                  post: {
                    summary: "Send an email",
                    description: "Sends an email to the specified recipients.",
                    operationId: "send_email",
                    requestBody: {
                      content: {
                        "application/json": {
                          schema: {
                            $ref: "#/components/schemas/EmailRequest",
                          },
                        },
                      },
                      required: true,
                    },
                    responses: {
                      "200": {
                        description: "Email sent successfully",
                        content: {
                          "application/json": {
                            schema: {
                              type: "object",
                              properties: {
                                status: {
                                  type: "string",
                                  example: "success",
                                },
                              },
                            },
                          },
                        },
                      },
                      "500": {
                        description: "Failed to send email",
                        content: {
                          "application/json": {
                            schema: {
                              type: "object",
                              properties: {
                                detail: {
                                  type: "string",
                                  example:
                                    "Failed to send email: Error message",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          };
          break;
        case "perplexity_search":
          requestBody = {
            openapi: {
              openapi: "3.0.0",
              info: {
                title: "Perplexity AI Search API",
                description: "API for making search requests to Perplexity AI.",
                version: "1.0.0",
              },
              servers: [
                {
                  url: "https://tools-server.lyzr.app",
                  description: "Avanade tools server",
                },
              ],
              components: {
                schemas: {
                  PerplexityRequest: {
                    type: "object",
                    properties: {
                      api_key: {
                        type: "string",
                        description: "API key for Perplexity AI",
                        default: data.api_key,
                      },
                      model: {
                        type: "string",
                        description: "Model to use for the search",
                        default: data.model,
                      },
                      query: {
                        type: "string",
                        description: "Query to search for",
                      },
                    },
                    required: ["query"],
                  },
                },
              },
              paths: {
                "/perplexity_search/": {
                  post: {
                    summary: "Make a search request to Perplexity AI",
                    description:
                      "Makes a search request to Perplexity AI with the specified query.",
                    operationId: "perplexity_search",
                    requestBody: {
                      content: {
                        "application/json": {
                          schema: {
                            $ref: "#/components/schemas/PerplexityRequest",
                          },
                        },
                      },
                      required: true,
                    },
                    responses: {
                      "200": {
                        description: "Search completed successfully",
                        content: {
                          "application/json": {
                            schema: {
                              type: "object",
                              properties: {
                                completion: {
                                  type: "string",
                                  example: "Search result content",
                                },
                              },
                            },
                          },
                        },
                      },
                      "500": {
                        description: "Failed to complete the search",
                        content: {
                          "application/json": {
                            schema: {
                              type: "object",
                              properties: {
                                detail: {
                                  type: "string",
                                  example:
                                    "Failed to complete the search: Error message",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          };
          break;
        case "post_image_and_text_linkedin":
          requestBody = {
            openapi: {
              openapi: "3.0.0",
              info: {
                title: "LinkedIn Post API",
                description: "API for posting images and text on LinkedIn.",
                version: "1.0.0",
              },
              servers: [
                {
                  url: "https://tools-server.lyzr.app",
                  description: "Avanade tools server",
                },
              ],
              components: {
                schemas: {
                  LinkedInPostRequest: {
                    type: "object",
                    properties: {
                      token: {
                        type: "string",
                        description: "LinkedIn API token for authentication",
                        default: data.token,
                      },
                      title: {
                        type: "string",
                        description: "Title for the LinkedIn post",
                      },
                      image_url: {
                        type: "string",
                        description: "URL of the image to post",
                      },
                      text_content: {
                        type: "string",
                        description:
                          "Text content to include in the LinkedIn post",
                      },
                    },
                    required: ["title", "image_url", "text_content"],
                  },
                },
              },
              paths: {
                "/post_linkedin/": {
                  post: {
                    summary: "Post image and text on LinkedIn",
                    description: "Posts an image and text content to LinkedIn.",
                    operationId: "post_image_and_text_linkedin",
                    requestBody: {
                      content: {
                        "application/json": {
                          schema: {
                            $ref: "#/components/schemas/LinkedInPostRequest",
                          },
                        },
                      },
                    },
                    responses: {
                      "200": {
                        description: "Post created successfully",
                        content: {
                          "application/json": {
                            schema: {
                              type: "object",
                              properties: {
                                status: {
                                  type: "string",
                                  example: "success",
                                },
                                response: {
                                  type: "string",
                                  example: "success",
                                },
                              },
                            },
                          },
                        },
                      },
                      "500": {
                        description: "Failed to post on LinkedIn",
                        content: {
                          "application/json": {
                            schema: {
                              type: "object",
                              properties: {
                                detail: {
                                  type: "string",
                                  example:
                                    "Failed to post on LinkedIn: Error message",
                                },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          };
          break;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/v2/tool`,
        requestBody,
        {
          headers: {
            "Content-Type": "application/json",
            "x-api-key": api_key,
          },
        },
      );

      if (response.status === 200) {
        updateToolConfig(index, data);
        setOpenDialog(null);
        toast({
          title: "Configuration Saved",
          description: "The tool configuration has been updated successfully.",
        });
      }
    } catch (error) {
      console.error("Failed to save configuration:", error);
      toast({
        title: "Error",
        description: "Failed to save the configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">
          Enable Tools to interact with third-party services:
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="no-scrollbar grid gap-4 overflow-auto pb-16 pt-4 md:grid-cols-3">
          {tools.map((tool, index) => (
            <li
              key={tool.name}
              className="rounded-lg border p-4 hover:shadow-md"
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center justify-center rounded-lg bg-muted p-2">
                  {tool.logo}
                </div>
                <Switch
                  className="ml-4"
                  checked={tool.enabled}
                  onCheckedChange={() => handleToolSwitchChange(index)}
                />
              </div>
              <div>
                <h2 className="mb-1 font-semibold">{tool.name}</h2>
                <p className="text-gray-500">{tool.desc}</p>
                {tool.config && (
                  <Dialog
                    open={openDialog === index}
                    onOpenChange={(open) => {
                      setOpenDialog(open ? index : null);
                      if (open) {
                        reset(tool.config || {});
                      }
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button variant="outline" className="mt-2">
                        Configure
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Configure {tool.name}</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={handleSubmit((data) => onSubmit(data, index))}
                      >
                        <div className="grid gap-4 py-4">
                          {Object.entries(tool.config).map(([key]) => (
                            <div
                              key={key}
                              className="grid grid-cols-4 items-center gap-4"
                            >
                              <Label htmlFor={key} className="text-right">
                                {key
                                  .split("_")
                                  .map(
                                    (word) =>
                                      word.charAt(0).toUpperCase() +
                                      word.slice(1),
                                  )
                                  .join(" ")}
                              </Label>
                              <div className="col-span-3">
                                <Input id={key} {...register(key as any)} />
                                {errors[key as keyof typeof errors] && (
                                  <p className="mt-1 text-sm text-red-500">
                                    {
                                      errors[key as keyof typeof errors]
                                        ?.message as string
                                    }
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                        <DialogFooter>
                          <Button type="submit">Save</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default ToolsTab;
