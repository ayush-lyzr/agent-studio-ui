import { HTMLAttributes, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { useMemberstack } from "@memberstack/react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/custom/button";
import { PasswordInput } from "@/components/custom/password-input";
import { cn } from "@/lib/utils";
import { Path } from "@/lib/types";
import { GithubLogo, GoogleLogo, LinkedinLogo } from "@/assets/icons";
import { } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast";
import { IS_ENTERPRISE_DEPLOYMENT } from '@/lib/constants';
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate  } from "react-router-dom";

interface UserAuthFormProps extends HTMLAttributes<HTMLDivElement> { }

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Please enter your email" })
    .email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(1, {
      message: "Please enter your password",
    })
    .min(7, {
      message: "Password must be at least 7 characters long",
    }),
});

export default function UserAuthForm({ className }: UserAuthFormProps) {
  const { toast } = useToast();
  const [params, _] = useSearchParams();
  const navigate = useNavigate()

  const { loginMemberEmailPassword, loginWithProvider } = useMemberstack();
  const [isLoading, setIsLoading] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [isKeycloakLoading, setIsKeycloakLoading] = useState(false);

  const { login } = useAuth();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const handleSignInProvider = (provider: string) => async () => {
    try {
      const response: any = await loginWithProvider({ provider });
      if (response?.data) {
        toast({
          title: "Login successful!",
        });
        if (params.get("redirect"))
          window.location.href = `${response.data.redirect}?redirect=${params.get("redirect")}`;
        else { 
           navigate(Path.HOME)
        }
      }

      // Additional user info handling here
    } catch (error: any) {
      toast({
        title: "Login error",
        description: error?.message ?? "",
        variant: "destructive",
      });
      console.error(error);
      // Handle errors here
    }
  };


  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      setIsLoading(true);
      await loginMemberEmailPassword(data);
      if (params.get("redirect"))
        window.location.href = `${Path.HOME}?redirect=${params.get("redirect")}`;
      else { 
        navigate(Path.HOME) 
      }
    } catch (error: any) {
      toast({
        title: "Login error",
        description: error?.message ?? "",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const handleKeycloakIdp = async (idpHint: string) => {
    try {
      setIsKeycloakLoading(true);
      console.log("Origin", window.location.origin);
      login(
        idpHint,
        window.location.origin
      );
    } catch (error: any) {
      console.error("Keycloak login failed:", error);
      toast({
        title: "Login failed",
        description: error?.message ?? "Failed to login with Keycloak",
        variant: "destructive",
      });
      setIsKeycloakLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn("grid gap-4", className)}
    >
      {
        !IS_ENTERPRISE_DEPLOYMENT && (
          <>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={handleSignInProvider("google")}
                className="flex w-full justify-between bg-blue-500 px-1 text-white hover:bg-blue-400"
              >
                <GoogleLogo className="size-6 bg-white p-0.5" />
                <p className="hover:bg-transparent">Login with Google</p>
                <div></div>
              </Button>
              <Button
                variant="outline"
                onClick={handleSignInProvider("linkedin")}
                className="flex w-full justify-between border border-primary/30 shadow-none"
              >
                <LinkedinLogo className="size-4" />
                <p>Login with Linkedin</p>
                <div></div>
              </Button>
              <Button
                variant="outline"
                onClick={handleSignInProvider("github")}
                className="flex w-full justify-between border border-primary/30 shadow-none"
              >
                <GithubLogo className="size-4" />
                <p>Login with Github</p>
                <div></div>
              </Button>
            </div>
            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-muted-foreground">or</span>
              </div>
            </div>
            {!isSigningIn ? (
              <Button
                variant="outline"
                className="border border-primary/30 shadow-none"
                onClick={() => setIsSigningIn(true)}
              >
                Login with Email
              </Button>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                  <div className="grid gap-4">
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
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <PasswordInput
                              className="border-input"
                              placeholder="********"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex items-center justify-end">
                      <Link
                        to={Path.FORGOT_PASSWORD}
                        className="text-xs underline underline-offset-4"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <Button className="mt-2" loading={isLoading}>
                      Login
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </>
        )
      }
      {
        IS_ENTERPRISE_DEPLOYMENT && (
          <>
            <div className="grid gap-2">
              <Button
                variant="outline"
                onClick={() => handleKeycloakIdp('oidc')}
                loading={isKeycloakLoading}
                disabled={isKeycloakLoading}
                className="flex w-full justify-center bg-blue-500 px-1 text-white hover:bg-blue-400"
              >
                <p className="hover:bg-transparent">Login with SSO</p>
                <div></div>
              </Button>
            </div>
          </>

        )
      }
    </motion.div>
  );
}
