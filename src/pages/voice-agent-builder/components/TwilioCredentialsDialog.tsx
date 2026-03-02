import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { PasswordInput } from "@/components/custom/password-input";

interface TwilioCredentialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (credentials: {
    account_sid: string;
    auth_token: string;
    label?: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
  mode?: "create" | "update";
}

type TwilioCredentialsFormValues = {
  account_sid: string;
  auth_token: string;
  label: string;
};

export function TwilioCredentialsDialog({
  open,
  onOpenChange,
  onSubmit,
  isSubmitting = false,
  mode = "create",
}: TwilioCredentialsDialogProps) {
  const form = useForm<TwilioCredentialsFormValues>({
    defaultValues: {
      account_sid: "",
      auth_token: "",
      label: "",
    },
    mode: "onChange",
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      account_sid: values.account_sid.trim(),
      auth_token: values.auth_token.trim(),
      label: values.label.trim() || undefined,
    });
    form.reset();
  });

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Connect" : "Update"} Twilio Account
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Enter your Twilio credentials to connect your account. Your auth token will be encrypted and stored securely."
              : "Update your Twilio account credentials. The new auth token will replace the existing one."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-5 py-4" onSubmit={handleSubmit}>
            <FormField
              control={form.control}
              name="account_sid"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Account SID <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="account_sid"
                        placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                        className={cn(
                          "font-mono text-sm",
                          form.formState.errors.account_sid &&
                            "border-destructive",
                        )}
                        disabled={isSubmitting}
                        maxLength={34}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="auth_token"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>
                    Auth Token <span className="text-destructive">*</span>
                  </FormLabel>
                  <div className="relative">
                    <FormControl>
                      <PasswordInput
                        id="auth_token"
                        placeholder="••••••••••••••••••••••••••••••••"
                        className={cn(
                          "pr-10 font-mono text-sm",
                          form.formState.errors.auth_token &&
                            "border-destructive",
                        )}
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Label (Optional)</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        id="label"
                        placeholder="Enter label"
                        disabled={isSubmitting}
                        maxLength={50}
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? mode === "create"
                    ? "Connecting..."
                    : "Updating..."
                  : mode === "create"
                    ? "Connect Account"
                    : "Update Account"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
