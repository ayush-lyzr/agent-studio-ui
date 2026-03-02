import React, { useEffect } from "react";
import confetti from "canvas-confetti";
import { SetURLSearchParams } from "react-router-dom";
import { CheckCircle2, CircleX, Loader2 } from "lucide-react";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { pricingTiers } from "@/pages/upgrade-plan/data";

export const ConfettiDialog: React.FC<{
  open: boolean;
  onOpen: SetURLSearchParams;
  success: boolean;
  loading: boolean;
  priceId: string;
}> = ({ open, onOpen, success = false, loading = true, priceId }) => {
  const topUpTier = {
    name: "Top Up",
    price: "$50",
    priceId: "prc_additional-one-time-0m6r01n3",
  };

  const data = [...pricingTiers()["default"], topUpTier].find(
    (tier) => tier?.priceId === priceId,
  );

  const receiptData = {
    dateTime: new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date()),
    senderName: "Avanade",
    amount: data?.price,
    plan: data?.name,
  };

  const fireConfetti = () => {
    // Fire confetti from the left
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.1, y: 0.5 },
    });

    // Fire confetti from the right
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { x: 0.9, y: 0.5 },
    });
  };

  useEffect(() => {
    if (success && !loading) {
      fireConfetti();
    }
  }, [success, loading]);

  return (
    <Dialog
      open={open && !loading}
      onOpenChange={(value) => onOpen(value ? "success" : "")}
    >
      <DialogContent className="max-w-[400px] p-0">
        <div className="relative">
          <div className="p-6 pb-8">
            {/* Success Icon */}
            <div className="mb-4 flex justify-center">
              <div
                className={cn(
                  "flex h-16 w-16 items-center justify-center rounded-full",
                  loading
                    ? "bg-neutral-200"
                    : success
                      ? "bg-green-50"
                      : "bg-destructive/20",
                )}
              >
                {loading ? (
                  <Loader2 className="animate-spin" />
                ) : success ? (
                  <CheckCircle2 className="size-8 text-green-600" />
                ) : (
                  <CircleX className="size-8 text-destructive" />
                )}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="shimmer h-5 w-1/3 rounded-lg bg-neutral-200" />
                <div className="shimmer h-5 w-1/2 rounded-lg bg-neutral-200" />
                <div className="mt-4 w-full space-y-4">
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Date & time</p>
                    <div className="shimmer h-5 w-1/3 rounded-md bg-neutral-200" />
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Biller Name</p>
                    <div className="shimmer h-5 w-1/3 rounded-md bg-neutral-200" />
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Plan Name</p>
                    <div className="shimmer h-5 w-1/3 rounded-md bg-neutral-200" />
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Total Amount</p>
                    <div className="shimmer h-5 w-1/3 rounded-md bg-neutral-200" />
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Success Message */}
                <div className="mb-6 text-center">
                  <h2 className="mb-2 text-xl font-semibold">
                    Payment {success ? "Success" : "Failure"}!
                  </h2>
                  {success ? (
                    <p className="text-muted-foreground">
                      Your payment has been successfully done.
                      <br />
                      Thank you for subscribing!
                    </p>
                  ) : (
                    <p className="text-muted-foreground">
                      Oops! There is a problem in the payment. Please ensure to
                      enter details correctly.
                    </p>
                  )}
                </div>

                {/* Receipt Details */}
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Date & time</p>
                    <p className="font-medium">{receiptData.dateTime}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Biller Name</p>
                    <p className="font-medium">{receiptData.senderName}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Plan Name</p>
                    <p className="font-medium">{receiptData.plan}</p>
                  </div>
                  <div className="flex justify-between">
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="font-medium">{receiptData.amount}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Scalloped Bottom Edge */}
          <div className="absolute -bottom-3 left-0 right-0 h-6 overflow-hidden">
            <div className="flex gap-3">
              {Array.from({ length: 25 }).map((_, i) => (
                <div
                  key={i}
                  className="-mr-2 h-4 w-6 rounded-full bg-background"
                />
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
