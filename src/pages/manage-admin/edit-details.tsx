import React, { Dispatch, SetStateAction } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
// import { GearIcon } from "@radix-ui/react-icons";
import { useAuth } from "@/contexts/AuthContext";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { buttonVariants } from "@/components/custom/button";
import { Textarea } from "@/components/ui/textarea";
// import ManageSubscription from "./manage-subscription";
import { useManageAdminStore } from "./manage-admin.store";
import { useOrganization } from "../organization/org.service";
import { useToast } from "@/components/ui/use-toast";
import { IUsage, UserRole } from "@/lib/types";
import { INDUSTRY_OPTIONS } from "@/lib/constants";
import { isOrgMode } from "@/lib/utils";

type IEditDetails = {
  open: boolean;
  onOpen: Dispatch<SetStateAction<boolean>>;
  usage: Partial<IUsage>;
};

const EditDetails: React.FC<IEditDetails> = ({ open, onOpen, usage }) => {
  const { getToken } = useAuth();
  const { toast } = useToast();
  // const [manageVisible, setManageVisible] = useState<boolean>(false);

  const { current_organization, setCurrentOrganization } = useManageAdminStore(
    (state) => state,
  );
  const { updateOrganization, isUpdatingOrganization, getCurrentOrg } =
    useOrganization({ token: getToken()!, current_organization });
  const enableForm =
    [UserRole.owner, UserRole.admin].includes(
      current_organization?.role as UserRole,
    ) && isOrgMode(usage?.plan_name);

  const formSchema = z.object({
    name: z.string().optional(),
    domain: z.string().optional(),
    industry: z.string().optional(),
    about_organization: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      name: current_organization?.name,
      domain: current_organization?.domain,
      industry: current_organization?.industry,
      about_organization: current_organization?.about_organization,
    },
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const res = await updateOrganization(values);
      if (res.data) {
        toast({
          title: "Success",
          description: "Updated organization details",
        });
        onOpen(false);
        getCurrentOrg().then((res) =>
          setCurrentOrganization({
            ...res.data?.current_organization,
            ...res.data?.policy,
          }),
        );
      }
    } catch (error) {}
  };

  return (
    <div>
      <Dialog open={open} onOpenChange={onOpen}>
        <Form {...form}>
          <DialogContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <DialogHeader>
                <DialogTitle>Edit Details</DialogTitle>
              </DialogHeader>
              <Separator />
              {enableForm && (
                <>
                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Org Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="domain"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Org Domain</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="industry"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Select
                            {...field}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select Industry" />
                            </SelectTrigger>
                            <SelectContent>
                              {INDUSTRY_OPTIONS.map((value) => (
                                <SelectItem
                                  key={value}
                                  value={value}
                                  className="w-full"
                                >
                                  {value}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="about_organization"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>About the company (optional)</FormLabel>
                        <FormControl>
                          <Textarea {...field} rows={4} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              {/* <Button
                variant="outline"
                className="w-fit"
                onClick={(e) => {
                  e.preventDefault();
                  setManageVisible(true);
                }}
              >
                <GearIcon className="mr-2 size-4" />
                Manage Subscription
              </Button> */}
              <Separator />
              <DialogFooter>
                <DialogClose
                  className={buttonVariants({ variant: "secondary" })}
                >
                  Cancel
                </DialogClose>
                {enableForm && (
                  <Button loading={isUpdatingOrganization}>Update</Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Form>
      </Dialog>
      {/* <ManageSubscription open={manageVisible} onOpen={setManageVisible} /> */}
    </div>
  );
};

export default EditDetails;
