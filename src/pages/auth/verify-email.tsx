import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth, useMemberstack } from "@memberstack/react";
import { motion } from "framer-motion";
import { Mail, CheckCircle2, RefreshCw, LogOut } from "lucide-react";

import { Button } from "@/components/custom/button";
import { useToast } from "@/components/ui/use-toast";
import { Path } from "@/lib/types";
import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

export default function VerifyEmail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { userId } = useAuth();
  const { getCurrentMember, sendMemberVerificationEmail, logout } = useMemberstack();
  const { setCurrentUser, current_user } = useManageAdminStore();

  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [hasRedirected, setHasRedirected] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) {
      return;
    }

    // Fetch current user to get email
    const fetchUser = async () => {
      try {
        const res = await getCurrentMember();
        const email = res.data?.auth?.email;

        if (!email) {
          // No email found - likely not logged in, redirect to login
          setHasRedirected(true);
          navigate(Path.LOGIN, { replace: true });
          return;
        }

        setUserEmail(email);

        // If already verified or OAuth user (no password), redirect to onboarding
        if (res.data?.verified || !res.data?.auth?.hasPassword) {
          setHasRedirected(true);

          // Update the user in the store to prevent redirect loop
          setCurrentUser({
            ...current_user,
            ...res.data,
            verified: res.data?.verified || false,
          });
          // No toast message on auto-verification
          // Redirect directly to onboarding
          navigate(Path.ONBOARDING, { replace: true });
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        // If there's an error fetching user, redirect to login
        setHasRedirected(true);
        navigate(Path.LOGIN, { replace: true });
      }
    };

    fetchUser();
  }, [userId]);

  const handleResendEmail = async () => {
    try {
      setIsResending(true);
      await sendMemberVerificationEmail();
      setEmailSent(true);
      toast({
        title: "Verification email sent",
        description: "Please check your inbox and spam folder.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending email",
        description: error?.message ?? "Failed to send verification email",
        variant: "destructive",
      });
      console.error("Error sending verification email:", error);
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    try {
      setIsChecking(true);
      const res = await getCurrentMember();

      if (res.data?.verified) {
        // Update the user in the store to prevent redirect loop
        setCurrentUser({
          ...current_user,
          ...res.data,
          verified: true,
        });
        // Full page reload so AuthContext re-initializes with the verified user's ID
        window.location.href = Path.ONBOARDING;
      } else {
        toast({
          title: "Not verified yet",
          description: "Please check your email and click the verification link.",
          variant: "default",
        });
        setIsChecking(false);
      }
    } catch (error: any) {
      toast({
        title: "Error checking verification",
        description: error?.message ?? "Failed to check verification status",
        variant: "destructive",
      });
      console.error("Error checking verification:", error);
      setIsChecking(false);
    }
  };

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await logout();
      toast({
        title: "Logged out successfully",
        description: "Redirecting to login page...",
      });
      setTimeout(() => {
        navigate(Path.LOGIN, { replace: true });
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error logging out",
        description: error?.message ?? "Failed to logout",
        variant: "destructive",
      });
      console.error("Error logging out:", error);
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-svh w-svw items-center justify-center overflow-hidden bg-background">
        <div className="flex flex-col items-center gap-4">
          <BrandLogo className="size-9 h-9 w-auto animate-pulse object-contain" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-svh w-svh items-center justify-center overflow-hidden bg-background">
      <div className="z-10 flex h-full w-full flex-col items-center justify-center gap-6 overflow-y-scroll px-4">
        <div className="mt-10 flex items-center justify-center">
          <BrandLogo className="h-12 w-auto max-w-[200px] object-contain" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-lg border bg-card p-8 text-center shadow-sm"
        >
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold">Verify Your Email</h1>

          <p className="mb-6 text-sm text-muted-foreground">
            We've sent a verification link to{" "}
            <span className="font-semibold text-foreground">{userEmail}</span>
          </p>

          <div className="mb-6 space-y-3 text-left text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>Check your inbox for an email from Lyzr</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>Click the verification link in the email</span>
            </p>
            <p className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>Return here and click "I've verified my email"</span>
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={handleCheckVerification}
              className="w-full"
              disabled={isChecking}
            >
              <RefreshCw className={cn("mr-2 h-4 w-4", isChecking && "animate-spin")} />
              I've verified my email
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-card px-4 text-xs text-muted-foreground">
                  Didn't receive the email?
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              onClick={handleResendEmail}
              className="w-full"
              loading={isResending}
              disabled={emailSent && !isResending}
            >
              {emailSent && !isResending ? "Email Sent!" : "Resend verification email"}
            </Button>

            <Button
              variant="ghost"
              onClick={handleLogout}
              className="w-full"
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Make sure to check your spam folder if you don't see the email
          </p>
        </motion.div>

        <div className="h-20" />
      </div>
      <div className="absolute bottom-10 -z-0 h-20 w-full bg-gradient-to-t from-[#3D10F5] to-[#E84711] opacity-50 blur-2xl" />
    </div>
  );
}
