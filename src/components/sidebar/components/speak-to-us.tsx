import React from "react";
import { Link } from "react-router-dom";
import { HandHelping, Headset } from "lucide-react";
import mixpanel from "mixpanel-browser";

import { buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isMixpanelActive } from "@/lib/constants";

type ISpeakToUs = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const SpeakToUs: React.FC<ISpeakToUs> = ({ open, onOpenChange }) => {
  const onContactSupportEvent = () => {
    if (isMixpanelActive && mixpanel.hasOwnProperty("cookie")) {
      mixpanel.track("Contact support clicked");
    }
  };

  const onBookDemoEvent = () => {
    if (isMixpanelActive && mixpanel.hasOwnProperty("cookie")) {
      mixpanel.track("Book a demo clicked");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <div className="grid grid-cols-1 gap-4 transition-all duration-1000 ease-in-out">
          <div className="group flex cursor-default items-center gap-4 rounded-lg p-2 hover:bg-secondary">
            <div className="grid h-28 w-28 place-items-center rounded-lg bg-primary/5">
              <Headset className="size-9 text-muted-foreground transition-all ease-in-out group-hover:text-primary" />
            </div>
            <span className="flex h-full flex-col items-start justify-between">
              <p className="text-muted-foreground transition-all ease-in-out group-hover:text-primary">
                Facing a problem or need assistance? We’re just an email away.
              </p>
              <Link
                className={cn(buttonVariants({ size: "sm" }), "w-36")}
                onClick={onContactSupportEvent}
                to="mailto:support@lyzr.ai?subject=Lyzr%20Support%20Request%20%E2%80%93%20%5BAdd%20Short%20Summary%5D&body=Hi%20Lyzr%20Team%2C%0D%0A%0D%0AI%E2%80%99m%20facing%20the%20following%20issue%3A%0D%0A%5BPlease%20describe%20your%20issue%20here%5D"
              >
                Contact Support
              </Link>
            </span>
          </div>
          <div className="group flex cursor-default items-center gap-4 rounded-lg p-2 hover:bg-secondary">
            <div className="grid h-32 w-32 place-items-center rounded-lg bg-primary/5">
              <HandHelping className="size-10 text-muted-foreground transition-all ease-in-out group-hover:text-primary" />
            </div>
            <span className="flex h-full flex-col items-start justify-between">
              <p className="text-muted-foreground transition-all ease-in-out group-hover:text-primary">
                Want to build something with Lyzr? Let’s talk about custom
                solutions.
              </p>
              <Link
                to="https://www.avanade.com/en-gb/contact"
                target="_blank"
                onClick={onBookDemoEvent}
                className={cn(buttonVariants({ size: "sm" }), "w-36")}
              >
                Book a Demo
              </Link>
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
