import React, { Dispatch, SetStateAction, useEffect } from "react";
import { Button, buttonVariants } from "@/components/custom/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormItem,
  FormField,
  FormMessage,
  FormControl,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useRAIPolicy } from "../rai.service";
import { useParams } from "react-router-dom";
import { IRAIPolicy } from "@/lib/types";

type IPolicyForm = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  data: Partial<IRAIPolicy>;
  onRefresh: () => void;
};

const PolicyForm: React.FC<IPolicyForm> = ({
  open,
  onOpen,
  data,
  onRefresh,
}) => {
  const params = useParams();
  const policy_id = params?.id;
  const { createPolicy, updatePolicy } = useRAIPolicy();

  const formSchema = z.object({
    name: z.string(),
    description: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues:
      Object.values(data).length > 0
        ? data
        : {
            name: "",
            description: "",
          },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (Object.values(data).length > 0) {
        await updatePolicy({
          ...values,
          policy_id: policy_id ?? data?._id ?? "",
        });
      } else {
        await createPolicy({
          name: values.name,
          description: values.description,
          toxicity_check: { enabled: false, threshold: 0.4 },
          prompt_injection: { enabled: false, threshold: 0.3 },
          secrets_detection: { enabled: false, action: "mask" },
          allowed_topics: { enabled: false, topics: [] },
          banned_topics: { enabled: false, topics: [] },
          keywords: { enabled: false, keywords: [] },
          pii_detection: {
            enabled: false,
            types: {
              CREDIT_CARD: "disabled",
              EMAIL_ADDRESS: "disabled",
              PHONE_NUMBER: "disabled",
              PERSON: "disabled",
              LOCATION: "disabled",
              IP_ADDRESS: "disabled",
              US_SSN: "disabled",
              URL: "disabled",
              DATE_TIME: "disabled",
            },
            custom_pii: [],
          },
        });
      }
      onOpen(false);
      onRefresh();
    } catch (error) {
      console.log("error in policy form", error);
    }
  };

  useEffect(() => {
    form.reset(data);

    return () => {
      form.reset({});
    };
  }, [data]);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <Form {...form}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {Object.keys(data).length ? "Update" : "Create"} new policy
            </DialogTitle>
            <DialogDescription>
              Policies define the rules and safeguards for agent behavior.
              Configure them and map to agents to get reliable interactions.
            </DialogDescription>
          </DialogHeader>
          <Separator />
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4"
          >
            <FormField
              name="name"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="description"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <DialogFooter>
              <DialogClose className={buttonVariants({ variant: "outline" })}>
                Cancel
              </DialogClose>
              <Button loading={form.formState.isSubmitting}>
                {Object.keys(data).length ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  );
};

export default PolicyForm;
