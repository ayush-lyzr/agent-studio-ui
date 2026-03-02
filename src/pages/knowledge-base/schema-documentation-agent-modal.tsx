import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { Dispatch, SetStateAction } from "react";
import { InfoCircledIcon } from "@radix-ui/react-icons";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { Button, buttonVariants } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import useStore from "@/lib/store";
import { useToast } from "@/components/ui/use-toast";
import axios from "@/lib/axios";
import { useMutation } from "@tanstack/react-query";
import { BASE_URL } from "@/lib/constants";
import { ProviderModel } from "../create-agent/components/provider-model";

type ISchemaDocumentationAgentModal = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  onSuccess: () => void;
};

const SchemaDocumentationAgentModal: React.FC<
  ISchemaDocumentationAgentModal
> = ({ open, onOpen, onSuccess }) => {
  const { toast } = useToast();
  const apiKey = useStore((state) => state.api_key);

  const formSchema = z
    .object({
      name: z.string(),
      llm_credential_id: z.string(),
      provider_id: z.string().min(1, "Provider is required"),
      model: z.string(),
      temperature: z.number().min(0).max(1),
      top_p: z.number().min(0).max(1),
      additional_model_params: z.any().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.provider_id && !data.model) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Model is required",
          path: ["model"],
        });
      }
    });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      temperature: 0.7,
      top_p: 0.9,
      provider_id: 'OpenAI',
      model: 'gpt-5-mini'
    },
  });

  const {
    mutateAsync: createDocumentationAgent,
    isPending: isCreatingDocAgent,
  } = useMutation({
    mutationKey: ["createDocumentationAgent", apiKey],
    mutationFn: (input: any) =>
      axios.post(`/v3/semantic_model/documentation_agents`, input, {
        baseURL: BASE_URL,
        headers: { "x-api-key": apiKey },
      }),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const payload = {
        ...values,
        model_id: values.model,
      };
      // @ts-ignore
      delete payload.model;

      await createDocumentationAgent(payload);
      onSuccess();
      onOpen(false);
      toast({
        title: "Success",
        description: "Created documentation agent",
      });
    } catch (error) {}
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <Form {...form}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Schema Documentation Agent</DialogTitle>
          </DialogHeader>
          <Separator />
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="grid grid-cols-1 gap-4"
          >
            <div className="space-y-4">
              <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
                <InfoCircledIcon className="mr-1 size-4" />
                <p className="w-[95%]">
                  This agent is used to generate descriptions of tables and
                  columns in your database. Select an LLM below to configure it
                  automatically.
                </p>
              </div>

              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <FormLabel required>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-41 flex items-end gap-4">
                <ProviderModel form={form} allowConfigure={false} />
              </div>

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <div className="mb-4 flex items-center justify-between text-sm">
                      <FormLabel required>Temperature</FormLabel>
                      <p>{field.value}</p>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([value]) => field.onChange(value)}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="top_p"
                render={({ field }) => (
                  <FormItem className="col-span-1">
                    <div className="mb-4 flex items-center justify-between text-sm">
                      <FormLabel required>Top P</FormLabel>
                      <p>{field.value}</p>
                    </div>
                    <FormControl>
                      <Slider
                        value={[field.value]}
                        onValueChange={([value]) => field.onChange(value)}
                        min={0}
                        max={1}
                        step={0.1}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator />
            <DialogFooter>
              <DialogClose className={buttonVariants({ variant: "outline" })}>
                Cancel
              </DialogClose>
              <Button loading={isCreatingDocAgent}>Submit</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  );
};

export default SchemaDocumentationAgentModal;
