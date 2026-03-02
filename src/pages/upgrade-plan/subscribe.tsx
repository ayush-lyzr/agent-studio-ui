import React, { Dispatch, SetStateAction, useState } from "react";
import { Check, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { useAuth, useMemberstack } from "@memberstack/react";
import mixpanel from "mixpanel-browser";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { buttonVariants } from "@/components/custom/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { pricingTiers } from "./data";
import { Path } from "@/lib/types";
import {
  INDUSTRY_OPTIONS,
  isMixpanelActive,
  PAGOS_URL,
  PlanType,
} from "@/lib/constants";
import axios from "@/lib/axios";
import { AxiosResponse } from "axios";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useOrganization } from "../organization/org.service";
import { useManageAdminStore } from "../manage-admin/manage-admin.store";

type ISubscribe = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  type: "team" | "org";
  planType: "monthly" | "yearly" | "default";
};

const Subscribe: React.FC<ISubscribe> = ({ open, onOpen, type, planType }) => {
  const { getToken } = useAuth();
  const token = getToken();
  const { purchasePlansWithCheckout } = useMemberstack();
  const isTeam = type === "team";

  const [domainChecked, setDomainChecked] = useState<boolean>(false);
  const { current_organization } = useManageAdminStore((state) => state);
  const { updateOrganization, isUpdatingOrganization } = useOrganization({
    token,
    current_organization,
  });

  const formSchema = z.object({
    name: z.string(),
    domain: z.string(),
    industry: z.string(),
    about_organization: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {},
    resolver: zodResolver(formSchema),
  });

  const {
    refetch: checkDomainDuplicacy,
    isFetching: isCheckingDomainDuplicacy,
    isSuccess,
  } = useQuery({
    queryKey: ["checkDomainDuplicacy", form.getValues("domain")],
    queryFn: () =>
      axios.get(`/organizations/domain-exists`, {
        baseURL: PAGOS_URL,
        headers: { Authorization: `Bearer ${token}` },
        params: { domain: form.getValues("domain") },
      }),
    retry: false,
    select: (res: AxiosResponse) => res.data,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    enabled: false,
  });

  const handleDomain = async () => {
    try {
      if (form.getValues("domain").length === 0) {
        toast.error("Domain is invalid. Empty string.");
        return;
      }
      const res = await checkDomainDuplicacy();
      setDomainChecked(res.data?.exists);
    } catch (error) {}
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    await updateOrganization(values);
    const priceId =
      pricingTiers()[planType].find(
        (plan) =>
          plan.name === (isTeam ? PlanType.Teams : PlanType.Organization),
      )?.priceId ?? "";

    toast.promise(
      purchasePlansWithCheckout({
        priceId,
        cancelUrl: Path.UPGRADE_PLAN,
        successUrl: Path.HOME,
        autoRedirect: true,
      }),
      {
        loading: "Redirecting you to stripe...",
        success: () => {
          if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive)
            mixpanel.track(`Checked out to organization plan`);
          return `Redirecting to buy organization plan`;
        },
        error: (error) =>
          error?.message ??
          "Error with the purchase. Please contact your administrator.",
        duration: 5 * 1000,
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <Form {...form}>
        <DialogContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <DialogHeader>
              <DialogTitle>
                {isTeam ? "Team" : "Organization"} Details
              </DialogTitle>
            </DialogHeader>
            <Separator />
            <div className="space-y-4">
              {domainChecked && (
                <motion.div
                  initial={{ y: "-50%", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: "-50%", opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <Alert className="bg-neutral-50">
                    <TriangleAlert className="h-4 w-4" />
                    <AlertDescription>
                      {isTeam ? "A teams" : "An organization"} account already
                      exists on Lyzr. Contact your admin to join and prevent
                      duplicates.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {isTeam ? "Team" : "Organization"} name
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="domain"
                disabled={isCheckingDomainDuplicacy}
                render={({ field }) => (
                  <FormItem
                    className={cn(
                      isCheckingDomainDuplicacy && "shimmer",
                      "w-full",
                    )}
                  >
                    <FormLabel>Domain</FormLabel>
                    <FormControl>
                      <span className="flex items-center justify-between rounded-md border px-2">
                        <Input
                          {...field}
                          className="border-none bg-transparent"
                          onBlur={handleDomain}
                          placeholder="Eg. example.com for john.doe@example.com"
                        />
                        {isCheckingDomainDuplicacy && (
                          <Loader2 className="animate-spin" />
                        )}
                        {isSuccess &&
                          (domainChecked ? (
                            <TriangleAlert className="size-5 text-red-600" />
                          ) : (
                            <Check className="size-5 text-green-600" />
                          ))}
                      </span>
                    </FormControl>
                    {isSuccess && !domainChecked && (
                      <FormDescription className="text-green-600">
                        Domain available!
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Select
                        {...field}
                        onValueChange={(value) => field.onChange(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select Industry" />
                        </SelectTrigger>
                        <SelectContent>
                          {INDUSTRY_OPTIONS.map((value) => (
                            <SelectItem
                              key={value}
                              value={value}
                              className="w-full"
                            >
                              {value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="about_organization"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      About the {isTeam ? "team" : "company"} (optional)
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Separator />
            </div>
            <DialogFooter className="mt-4">
              <DialogClose className={buttonVariants({ variant: "outline" })}>
                Cancel
              </DialogClose>
              <Button
                loading={form.formState.isSubmitting || isUpdatingOrganization}
              >
                Continue to subscribe
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  );
};

export default Subscribe;
