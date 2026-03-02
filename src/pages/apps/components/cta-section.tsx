import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentCreatorDialog } from "./agent-creator-dialog";

interface CTASectionProps {
    className?: string;
}

export function CTASection({ className }: CTASectionProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <div
                className={cn(
                    "flex flex-col items-center justify-center pb-6 text-center",
                    className
                )}
            >
                <img src="/mira-logo.svg" alt="Icon" className="text-primary h-36 w-36" />
                <h2 className="mb-3 text-2xl font-bold text-foreground md:text-3xl">
                    Become an Agent
                    <br />
                    Creator today
                </h2>
                <p className="mb-6 max-w-md text-sm text-muted-foreground">
                    Empower your business with Lyzr's Agent Studio where you can build, deploy, and manage AI agents tailored for your enterprise needs.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-4">
                    <Button 
                        size="lg"
                        className="inline-flex items-center gap-2 text-base font-semibold"
                        onClick={() => setIsDialogOpen(true)}
                    >
                        Sign Up
                        <ArrowRight className="h-5 w-5" />
                    </Button>
                    <Button asChild variant="outline" size="lg" className="inline-flex items-center gap-2 text-base font-semibold">
                        <Link to="/blueprints" target="_blank" className="inline-flex items-center gap-2">
                            Explore Blueprints
                            <ArrowRight className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>
            </div>

            <AgentCreatorDialog 
                open={isDialogOpen} 
                onOpenChange={setIsDialogOpen} 
            />
        </>
    );
}
