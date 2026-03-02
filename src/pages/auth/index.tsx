import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { BrandLogo } from "@/components/branding/BrandLogo";
import { Path } from "@/lib/types";

export default function Authentication() {
  const { isLoggedIn } = useAuth();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get("redirect") || "/";
  const isSignup = location.pathname === Path.REGISTER;

  if (isLoggedIn) {
    const path = `${Path.HOME}?redirect=${redirectTo}`;
    return <Navigate to={redirectTo.startsWith("http") ? path : redirectTo} />;
  }

  return (
    <>
      <div className="flex h-svh w-svw items-center justify-center overflow-hidden bg-background">
        <div className="z-10 flex h-full w-full flex-col items-center justify-center gap-4 overflow-y-scroll">
          <div className="mt-10 flex items-center justify-center">
            <BrandLogo className="h-12 w-auto max-w-[200px] object-contain" />
          </div>
          <p className="w-4/5 text-center font-semibold">
            Build and deploy reliable AI agents effortlessly
          </p>
          <p className="text-sm">
            {isSignup ? "Create your account" : "Login to your account"}
          </p>

          <div className="flex w-[26rem] flex-col justify-center gap-2 max-[450px]:w-[20rem]">
            <Outlet />
          </div>
          {isSignup ? (
            <p className="text-xs text-primary/80 dark:text-muted-foreground">
              Already, have an account?{" "}
              <a
                href={`${Path.LOGIN}${location.search}`}
                className="font-semibold text-primary underline"
              >
                Login
              </a>
            </p>
          ) : (
            <p className="text-xs text-primary/80 dark:text-muted-foreground">
              Don't have an account?{" "}
              <a
                href={`${Path.REGISTER}${location.search}`}
                className="font-semibold text-primary underline"
              >
                Sign up for Free
              </a>
            </p>
          )}
          <div className="h-40"></div>
        </div>
      </div>
      <div className="absolute bottom-10 -z-0 h-20 w-full bg-gradient-to-t from-[#3D10F5] to-[#E84711] opacity-50 blur-2xl" />
    </>
  );
}
