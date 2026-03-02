import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import {
    Dialog,
    DialogContent,
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
import { Rocket, Sparkles, TrendingUp, Loader2, CheckCircle, ArrowRight, Zap } from "lucide-react";
import { toast } from "sonner";
import { BrandLogo } from "@/components/branding/BrandLogo";
import axios from "axios";

interface AgentCreatorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

// Zod schema for form validation
const formSchema = z.object({
    fullName: z.string().min(1, "Please enter your full name").min(2, "Name must be at least 2 characters"),
    email: z.string().min(1, "Please enter your email address").email("Please enter a valid email address"),
    linkedinUrl: z
        .string()
        .min(1, "Please enter your LinkedIn profile URL")
        .refine(
            (url) => {
                const lowerUrl = url.toLowerCase();
                return lowerUrl.includes("linkedin.com/in/") || lowerUrl.includes("linkedin.com/company/");
            },
            { message: "Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourprofile)" }
        ),
});

type FormData = z.infer<typeof formSchema>;

const benefits = [
    {
        icon: TrendingUp,
        title: "Monetize Your Expertise",
        description: "Earn revenue from every agent deployment",
    },
    {
        icon: Sparkles,
        title: "Premium Support",
        description: "Priority access to workshops & events",
    },
    {
        icon: Rocket,
        title: "Enterprise network",
        description: "Get discovered by enterprise buyers",
    },
];

export function AgentCreatorDialog({ open, onOpenChange }: AgentCreatorDialogProps) {
    const [isSubmitted, setIsSubmitted] = useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            fullName: "",
            email: "",
            linkedinUrl: "",
        },
    });

    const { mutate: sendToSlack, isPending: isSubmitting } = useMutation({
        mutationKey: ["sendSlackCreatorProgram"],
        mutationFn: (data: FormData) => {
            const apiUrl = import.meta.env.VITE_MARKETPLACE_URL;
            const apiSecretKey = import.meta.env.VITE_SLACK_API_SECRET_KEY;

            if (!apiUrl || !apiSecretKey) {
                throw new Error("Slack API configuration missing");
            }

            // Format message for Slack webhook
            const message = {
                text: `🎉 New Agent Creator Program Application`,
                blocks: [
                    {
                        type: "header",
                        text: {
                            type: "plain_text",
                            text: "🎉 New Agent Creator Program Application",
                            emoji: true,
                        },
                    },
                    {
                        type: "section",
                        fields: [
                            {
                                type: "mrkdwn",
                                text: `*Full Name:* ${data.fullName}`,
                            },
                            {
                                type: "mrkdwn",
                                text: `*Email:* ${data.email}`,
                            },
                        ],
                    },
                    {
                        type: "section",
                        fields: [
                            {
                                type: "mrkdwn",
                                text: `*LinkedIn Profile:* <${data.linkedinUrl}|View Profile>`,
                            },
                            {
                                type: "mrkdwn",
                                text: `*Submitted At:* ${new Date().toLocaleString()}`,
                            },
                        ],
                    },
                    {
                        type: "divider",
                    },
                    {
                        type: "context",
                        elements: [
                            {
                                type: "mrkdwn",
                                text: "📍 Submitted via Lyzr Agent Studio Marketplace",
                            },
                        ],
                    },
                ],
            };

            return axios.post(
                `/api/slack/send`,
                message,
                {
                    baseURL: apiUrl,
                    headers: {
                        "x-secret-key": apiSecretKey,
                    },
                }
            );
        },
        onSuccess: () => {
            setIsSubmitted(true);
            toast.success("Application submitted successfully!");
        },
        onError: (error) => {
            console.error("Error sending to Slack:", error);
            toast.error(error?.message || "Failed to submit application. Please try again.");
        },
    });

    const onSubmit = (data: FormData) => {
        sendToSlack(data);
    };

    const handleClose = () => {
        onOpenChange(false);
        setTimeout(() => {
            form.reset();
            setIsSubmitted(false);
        }, 300);
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-h-[90vh] max-w-4xl gap-0 overflow-hidden border-0 p-0 shadow-2xl">
                <div className="grid max-h-[90vh] grid-cols-1 overflow-y-auto lg:grid-cols-2 lg:overflow-hidden">
                    {/* Left Panel - Hidden on mobile, shown on lg+ */}
                    <div className="relative hidden bg-gradient-to-br from-violet-200 via-purple-200 to-indigo-200 p-6 dark:from-violet-900/50 dark:via-purple-900/50 dark:to-indigo-900/50 lg:flex lg:flex-col lg:justify-between lg:p-10">
                        <div className="absolute inset-0 opacity-30">
                            <div className="absolute left-0 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-300/30 blur-3xl" />
                            <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-violet-300/20 blur-3xl" />
                        </div>

                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-3">
                                <BrandLogo className="h-10 w-10 rounded-lg object-contain" />
                                <span className="text-lg font-semibold text-foreground">Agent Creator Program</span>
                            </div>

                            <div className="space-y-3 pt-4">
                                <h2 className="text-3xl font-bold leading-tight text-foreground lg:text-4xl">
                                    Turn Your AI Skills Into{" "}
                                    <span className="text-violet-600 dark:text-violet-400">
                                        Revenue
                                    </span>
                                </h2>
                                <p className="max-w-md text-base text-muted-foreground lg:text-lg">
                                    Join an exclusive community of creators building the future of enterprise AI
                                </p>
                            </div>
                        </div>

                        <div className="relative z-10 space-y-3 pt-6">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 rounded-xl border border-violet-200 bg-white/50 p-3 backdrop-blur-sm transition-colors duration-200 hover:bg-white/70 dark:border-white/10 dark:bg-white/10 dark:hover:bg-white/15"
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-100 dark:border-white/10 dark:bg-white/10">
                                        <benefit.icon className="h-5 w-5 text-violet-600 dark:text-white" />
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-semibold text-foreground">
                                            {benefit.title}
                                        </h4>
                                        <p className="text-xs text-muted-foreground">
                                            {benefit.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="relative z-10 pt-6">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Zap className="h-4 w-4" />
                                <span>Trusted by Fortune 500 enterprises worldwide</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Form Section */}
                    <div className="flex flex-col justify-center bg-background p-6 sm:p-8 lg:p-10">
                        {isSubmitted ? (
                            <div className="flex flex-col items-center justify-center space-y-6 py-8 text-center">
                                <div className="relative">
                                    <div className="absolute inset-0 animate-pulse rounded-full bg-green-500/20 blur-xl" />
                                    <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                                        <CheckCircle className="h-10 w-10 text-white" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl font-bold">You're In! 🎉</h3>
                                    <p className="max-w-xs text-muted-foreground">
                                        Welcome to the Agent Creator Program. Thank you for applying!
                                    </p>
                                </div>
                                <Button
                                    onClick={handleClose}
                                    className="px-8"
                                >
                                    Done
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="mb-4 flex items-center gap-3 lg:hidden">
                                    <BrandLogo className="h-8 w-8 rounded-lg object-contain" />
                                    <span className="text-base font-semibold text-foreground">Agent Creator Program</span>
                                </div>

                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                                        <div className="space-y-1">
                                            <h3 className="text-xl font-bold sm:text-2xl">Apply Now</h3>
                                            <p className="text-sm text-muted-foreground">
                                                Takes less than 30 seconds to get started
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="fullName"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Full Name</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="John Doe"
                                                                disabled={isSubmitting}
                                                                className="h-11 border-border bg-secondary px-4 text-foreground transition-colors placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500/20"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="email"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">Work Email</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="email"
                                                                placeholder="john@company.com"
                                                                disabled={isSubmitting}
                                                                className="h-11 border-border bg-secondary px-4 text-foreground transition-colors placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500/20"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="linkedinUrl"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium">LinkedIn Profile</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="url"
                                                                placeholder="linkedin.com/in/johndoe"
                                                                disabled={isSubmitting}
                                                                className="h-11 border-border bg-secondary px-4 text-foreground transition-colors placeholder:text-muted-foreground focus:border-violet-500 focus:ring-violet-500/20"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            className="h-11 w-full items-center justify-center text-center"
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    Join the Program
                                                    <ArrowRight className="ml-2 h-5 w-5" />
                                                </>
                                            )}
                                        </Button>
                                    </form>
                                </Form>
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
