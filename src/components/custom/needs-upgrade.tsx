import {
  Dialog,
  DialogFooter,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import React, { Dispatch, SetStateAction } from "react";
import {
  Award,
  BrainCircuit,
  ChevronRight,
  Coins,
  Crown,
  MoveUpRight,
  Users,
} from "lucide-react";
import { Button, buttonVariants } from "./button";
import { cn } from "@/lib/utils";
import { Separator } from "../ui/separator";
import { Link } from "react-router-dom";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../ui/collapsible";

type NeedsUpgradeProps = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  description: string;
};

export const NeedsUpgrade: React.FC<NeedsUpgradeProps> = (props) => {
  const benefits = [
    {
      icon: <Coins className="size-4" />,
      text: "Custom credits and storage as per your needs",
    },
    {
      icon: <Users className="size-4" />,
      text: "Add team members to share and build agents together",
    },
    {
      icon: <Award className="size-4" />,
      text: "Unlock Agent Eval, Responsible AI, Hallucination Manager, and extended logs",
    },
    {
      icon: <BrainCircuit className="size-4" />,
      text: "Access advanced models or bring your own model",
    },
  ];

  return (
    <Dialog open={props.open} onOpenChange={props.onOpen}>
      <DialogContent className="max-w-screen-sm !rounded-3xl">
        <DialogHeader>
          <div className="grid size-10 place-items-center rounded-lg bg-primary">
            <Crown className="size-5 text-secondary" />
          </div>
          <DialogTitle>
            {props.title} is available only to Custom plan users
          </DialogTitle>
        </DialogHeader>
        <Separator />
        <div>
          <p>{props.description}</p>

          <Collapsible className="flex flex-col gap-2">
            <div className="flex items-center gap-1 text-muted-foreground underline underline-offset-4">
              <p className="text-sm">View all benefits from Custom Plan</p>
              <CollapsibleTrigger asChild>
                <Button variant="link" className="px-0">
                  <ChevronRight className="ml-1 size-4" />
                  <span className="sr-only">
                    Toggle to see benefits of custom plan
                  </span>
                </Button>
              </CollapsibleTrigger>
            </div>

            <CollapsibleContent>
              <ul className="grid gap-2 text-sm">
                {benefits.map((benefit) => (
                  <li className="flex items-center gap-2">
                    <span className="grid place-items-center rounded-md bg-accent p-2">
                      {benefit.icon}
                    </span>
                    {benefit.text}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
          </Collapsible>
        </div>
        <DialogFooter className="gap-4">
          <Link
            to="mailto:support@lyzr.ai?subject=Lyzr%20Support%20Request%20%E2%80%93%20%5BAdd%20Short%20Summary%5D&body=Hi%20Lyzr%20Team%2C%0D%0A%0D%0AI%E2%80%99m%20facing%20the%20following%20issue%3A%0D%0A%5BPlease%20describe%20your%20issue%20here%5D"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Speak to us <MoveUpRight className="ml-2 size-4" />
          </Link>
          <Link
            to="https://www.avanade.com/en-gb/contact"
            target="_blank"
            className={cn(buttonVariants({ variant: "outline" }), "w-full")}
          >
            Book a Demo
            <MoveUpRight className="ml-2 size-4" />
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
