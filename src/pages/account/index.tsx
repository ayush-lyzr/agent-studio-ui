import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Eye, EyeOff, Copy, Check, ShieldAlert } from "lucide-react";
import { z } from "zod";
import mixpanel from "mixpanel-browser";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import axios from "axios";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { cn } from "@/lib/utils";
import useStore from "@/lib/store";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { KEYCLOAK_URL, KEYCLOAK_REALM, IS_ENTERPRISE_DEPLOYMENT } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";
import { useMember } from "@memberstack/react";

if (mixpanel.hasOwnProperty("cookie")) mixpanel.track("Account page visited");
export default function Account() {
  const { currentUser } = useCurrentUser();
  const { getToken } = useAuth();
  const { updateCustomFields } = useMember();
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const apiKey = useStore((state) => state.api_key);

  const formSchema = z.object({
    ["first-name"]: z.string().optional(),
    ["last-name"]: z.string().optional(),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {},
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (IS_ENTERPRISE_DEPLOYMENT) {
        const token = getToken();
        await axios.post(
          `${KEYCLOAK_URL}realms/${KEYCLOAK_REALM}/account`,
          {
            email: currentUser?.auth?.email,
            firstName: values["first-name"],
            lastName: values["last-name"],
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );
      } else {
        await updateCustomFields({
          "first-name": values["first-name"],
          "last-name": values["last-name"],
        });
      }
      toast.success("Successfully updated user details");
      setIsEditing(false);
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(
        error?.response?.data?.errorMessage ||
          error?.message ||
          "Failed to update profile",
      );
    }
  };

  useEffect(() => {
    form.reset({
      ["first-name"]: (currentUser?.customFields ?? {})?.["first-name"],
      ["last-name"]: (currentUser?.customFields ?? {})?.["last-name"],
    });
  }, [currentUser]);

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText(apiKey || "");
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full w-full p-6"
    >
      <p className="text-lg font-semibold">Account</p>
      <p className="text-muted-foreground">
        You can change your personal information settings here.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-6">
        <div className="z-10 flex h-[25rem] flex-col justify-end rounded-xl">
          <p className="px-1 py-3 font-semibold">Profile</p>
          <div className={cn("z-20 h-[90%] w-full rounded-xl border p-6")}>
            <div className="mb-6 flex items-center justify-between">
              <Avatar className="ml-2 size-20 rounded-lg">
                <AvatarImage
                  className="rounded-md"
                  alt="@shadcn"
                  src={currentUser?.profileImage}
                />
                <AvatarFallback className="rounded-sm text-2xl uppercase">
                  {currentUser?.auth?.email
                    ?.split(" ")
                    .map((name: string) => name[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>
              {(currentUser?.customFields?.["first-name"] ||
                currentUser?.customFields?.["last-name"]) && (
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing((prev) => !prev)}
                  >
                    {isEditing ? (
                      "Cancel"
                    ) : (
                      <>
                        <Pencil className="mr-1 size-4" /> Edit
                      </>
                    )}
                  </Button>
                )}
            </div>
            <div>
              <Form {...form}>
                <form
                  className="grid grid-cols-2 gap-6"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  {Object.keys(currentUser?.customFields ?? {})?.length > 0 && (
                    <>
                      <FormField
                        name="first-name"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className="text-muted-foreground">
                              First Name
                            </FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input {...field} />
                              ) : (
                                <p className="font-semibold">{field.value}</p>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        name="last-name"
                        render={({ field }) => (
                          <FormItem className="col-span-1">
                            <FormLabel className="text-muted-foreground">
                              Last Name
                            </FormLabel>
                            <FormControl>
                              {isEditing ? (
                                <Input {...field} />
                              ) : (
                                <p className="font-semibold">{field.value}</p>
                              )}
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    name="email"
                    render={() => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-muted-foreground">
                          Email
                        </FormLabel>
                        <FormControl>
                          <p className="font-semibold">
                            {currentUser?.auth?.email}
                          </p>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="created_at"
                    render={() => (
                      <FormItem className="col-span-1">
                        <FormLabel className="text-muted-foreground">
                          User Since
                        </FormLabel>
                        <FormControl>
                          <p className="font-semibold">
                            {currentUser?.createdAt
                              ? new Intl.DateTimeFormat("en-GB", {
                                dateStyle: "medium",
                                timeStyle: "short",
                                hour12: true,
                              }).format(new Date(currentUser?.createdAt))
                              : ""}
                          </p>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {isEditing && (
                    <div className="col-span-2 flex justify-end">
                      <Button
                        loading={form.formState.isSubmitting}
                        disabled={false}
                      >
                        Update
                      </Button>
                    </div>
                  )}
                </form>
              </Form>
            </div>
          </div>
        </div>

        {/* API Key Section */}
        <div className="z-10 flex h-[25rem] flex-col justify-end rounded-xl">
          <p className="px-1 py-3 font-semibold">API Key</p>
          <div className="z-20 h-[90%] w-full rounded-xl border p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-grow">
                <p className="mb-2 text-sm text-muted-foreground">
                  Your API Key
                </p>
                <div className="flex items-center space-x-2">
                  <div className="relative flex-grow">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      value={apiKey || ""}
                      readOnly
                      className="pr-10 font-mono"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopyApiKey}
                    className="flex w-[100px] items-center justify-center space-x-2"
                  >
                    {isCopied ? (
                      <>
                        <Check className="h-4 w-4 text-green-500" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <Alert className="mt-4">
              <ShieldAlert className="mt-3 h-4 w-4" />
              <AlertDescription className="mt-2">
                Keep your API key secure and never share it with third parties.
                If you believe your API key has been compromised, please contact
                us immediately at support@lyzr.ai
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
