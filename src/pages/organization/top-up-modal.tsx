import { zodResolver } from "@hookform/resolvers/zod";
import React, { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useMemberstack } from "@memberstack/react";
import { TOP_UP_PRICEID } from "@/lib/constants";
import Loader from "@/components/loader";
import { toast } from "sonner";

type ITopupModal = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
};

export const TopUpModal: React.FC<ITopupModal> = ({ open, onOpen }) => {
  const { purchasePlansWithCheckout } = useMemberstack();
  const formSchema = z.object({
    amount: z.number(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { amount: 50 },
  });

  const onSubmit = async () => {
    try {
      const res = await purchasePlansWithCheckout({
        priceId: TOP_UP_PRICEID,
        cancelUrl: window.location.origin + "/organization",
        successUrl: window.location.origin,
      });
      if (res.data?.url) {
        toast.success(`🎉 Successfully topped up !`);
      }
    } catch (error: any) {
      console.log("Error topping up => ", error);
      toast.error(error?.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="top-[80%] data-[state=closed]:slide-out-to-bottom-[80%] data-[state=open]:slide-in-from-bottom-[80%]">
        <DialogHeader>
          <DialogTitle>Top up</DialogTitle>
          <DialogDescription>Do top up here</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              name="amount"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enter a value</FormLabel>
                  <FormDescription>
                    Currently, only $50 topup available.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="mt-4">
              <Button onClick={() => onOpen(false)} variant="secondary">
                Cancel
              </Button>
              <Button>
                {form.formState.isSubmitting && <Loader className="mr-1" />}
                {form.formState.isSubmitting ? "Adding" : "Add now"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
