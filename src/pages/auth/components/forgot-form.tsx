import { HTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemberstack } from "@memberstack/react";
import { z } from "zod";

import { Button } from "@/components/custom/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { CheckCircle2 } from "lucide-react";

interface ForgotFormProps extends HTMLAttributes<HTMLDivElement> {}

export function ForgotForm({ className, ...props }: ForgotFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();
  const { sendMemberResetPasswordEmail } = useMemberstack();

  const formSchema = z.object({
    email: z
      .string()
      .min(1, { message: "Please enter your email" })
      .email({ message: "Invalid email address" }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const res = await sendMemberResetPasswordEmail(data);
      if (res.data) {
        toast({
          title: "Success",
          description: "Password reset link has been sent to your email",
        });
        setResetSuccess(true);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message ?? "",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="grid gap-2">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="mt-2" loading={isLoading}>
              Continue
            </Button>
          </div>
        </form>
      </Form>

      {resetSuccess && (
        <Alert className="bg-green-300">
          <CheckCircle2 className="size-4" />
          <AlertTitle>Success!</AlertTitle>
          <AlertDescription>
            You can reset new password by clicking the link in your email
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
