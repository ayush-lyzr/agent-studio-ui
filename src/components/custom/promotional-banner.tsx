import { useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/custom/button";
import { cn } from "@/lib/utils";

type PromotionalBannerProps = {
  icon: ReactNode;
  headline: string;
  subtext: string;
  ctaLabel: string;
  ctaHref: string;
  ctaIcon?: ReactNode;
  dismissStorageKey?: string;
  className?: string;
};

export function PromotionalBanner({
  icon,
  headline,
  subtext,
  ctaLabel,
  ctaHref,
  ctaIcon,
  dismissStorageKey,
  className,
}: PromotionalBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!dismissStorageKey) return;
    try {
      setDismissed(window.localStorage.getItem(dismissStorageKey) === "1");
    } catch {
      // ignore storage access issues (private mode, blocked storage, etc.)
    }
  }, [dismissStorageKey]);

  if (dismissed) return null;

  const onDismiss = () => {
    setDismissed(true);
    if (!dismissStorageKey) return;
    try {
      window.localStorage.setItem(dismissStorageKey, "1");
    } catch {
      // ignore storage access issues
    }
  };

  const onCtaClick = () => {
    const newTab = window.open(ctaHref, "_blank");
    if (newTab) newTab.opener = null;
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-lg border border-indigo-200/60 bg-indigo-50/70 p-4 text-foreground dark:border-indigo-900/50 dark:bg-indigo-950/30 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
      role="region"
      aria-label={headline}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 shrink-0 text-indigo-700 dark:text-indigo-300">
          {icon}
        </div>
        <div className="flex min-w-0 flex-col gap-1">
          <h4 className="font-semibold">{headline}</h4>
          <p className="text-sm text-muted-foreground">{subtext}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:self-center">
        <Button className="gap-2" type="button" onClick={onCtaClick}>
          {ctaLabel}
          {ctaIcon}
        </Button>

        {dismissStorageKey ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onDismiss}
            aria-label="Dismiss banner"
          >
            <X className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
    </div>
  );
}

