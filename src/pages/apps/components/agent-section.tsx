import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface AgentSectionProps {
    title: string;
    viewAllLink?: string;
    children: ReactNode;
    className?: string;
}

export function AgentSection({
    title,
    viewAllLink,
    children,
    className,
}: AgentSectionProps) {
    return (
        <section className={cn("w-full space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        View all
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
            </div>
            <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {children}
            </div>
        </section>
    );
}

interface AgentSectionGridProps extends Omit<AgentSectionProps, "children"> {
    children: ReactNode;
    columns?: 2 | 3 | 4;
}

export function AgentSectionGrid({
    title,
    viewAllLink,
    children,
    className,
    columns = 4,
}: AgentSectionGridProps) {
    const gridCols = {
        2: "grid-cols-1 sm:grid-cols-2",
        3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
        4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    };

    return (
        <section className={cn("space-y-4", className)}>
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                {viewAllLink && (
                    <Link
                        to={viewAllLink}
                        className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        View all
                        <ChevronRight className="h-4 w-4" />
                    </Link>
                )}
            </div>

            <div className={cn("grid auto-rows-fr gap-4", gridCols[columns])}>{children}</div>
        </section>
    );
}
