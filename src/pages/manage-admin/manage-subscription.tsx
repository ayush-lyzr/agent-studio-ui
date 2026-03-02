import React, { Dispatch, SetStateAction } from "react";
import { Link } from "react-router-dom";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useManageAdminStore } from "./manage-admin.store";
import { isOrgMode } from "@/lib/utils";

type IManageSubscription = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
};

const ManageSubscription: React.FC<IManageSubscription> = ({
  open,
  onOpen,
}) => {
  const { current_organization, usage_data } = useManageAdminStore(
    (state) => state,
  );

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
        </DialogHeader>
        <Separator />
        <div className="grid grid-cols-2 place-content-between gap-4">
          <span className="col-span-2 inline-flex space-x-2">
            <p>{"Your current plan : "}</p>
            <p className="col-span-1 font-bold">{usage_data?.plan_name} Plan</p>
          </span>
          {current_organization?.domain && (
            <span className="col-span-2 inline-flex space-x-2">
              <p>{"Domain: "}</p>
              <p className="col-span-1 font-bold">
                {current_organization?.domain}
              </p>
            </span>
          )}
          {isOrgMode(usage_data?.plan_name) && (
            <p className="col-span-2">
              Current team size is {current_organization?.user_ids?.length}/
              {usage_data?.total_seats}
            </p>
          )}
          <span className="col-span-2 inline-flex space-x-1">
            <p>If you want to unsubscribe, please mail us at</p>
            <Link
              to="mailto:studio@lyzr.ai?subject=Unsubscribe me"
              target="_blank"
              className="text-blue-600 hover:text-blue-500"
            >
              studio@lyzr.ai
            </Link>
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManageSubscription;
