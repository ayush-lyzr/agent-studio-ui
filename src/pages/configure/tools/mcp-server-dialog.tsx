import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useTools } from "./tools-service";
import useStore from "@/lib/store";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  server_url: z
    .string()
    .url("Invalid URL format")
    .min(1, "Server URL is required"),
  auth_type: z.enum(["no_auth", "api_key", "oauth"], {
    required_error: "Auth type is required",
  }),
});

interface MCPServerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function MCPServerDialog({
  open,
  onOpenChange,
  onSuccess,
}: MCPServerDialogProps) {
  const apiKey = useStore((state) => state.api_key);
  const { createMCPServer, isCreatingMCPServer } = useTools({ apiKey });
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [serverName, setServerName] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      server_url: "",
      auth_type: "no_auth",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      await createMCPServer({
        payload: {
          config: {
            auth_type: values.auth_type,
            server_url: values.server_url,
          },
          description: values.description,
          name: values.name,
        },
      });
      setServerName(values.name);
      setCurrentStep(2);
    } catch (error) {
      console.error("Error:", error);
    }
  }

  const handleClose = () => {
    form.reset();
    setCurrentStep(1);
    setServerName("");
    onOpenChange(false);
    if (currentStep === 2) {
      onSuccess?.();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        {currentStep === 1 ? (
          <>
            <DialogHeader>
              <DialogTitle>Add MCP Server</DialogTitle>
            </DialogHeader>
            <DialogDescription>Add MCP Server as a tool.</DialogDescription>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter server name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter server description"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="server_url"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Server URL</FormLabel>
                        <Link
                          to="https://modelcontextprotocol.io/docs/develop/build-server"
                          target="_blank"
                          className="text-xs text-link underline-offset-2 hover:underline"
                        >
                          Learn how to get started
                        </Link>
                      </div>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="auth_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Auth Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select auth type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="no_auth">No Auth</SelectItem>
                          <SelectItem value="api_key">API Key</SelectItem>
                          <SelectItem value="oauth">OAuth</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isCreatingMCPServer}>
                    Add Server
                  </Button>
                </div>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Step 2: Connect Your MCP Server</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-success" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    Server "{serverName}" has been added successfully!
                  </p>
                  <p className="mt-1 text-sm">
                    A tool card has been automatically generated for your MCP
                    server.
                  </p>
                </div>
              </div>
              <div className="space-y-3 pt-2">
                <p className="text-sm font-medium">Next steps:</p>
                <ol className="list-inside list-decimal space-y-2 text-sm">
                  <li>
                    Find the tool card for your MCP server in the tools list
                  </li>
                  <li>Click on the tool card to open it</li>
                  <li>
                    Click the "Connect" button to establish the connection
                  </li>
                  <li>
                    If authentication is required, enable "Use your custom
                    OAuth" option
                  </li>
                </ol>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={handleClose}>
                  Close
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
