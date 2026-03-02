import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import mixpanel from "mixpanel-browser";
import { useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isMixpanelActive, MARKETPLACE_URL } from "@/lib/constants";
import { LaunchProps } from "../types";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  INDUSTRY_OPTIONS,
  FUNCTION_OPTIONS,
  CATEGORY_OPTIONS,
} from "@/lib/constants";
import { Link, Rocket } from "lucide-react";
import { isOrgMode } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { Path } from "@/lib/types";
import useStore from "@/lib/store";

export function Launch({
  open,
  onOpenChange,
  agent,
  currentUser,
  userId,
}: LaunchProps) {
  const [showForm, setShowForm] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [publishedAgentLink, setPublishedAgentLink] = useState<string | null>(
    null,
  );

  const token = useStore((state) => state.app_token);
  const { current_organization, usage_data } = useManageAdminStore(
    (state) => state,
  );

  const launchFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    creator: z
      .string()
      .default(
        currentUser?.customFields?.["first-name"] ??
          currentUser?.auth?.email ??
          "Anonymous",
      ),
    user_id: z.string(),
    welcome_message: z.string().optional(),
    agent_id: z.string(),
    public: z.boolean(),
    tags: z.object({
      industry: z.string(),
      function: z.string(),
      category: z.string().min(1, "Category is required"),
    }),
    visibility: z.enum(["private", "public", "organization"]),
  });

  type LaunchFormValues = z.infer<typeof launchFormSchema>;

  const form = useForm<LaunchFormValues>({
    resolver: zodResolver(launchFormSchema),
    defaultValues: {
      name: agent?.name,
      description: agent?.description,
      creator:
        currentUser?.customFields?.["first-name"] ??
        currentUser?.auth?.email ??
        "Anonymous",
      user_id: userId || "",
      welcome_message: "",
      agent_id: agent?._id,
      public: false,
      tags: {
        industry: "",
        function: "",
        category: "",
      },
      visibility: "private" as const,
    },
  });

  const handlePublicConfirm = async () => {
    if (publishedAgentLink) {
      try {
        await navigator.clipboard.writeText(publishedAgentLink);
        if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
          mixpanel.track("User clicked Share Link");
        toast({
          title: "Link copied!",
        });
      } catch (err) {
        toast({
          title: "Failed to copy!",
          variant: "destructive",
        });
      }
    }
    setShowLaunchDialog(false);
    onOpenChange(false);
  };

  const onSubmit = async (data: LaunchFormValues) => {
    try {
      const formData = {
        ...data,
        public: data.visibility === "public",
        organization_id:
          data?.visibility === "organization"
            ? current_organization?.org_id
            : undefined,
        visibility: undefined,
        categories: undefined,
      };

      const res = await axios.post("/app/", formData, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Launched an app", data);
      queryClient.invalidateQueries({ queryKey: ["userApps"] });

      const linkOfAgent = `${window.location.origin}/agent/${res.data?.id}`;
      if (data.visibility === "public") {
        setPublishedAgentLink(linkOfAgent);
        setShowLaunchDialog(true);
      } else {
        toast({
          title: "Success!",
          description:
            "Agent created successfully. Please check the marketplace.",
          action: (
            <Button onClick={() => window.open(linkOfAgent)}>View Agent</Button>
          ),
        });
      }
      navigate(`${Path.AGENT_CREATE}/${agent?._id}`, {
        state: {
          isLaunched: true,
          appId: res.data?.id,
        },
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error creating app:", error);
      toast({
        title: "Error!",
        description:
          error.response?.data?.detail ??
          "Failed to create the app. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    form.reset({
      name: agent?.name,
      description: agent?.description,
      creator:
        currentUser?.customFields?.["first-name"] ??
        currentUser?.auth?.email ??
        "Anonymous",
      user_id: userId ?? "",
      agent_id: agent?._id,
      public: false,
      tags: {
        industry: "",
        function: "",
        category: "",
      },
      visibility: "private" as const,
    });
  }, [userId, currentUser, agent]);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Launch Agent as App</DialogTitle>
          </DialogHeader>
          <Separator className="mb-4" />

          {!showForm ? (
            <div className="space-y-6">
              <div className="space-y-4 text-center">
                <p className="text-lg font-medium">
                  Ready to Launch Your Agent?
                </p>
                <p className="text-sm text-muted-foreground">
                  Before proceeding, please ensure you are satisfied with the
                  quality of your agent's inferences. Any subsequent changes you
                  make to this agent will automatically reflect in the launched
                  app. Once launched, the app will be available according to
                  your visibility settings.
                </p>
              </div>
              <div className="flex justify-center pt-4">
                <Button onClick={() => setShowForm(true)}>
                  Yes I am ready
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                        App Name
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="w-[200px]"
                    >
                      Enter a unique name for your app
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Input
                  {...form.register("name")}
                  id="name"
                  placeholder="Enter app name"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                        Description
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="w-[200px]"
                    >
                      Provide a detailed description of your app's functionality
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Textarea
                  {...form.register("description")}
                  id="description"
                  placeholder="Describe your app..."
                  rows={4}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                        Welcome Message
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="w-[200px]"
                    >
                      Provide a welcome message for your app
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Textarea
                  {...form.register("welcome_message")}
                  id="welcome_message"
                  placeholder="Write your welcome message..."
                  rows={3}
                />
                {form.formState.errors.welcome_message && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.welcome_message.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                        Category
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="w-[200px]"
                    >
                      Select a category for your app
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="flex flex-wrap gap-2">
                  {CATEGORY_OPTIONS.map((category) => (
                    <Button
                      key={category}
                      type="button"
                      variant={
                        form.watch("tags.category") === category
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      className="rounded-full"
                      onClick={() => form.setValue("tags.category", category)}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
                {form.formState.errors.tags?.category && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.tags.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                        Industry
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="w-[200px]"
                    >
                      Select an industry for your app
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select
                  onValueChange={(value) =>
                    form.setValue("tags.industry", value)
                  }
                  value={form.watch("tags.industry")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {INDUSTRY_OPTIONS.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                        Function
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="w-[200px]"
                    >
                      Select a function for your app
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <Select
                  onValueChange={(value) =>
                    form.setValue("tags.function", value)
                  }
                  value={form.watch("tags.function")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select function" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {FUNCTION_OPTIONS.map((func) => (
                        <SelectItem key={func} value={func}>
                          {func}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label className="cursor-help underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
                        Visibility
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent
                      side="top"
                      align="start"
                      className="flex w-[250px] flex-col gap-2"
                    >
                      <p>Choose who can see and access your app</p>
                      <p>
                        Private - Publishes your agent to the Agent Marketplace,
                        but only you can view and access it.
                      </p>
                      <p>
                        Public - Publishes your agent to the Agent Marketplace,
                        visible to all Lyzr Agent Studio users. You can also
                        share the app with anyone via a link.
                      </p>
                      <p>
                        Organization - Available for Teams plan and above.
                        Publishes your agent so all members within your
                        organization can view and use it.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <RadioGroup
                  defaultValue="private"
                  onValueChange={(value) =>
                    form.setValue("visibility", value as "private" | "public")
                  }
                  className="flex space-x-4"
                >
                  {["private", "public"].map((value) => (
                    <div key={value} className="flex items-center space-x-2">
                      <RadioGroupItem value={value} id={value} />
                      <Label htmlFor={value}>
                        {value.charAt(0).toUpperCase() + value.slice(1)}
                      </Label>
                    </div>
                  ))}
                  {isOrgMode(usage_data?.plan_name) && (
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem
                        value={"organization"}
                        id={"organization"}
                      />
                      <Label htmlFor={"organization"}>Organization</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => form.reset()}
                >
                  Reset
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting}>
                  Launch App
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={showLaunchDialog} onOpenChange={setShowLaunchDialog}>
        <DialogContent>
          <DialogHeader>
            <Rocket className="align-center h-20 w-full" />
            <DialogTitle>Your App Is Live!</DialogTitle>
            <DialogDescription>
              It's now up and running. Since it's public, you can share it with
              friends, teammates, or anyone who might find it useful. Copy the
              link and spread the word!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              className="flex gap-2"
              onClick={handlePublicConfirm}
            >
              <Link className="h-4 w-4" /> Share Link
            </Button>
            <Button
              className="flex gap-2"
              onClick={() => window.open(publishedAgentLink ?? "", "_blank")}
            >
              View Launched Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
