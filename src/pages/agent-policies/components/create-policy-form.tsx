import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
import { CreateAEPPolicyRequest } from "../types";
import { useAEPPolicies } from "../aep.service";
import { Checkbox } from "@/components/ui/checkbox";
import { FUNCTION_OPTIONS } from "@/lib/constants";

const sensitivityOptions = ["low", "medium", "high"];
const networkGroupOptions = ["trusted", "untrusted", "external"];

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
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

type CreatePolicyFormProps = {
  organizationId?: string;
  onSuccess: () => void;
  onCancel: () => void;
};

export default function CreatePolicyForm({
  organizationId,
  onSuccess,
  onCancel,
}: CreatePolicyFormProps) {
  const { getToken } = useAuth();
  const token = getToken() ?? "";
  const { createPolicy, isCreatingPolicy } = useAEPPolicies(token);
  const [step, setStep] = useState(1);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      sensitivity: "low",
      functional_group: "",
      allowed_sensitivities: ["low"],
      allowed_network_groups: ["trusted"],
      allowed_functional_groups: [],
      parent_policy_id: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const policyData: CreateAEPPolicyRequest = {
        ...values,
        organization_id: organizationId,
      };

      await createPolicy(policyData);
      toast.success("Policy created successfully");
      onSuccess();
    } catch (error) {
      console.error("Error creating policy:", error);
      toast.error("Failed to create policy");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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
                      The Data sensitivity level of this entity
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
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Connection Permissions</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Define which types of endpoints this policy can connect to
            </p>

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
                      select if this policy provides access to other
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
          </div>
        )}

        <div className="flex justify-between">
          {step === 1 ? (
            <>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => setStep(2)}
                disabled={
                  !form.formState.isValid ||
                  !form.getValues().name ||
                  !form.getValues().description ||
                  !form.getValues().sensitivity ||
                  !form.getValues().functional_group
                }
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                Back
              </Button>
              <Button type="submit" disabled={isCreatingPolicy}>
                {isCreatingPolicy ? "Creating..." : "Create Policy"}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
}
