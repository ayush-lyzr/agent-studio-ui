import { HTMLAttributes, useState } from "react";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useMemberstack } from "@memberstack/react";
import { z } from "zod";
import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/custom/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { PasswordInput } from "@/components/custom/password-input";
import { Path } from "@/lib/types";

interface ForgotFormProps extends HTMLAttributes<HTMLDivElement> {}

export function ResetForm({ className, ...props }: ForgotFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const { toast } = useToast();
  const { resetMemberPassword } = useMemberstack();

  const formSchema = z.object({
    token: z
      .string()
      .min(6, { message: "Token should be 6 digits" })
      .max(6, { message: "Token should be 6 digits" }),
    newPassword: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { token: "", newPassword: "" },
  });

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      const res = await resetMemberPassword(data);
      if (res.data) {
        toast({
          title: "Success",
          description: "Password reset successfully",
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
              name="token"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>Token</FormLabel>
                  <FormDescription>
                    6 digit code you received in email.
                  </FormDescription>
                  <FormControl>
                    <Input placeholder="Eg: 123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem className="space-y-1">
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder="*********" {...field} />
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
          <AlertDescription className="inline-flex space-x-1">
            You can now login using new password.{" "}
            <Link to={Path.LOGIN} className="ml-1 underline underline-offset-4">
              Login now
            </Link>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
