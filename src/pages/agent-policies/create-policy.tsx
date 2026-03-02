import React from "react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";

import { PageTitle } from "@/components/ui/page-title";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { CreateAEPPolicyRequest } from "./types";
import { useAEPPolicies } from "./aep.service";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";
import { useGroups } from "../groups/groups.service";
import { IGroup } from "../groups/types";
import { Path } from "@/lib/types";

const sensitivityOptions = ["low", "medium", "high"];
const networkGroupOptions = ["internal", "external"];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  policy_type: z.enum(["individual", "group"]),
  sensitivity: z.enum(["low", "medium", "high"], {
    required_error: "Sensitivity is required",
  }),
  functional_group: z.string().min(1, "Functional group is required"),
  allowed_sensitivities: z
    .array(z.string())
    .min(1, "Select at least one allowed sensitivity"),
  allowed_network_groups: z
    .array(z.string())
    .min(1, "Select at least one allowed network group"),
  allowed_functional_groups: z
    .array(z.string())
    .min(1, "Select at least one allowed functional group"),
  parent_policy_id: z.string().optional(),
});

export default function CreatePolicyPage() {
  const { getToken } = useAuth();
  const token = getToken();
  const navigate = useNavigate();
  const { createPolicy, isCreatingPolicy } = useAEPPolicies(token!);
  const { getAllGroups, groups } = useGroups(token!);
  const { current_organization } = useManageAdminStore((state) => state);
  const [activeTab, setActiveTab] = useState("general");

  // Fetch all groups when the component mounts
  React.useEffect(() => {
    if (token) {
      getAllGroups();
    }
  }, [token, getAllGroups]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      policy_type: "individual",
      sensitivity: "low",
      functional_group: "",
      allowed_sensitivities: ["low"],
      allowed_network_groups: ["internal"],
      allowed_functional_groups: [],
      parent_policy_id: "",
    },
  });

  const watchPolicyType = form.watch("policy_type");

  // Update sensitivity and functional group when policy type changes
  React.useEffect(() => {
    if (watchPolicyType === "group") {
      form.setValue("sensitivity", "high");
      form.setValue("functional_group", "group");
    }
  }, [watchPolicyType, form]);

  React.useEffect(() => {
    console.log(groups);
  }, [groups]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const policyData: CreateAEPPolicyRequest = {
        ...values,
        organization_id: current_organization?._id,
      };

      await createPolicy(policyData);
      toast.success("Policy created successfully");
      navigate(Path.AGENT_POLICIES);
    } catch (error) {
      console.error("Error creating policy:", error);
      toast.error("Failed to create policy");
    }
  }

  const goBack = () => {
    navigate(Path.AGENT_POLICIES);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex h-full w-full flex-col space-y-8 p-8"
    >
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          className="mr-2 h-8 w-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <PageTitle
          title="Create Agent Policy"
          description="Configure a new policy to govern agent endpoint connections"
        />
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Tabs
              defaultValue="general"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="mb-6">
                <TabsTrigger value="general">General Information</TabsTrigger>
                <TabsTrigger value="properties">Properties</TabsTrigger>
                <TabsTrigger value="connections">Connection Rules</TabsTrigger>
              </TabsList>

              <TabsContent value="general" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="rounded-lg border p-6">
                    <h3 className="mb-4 text-lg font-medium">
                      Basic Information
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Policy Name</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter policy name"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              A descriptive name for this policy
                            </FormDescription>
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
                              <Textarea
                                placeholder="Enter policy description"
                                className="min-h-32"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              What is this policy used for? What agents should
                              it be applied to?
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="properties" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="rounded-lg border p-6">
                    <h3 className="mb-4 text-lg font-medium">Policy Type</h3>
                    <div className="grid grid-cols-1 gap-6">
                      <FormField
                        control={form.control}
                        name="policy_type"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Policy Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="individual" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Individual Policy
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="group" />
                                  </FormControl>
                                  <FormLabel className="font-normal">
                                    Group Policy
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormDescription>
                              {watchPolicyType === "individual"
                                ? "Individual policies are applied to specific agents"
                                : "Group policies are applied to groups of agents and automatically set to high sensitivity"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="rounded-lg border p-6">
                    <h3 className="mb-4 text-lg font-medium">
                      Policy Properties
                    </h3>
                    <div className="grid grid-cols-1 gap-6">
                      {watchPolicyType === "individual" && (
                        <FormField
                          control={form.control}
                          name="sensitivity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Data Sensitivity Level</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select sensitivity level" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {sensitivityOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                      {option.charAt(0).toUpperCase() +
                                        option.slice(1)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                The sensitivity level determines the level of
                                access control
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {watchPolicyType === "individual" ? (
                        <FormField
                          control={form.control}
                          name="functional_group"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Functional Group</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select a group" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {groups?.map((group: IGroup) => (
                                    <SelectItem
                                      key={group._id}
                                      value={group.name!}
                                    >
                                      {group.name ||
                                        `Group ${group._id.substring(0, 8)}`}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Select a group to associate with this policy
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      ) : (
                        <div className="rounded-md bg-accent p-4">
                          <p className="text-sm text-muted-foreground">
                            Group policies can only be attached to functional
                            groups.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="connections" className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-4 rounded-lg border p-6">
                    <h3 className="text-lg font-medium">
                      Compatible Data Sensitivity Levels
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select which sensitivity levels can connect to this agent.
                      Agents with the selected sensitivity levels will be
                      permitted to access data from this agent.
                    </p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      {sensitivityOptions.map((sensitivity) => {
                        const fieldValues =
                          form.getValues("allowed_sensitivities") || [];
                        const isChecked = fieldValues.includes(sensitivity);

                        return (
                          <div
                            key={sensitivity}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`sensitivity-${sensitivity}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentValues =
                                  form.getValues("allowed_sensitivities") || [];
                                let newValues: string[];

                                if (checked) {
                                  newValues = [...currentValues, sensitivity];
                                } else {
                                  newValues = currentValues.filter(
                                    (val) => val !== sensitivity,
                                  );
                                }

                                form.setValue(
                                  "allowed_sensitivities",
                                  newValues,
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  },
                                );
                              }}
                            />
                            <label
                              htmlFor={`sensitivity-${sensitivity}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {sensitivity}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {form.formState.errors.allowed_sensitivities && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.allowed_sensitivities.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-6">
                    <h3 className="text-lg font-medium">Data Sharing Scope</h3>
                    <p className="text-sm text-muted-foreground">
                      Define where agents under this policy may share data.
                      Internal is typically appropriate for finance, legal, or
                      audit functions, while external may be needed for
                      marketing or customer-facing operations.
                    </p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      {networkGroupOptions.map((group) => {
                        const fieldValues =
                          form.getValues("allowed_network_groups") || [];
                        const isChecked = fieldValues.includes(group);

                        return (
                          <div
                            key={group}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`network-${group}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentValues =
                                  form.getValues("allowed_network_groups") ||
                                  [];
                                let newValues: string[];

                                if (checked) {
                                  newValues = [...currentValues, group];
                                } else {
                                  newValues = currentValues.filter(
                                    (val) => val !== group,
                                  );
                                }

                                form.setValue(
                                  "allowed_network_groups",
                                  newValues,
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  },
                                );
                              }}
                            />
                            <label
                              htmlFor={`network-${group}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {group}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {form.formState.errors.allowed_network_groups && (
                      <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.allowed_network_groups.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-4 rounded-lg border p-6">
                    <h3 className="text-lg font-medium">
                      Allowed Functional Groups
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Which groups can this policy connect to?
                    </p>
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                      {groups?.map((group: IGroup) => {
                        const fieldValues =
                          form.getValues("allowed_functional_groups") || [];
                        const isChecked = fieldValues.includes(group._id);

                        return (
                          <div
                            key={group._id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`group-${group._id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                const currentValues =
                                  form.getValues("allowed_functional_groups") ||
                                  [];
                                let newValues: string[];

                                if (checked) {
                                  newValues = [...currentValues, group._id];
                                } else {
                                  newValues = currentValues.filter(
                                    (val) => val !== group._id,
                                  );
                                }

                                form.setValue(
                                  "allowed_functional_groups",
                                  newValues,
                                  {
                                    shouldValidate: true,
                                    shouldDirty: true,
                                  },
                                );
                              }}
                            />
                            <label
                              htmlFor={`group-${group._id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {group.name ||
                                `Group ${group._id.substring(0, 8)}`}
                            </label>
                          </div>
                        );
                      })}
                    </div>
                    {form.formState.errors.allowed_functional_groups && (
                      <p className="text-sm font-medium text-destructive">
                        {
                          form.formState.errors.allowed_functional_groups
                            .message
                        }
                      </p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-4 pt-4">
              <Button type="button" variant="outline" onClick={goBack}>
                Cancel
              </Button>
              <Button type="submit" disabled={isCreatingPolicy}>
                {isCreatingPolicy ? "Creating..." : "Create Policy"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </motion.div>
  );
}
