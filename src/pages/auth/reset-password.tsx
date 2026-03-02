import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMemberstack } from "@memberstack/react";
import { CheckCircle2, ChevronLeft } from "lucide-react";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/custom/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { PasswordInput } from "@/components/custom/password-input";
import { Path } from "@/lib/types";

export default function ResetPassword() {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex h-svh w-svw items-center justify-center overflow-hidden bg-background">
        <div className="z-10 flex h-full flex-col items-center justify-center gap-4 sm:w-4/5 md:w-[25rem]">
          <div className="flex h-1/6 items-center gap-2">
            <BrandLogo className="h-12 w-auto max-w-[200px] object-contain" />
          </div>
          <p className="text-lg font-semibold">Reset Password</p>
          <p className="w-4/5 text-center text-sm text-muted-foreground">
            No worries, We will send you the reset instructions
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="h-1/4 w-[20rem]"
            >
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
                      <Input
                        className="bg-input"
                        placeholder="Eg: 123456"
                        {...field}
                      />
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
                      <PasswordInput
                        className="bg-input"
                        placeholder="*********"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="mt-2 w-full" loading={isLoading}>
                Submit
              </Button>
            </form>
            {resetSuccess && (
              <Alert className="bg-green-300">
                <CheckCircle2 className="size-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  You can reset new password by clicking the link in your email
                </AlertDescription>
              </Alert>
            )}
          </Form>
          <Link
            to={Path.LOGIN}
            className="mt-8 inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
          >
            <ChevronLeft className="size-4" />
            Back to Login
          </Link>
        </div>
      </div>
      <div className="absolute bottom-10 -z-0 h-20 w-full bg-gradient-to-t from-[#3D10F5] to-[#E84711] opacity-50 blur-2xl" />
    </motion.div>
  );
}
