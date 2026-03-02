import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useMemberstack } from "@memberstack/react";
import { CheckCircle2, ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

import { BrandLogo } from "@/components/branding/BrandLogo";
import { useToast } from "@/components/ui/use-toast";
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
import { Path } from "@/lib/types";

export default function ForgotPassword() {
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
    >
      <div className="flex h-svh w-svw items-center justify-center overflow-hidden bg-background">
        <div className="z-10 flex h-full flex-col items-center justify-center gap-4 sm:w-4/5 md:w-[25rem]">
          <div className="flex h-1/4 items-center gap-2">
            <BrandLogo className="h-12 w-auto max-w-[200px] object-contain" />
          </div>
          <p className="text-lg font-semibold">Forgot Password</p>
          <p className="w-4/5 text-center text-sm text-muted-foreground">
            Enter your registered email and we will send you a link to reset
            your password.
          </p>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="h-1/4 w-[20rem]"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        className="border-input"
                        placeholder="name@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button className="mt-2 w-full" loading={isLoading}>
                Continue
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
            <Link
              to={Path.LOGIN}
              className="inline-flex items-center gap-1 text-sm underline-offset-4 hover:underline"
            >
              <ChevronLeft className="size-4" />
              Back to Login
            </Link>
          </Form>
        </div>
      </div>
      <div className="absolute bottom-10 -z-0 h-20 w-full bg-gradient-to-t from-[#3D10F5] to-[#E84711] opacity-50 blur-2xl" />
    </motion.div>
  );
}
