import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { useFormContext } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { AxiosResponse } from "axios";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button, buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowTopRightIcon } from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import useStore from "@/lib/store";

import LabelWithTooltip from "@/components/custom/label-with-tooltip";
import { RAI_URL } from "@/lib/constants";
import axios from "@/lib/axios";
import { IRAIPolicy, Path } from "@/lib/types";

interface ConfigureResponsibleAIProps {
  updateFeatures: (
    name: string,
    enabled: boolean,
    ragId?: string,
    ragName?: string,
    config?: {
      [key: string]: any;
    },
  ) => void;
  featureName: string;
  openDialog?: boolean;
}

export const ConfigureResponsibleAI: React.FC<ConfigureResponsibleAIProps> = ({
  updateFeatures,
  featureName,
  openDialog,
}) => {
  const [open, setOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const parentForm = useFormContext();

  const formSchema = z.object({
    policy_id: z.coerce.string({
      required_error: "Please select a policy",
    }),
  });

  const existingFeatures = parentForm?.watch("features") || [];
  const existingRAIConfig = existingFeatures.find(
    (feature: any) => feature.type === "RAI",
  );
  const existingPolicyId = existingRAIConfig?.config?.policy_id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      policy_id: existingPolicyId ?? "",
    },
  });

  const apiKey = useStore((state: any) => state.api_key);

  const { data: policies = [], refetch: fetchPolicies } = useQuery({
    queryKey: ["fetchAllPolicies", apiKey],
    queryFn: () =>
      axios.get(`/v1/rai/policies`, {
        baseURL: RAI_URL,
        headers: { accept: "application/json", "x-api-key": apiKey },
      }),
    select: (res: AxiosResponse<{ policies: IRAIPolicy[] }, any>) =>
      res.data?.policies ?? [],
    enabled: !!apiKey,
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (existingPolicyId) {
      form.setValue("policy_id", existingPolicyId);
    }
  }, [existingPolicyId, form]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchPolicies();
    } catch (error) {
      console.error("Error refreshing RAIs:", error);
    }
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    if (openDialog) {
      setOpen(true);
      handleRefresh();
    }
  }, [openDialog]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (values.policy_id) {
      const selectedPolicy = policies.find(
        (policy: IRAIPolicy) => policy?._id === values?.policy_id,
      );

      if (!selectedPolicy) {
        console.error("Selected Policy not found:", values?.policy_id);
        form.setError("policy_id", {
          message: "Selected Policy not found",
          type: "validate",
        });
        return;
      }

      updateFeatures(
        featureName,
        true,
        String(values?.policy_id),
        selectedPolicy?.name,
        {
          endpoint: `${RAI_URL}v1/rai/inference`,
          policy_id: values?.policy_id,
          policy_name: selectedPolicy?.name,
        },
      );

      form.reset({
        policy_id: values?.policy_id,
      });

      setOpen(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen && !form.getValues("policy_id")) {
      updateFeatures(featureName, false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        className={cn(
          buttonVariants({ variant: "link" }),
          "p-0 text-indigo-600 animate-in slide-in-from-top-2 hover:text-indigo-500",
        )}
      >
        Configure
        <ArrowTopRightIcon className="size-4" />
      </DialogTrigger>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="grid grid-cols-1 gap-4"
        >
          <DialogContent className="max-w-xl !rounded-xl data-[state=closed]:slide-out-to-bottom-[25%] data-[state=open]:slide-in-from-bottom-[25%]">
            <DialogHeader>
              <DialogTitle>Configure Responsible AI</DialogTitle>
              <DialogDescription className="text-xs">
                Choose the right policy to get reliable agent interactions.
                Policies define the rules and safeguards for agent behavior.
              </DialogDescription>
            </DialogHeader>
            <Separator />
            {policies?.length > 0 ? (
              <>
                <FormField
                  control={form.control}
                  name="policy_id"
                  render={({ field }) => (
                    <FormItem className="col-span-1">
                      <LabelWithTooltip
                        tooltip="Select an existing policy to use for retrieving relevant context."
                        required={true}
                      >
                        Responsible AI
                      </LabelWithTooltip>
                      <div className="flex gap-2">
                        <FormControl className="flex-1">
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                            required
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {policies?.map((policy) => (
                                <SelectItem key={policy._id} value={policy._id}>
                                  {policy.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleRefresh}
                        >
                          <RefreshCw
                            className={cn(
                              "mx-auto size-4",
                              isRefreshing && "animate-spin",
                            )}
                          />
                        </Button>
                      </div>
                      <Link
                        to={Path.RESPONSIBLE_AI}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          buttonVariants({ variant: "link" }),
                          "mt-2 p-0 text-indigo-600 hover:text-indigo-500",
                        )}
                      >
                        Create New
                        <ArrowTopRightIcon className="size-4" />
                      </Link>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="mb-4 flex gap-2">
                  <p className="text-sm text-muted-foreground">
                    No safe & responsible AI policies found
                  </p>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Link
                    to={Path.RESPONSIBLE_AI}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="default">
                      Create New
                      <ArrowTopRightIcon className="ml-2 size-4" />
                    </Button>
                  </Link>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleRefresh}
                  >
                    <RefreshCw
                      className={cn(
                        "mx-auto size-4",
                        isRefreshing && "animate-spin",
                      )}
                    />
                  </Button>
                </div>
              </div>
            )}{" "}
            <Separator />
            <DialogFooter>
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => form.reset()}
                >
                  Cancel
                </Button>
              </DialogClose>
              {policies?.length > 0 && (
                <Button type="submit" onClick={form.handleSubmit(onSubmit)}>
                  Save
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </form>
      </Form>
    </Dialog>
  );
};
