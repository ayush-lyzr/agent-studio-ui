import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        blue: "bg-blue-500 text-white shadow hover:bg-blue-600",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-secondary hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-secondary hover:text-accent-foreground",
        "secondary-ghost":
          "bg-foreground/70 hover:bg-foreground/80 text-primary-foreground rounded-full border-0",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  withTooltip?: string;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    if (props?.withTooltip) {
      return (
        <Tooltip>
          <TooltipTrigger>
            <Comp
              className={cn(buttonVariants({ variant, size, className }))}
              ref={ref}
              {...props}
              disabled={loading || props.disabled}
            >
              <div className={cn("inline-flex items-center", className)}>
                {props.children}
                {loading && (
                  <Loader2
                    className={cn(
                      variant === "destructive"
                        ? "stroke-red-500"
                        : "stroke-primary-julius",
                      "ml-1 size-4 animate-spin",
                    )}
                  />
                )}
              </div>
            </Comp>
          </TooltipTrigger>
          <TooltipContent>{props?.withTooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
        disabled={loading || props.disabled}
      >
        <div className={cn("inline-flex items-center", className)}>
          {props.children}
          {loading && (
            <Loader2
              className={cn(
                variant === "destructive"
                  ? "stroke-red-500"
                  : "stroke-primary-julius",
                "ml-1 size-4 animate-spin",
              )}
            />
          )}
        </div>
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
