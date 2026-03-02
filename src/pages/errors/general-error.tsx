import { useNavigate, useRouteError } from "react-router-dom";
import { Button } from "@/components/custom/button";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

interface GeneralErrorProps extends React.HTMLAttributes<HTMLDivElement> {
  minimal?: boolean;
}

export default function GeneralError({
  className,
  minimal = false,
}: GeneralErrorProps) {
  const navigate = useNavigate();
  const error = useRouteError();

  useEffect(() => {
    // Log the error to console when component mounts or error changes
    if (error) {
      console.error("=== General Error Occurred ===");
      console.error("Error object:", error);

      // Log different error properties
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else if (typeof error === 'object') {
        console.error("Error details:", JSON.stringify(error, null, 2));
      }

      // Log additional React Router error info if available
      if ('status' in (error as any)) {
        console.error("Status:", (error as any).status);
      }
      if ('statusText' in (error as any)) {
        console.error("Status Text:", (error as any).statusText);
      }
      if ('data' in (error as any)) {
        console.error("Error data:", (error as any).data);
      }

      console.error("============================");
    }
  }, [error]);

  useEffect(() => {
    if (!minimal) {
      // const refreshInterval = setInterval(() => {
      //   window.location.href =
      //     window.location.href + "?forceReload=" + Date.now();
      // }, 2000);
      // return () => clearInterval(refreshInterval);
    }
  }, [minimal]);

  const handleHardReload = () => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("forceReload")) {
      url.searchParams.set("forceReload", Date.now().toString());
      window.location.href = url.toString();
    } else {
      window.location.reload(); // fallback if already present
    }
  };

  return (
    <div className={cn("h-svh w-full", className)}>
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        {!minimal && (
          <h1 className="text-[2rem] font-bold leading-tight">
            Restoring connection...
          </h1>
        )}
        <p className="text-center text-muted-foreground">
          We're just updating things in the background.
          <br />
          Your data is safe. Please reload the page.
        </p>
        {!minimal && (
          <div className="mt-6 flex gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Go Back
            </Button>
            <Button onClick={handleHardReload}>Reload</Button>
          </div>
        )}
      </div>
    </div>
  );
}
