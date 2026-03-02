import { HTMLAttributes, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { useMemberstack } from "@memberstack/react";
import mixpanel from "mixpanel-browser";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useSearchParams } from "react-router-dom";
import { decodeJWT } from "@/lib/jwt";

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
import { BASE_URL, HCAPTCHA_SITE_KEY, isMixpanelActive } from "@/lib/constants";
import { GithubLogo, GoogleLogo, LinkedinLogo } from "@/assets/icons";
import { useToast } from "@/components/ui/use-toast";
import { Path } from "@/lib/types";
// import { useAuth as useKeycloakAuth } from "@/contexts/AuthContext";

interface SignUpFormProps extends HTMLAttributes<HTMLDivElement> { }

const formSchema = z
  .object({
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
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export default function SignUpForm({ className }: SignUpFormProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signupWithProvider, loginMemberEmailPassword } = useMemberstack();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSigningUp, setIsSigningUp] = useState<boolean>(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  // const [isKeycloakLoading, setIsKeycloakLoading] = useState(false);
  const [searchParams, _] = useSearchParams();


  const inviteLink = searchParams.get("invite_link");
  let decodedJwt;

  if(inviteLink) { 
    decodedJwt = decodeJWT(inviteLink);
    console.log("Decoded JWT", decodedJwt);
  }
  
  // const { login } = useKeycloakAuth();
  // const { current_organization } = useManageAdminStore(
  //   (state) => state,
  // );

  // // const { createOrganization, getCurrentOrg } = useOrganization({
  // //   token: getToken(),
  // //   current_organization,
  // // });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const handleSignUpProvider = (provider: string) => async () => {
    try {
      const res: any = await signupWithProvider({ provider });
      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
        mixpanel.track(`New user signup`, {
          user: res?.data?.member,
          provider,
        });
      }
      toast({
        title: "Authenticated successfully!",
        duration: 3 * 1000,
      });
      navigate(Path.VERIFY_EMAIL);

      // Additional user info handling here
    } catch (error: any) {
      toast({
        title: "Signup error",
        description: error?.message ?? "",
        variant: "destructive",
      });
      console.error(error);
      // Handle errors here
    }
  };

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (!captchaToken) {
      toast({
        title: "Verification required",
        description: "Please complete the captcha verification.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const res = await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          captcha_token: captchaToken,
        }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.detail || "Signup failed");
      }

      if (mixpanel.hasOwnProperty("cookie") && isMixpanelActive) {
        mixpanel.track(`New user signup`, {
          email: data.email,
          member_id: responseData.member_id,
        });
      }

      // Auto-login after successful signup
      await loginMemberEmailPassword({
        email: data.email,
        password: data.password,
      });

      toast({
        title: "Success",
        description: "Account created successfully. Redirecting to email verification...",
        duration: 2 * 1000,
      });

      // Redirect directly to verification page, not home
      navigate(Path.VERIFY_EMAIL, { replace: true });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message,
        variant: "destructive",
      });
      console.error("Error signing up => ", error);
      captchaRef.current?.resetCaptcha();
      setCaptchaToken(null);
    } finally {
      setIsLoading(false);
    }
  }


  // const handleKeycloakIdp = async (idpHint: string) => {
  //   try {
  //     setIsKeycloakLoading(true);
  //     const redirectUri = window.location.origin + searchParams
  //     console.log("Redirect URI", redirectUri);
  //     if(inviteLink) { 
  //       const decodedJWT = decodeJWT(inviteLink);
  //       console.log("Decoded JWT", decodedJWT);
  //     }

  //     login(idpHint, redirectUri);

  //   } catch (error: any) {
  //     console.error("Keycloak signup failed:", error);
  //     toast({
  //       title: "Signup failed",
  //       description: error?.message ?? "Failed to signup with Keycloak",
  //       variant: "destructive",
  //     });
  //     setIsKeycloakLoading(false);
  //   }
  // }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={cn("grid gap-4", className)}
    >
      <div className="grid gap-2">
        <Button
          variant="outline"
          onClick={handleSignUpProvider("google")}
          className="flex w-full justify-between bg-blue-500 px-1 text-white hover:bg-blue-400"
        >
          <GoogleLogo className="size-6 bg-white p-0.5" />
          <p className="hover:bg-transparent">Sign up with Google</p>
          <div></div>
        </Button>
        <Button
          variant="outline"
          onClick={handleSignUpProvider("linkedin")}
          className="flex w-full justify-between border border-primary/30 shadow-none"
        >
          <LinkedinLogo className="size-4" />
          <p>Sign up with Linkedin</p>
          <div></div>
        </Button>
        <Button
          variant="outline"
          onClick={handleSignUpProvider("github")}
          className="flex w-full justify-between border border-primary/30 shadow-none"
        >
          <GithubLogo className="size-4" />
          <p>Sign up with Github</p>
          <div></div>
        </Button>
      </div>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-transparent px-4 text-muted-foreground">or</span>
        </div>
      </div>
      {!isSigningUp ? (
        <Button
          variant="outline"
          className="border border-primary/30 shadow-none"
          onClick={() => setIsSigningUp(true)}
        >
          Sign up with Email
        </Button>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
        >
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
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Confirm Password</FormLabel>
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

                <span className="inline-flex items-center gap-1 text-xs max-[450px]:text-[0.6rem]">
                  By signing up, you agree to our{" "}
                  <Link
                    to="https://www.avanade.com/en-gb/about/legal"
                    target="_blank"
                    className="underline underline-offset-4"
                  >
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link
                    to="https://www.avanade.com/en-gb/about/legal/privacy"
                    target="_blank"
                    className="underline underline-offset-4"
                  >
                    Privacy Policy
                  </Link>
                </span>

                <div className="mt-2 flex justify-center">
                  <HCaptcha
                    ref={captchaRef}
                    sitekey={HCAPTCHA_SITE_KEY}
                    onVerify={(token) => setCaptchaToken(token)}
                    onExpire={() => setCaptchaToken(null)}
                    onError={() => setCaptchaToken(null)}
                  />
                </div>

                <Button className="mt-2" loading={isLoading} disabled={!captchaToken}>
                  Sign-Up
                </Button>
              </div>
              <div className="relative flex justify-center">
                <span className="bg-background px-4 text-muted-foreground">or</span>
              </div>
            </form>
          </Form>
        </motion.div>
      )}
    </motion.div>
  );
}