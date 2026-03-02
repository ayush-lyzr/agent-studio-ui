import React, {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

import { useManageAdminStore } from "./manage-admin.store";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn, convertToReadableNumber, getNextBillingDate } from "@/lib/utils";
import { IUsage, SubOrganization } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import {
  SubOrganizationUsage,
  useSubOrganizationService,
} from "@/services/subOrganizationService";
import { RowData } from "@tanstack/react-table";
import { SubOrgModeType } from "./sub-orgs";
import useStore from "@/lib/store";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CREDITS_DIVISOR } from "@/lib/constants";

declare module "@tanstack/react-table" {
  interface TableMeta<TData extends RowData> {
    usage_data?: Partial<IUsage>;
    setFormVisible?: Dispatch<SetStateAction<boolean>>;
    setMode?: Dispatch<SetStateAction<SubOrgModeType>>;
    setFormData?: Dispatch<SetStateAction<Partial<SubOrgFormType>>>;
    onSwitch?: (org: SubOrganization) => Promise<void>;
  }
}

const formSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  about_organization: z.string().optional(),
  limit: z.number().optional(),
});

export type SubOrgFormType = z.infer<typeof formSchema>;

type CreateSubOrgModalProps = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  data: Partial<SubOrganizationUsage>;
  subOrganizations: SubOrganizationUsage[];
  mode?: SubOrgModeType;
};

export const CreateSubOrgModal: React.FC<CreateSubOrgModalProps> = ({
  open,
  onOpen,
  data,
  subOrganizations,
  mode,
}) => {
  const createMode = mode === "create";
  const [currentStep, setCurrentStep] = useState<number>(1);
  const token = useStore((state) => state.app_token);
  const usage_data = useManageAdminStore((state) => state.usage_data);
  const current_organization = useManageAdminStore(
    (state) => state.current_organization,
  );

  const {
    updateMultipleSubOrgLimits,
    createSubOrganization,
    isCreatingSubOrg,
    updateSubOrganization,
    isUpdatingSubOrg,
  } = useSubOrganizationService({ token });

  const totalCredits =
    (Number((usage_data?.paid_credits ?? 0).toFixed(2)) +
      Number((usage_data?.used_credits ?? 0).toFixed(2)) +
      Number((usage_data?.recurring_credits ?? 0).toFixed(2))) /
    100;

  const creditsLeft =
    totalCredits - Number((usage_data?.used_credits ?? 0).toFixed(2)) / 100;

  const form = useForm<SubOrgFormType>({
    resolver: zodResolver(formSchema),
    mode: "onSubmit",
    defaultValues: { name: "", about_organization: "", limit: 1 },
  });

  const creditsAllocationSchema = z
    .object({
      sub_orgs: z.array(
        z.object({
          organization_id: z.string(),
          name: z.string(),
          limit: z.number().min(1).nullable(),
        }),
      ),
    })
    .superRefine((ref, ctx) => {
      const totalCreditsAllocationDisplay = ref.sub_orgs.reduce(
        (prev, curr) =>
          (prev ?? 0) + (curr.limit ?? 0) / CREDITS_DIVISOR,
        0,
      );

      ref.sub_orgs.forEach((org, idx) => {
        if (org.limit === null) {
          ctx.addIssue({
            code: "custom",
            path: [`sub_orgs.${idx}.limit`],
            message: `Credits limit is required.`,
          });
          return;
        }

        const limitDisplay = (org?.limit ?? 0) / CREDITS_DIVISOR;
        if (
          org?.limit &&
          (limitDisplay <= 0 || limitDisplay > creditsLeft)
        ) {
          ctx.addIssue({
            code: "custom",
            path: [`sub_orgs.${idx}.limit`],
            message: `Invalid credits assigned. Should be within 1 and ${creditsLeft}.`,
          });
        }
      });

      if (totalCreditsAllocationDisplay > creditsLeft) {
        ctx.addIssue({
          code: "custom",
          path: ["sub_orgs"],
          message: "Sub org cannot be allocated more credits than parent org",
        });
      }
    });

  type SubOrgCredentialsFormType = z.infer<typeof creditsAllocationSchema>;

  const creditsAllocationForm = useForm<SubOrgCredentialsFormType>({
    resolver: zodResolver(creditsAllocationSchema),
    mode: "onSubmit",
    defaultValues: {
      sub_orgs: subOrganizations,
    },
  });

  const {
    fields: subOrgFields,
    append: addSubOrg,
    remove: removeSubOrg,
  } = useFieldArray<SubOrgCredentialsFormType>({
    control: creditsAllocationForm.control,
    name: "sub_orgs",
  });

  const sub_orgs = creditsAllocationForm.watch("sub_orgs");

  const totalSubOrgCreditsForm = sub_orgs?.reduce(
    (prev, curr) => Number((prev ?? 0) / CREDITS_DIVISOR) + Number((curr?.limit ?? 0) / CREDITS_DIVISOR),
    0,
  );

  const onSubmit = async (newOrg: z.infer<typeof formSchema>) => {
    if (mode === "create") {
      if (subOrgFields.findIndex((field) => !field.organization_id) === -1)
        addSubOrg({
          name: form.watch("name"),
          limit: null,
          organization_id: "",
        });
      setCurrentStep((prev) => prev + 1);
    }
    if (mode === "update") {
      await updateSubOrganization({
        data: {
          name: newOrg.name,
          about_organization: newOrg.about_organization,
        },
        subOrgId: data?.organization_id ?? "",
      });
      onOpen(false);
    }
  };

  const onCreditsSubmit = async (values: SubOrgCredentialsFormType) => {
    try {
      await updateMultipleSubOrgLimits({
        sub_orgs: values.sub_orgs
          .filter((org) => !!org.organization_id)
          .map((org) => ({
            ...org,
            limit: org.limit ?? 1, // default to 1 if limit is null/undefined
          })),
      });
      if (mode === "create") {
        const newOrg = form.watch();
        await createSubOrganization({
          name: newOrg.name,
          limit: sub_orgs.find((org) => !org.organization_id)?.limit ?? 1,
          about_organization: newOrg.about_organization,
        });
        onOpen(false);
        setCurrentStep(1);
        onReset();
      }
      if (mode === "update") {
        const newOrg = form.getValues();
        await updateSubOrganization({
          data: {
            name: newOrg.name,
            limit: sub_orgs.find((org) => !org.organization_id)?.limit ?? 1,
            about_organization: newOrg.about_organization,
          },
          subOrgId: "",
        });
        onOpen(false);
      }
      onOpen(false);
    } catch (error) {}
  };

  const hasError =
    !!creditsAllocationForm.formState.errors.sub_orgs?.root?.message;

  const onReset = useCallback(() => {
    if (mode !== "create") {
      creditsAllocationForm.reset({
        sub_orgs: subOrganizations.map((org) => ({
          ...org,
          limit: org.allocated_credits,
        })),
      });
    }
    if (mode === "create") {
      if (currentStep === 1) {
        form.reset({ name: "", about_organization: "", limit: 1 });
      }
      if (currentStep === 2) {
        creditsAllocationForm.reset({
          sub_orgs: subOrganizations.map((org) => ({
            ...org,
            limit: org?.allocated_credits,
          })),
        });
        // addSubOrg({
        //   name: form.watch("name"),
        //   limit: null,
        //   organization_id: "",
        // });
      }
    }
    if (mode === "update") form.reset({ ...data });
  }, [mode, open, form, creditsAllocationForm, data, subOrganizations]);

  useEffect(() => {
    onReset();

    return () => {
      onReset();
    };
  }, [onReset]);

  useEffect(() => {
    setCurrentStep(mode === "manage" ? 2 : 1);
  }, [mode]);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-w-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom-10 data-[state=open]:slide-in-from-top-10">
        <DialogHeader>
          <DialogTitle>
            {currentStep === 1
              ? mode === "update"
                ? "Update Account"
                : "New Account"
              : "Manage Credits"}
          </DialogTitle>
        </DialogHeader>
        <Separator />
        {currentStep === 1 && (
          <motion.div
            key="Sub org form step 1"
            variants={{
              initial: { width: 0 },
              animate: { width: "100%" },
              exit: { opacity: 0 },
            }}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="grid gap-4"
              >
                <FormField
                  name="name"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Sub-Account Name{" "}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="about_organization"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} rows={1} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />
                <DialogFooter>
                  <DialogClose
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Cancel
                  </DialogClose>
                  <Button loading={form.formState.isSubmitting}>
                    {mode === "create"
                      ? "Next"
                      : mode === "update"
                        ? isUpdatingSubOrg
                          ? "Updating"
                          : "Update"
                        : "Submit"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </motion.div>
        )}
        {currentStep === 2 && (
          <motion.div
            key="Sub org form step 2"
            variants={{
              initial: { width: 0 },
              animate: { width: "100%" },
              exit: { opacity: 0 },
            }}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <Form {...creditsAllocationForm}>
              <form
                onSubmit={creditsAllocationForm.handleSubmit(onCreditsSubmit)}
                className="grid gap-4"
              >
                <div className="flex items-center justify-between rounded-md bg-secondary p-2">
                  <span>
                    <p className="text-sm font-semibold">
                      Changes in allocation will take effect from the next cycle
                    </p>
                    {/* <p className="text-xs text-muted-foreground">
                      Remaining credits will be used by the main account
                    </p> */}
                  </span>
                  <span>
                    <p className="text-xs text-muted-foreground">
                      (
                      {new Intl.DateTimeFormat(undefined, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(
                        getNextBillingDate(
                          new Date(usage_data?.created_at ?? new Date()),
                          // @ts-ignore
                          usage_data?.cycle_at ?? "monthly",
                        ),
                      )}
                      )
                    </p>
                    {/* <p className="text-sm font-semibold">
                      {`${convertToReadableNumber(creditsLeft - totalSubOrgCreditsForm)}`}
                    </p> */}
                  </span>
                </div>
                <Separator />

                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Allocate credits
                  </p>
                  {/* <Button
                    variant="link"
                    size="sm"
                    type="button"
                    className="text-muted-foreground"
                    onClick={onReset}
                  >
                    <RefreshCw className="mr-1 size-4" /> Reset
                  </Button> */}
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm">
                      {current_organization?.name} Main account
                    </p>

                    <p className="text-sm font-semibold">
                      {`${convertToReadableNumber(totalCredits - totalSubOrgCreditsForm)}`}
                    </p>
                  </div>

                  {subOrgFields.map((subOrgField, idx) => (
                    <div key={subOrgField.id}>
                      <FormField
                        control={creditsAllocationForm.control}
                        name={`sub_orgs.${idx}.limit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-6 gap-2">
                                <div className="col-span-4 inline-flex items-center gap-2 text-sm">
                                  <p
                                    className="truncate"
                                    title={subOrgField.name}
                                  >
                                    {subOrgField.name}
                                  </p>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="premium"
                                        size="sm"
                                        className="cursor-default"
                                      >
                                        {`${(((Number(field.value ?? 0) / CREDITS_DIVISOR) / totalCredits) * 100).toFixed(2)}%`}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent>{`${(((Number(field.value ?? 0) / CREDITS_DIVISOR) / totalCredits) * 100).toFixed(2)}% out of ${convertToReadableNumber(totalCredits)}`}</TooltipContent>
                                  </Tooltip>
                                </div>
                                <Input
                                  {...field}
                                  value={
                                    field.value != null
                                      ? Number(field.value) / CREDITS_DIVISOR
                                      : ""
                                  }
                                  disabled={
                                    idx <
                                    (mode === "create"
                                      ? subOrgFields.length - 1
                                      : subOrgFields.length)
                                  }
                                  onChange={(e) => {
                                    const parsed =
                                      e.target.value === ""
                                        ? null
                                        : Number(e.target.value);
                                    field.onChange(
                                      parsed === null
                                        ? null
                                        : parsed * CREDITS_DIVISOR
                                    );
                                  }}
                                  type="number"
                                  onKeyDown={(evt) =>
                                    ["e", "E", "+", "-"].includes(evt.key) &&
                                    evt.preventDefault()
                                  }
                                  className="col-span-2"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </div>
                <Separator />
                <DialogFooter
                  className={cn(
                    "flex w-full items-center",
                    hasError && "!justify-between",
                  )}
                >
                  {hasError && (
                    <span className="flex flex-row items-center gap-2">
                      <AlertTriangle className="size-4 text-destructive" />
                      <p className="text-xs text-destructive">
                        {
                          creditsAllocationForm.formState.errors.sub_orgs?.root
                            ?.message
                        }
                      </p>
                    </span>
                  )}
                  <div className="flex items-center gap-2">
                    {mode === "create" && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          console.log({ subOrgFields: subOrgFields.length });
                          removeSubOrg(subOrgFields.length - 1);
                          setCurrentStep((prev) => prev - 1);
                        }}
                      >
                        Back
                      </Button>
                    )}
                    <Button
                      loading={creditsAllocationForm.formState.isSubmitting}
                    >
                      {isCreatingSubOrg
                        ? "Creating Organization"
                        : isUpdatingSubOrg
                          ? "Updating Organization"
                          : creditsAllocationForm.formState.isSubmitting
                            ? "Allocating Credits ..."
                            : createMode
                              ? "Create"
                              : "Update"}
                    </Button>
                  </div>
                </DialogFooter>
              </form>
            </Form>
          </motion.div>
        )}
      </DialogContent>
    </Dialog>
  );
};
