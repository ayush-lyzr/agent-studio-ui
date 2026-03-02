import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface NewCreditSystemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const NewCreditSystemDialog = ({
  open,
  onOpenChange,
}: NewCreditSystemDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg sm:max-w-xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              New credits display
            </span>
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight">
            We&apos;ve simplified how credits work
          </DialogTitle>
          <DialogDescription>
            <p className="text-sm text-muted-foreground">
              1 credit now directly equals $1 so you can understand usage and
              spend at a glance.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What&apos;s changing
            </h3>
            <div className="flex items-stretch gap-3">
              <div className="flex-1 rounded-lg border bg-card p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Before (old display)
                </p>
                <p className="text-xl font-bold">100 credits = $1</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  e.g. 500 credits = $5
                </p>
              </div>
              <div className="flex shrink-0 items-center text-muted-foreground">
                <span className="text-xl" aria-hidden>
                  →
                </span>
              </div>
              <div className="bg-muted-background flex-1 rounded-lg border p-4">
                <p className="mb-2 text-xs font-medium text-muted-foreground">
                  Now (new display)
                </p>
                <p className="text-xl font-bold">1 credit = $1</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  e.g. 5 credits = $5
                </p>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              What this means for you
            </h3>
            <ul className="list-disc space-y-2 pl-4 text-sm text-muted-foreground">
              <li>Your total value and pricing stay exactly the same.</li>
              <li>
                You&apos;ll simply see fewer credits (e.g. 5 instead of 500).
              </li>
              <li>
                Usage now deducts fractional credits (1/100th of the previous
                numbers).
              </li>
              <li>No change to billing, plans, or actual usage cost.</li>
              <li>Only the way credits are represented has changed.</li>
            </ul>
            <div className="rounded-lg border bg-home-emerald p-3 text-sm text-home-emerald-background">
              You&apos;re not losing credits, and nothing is becoming more
              expensive.
            </div>
          </section>
        </div>

        {/* <DialogFooter className="flex-row justify-end gap-2 sm:justify-end">
          <Button variant="outline" onClick={handleContactSupport}>
            Contact support
          </Button>
          <Button onClick={() => onOpenChange(false)}>Got it</Button>
        </DialogFooter> */}
      </DialogContent>
    </Dialog>
  );
};
