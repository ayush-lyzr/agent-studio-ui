import { ReactElement, useEffect } from "react";
import { z } from "zod";
import { TooltipContentProps } from "@radix-ui/react-tooltip";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import mixpanel from "mixpanel-browser";

import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
import {
  INDUSTRY_OPTIONS,
  FUNCTION_OPTIONS,
  CATEGORY_OPTIONS,
  MARKETPLACE_URL,
  isMixpanelActive,
} from "@/lib/constants";
import axios from "@/lib/axios";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";
import { isOrgMode } from "@/lib/utils";
import { MarketplaceAppData } from "@/pages/apps/components/market-place";

interface EditProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  app: MarketplaceAppData;
  token: string;
}

const LabelWithTooltip = ({
  children,
  tooltip,
  tooltipExample,
  required = false,
  side,
  align,
  onClick,
}: {
  children: React.ReactNode;
  tooltip: string | ReactElement;
  tooltipExample?: string;
  required?: boolean;
  onClick?: () => void;
} & Partial<TooltipContentProps>) => {
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger
          className="flex cursor-help items-center gap-1"
          asChild
          onClick={(e) => {
            e.preventDefault();
            onClick?.();
          }}
        >
          <Label className="mb-1 inline-flex cursor-help items-center underline decoration-muted-foreground/50 decoration-dotted underline-offset-2 hover:decoration-muted-foreground">
            {children} {required && <p className="text-destructive">*</p>}
          </Label>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          align={align}
          className="max-w-[250px] whitespace-normal text-xs"
        >
          <div className="leading-relaxed">
            <p>{tooltip}</p>
            {tooltipExample && <p className="mt-2 italic">{tooltipExample}</p>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export function Edit({ open, onOpenChange, app, token }: EditProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { usage_data, current_organization } = useManageAdminStore(
    (state) => state,
  );

  const editFormSchema = z.object({
    name: z.string().min(1, "Name is required"),
    description: z.string(),
    welcome_message: z.string().optional(),
    tags: z.object({
      industry: z.string(),
      function: z.string(),
      category: z.string(),
    }),
    visibility: z.enum(["private", "public", "organization"]),
  });

  type EditFormValues = z.infer<typeof editFormSchema>;
  console.log(app?.welcome_message);
  const form = useForm<EditFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      name: app?.name || "",
      description: app?.description || "",
      welcome_message: app?.welcome_message || "",
      tags: {
        industry: app?.tags?.industry || "",
        function: app?.tags?.function || "",
        category: app?.tags?.category || "",
      },
      visibility: app?.organization_id
        ? "organization"
        : app?.public
          ? "public"
          : "private",
    },
  });

  const onSubmit = async (data: EditFormValues) => {
    try {
      const formData = {
        name: data.name,
        description: data.description,
        welcome_message: data.welcome_message,
        public: data.visibility === "public",
        organization_id:
          data.visibility === "organization"
            ? current_organization?.org_id
            : undefined,
        tags: {
          industry: data.tags.industry,
          function: data.tags.function,
          category: data.tags.category,
        },
        agent_id: app.agent_id,
      };

      if (data.visibility !== "organization") {
        delete formData.organization_id;
      }

      await axios.put(`/app/${app.id}`, formData, {
        baseURL: MARKETPLACE_URL,
        headers: { Authorization: `Bearer ${token}` },
      });

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
        mixpanel.track("Edited app", formData);
      }

      queryClient.invalidateQueries({ queryKey: ["fetchApps"] });
      queryClient.invalidateQueries({ queryKey: ["userApps"] });
      queryClient.invalidateQueries({ queryKey: ["getOrgApps"] });

      toast({
        title: "Success",
        description: "App updated successfully!",
      });
      onOpenChange(false);
    } catch (error: any) {
      if (
        error.response?.data?.detail === "App with this name already exists"
      ) {
        toast({
          title: "Name Already Exists",
          description: "Please choose a different name for your app.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: error?.message || "Failed to update the app.",
          variant: "destructive",
        });
      }
    }
  };

  useEffect(() => {
    form.reset({
      name: app?.name || "",
      description: app?.description || "",
      welcome_message: app?.welcome_message || "",
      tags: {
        industry: app?.tags?.industry || "",
        function: app?.tags?.function || "",
        category: app?.tags?.category || "",
      },
      visibility: app?.organization_id
        ? "organization"
        : app?.public
          ? "public"
          : "private",
    });
  }, [app]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit App</DialogTitle>
        </DialogHeader>
        <Separator className="mb-4" />

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <LabelWithTooltip tooltip="Update the name of your app">
              App Name
            </LabelWithTooltip>
            <Input {...form.register("name")} placeholder="Enter app name" />
            {form.formState.errors.name && (
              <p className="text-red-600">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <LabelWithTooltip tooltip="Update the description of your app">
              Description
            </LabelWithTooltip>
            <Textarea
              {...form.register("description")}
              placeholder="Describe your app..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip tooltip="Provide a welcome message for your app">
              Welcome Message
            </LabelWithTooltip>
            <Textarea
              {...form.register("welcome_message")}
              placeholder="Write your welcome message..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <LabelWithTooltip tooltip="Select a category for your app">
              Category
            </LabelWithTooltip>
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
            <LabelWithTooltip tooltip="Select an industry for your app">
              Industry
            </LabelWithTooltip>
            <Select
              onValueChange={(value) => form.setValue("tags.industry", value)}
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
            <LabelWithTooltip tooltip="Select a function for your app">
              Function
            </LabelWithTooltip>
            <Select
              onValueChange={(value) => form.setValue("tags.function", value)}
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
            <LabelWithTooltip tooltip="Choose who can see and access your app">
              Visibility
            </LabelWithTooltip>
            <RadioGroup
              value={form.watch("visibility")}
              onValueChange={(value) =>
                form.setValue(
                  "visibility",
                  value as "private" | "public" | "organization",
                )
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
                  <RadioGroupItem value="organization" id="organization" />
                  <Label htmlFor="organization">Organization</Label>
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
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
