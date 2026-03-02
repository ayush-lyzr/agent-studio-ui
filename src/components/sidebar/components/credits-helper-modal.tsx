import { Dispatch, SetStateAction, useState } from "react";
import { Calendar } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { PlanType } from "@/lib/constants";
import { getNextBillingDate } from "@/lib/utils";
import { useManageAdminStore } from "@/pages/manage-admin/manage-admin.store";

const points = [
  {
    index: 1,
    title: "Model Type",
    description:
      "Advanced reasoning models (e.g., GPT-4.1) consume more credits than lighter ones (e.g., GPT-4o-mini).",
  },
  {
    index: 2,
    title: "Features Used",
    description:
      "Some features like memory are free. features (tools, reflection, Responsible AI) incur additional credits.",
  },
  {
    index: 3,
    title: "Message Length",
    description:
      "Longer instructions, questions, or agent response = more input and output tokens = more credits used.",
  },
];

export const CreditsHelperModal: React.FC<{
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
}> = ({ open, onOpen }) => {
  const [isVideoLoading, setIsVideoLoading] = useState<boolean>(true);

  const { usage_data } = useManageAdminStore((state) => state);

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent className="max-h-[90vh] max-w-[80vw] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Understanding Credits</DialogTitle>
          <DialogDescription>
            Credits are the currency used to run agents in Lyzr Agent Studio.
            Every interaction with an agent consumes credits.
          </DialogDescription>
        </DialogHeader>

        <div className="flex h-[25rem] items-start justify-between gap-4">
          <div className="w-[45%] space-y-4">
            <p className="text-sm font-bold leading-relaxed text-muted-foreground">
              Credits consumption depends on:
            </p>
            {points.map((point) => (
              <div className="group cursor-default rounded-xl border border-l-4 border-l-primary/30 transition-all ease-in-out">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Badge className="mt-0.5 bg-primary/50 font-semibold group-hover:bg-primary">
                        {point.index}
                      </Badge>
                      <div>
                        <h3 className="text-md text-md font-bold group-hover:text-primary">
                          {point.title}
                        </h3>

                        <p className="mt-1 text-sm text-muted-foreground group-hover:text-primary">
                          {point.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </div>
            ))}
          </div>
          <Separator orientation="vertical" />
          <div className="h-full w-[55%] p-2 pr-0">
            {isVideoLoading && (
              <Skeleton className="absolute inset-0 h-full w-full" />
            )}
            <iframe
              title="Video"
              src="https://www.youtube.com/embed/pxb1HkRXHq0"
              className="h-full w-full rounded-lg"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={() => setIsVideoLoading(false)}
            />
          </div>
        </div>
        {usage_data?.plan_name === PlanType.Community && (
          <div className="flex items-center gap-1 rounded-lg border border-muted-foreground/50 bg-secondary p-2 text-sm text-primary">
            <Calendar className="size-4" /> Credits are replenished every month
            & you will have 500 credits on{" "}
            {new Intl.DateTimeFormat("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
            }).format(
              getNextBillingDate(
                new Date(usage_data?.created_at ?? new Date()),
                usage_data?.cycle_at ?? "monthly",
              ),
            )}
            .
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
