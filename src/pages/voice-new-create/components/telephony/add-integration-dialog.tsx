import { useState } from "react";
import { ArrowLeft, Info, ShieldCheck } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/custom/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/custom/password-input";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

import { telephonyApi } from "./telephony-api";
import type { TelephonyProvider } from "./types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface AddIntegrationDialogProperties {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onIntegrationAdded: () => void;
}

type Step = "choose" | "telnyx" | "twilio";

// ---------------------------------------------------------------------------
// Provider cards for chooser step
// ---------------------------------------------------------------------------

const PROVIDERS: {
    id: TelephonyProvider;
    name: string;
    description: string;
}[] = [
    {
        id: "telnyx",
        name: "Telnyx",
        description: "Connect using a Telnyx API key.",
    },
    {
        id: "twilio",
        name: "Twilio",
        description: "Connect using Twilio Account SID and Auth Token.",
    },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toastError(toast: ReturnType<typeof useToast>["toast"], error: unknown) {
    toast({
        title: "Error",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive",
    });
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function AddIntegrationDialog({
    open,
    onOpenChange,
    onIntegrationAdded,
}: AddIntegrationDialogProperties) {
    const { toast } = useToast();
    const [step, setStep] = useState<Step>("choose");

    // ── Telnyx state ──
    const [telnyxKey, setTelnyxKey] = useState("");
    const [telnyxVerified, setTelnyxVerified] = useState(false);
    const [isVerifyingTelnyx, setIsVerifyingTelnyx] = useState(false);
    const [isSavingTelnyx, setIsSavingTelnyx] = useState(false);

    // ── Twilio state ──
    const [twilioAccountSid, setTwilioAccountSid] = useState("");
    const [twilioAuthToken, setTwilioAuthToken] = useState("");
    const [twilioName, setTwilioName] = useState("");
    const [twilioVerified, setTwilioVerified] = useState(false);
    const [isVerifyingTwilio, setIsVerifyingTwilio] = useState(false);
    const [isSavingTwilio, setIsSavingTwilio] = useState(false);

    // ── Reset ──
    function resetAll() {
        setStep("choose");
        setTelnyxKey("");
        setTelnyxVerified(false);
        setTwilioAccountSid("");
        setTwilioAuthToken("");
        setTwilioName("");
        setTwilioVerified(false);
    }

    function handleOpenChange(next: boolean) {
        if (!next) resetAll();
        onOpenChange(next);
    }

    // ── Telnyx actions ──
    const telnyxTrimmed = telnyxKey.trim();
    const telnyxEmpty = telnyxTrimmed.length === 0;

    async function handleVerifyTelnyx() {
        setIsVerifyingTelnyx(true);
        try {
            const response = await telephonyApi.verifyCredentials(telnyxTrimmed);
            if (response.valid) {
                setTelnyxVerified(true);
                toast({
                    title: "Key verified",
                    description: "Telnyx credentials are valid.",
                });
            }
        } catch (error) {
            toastError(toast, error);
        } finally {
            setIsVerifyingTelnyx(false);
        }
    }

    async function handleSaveTelnyx() {
        setIsSavingTelnyx(true);
        try {
            await telephonyApi.saveCredentials(telnyxTrimmed);
            toast({ title: "Connected", description: "Telnyx integration saved." });
            resetAll();
            onIntegrationAdded();
            onOpenChange(false);
        } catch (error) {
            toastError(toast, error);
        } finally {
            setIsSavingTelnyx(false);
        }
    }

    // ── Twilio actions ──
    const twilioAccountSidTrimmed = twilioAccountSid.trim();
    const twilioAuthTokenTrimmed = twilioAuthToken.trim();
    const twilioNameTrimmed = twilioName.trim();
    const twilioEmpty =
        twilioAccountSidTrimmed.length === 0 ||
        twilioAuthTokenTrimmed.length === 0;

    async function handleVerifyTwilio() {
        setIsVerifyingTwilio(true);
        try {
            const response = await telephonyApi.verifyTwilioCredentials({
                accountSid: twilioAccountSidTrimmed,
                authToken: twilioAuthTokenTrimmed,
            });
            if (response.valid) {
                setTwilioVerified(true);
                toast({
                    title: "Credentials verified",
                    description: "Twilio credentials are valid.",
                });
            }
        } catch (error) {
            toastError(toast, error);
        } finally {
            setIsVerifyingTwilio(false);
        }
    }

    async function handleSaveTwilio() {
        setIsSavingTwilio(true);
        try {
            await telephonyApi.saveTwilioCredentials({
                accountSid: twilioAccountSidTrimmed,
                authToken: twilioAuthTokenTrimmed,
                name: twilioNameTrimmed || undefined,
            });
            toast({
                title: "Connected",
                description: "Twilio integration saved.",
            });
            resetAll();
            onIntegrationAdded();
            onOpenChange(false);
        } catch (error) {
            toastError(toast, error);
        } finally {
            setIsSavingTwilio(false);
        }
    }

    // ── Render ──
    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[520px]">
                {/* ───── Choose Provider ───── */}
                {step === "choose" && (
                    <>
                        <DialogHeader>
                            <DialogTitle>Add Integration</DialogTitle>
                            <DialogDescription>
                                Choose a telephony provider to connect.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid grid-cols-2 gap-3 py-4">
                            {PROVIDERS.map((p) => (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setStep(p.id)}
                                    className={cn(
                                        "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors",
                                        "hover:border-primary/40 hover:bg-primary/[0.03]",
                                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                    )}
                                >
                                    <span className="text-sm font-semibold">
                                        {p.name}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        {p.description}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </>
                )}

                {/* ───── Telnyx Form ───── */}
                {step === "telnyx" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep("choose")}
                                    className="rounded p-0.5 hover:bg-muted"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                Connect Telnyx Account
                            </DialogTitle>
                            <DialogDescription>
                                Enter your Telnyx API key to connect your
                                account. Your key will be stored securely.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="telnyx-api-key">
                                    API Key{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <PasswordInput
                                    id="telnyx-api-key"
                                    placeholder="KEY..."
                                    className="pr-10 font-mono text-sm"
                                    value={telnyxKey}
                                    onChange={(event) => {
                                        setTelnyxKey(event.target.value);
                                        setTelnyxVerified(false);
                                    }}
                                    disabled={isVerifyingTelnyx || isSavingTelnyx}
                                />
                                {telnyxVerified && (
                                    <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Verified
                                    </p>
                                )}
                            </div>

                            <Alert
                                variant="default"
                                className="border-muted bg-muted/40 py-2 [&>svg]:top-2.5"
                            >
                                <Info className="h-3.5 w-3.5" />
                                <AlertDescription className="text-xs text-muted-foreground">
                                    We store this key to manage your numbers. You
                                    can disconnect anytime.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                    telnyxEmpty ||
                                    isVerifyingTelnyx ||
                                    isSavingTelnyx
                                }
                                loading={isVerifyingTelnyx}
                                onClick={handleVerifyTelnyx}
                                leftSection={
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                }
                            >
                                Verify
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={
                                    telnyxEmpty ||
                                    isVerifyingTelnyx ||
                                    isSavingTelnyx
                                }
                                loading={isSavingTelnyx}
                                onClick={handleSaveTelnyx}
                            >
                                Save & Connect
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ───── Twilio Form ───── */}
                {step === "twilio" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setStep("choose")}
                                    className="rounded p-0.5 hover:bg-muted"
                                    aria-label="Back"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </button>
                                Connect Twilio Account
                            </DialogTitle>
                            <DialogDescription>
                                Enter your Twilio credentials to connect your
                                account. Your auth token will be encrypted
                                and stored securely.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="twilio-sid">
                                    Account SID{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="twilio-sid"
                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    className="font-mono text-sm"
                                    value={twilioAccountSid}
                                    onChange={(event) => {
                                        setTwilioAccountSid(event.target.value);
                                        setTwilioVerified(false);
                                    }}
                                    disabled={isVerifyingTwilio || isSavingTwilio}
                                    maxLength={34}
                                />
                                {twilioVerified && (
                                    <p className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                                        <ShieldCheck className="h-3.5 w-3.5" />
                                        Verified
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="twilio-auth-token">
                                    Auth Token{" "}
                                    <span className="text-destructive">*</span>
                                </Label>
                                <PasswordInput
                                    id="twilio-auth-token"
                                    placeholder="••••••••••••••••••••••••••••••••"
                                    className="pr-10 font-mono text-sm"
                                    value={twilioAuthToken}
                                    onChange={(event) => {
                                        setTwilioAuthToken(event.target.value);
                                        setTwilioVerified(false);
                                    }}
                                    disabled={isVerifyingTwilio || isSavingTwilio}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="twilio-name">
                                    Name (Optional)
                                </Label>
                                <Input
                                    id="twilio-name"
                                    placeholder="e.g. Production Account"
                                    value={twilioName}
                                    onChange={(event) =>
                                        setTwilioName(event.target.value)
                                    }
                                    disabled={isVerifyingTwilio || isSavingTwilio}
                                    maxLength={50}
                                />
                            </div>

                            <Alert
                                variant="default"
                                className="border-muted bg-muted/40 py-2 [&>svg]:top-2.5"
                            >
                                <Info className="h-3.5 w-3.5" />
                                <AlertDescription className="text-xs text-muted-foreground">
                                    Your auth token is encrypted. You can
                                    disconnect anytime.
                                </AlertDescription>
                            </Alert>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={
                                    twilioEmpty ||
                                    isVerifyingTwilio ||
                                    isSavingTwilio
                                }
                                loading={isVerifyingTwilio}
                                onClick={handleVerifyTwilio}
                                leftSection={
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                }
                            >
                                Verify
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                disabled={
                                    twilioEmpty ||
                                    isVerifyingTwilio ||
                                    isSavingTwilio
                                }
                                loading={isSavingTwilio}
                                onClick={handleSaveTwilio}
                            >
                                Save & Connect
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
