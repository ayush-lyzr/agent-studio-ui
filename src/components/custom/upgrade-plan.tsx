import {
  Dialog,
  DialogFooter,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import React, { Dispatch, SetStateAction } from "react";
import { Crown } from "lucide-react";
import { Button } from "./button";
import { Separator } from "../ui/separator";
import { Path } from "@/lib/types";
import { Link } from "react-router-dom";

type UpgradePlanProps = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  title: string;
  description: string;
};

export const UpgradePlan: React.FC<UpgradePlanProps> = (props) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpen}>
      <DialogContent className="max-w-xl">
        <DialogHeader className="flex gap-2">
          <div className="grid size-10 place-items-center rounded-lg bg-primary">
            <Crown className="size-5 text-secondary" />
          </div>
          <DialogTitle>{props.title}</DialogTitle>
        </DialogHeader>
        <Separator />
        <div>{props.description}</div>
        <DialogFooter className="gap-4">
          <Button className="w-full">
            <Link
              to={Path.UPGRADE_PLAN}
              className="flex w-full flex-row justify-center"
            >
              View plans
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
