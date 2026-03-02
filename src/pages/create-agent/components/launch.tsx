import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import axios from "axios";
import mixpanel from "mixpanel-browser";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Copy, Rocket, Share2, Link } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isMixpanelActive, MAIA_FRONTEND_URL, MAIA_URL, IS_PROPHET_DEPLOYMENT, MARKETPLACE_URL, INDUSTRY_OPTIONS, FUNCTION_OPTIONS, CATEGORY_OPTIONS } from "@/lib/constants";
import { LaunchProps } from "../types";
import { Path, UserRole } from "@/lib/types";
import useStore from "@/lib/store";
import { ShareAppModal } from "@/pages/app/components/share-app-modal";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, isOrgMode } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import axiosInstance from "@/lib/axios";
import { Checkbox } from "@/components/ui/checkbox";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

type PublishTag = {
  label: string;
  id: string;
  tags: string[];
  visible_in_maia: boolean;
};

// Prophet deployment form schema
const prophetFormSchema = z.object({
  creator_id: z.string(),
  tags: z.record(z.string(), z.array(z.string())).refine(
    (data) => Object.values(data).flat().length > 0,
    "Atleast 1 tag is required"
  ),
  is_public: z.boolean(),
  is_consent_accepted: z.boolean().default(false),
});

type ProphetFormValues = z.infer<typeof prophetFormSchema>;

// Non-Prophet deployment form schema
const nonProphetFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  creator: z.string(),
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

type NonProphetFormValues = z.infer<typeof nonProphetFormSchema>;

export function Launch({
  open,
  onOpenChange,
  agent,
  currentUser,
  userId,
  updatedMode,
  initialValues,
  onSuccess,
}: LaunchProps) {
  type ViewState = "intro" | "form" | "success";
  const [view, setView] = useState<ViewState>(updatedMode ? "form" : "intro");
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showLaunchDialog, setShowLaunchDialog] = useState(false);
  const [publishedAgentLink, setPublishedAgentLink] = useState<string | null>(null);

  const token = useStore((state) => state.app_token);

  const { current_organization, usage_data } = useManageAdminStore(
    (state) => state,
  );
  const isBuilder = (current_organization?.role as UserRole) === UserRole.role_builder;

  // Prophet deployment form
  const prophetForm = useForm<ProphetFormValues>({
    resolver: zodResolver(prophetFormSchema),
    defaultValues: {
      creator_id: userId,
      is_public: false,
      is_consent_accepted: false,
    },
  });

  // Non-Prophet deployment form
  const nonProphetForm = useForm<NonProphetFormValues>({
    resolver: zodResolver(nonProphetFormSchema),
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

  const { data: tagsData = [] } = useQuery<PublishTag[]>({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await axiosInstance.get("/api/v1/tags", {
        baseURL: MAIA_URL,
      });
      return res.data;
    },
    enabled: IS_PROPHET_DEPLOYMENT,
  });

  const handlePublicConfirm = async () => {
    const link = IS_PROPHET_DEPLOYMENT
      ? `${MAIA_FRONTEND_URL}/agent-library/${agent?._id}`
      : publishedAgentLink;

    if (link) {
      try {
        await navigator.clipboard.writeText(link);
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

  const launchAppMutation = useMutation({
    mutationFn: async (data: any) => {
      if (updatedMode) {
        const res = await axios.put("/api/v1/agent-registry", data, {
          baseURL: MAIA_URL,
          headers: { Authorization: `Bearer ${token}` },
        });
        return res.data;
      }
      const res = await axios.post("/api/v1/agent-registry", data, {
        baseURL: MAIA_URL,
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
  });

  // Prophet deployment submit handler
  const onProphetSubmit = async (data: ProphetFormValues) => {
    try {
      const { is_consent_accepted, ...rest } = data;
      const formData = {
        ...rest,
        agent_id: agent?._id,
        role: (agent as any)?.agent_role,
        goal: (agent as any)?.agent_goal,
        agent_name: agent?.name,
        description: agent?.description,
      };

      const res = await launchAppMutation.mutateAsync(formData);

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
        mixpanel.track("Launched an app", data);

      onSuccess?.();

      const linkOfAgent = `${MAIA_FRONTEND_URL}/agent-library/${agent?._id}`;

      toast({
        title: "Success!",
        description: updatedMode
          ? "Agent updated successfully."
          : "Agent published successfully.",
        action: (
          <Button onClick={() => window.open(linkOfAgent)}>View Agent</Button>
        ),
      });

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

  // Non-Prophet deployment submit handler
  const onNonProphetSubmit = async (data: NonProphetFormValues) => {
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
    if (IS_PROPHET_DEPLOYMENT) {
      if (updatedMode && initialValues) {
        prophetForm.reset({
          creator_id: initialValues?.data?.creator_id || userId,
          tags: initialValues?.data?.tags || {},
          is_public: initialValues?.data?.is_public ?? false,
        });
      } else {
        prophetForm.reset({
          creator_id: userId,
          tags: {},
          is_public: false,
          is_consent_accepted: false,
        });
      }
    } else {
      nonProphetForm.reset({
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
    }
    if (updatedMode) {
      setView("form");
    } else {
      setView("intro");
    }
  }, [userId, agent, updatedMode, initialValues, currentUser]);

  const variants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 },
  };

  // Render Prophet deployment form
  const renderProphetForm = () => (
    <Form {...prophetForm}>
      <form
        onSubmit={prophetForm.handleSubmit(onProphetSubmit)}
        className="space-y-3"
      >
        <FormField
          control={prophetForm.control}
          name="tags"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <LabelWithTooltip required tooltip="Select tags for better discovery">
                Tags
              </LabelWithTooltip>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between text-left",
                        !Object.values(field.value || {}).flat()
                          ?.length && "text-muted-foreground",
                      )}
                    >
                      <p className="w-[90%] truncate">
                        {Object.values(field.value || {}).flat()
                          ?.length > 0
                          ? `${Object.values(field.value)
                            .flat()
                            .join(", ")}`
                          : "Select tags"}
                      </p>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[500px] p-0"
                  align="start"
                >
                  <Command>
                    <CommandInput placeholder="Search tags..." />
                    <CommandList>
                      <CommandEmpty>No tags found.</CommandEmpty>
                      {tagsData?.map((section) => {
                        const isSingleSelect = section.label === "Owned By";
                        return (
                          <CommandGroup
                            key={section.label}
                            heading={section.label}
                            className="capitalize"
                          >
                            {section.tags.map((item: any) => (
                              <CommandItem
                                key={item}
                                value={item}
                                onSelect={() => {
                                  const currentTags =
                                    field.value?.[section.label] || [];
                                  const otherTags = {
                                    ...field.value,
                                  };

                                  if (isSingleSelect) {
                                    if (currentTags.includes(item)) {
                                      otherTags[section.label] = [];
                                    } else {
                                      otherTags[section.label] = [item];
                                    }
                                  } else {
                                    if (currentTags.includes(item)) {
                                      otherTags[section.label] =
                                        currentTags.filter(
                                          (tag) => tag !== item,
                                        );
                                    } else {
                                      otherTags[section.label] = [
                                        ...currentTags,
                                        item,
                                      ];
                                    }
                                  }
                                  field.onChange(otherTags);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.value?.[
                                      section.label
                                    ]?.includes(item)
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                                {item.split("_").join(" ")}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        );
                      })}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={prophetForm.control}
          name="is_public"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <LabelWithTooltip required tooltip="Choose who can see and access your app">
                Access Level
              </LabelWithTooltip>
              <FormControl>
                <RadioGroup
                  onValueChange={(value) =>
                    field.onChange(value === "open")
                  }
                  value={field.value ? "open" : "restricted"}
                  className="grid grid-cols-2 gap-4"
                >
                  {!isBuilder && (
                    <FormItem className="relative">
                      <FormControl>
                        <RadioGroupItem
                          value="open"
                          className="peer sr-only"
                          id="open"
                        />
                      </FormControl>
                      <Label
                        htmlFor="open"
                        className={cn(
                          "flex h-full cursor-pointer flex-row gap-3 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50",
                          field.value === true && "border-primary",
                        )}
                      >
                        <div
                          className={cn(
                            "mt-1 h-4 w-4 shrink-0 rounded-full border border-primary",
                            field.value === true
                              ? "bg-primary text-primary-foreground"
                              : "opacity-50",
                          )}
                        >
                          {field.value === true && (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <p className="font-medium leading-none">
                            Endorsed
                          </p>
                          <div className="text-xs text-muted-foreground">
                            Available to all Propheteers
                          </div>
                        </div>
                      </Label>
                    </FormItem>
                  )}
                  <FormItem className="relative">
                    <FormControl>
                      <RadioGroupItem
                        value="restricted"
                        className="peer sr-only"
                        id="restricted"
                      />
                    </FormControl>
                    <Label
                      htmlFor="restricted"
                      className={cn(
                        "flex h-full cursor-pointer flex-row gap-3 rounded-md border p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent/50",
                        field.value === false && "border-primary",
                      )}
                    >
                      <div
                        className={cn(
                          "mt-1 h-4 w-4 shrink-0 rounded-full border border-primary",
                          field.value === false
                            ? "bg-primary text-primary-foreground"
                            : "opacity-50",
                        )}
                      >
                        {field.value === false && (
                          <Check className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium leading-none">
                          Restricted
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Visible to all Propheteers, requires approval to access
                        </div>
                      </div>
                    </Label>
                  </FormItem>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="h-4" />

        <FormField
          control={prophetForm.control}
          name="is_consent_accepted"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  By listing this agent, I attest that I am adhering to the{' '}
                  <a
                    href="https://intranet.prophet.com/login/to/learning/course/1139"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 cursor-pointer"
                  >
                    Maia acceptable use policy
                  </a>
                  {' '}and{' '}
                  <a
                    href="https://intranet.prophet.com/login/to/browse/post/60747"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline hover:text-primary/80 cursor-pointer"
                  >
                    Prophet's AI policy
                  </a>
                  . I have any questions, I will reach out to the AI Foundry before proceeding.
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => prophetForm.reset()}
          >
            Reset
          </Button>
          <Button
            type="submit"
            loading={prophetForm.formState.isSubmitting}
            disabled={!prophetForm.watch("is_consent_accepted")}
          >
            Launch App
          </Button>
        </div>
      </form>
    </Form>
  );

  // Render non-Prophet deployment form
  const renderNonProphetForm = () => (
    <form onSubmit={nonProphetForm.handleSubmit(onNonProphetSubmit)} className="space-y-6">
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
          {...nonProphetForm.register("name")}
          id="name"
          placeholder="Enter app name"
        />
        {nonProphetForm.formState.errors.name && (
          <p className="text-sm text-red-500">
            {nonProphetForm.formState.errors.name.message}
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
          {...nonProphetForm.register("description")}
          id="description"
          placeholder="Describe your app..."
          rows={4}
        />
        {nonProphetForm.formState.errors.description && (
          <p className="text-sm text-red-500">
            {nonProphetForm.formState.errors.description.message}
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
          {...nonProphetForm.register("welcome_message")}
          id="welcome_message"
          placeholder="Write your welcome message..."
          rows={3}
        />
        {nonProphetForm.formState.errors.welcome_message && (
          <p className="text-sm text-red-500">
            {nonProphetForm.formState.errors.welcome_message.message}
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
                nonProphetForm.watch("tags.category") === category
                  ? "default"
                  : "outline"
              }
              size="sm"
              className="rounded-full"
              onClick={() => nonProphetForm.setValue("tags.category", category)}
            >
              {category}
            </Button>
          ))}
        </div>
        {nonProphetForm.formState.errors.tags?.category && (
          <p className="text-sm text-red-500">
            {nonProphetForm.formState.errors.tags.category.message}
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
            nonProphetForm.setValue("tags.industry", value)
          }
          value={nonProphetForm.watch("tags.industry")}
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
            nonProphetForm.setValue("tags.function", value)
          }
          value={nonProphetForm.watch("tags.function")}
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
            nonProphetForm.setValue("visibility", value as "private" | "public" | "organization")
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
          onClick={() => nonProphetForm.reset()}
        >
          Reset
        </Button>
        <Button type="submit" loading={nonProphetForm.formState.isSubmitting}>
          Launch App
        </Button>
      </div>
    </form>
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {view === "intro" && (IS_PROPHET_DEPLOYMENT ? "Publish App to Maia" : "Launch Agent as App")}
              {view === "form" &&
                (updatedMode
                  ? "Update App Configuration"
                  : IS_PROPHET_DEPLOYMENT ? "Publish Configuration" : "Launch Configuration")}
              {view === "success" && "Your App Is Live!"}
            </DialogTitle>
          </DialogHeader>
          <Separator />

          <AnimatePresence mode="wait">
            {view === "intro" && (
              <motion.div
                key="intro"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4 text-center">
                  <p className="text-lg font-medium">
                    {IS_PROPHET_DEPLOYMENT ? "Ready to Publish Your Agent?" : "Ready to Launch Your Agent?"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Before proceeding, please ensure you are satisfied with the
                    quality of your agent's inferences. Any subsequent changes
                    you make to this agent will automatically reflect in the
                    launched app. Once launched, the app will be available
                    according to your visibility settings.
                  </p>
                </div>
                <div className="flex justify-center pt-4">
                  <Button onClick={() => setView("form")}>
                    Yes I am ready
                  </Button>
                </div>
              </motion.div>
            )}

            {view === "form" && (
              <motion.div
                key="form"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="max-h-[60vh] overflow-y-auto pr-2"
              >
                {IS_PROPHET_DEPLOYMENT ? renderProphetForm() : renderNonProphetForm()}
              </motion.div>
            )}

            {view === "success" && (
              <motion.div
                key="success"
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="flex flex-col items-center space-y-4 text-center">
                  <Rocket className="h-20 w-20 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">
                      It's now up and running. Since it's public, you can share
                      it with friends, teammates, or anyone who might find it
                      useful. Copy the link and spread the word!
                    </p>
                  </div>
                </div>
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    className="flex gap-2"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className="h-4 w-4" /> Share Link
                  </Button>
                  <Button
                    variant="outline"
                    className="flex gap-2"
                    onClick={handlePublicConfirm}
                  >
                    <Copy className="h-4 w-4" /> Copy Link
                  </Button>
                  <Button
                    className="flex gap-2"
                    onClick={() =>
                      window.open(
                        IS_PROPHET_DEPLOYMENT
                          ? `${MAIA_FRONTEND_URL}/agent-library/${agent?._id}`
                          : publishedAgentLink ?? "",
                        "_blank",
                      )
                    }
                  >
                    View Launched Agent
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
      {/* Non-Prophet public launch success dialog */}
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
              onClick={() => (window.open(publishedAgentLink ?? "", "_blank"))}
            >
              View Launched Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ShareAppModal
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        appId={agent?._id ?? ""}
      />
    </>
  );
}
