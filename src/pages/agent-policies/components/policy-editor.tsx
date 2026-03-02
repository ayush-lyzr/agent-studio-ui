import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

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
import { FUNCTION_OPTIONS } from "@/lib/constants";
import { IAEPPolicy } from "../types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PolicyEditorProps {
  policy: IAEPPolicy;
  onSave: (updatedPolicy: Partial<IAEPPolicy>) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}

const sensitivityOptions = ["low", "medium", "high"];
const networkGroupOptions = ["trusted", "untrusted", "external"];
const statusOptions = ["ACTIVE", "INACTIVE", "DRAFT"];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  status: z.enum(["ACTIVE", "INACTIVE", "DRAFT"]),
  sensitivity: z.enum(["low", "medium", "high"]),
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
});

export default function PolicyEditor({
  policy,
  onSave,
  onCancel,
  isSaving,
}: PolicyEditorProps) {
  const [activeTab, setActiveTab] = useState("basic");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: policy.metadata.name || "",
      description: policy.metadata.description || "",
      status: policy.metadata.status as "ACTIVE" | "INACTIVE" | "DRAFT",
      sensitivity: policy.properties.sensitivity as "low" | "medium" | "high",
      functional_group: policy.properties.functional_group,
      allowed_sensitivities:
        policy.connection_rules.inference.allowed.sensitivities,
      allowed_network_groups:
        policy.connection_rules.inference.allowed.network_groups,
      allowed_functional_groups:
        policy.connection_rules.inference.allowed.functional_groups,
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    const updatedPolicy: Partial<IAEPPolicy> = {
      metadata: {
        ...policy.metadata,
        name: values.name,
        description: values.description,
        status: values.status,
      },
      properties: {
        ...policy.properties,
        sensitivity: values.sensitivity,
        functional_group: values.functional_group,
      },
      connection_rules: {
        inference: {
          allowed: {
            sensitivities: values.allowed_sensitivities,
            network_groups: values.allowed_network_groups,
            functional_groups: values.allowed_functional_groups,
          },
        },
      },
    };

    await onSave(updatedPolicy);
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="connections">Connection Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter policy name" {...field} />
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
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Describe the purpose and scope of this policy
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Current status of this policy
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sensitivity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sensitivity</FormLabel>
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
                            {option.charAt(0).toUpperCase() + option.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The sensitivity level of this endpoint
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="functional_group"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Functional Group</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select functional group" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {FUNCTION_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option.toLowerCase()}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The functional category of this endpoint
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>

          <TabsContent value="connections" className="space-y-4">
            <FormField
              control={form.control}
              name="allowed_sensitivities"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Allowed Sensitivity Levels</FormLabel>
                    <FormDescription>
                      Select which sensitivity levels this endpoint can connect
                      to
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {sensitivityOptions.map((sensitivity) => (
                      <FormField
                        key={sensitivity}
                        control={form.control}
                        name="allowed_sensitivities"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={sensitivity}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sensitivity)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          sensitivity,
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== sensitivity,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {sensitivity.charAt(0).toUpperCase() +
                                  sensitivity.slice(1)}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowed_network_groups"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Organization Access</FormLabel>
                    <FormDescription>
                      Select if this policy provides access to other
                      organizations
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {networkGroupOptions.map((group) => (
                      <FormField
                        key={group}
                        control={form.control}
                        name="allowed_network_groups"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={group}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(group)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, group])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== group,
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {group.charAt(0).toUpperCase() + group.slice(1)}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="allowed_functional_groups"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel>Allowed Functional Groups</FormLabel>
                    <FormDescription>
                      Select which functional groups this endpoint can connect
                      to
                    </FormDescription>
                  </div>
                  <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto">
                    {FUNCTION_OPTIONS.map((group) => (
                      <FormField
                        key={group}
                        control={form.control}
                        name="allowed_functional_groups"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={group}
                              className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(
                                    group.toLowerCase(),
                                  )}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          group.toLowerCase(),
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) =>
                                              value !== group.toLowerCase(),
                                          ),
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal">
                                {group}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
