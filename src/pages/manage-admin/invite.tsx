import React, { Dispatch, SetStateAction } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { buttonVariants } from "@/components/custom/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useOrganization } from "../organization/org.service";
import { useToast } from "@/components/ui/use-toast";
import { useManageAdminStore } from "./manage-admin.store";
import { IS_ENTERPRISE_DEPLOYMENT } from "@/lib/constants";
import { UserRole } from "@/lib/types";

const Invite: React.FC<{
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  fetchTeamMembers?: () => void;
}> = ({ open, onOpen, fetchTeamMembers }) => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  const { current_organization } = useManageAdminStore((state) => state);
  const { inviteUser, isInvitingUser, inviteSsoUser, isInviteSsoUserPending } =
    useOrganization({
      token: getToken()!,
      current_organization,
    });

  const formSchema = z.object({
    user_email: z.string().email(),
    role: z.string(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {},
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      let res;
      if (IS_ENTERPRISE_DEPLOYMENT) {
        res = await inviteSsoUser(values);
      } else {
        res = await inviteUser(values);
      }

      if (res.data) {
        fetchTeamMembers?.();
        toast({
          title: "Invitation sent",
          description: "Recepient will receive an email.",
        });
        onOpen(false);
      }
    } catch (error) {
      toast({
        title: "Unable to send invitation",
        description: "Something went wrong please try again later",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpen}>
      <Form {...form}>
        <DialogContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <DialogHeader>
              <DialogTitle>Invite a person</DialogTitle>
            </DialogHeader>
            <Separator />
            <FormField
              control={form.control}
              name="user_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <Select
                      {...field}
                      onValueChange={(value) => field.onChange(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={UserRole.admin}>Admin</SelectItem>
                        <SelectItem value={UserRole.member}>Member</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Separator />
            <DialogFooter>
              <DialogClose className={buttonVariants({ variant: "secondary" })}>
                Cancel
              </DialogClose>
              <Button loading={isInvitingUser || isInviteSsoUserPending}>
                {isInvitingUser ? "Sending" : "Send"} Invitation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Form>
    </Dialog>
  );
};

export default Invite;
