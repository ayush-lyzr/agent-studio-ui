import { useEffect, useState } from "react";
import {
  Phone,
  RefreshCw,
  Settings,
  Trash2,
  Check,
  X,
  Ellipsis,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  phoneNumbersService,
  TwilioPhoneNumber,
} from "@/services/phoneNumbersService";
import { useToast } from "@/components/ui/use-toast";
import { ConfigurePhoneDialog } from "./ConfigurePhoneDialog";
import { TwilioCredentialsDialog } from "./TwilioCredentialsDialog";
import { IAgent } from "@/lib/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useVoiceAgentService } from "../voice-agent.service";
import { isDevEnv, LYZR_PHONE_NUMBERS } from "@/lib/constants";

interface PhoneNumbersViewProps {
  agents: IAgent[];
  clientId: string;
}

export function PhoneNumbersView({ agents, clientId }: PhoneNumbersViewProps) {
  const { toast } = useToast();
  const [phoneNumbers, setPhoneNumbers] = useState<TwilioPhoneNumber[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [configureDialogOpen, setConfigureDialogOpen] = useState(false);
  const [twilioCredentialsDialogOpen, setTwilioCredentialsDialogOpen] =
    useState(false);
  const [selectedPhone, setSelectedPhone] = useState<TwilioPhoneNumber | null>(
    null,
  );
  const [phoneToRemove, setPhoneToRemove] = useState<TwilioPhoneNumber | null>(
    null,
  );
  const [isRemoving, setIsRemoving] = useState(false);

  const {
    saveTwilioCredentials,
    isSavingCredentials,
    getTwilioCredentials,
    getTwilioNumbers,
    removePhoneNumber,
  } = useVoiceAgentService(clientId);

  const loadPhoneNumbers = async () => {
    try {
      setIsLoading(true);
      let numbers: TwilioPhoneNumber[] = [];

      const updatedPhone = (phone: any): TwilioPhoneNumber => ({
        ...phone,
        twilio_friendly_name: phone.twilio_friendly_name || "",
        current_webhook_url: phone.current_webhook_url || "",
        capabilities: phone.capabilities || {
          voice: false,
          sms: false,
          mms: false,
        },
        our_config: phone.our_config
          ? {
              ...phone.our_config,
              friendly_name: phone.our_config.friendly_name || "",
              status: phone.our_config.status || "",
            }
          : null,
      });

      if (isDevEnv) {
        const [availableResponse, twilioResponse] = await Promise.all([
          phoneNumbersService.getAvailablePhoneNumbers(),
          getTwilioNumbers(),
        ]);

        const availableNumbers =
          availableResponse.phone_numbers?.map(updatedPhone) || [];
        const twilioNumbersData =
          twilioResponse.data?.phone_numbers?.map(updatedPhone) || [];

        const mergedNumbersMap = new Map<string, TwilioPhoneNumber>();
        availableNumbers.forEach((phone) =>
          mergedNumbersMap.set(phone.phone_number, phone),
        );
        twilioNumbersData.forEach((phone) =>
          mergedNumbersMap.set(phone.phone_number, phone),
        );

        numbers = Array.from(mergedNumbersMap.values());
      } else {
        const response = await getTwilioNumbers();
        numbers = response.data?.phone_numbers?.map(updatedPhone) || [];
      }

      // Sort: Available first, then Configured, then In Use Elsewhere
      const sortedPhoneNumbers = [...numbers].sort((a, b) => {
        // Available numbers come first
        if (a.is_available && !b.is_available) return -1;
        if (!a.is_available && b.is_available) return 1;

        // Then configured numbers
        if (a.is_configured && !b.is_configured && !b.is_available) return -1;
        if (!a.is_configured && b.is_configured && !a.is_available) return 1;

        // In use elsewhere come last (default)
        return 0;
      });

      const HIDDEN_PHONE_NUMBER = "+14843312860";

      const filteredPhoneNumbers = sortedPhoneNumbers.filter(
        (phone) => phone.phone_number !== HIDDEN_PHONE_NUMBER,
      );

      setPhoneNumbers(filteredPhoneNumbers as TwilioPhoneNumber[]);
    } catch (error) {
      console.error("Failed to load phone numbers:", error);
      toast({
        title: "Error",
        description: "Failed to load phone numbers from Twilio",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPhoneNumbers();
  }, []);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadPhoneNumbers();
  };

  const handleConfigure = (phone: TwilioPhoneNumber) => {
    setSelectedPhone(phone);
    setConfigureDialogOpen(true);
  };

  const handleConfigureSuccess = () => {
    setConfigureDialogOpen(false);
    setSelectedPhone(null);
    handleRefresh();
  };

  const handleImportTwilio = () => {
    setTwilioCredentialsDialogOpen(true);
  };

  const handleSaveTwilioCredentials = async (credentials: {
    account_sid: string;
    auth_token: string;
    label?: string;
  }) => {
    try {
      await saveTwilioCredentials(credentials);
      setTwilioCredentialsDialogOpen(false);
      await getTwilioCredentials();
      handleRefresh();
    } catch (error) {
      console.error("Failed to save Twilio credentials:", error);
    }
  };

  const handleRemove = async () => {
    if (!phoneToRemove) return;

    try {
      setIsRemoving(true);
      await removePhoneNumber(phoneToRemove.phone_number);
      // await phoneNumbersService.removePhoneNumber(phoneToRemove.phone_number);
      toast({
        title: "Success",
        description: `Removed configuration for ${phoneToRemove.phone_number}`,
      });
      setPhoneToRemove(null);
      handleRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove phone number",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  // const configuredCount = phoneNumbers.filter((p) => p.is_configured).length;
  // const availableCount = phoneNumbers.filter((p) => p.is_available).length;
  // const inUseElsewhereCount = phoneNumbers.filter(
  //   (p) => p.in_use_elsewhere,
  // ).length;

  return (
    <div className="flex h-full flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Phone Numbers</h2>
          <p className="text-sm text-muted-foreground">
            Manage phone numbers and connect them to voice agents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isRefreshing ? "animate-spin" : "")}
            />
            Refresh
          </Button>
          <Button onClick={handleImportTwilio}>
            <Download className="mr-2 h-4 w-4" />
            Add Twilio Credentials
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      {/* {!isLoading && (
        <div className="grid grid-cols-4 gap-4">
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Total Numbers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{phoneNumbers.length}</div>
            </CardContent>
          </Card>
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Configured</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {configuredCount}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Available</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {availableCount}
              </div>
            </CardContent>
          </Card>
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                In Use Elsewhere
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {inUseElsewhereCount}
              </div>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Phone Numbers List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : phoneNumbers.length === 0 ? (
          <Card className="hover:translate-y-0 hover:border-input hover:shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-10">
              <Phone className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-center text-sm text-muted-foreground">
                No phone numbers found in your Twilio account.
                <br />
                Purchase phone numbers from Twilio to get started.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {phoneNumbers.map((phone) => (
              <Card
                key={phone.phone_number}
                className="relative hover:translate-y-0 hover:border-input hover:shadow-none focus:outline-none focus-visible:outline-none"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {phone.phone_number}
                        </CardTitle>
                        <CardDescription>
                          {phone.twilio_friendly_name || "No friendly name"}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {phone.is_configured ? (
                        <Badge variant="default" className="bg-green-600">
                          <Check className="mr-1 h-3 w-3" />
                          Configured
                        </Badge>
                      ) : phone.in_use_elsewhere ? (
                        <Badge variant="default" className="bg-orange-600">
                          <X className="mr-1 h-3 w-3" />
                          In Use Elsewhere
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <Check className="mr-1 h-3 w-3" />
                          Available
                        </Badge>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 justify-center rounded-full"
                          >
                            <Ellipsis className="h-4 w-4" />
                            <span className="sr-only">Open phone actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer"
                            onClick={() => handleConfigure(phone)}
                          >
                            <Settings className="mr-2 h-4 w-4" />
                            {phone.is_configured ? "Change Agent" : "Configure"}
                          </DropdownMenuItem>
                          {!LYZR_PHONE_NUMBERS.includes(phone.phone_number) && (
                            <DropdownMenuItem
                              className="cursor-pointer text-destructive focus:text-destructive"
                              onClick={() => setPhoneToRemove(phone)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {phone.is_configured && phone.our_config ? (
                    <div className="space-y-3">
                      <div className="rounded-lg bg-secondary p-3">
                        <div className="mb-1 text-xs font-medium text-muted-foreground">
                          Connected Agent
                        </div>
                        <div className="font-medium">
                          {phone.our_config?.agent_name}
                        </div>
                      </div>
                    </div>
                  ) : phone.in_use_elsewhere ? (
                    <div className="space-y-3">
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-950/20">
                        <div className="mb-2 text-sm font-medium text-orange-900 dark:text-orange-100">
                          Used by Another Service
                        </div>
                        <div className="text-xs text-orange-700 dark:text-orange-300">
                          This phone number is currently connected to another
                          service or application.
                        </div>
                        {phone.current_webhook_url && (
                          <div className="mt-2 border-t border-orange-200 pt-2 dark:border-orange-800">
                            <div className="mb-1 text-xs font-medium text-orange-900 dark:text-orange-100">
                              Current Webhook
                            </div>
                            <code className="break-all text-xs text-orange-700 dark:text-orange-300">
                              {phone.current_webhook_url}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-muted-foreground">
                        This phone number is not configured. Connect it to a
                        voice agent to start receiving calls.
                      </div>
                      {/* <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleConfigure(phone)}
                      >
                        <Settings className="mr-2 h-4 w-4" />
                        Configure
                      </Button> */}
                    </div>
                  )}

                  {/* Capabilities */}
                  {/* <div className="mt-3 flex gap-2">
                    {phone.capabilities.voice && (
                      <Badge variant="outline" className="text-xs">
                        Voice
                      </Badge>
                    )}
                    {phone.capabilities.sms && (
                      <Badge variant="outline" className="text-xs">
                        SMS
                      </Badge>
                    )}
                    {phone.capabilities.mms && (
                      <Badge variant="outline" className="text-xs">
                        MMS
                      </Badge>
                    )}
                  </div> */}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Configure Dialog */}
      {selectedPhone && (
        <ConfigurePhoneDialog
          open={configureDialogOpen}
          onOpenChange={setConfigureDialogOpen}
          phoneNumber={selectedPhone}
          agents={agents}
          onSuccess={handleConfigureSuccess}
          clientId={clientId}
        />
      )}

      {/* Remove Confirmation Dialog */}
      <AlertDialog
        open={!!phoneToRemove}
        onOpenChange={(open) => !open && setPhoneToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Phone Number</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove the configuration for{" "}
              <span className="font-semibold">
                {phoneToRemove?.phone_number}
              </span>
              ?
              <br />
              <br />
              This will disconnect it from the agent. The phone number will
              remain in your Twilio account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isRemoving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRemoving ? "Removing..." : "Remove"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <TwilioCredentialsDialog
        open={twilioCredentialsDialogOpen}
        onOpenChange={setTwilioCredentialsDialogOpen}
        onSubmit={handleSaveTwilioCredentials}
        isSubmitting={isSavingCredentials}
        mode="create"
      />
    </div>
  );
}
