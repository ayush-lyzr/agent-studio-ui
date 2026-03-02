import React from "react";
import { Link as RouterLink } from "react-router-dom";
import { AtSign, Copy, Link, Share2 } from "lucide-react";
import mixpanel from "mixpanel-browser";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import {
  InputGroupButton,
  InputGroupAddon,
  InputGroupInput,
  InputGroup,
} from "@/components/ui/input-group";
import { CopyMessage } from "@/components/custom/copy-message";
import { cn } from "@/lib/utils";
import GradientCard from "@/components/custom/gradient-card";
import { isMixpanelActive } from "@/lib/constants";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

type ShareAppModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appId: string;
};

export const ShareAppModal: React.FC<ShareAppModalProps> = ({
  open,
  onOpenChange,
  appId,
}) => {
  //  Ideally this feature should be blocked since prophet has a private lyzr studio
  const link = `https://maia.prophet.com/agent-library/${appId}`;
  const user = useManageAdminStore((state) => state.current_user);

  const handleLinkedinEvent = () => {
    if (isMixpanelActive && mixpanel.hasOwnProperty("cookie"))
      mixpanel.track(`Shared app to social platform`, {
        platform: "linkedin",
        user: user?.auth?.email,
        appId,
      });
  };

  const handleTwitterEvent = () => {
    if (isMixpanelActive && mixpanel.hasOwnProperty("cookie"))
      mixpanel.track(`Shared app to social platform`, {
        platform: "twitter",
        user: user?.auth?.email,
        appId,
      });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <GradientCard text={link} className="mb-2 h-40 w-full rounded-xl" />
          <DialogTitle>Share your agent with the world 🌍</DialogTitle>
          <DialogDescription>
            Post about it instantly on LinkedIn or X.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <ul className="space-y-2 text-sm font-normal">
            <li>
              <p className=" text-xs text-muted-foreground">How it works</p>
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-md bg-neutral-200 p-2 dark:bg-neutral-600">
                <Share2 className="size-3" />
              </span>
              Share your agent on Linkedin or X (Twitter)
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-md bg-neutral-200 p-2 dark:bg-neutral-600">
                <AtSign className="size-3" />
              </span>
              Tag <b>@Lyzr AI</b> in your post to earn 500 credits per share
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-md bg-neutral-200 p-2 dark:bg-neutral-600">
                <Copy className="size-3" />
              </span>
              Copy and share the link privately (not eligible for the credits)
            </li>
          </ul>
          <div className="grid grid-cols-2 gap-4">
            {/* TODO: Mixpanel events to be added */}
            <RouterLink
              target="_blank"
              to={`https://www.linkedin.com/sharing/share-offsite/?text=${encodeURIComponent(`Excited to share something I've been working on — my AI agent is live!\nTry it here: ${link}\n\nBuilt using Lyzr Agent Studio.`)}&url=${link}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "col-span-1 h-14",
              )}
              onClick={handleLinkedinEvent}
            >
              <img src="/linkedin.svg" className="mr-2 size-6" />
              Share on Linkedin
            </RouterLink>
            <RouterLink
              target="_blank"
              to={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Excited to share something I've been working on — my AI agent is live!\nTry it here: ${link}\n\nBuilt using Lyzr Agent Studio. @lyzr__ai`)}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "col-span-1 h-14",
              )}
              onClick={handleTwitterEvent}
            >
              <img src="/x.svg" className="mr-2 size-5" />
              Share on X
            </RouterLink>
          </div>
        </div>
        <DialogFooter>
          <InputGroup className="border-none bg-neutral-200 p-2 dark:bg-neutral-600">
            <InputGroupAddon className="px-0">
              <Link className="size-3 text-primary" />
            </InputGroupAddon>

            <InputGroupInput className="truncate" value={link} disabled />

            <InputGroupButton
              className="px-0 hover:no-underline"
              variant="link"
            >
              <CopyMessage content={link} />
            </InputGroupButton>
          </InputGroup>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
