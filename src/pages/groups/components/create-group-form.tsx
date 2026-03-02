import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { PlusIcon, XIcon } from "lucide-react";
import { UseMutateAsyncFunction } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreateGroupRequest } from "../types";
import { useAEPPolicies } from "@/pages/agent-policies/aep.service";
import { IAEPPolicy } from "@/pages/agent-policies/types";
import { useAuth } from "@/contexts/AuthContext";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  group_aep_id: z.string().optional(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.string(), z.any()).default({}),
});

export type FormValues = z.infer<typeof formSchema>;

interface CreateGroupFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  defaultValues?: Partial<FormValues>;
  createGroup: UseMutateAsyncFunction<
    AxiosResponse<any>,
    Error,
    CreateGroupRequest,
    unknown
  >;
  isCreatingGroup: boolean;
}

export function CreateGroupForm({
  onSuccess,
  onCancel,
  defaultValues,
  createGroup,
  isCreatingGroup,
}: CreateGroupFormProps) {
  const [tagInput, setTagInput] = useState("");
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const { policies, getAllPolicies } = useAEPPolicies(token);
  const [groupPolicies, setGroupPolicies] = useState<IAEPPolicy[]>([]);

  // Fetch policies on component mount
  useEffect(() => {
    getAllPolicies();
  }, [getAllPolicies]);

  // Filter policies where function_group is "group"
  useEffect(() => {
    if (policies) {
      const filtered = policies.filter(
        (policy: IAEPPolicy) =>
          policy.properties && policy.properties.functional_group === "group",
      );
      setGroupPolicies(filtered);
    }
  }, [policies]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
      group_aep_id: defaultValues?.group_aep_id || "",
      tags: defaultValues?.tags || [],
      metadata: defaultValues?.metadata || {},
    },
  });

  async function onSubmit(values: FormValues) {
    try {
      const createRequest: CreateGroupRequest = {
        name: values.name.trim(),
        description: values.description?.trim() || null,
        group_aep_id:
          values.group_aep_id === "none"
            ? null
            : values.group_aep_id?.trim() || null,
        tags: values.tags || [],
        metadata: values.metadata || {},
      };

      await createGroup(createRequest);
      onSuccess();
    } catch (error) {
      console.error("Error creating group:", error);
      form.setError("root", {
        type: "manual",
        message: "Failed to create group. Please try again.",
      });
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !form.getValues("tags").includes(tagInput.trim())) {
      form.setValue("tags", [...form.getValues("tags"), tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    form.setValue(
      "tags",
      form.getValues("tags").filter((tag) => tag !== tagToRemove),
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-medium">Group Information</h3>
          <div className="grid grid-cols-1 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this group
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
                      placeholder="Enter group description"
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    What is this group for? Who should join it?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="group_aep_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Group Policy ID (Optional)</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value || "none"}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select an agent group policy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {groupPolicies.map((policy: IAEPPolicy) => (
                          <SelectItem
                            key={policy.policy_id}
                            value={policy.policy_id}
                          >
                            {policy.metadata.name || policy.policy_id}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormDescription>
                    Link this group to an agent policy to control agent access
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={() => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className="mb-2 flex flex-wrap gap-2">
                    {form.getValues("tags").map((tag, i) => (
                      <Badge key={i} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4 p-0"
                          onClick={() => removeTag(tag)}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button type="button" variant="outline" onClick={addTag}>
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>
                  <FormDescription>
                    Add tags to categorize and find your group
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {form.formState.errors.root && (
          <p className="text-sm font-medium text-destructive">
            {form.formState.errors.root.message}
          </p>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isCreatingGroup}>
            {isCreatingGroup ? "Creating..." : "Create Group"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
