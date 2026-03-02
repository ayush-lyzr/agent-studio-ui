import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { IAgent } from "@/lib/types";
import {
  TwilioPhoneNumber,
  phoneNumbersService,
} from "@/services/phoneNumbersService";
import { useToast } from "@/components/ui/use-toast";
import { Phone, User } from "lucide-react";
import { useVoiceAgentService } from "../voice-agent.service";
import { LYZR_PHONE_NUMBERS } from "@/lib/constants";

interface ConfigurePhoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phoneNumber: TwilioPhoneNumber;
  agents: IAgent[];
  onSuccess: () => void;
  clientId: string;
}

export function ConfigurePhoneDialog({
  open,
  onOpenChange,
  phoneNumber,
  agents,
  onSuccess,
  clientId,
}: ConfigurePhoneDialogProps) {
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState(
    phoneNumber.our_config?.agent_id || "",
  );
  const [friendlyName, setFriendlyName] = useState(
    phoneNumber.our_config?.friendly_name ||
      phoneNumber.twilio_friendly_name ||
      "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { connectPhoneNumber, reassignPhoneNumber } =
    useVoiceAgentService(clientId);

  const handleSubmit = async () => {
    if (!selectedAgentId) {
      toast({
        title: "Error",
        description: "Please select an agent",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      if (phoneNumber.is_configured) {
        // Update existing configuration
        const updatedClientId = LYZR_PHONE_NUMBERS.includes(
          phoneNumber.phone_number,
        )
          ? "first_party"
          : clientId;
        await reassignPhoneNumber({
          clientId: updatedClientId,
          phoneNumber: phoneNumber.phone_number,
          agentId: selectedAgentId,
        });
        // await phoneNumbersService.updatePhoneNumber(
        //   phoneNumber.phone_number,
        //   selectedAgentId,
        // );
        toast({
          title: "Success",
          description: `Updated ${phoneNumber.phone_number} to connect to the selected agent`,
        });
      } else {
        // Create new configuration
        if (LYZR_PHONE_NUMBERS.includes(phoneNumber.phone_number)) {
          // await reassignPhoneNumber({
          //   clientId: "first_party",
          //   phoneNumber: phoneNumber.phone_number,
          //   agentId: selectedAgentId,
          // });
          await phoneNumbersService.updatePhoneNumber(
            phoneNumber.phone_number,
            selectedAgentId,
          );
        } else {
          await connectPhoneNumber({
            phone_number: phoneNumber.phone_number,
            agent_id: selectedAgentId,
            twilio_sid: phoneNumber.twilio_sid,
            friendly_name: friendlyName || undefined,
          });
        }
        toast({
          title: "Success",
          description: `Connected ${phoneNumber.phone_number} to the selected agent`,
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to configure phone number",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedAgent = agents.find((a) => a._id === selectedAgentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {phoneNumber.is_configured ? "Update" : "Configure"} Phone Number
          </DialogTitle>
          <DialogDescription>
            {phoneNumber.is_configured
              ? "Change which agent this phone number connects to"
              : "Connect this phone number to a voice agent to start receiving calls"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phone Number Display */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold">{phoneNumber.phone_number}</div>
                <div className="text-xs text-muted-foreground">
                  {phoneNumber.twilio_friendly_name || "No friendly name"}
                </div>
              </div>
            </div>
          </div>

          {/* Friendly Name Input */}
          {!phoneNumber.is_configured && (
            <div className="space-y-2">
              <Label htmlFor="friendly_name">Friendly Name (Optional)</Label>
              <Input
                id="friendly_name"
                placeholder="e.g., Customer Support Line"
                value={friendlyName}
                onChange={(e) => setFriendlyName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                A display name to help you identify this phone number
              </p>
            </div>
          )}

          {/* Agent Selection */}
          <div className="space-y-2">
            <Label htmlFor="agent">Select Voice Agent *</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger
                id="agent"
                className="focus:ring-0 focus:ring-offset-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
              >
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                {agents.length === 0 ? (
                  <div className="p-2 text-center text-sm text-muted-foreground">
                    No voice agents available
                  </div>
                ) : (
                  agents.map((agent) => (
                    <SelectItem key={agent._id} value={agent._id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {agent.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {selectedAgent && (
              <div className="rounded-md bg-muted p-3 text-sm">
                <div className="font-medium">{selectedAgent.name}</div>
                {selectedAgent.description && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {selectedAgent.description}
                  </div>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Model: {selectedAgent.model || "N/A"}
                </div>
              </div>
            )}
          </div>

          {/* Webhook Info */}
          {selectedAgentId && (
            <div className="rounded-lg border bg-blue-50 p-3 dark:bg-blue-950/20">
              <div className="mb-1 text-xs font-medium">Webhook URL</div>
              <code className="break-all text-xs text-muted-foreground">
                {`${import.meta.env.VITE_VOICE_API_URL || "http://localhost:4444"}/voice/${selectedAgentId}`}
              </code>
              <p className="mt-2 text-xs text-muted-foreground">
                This webhook will be automatically configured in Twilio
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedAgentId}
          >
            {isSubmitting
              ? "Configuring..."
              : phoneNumber.is_configured
                ? "Update"
                : "Configure"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
