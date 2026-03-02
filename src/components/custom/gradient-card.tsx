import React, { useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  GradientGeneratorFactory,
  type IGradientGenerator,
  type GradientConfig,
} from "@/lib/gradientColorUtils";

/**
 * Props interface for the GradientCard component
 * Following Interface Segregation Principle
 */
interface GradientCardProps {
  /** The string used to generate the gradient */
  text: string;
  /** Optional class name for additional styling */
  className?: string;
  /** Optional children to render inside the card */
  children?: React.ReactNode;
  /** Optional custom gradient generator */
  generator?: IGradientGenerator;
  /** Card size variant */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether the card should have hover effects */
  interactive?: boolean;
}

/**
 * Hook for managing gradient generation with performance optimization
 * Following Single Responsibility Principle
 */
const useGradient = (
  text: string,
  generator?: IGradientGenerator,
): GradientConfig => {
  const gradientGenerator = useMemo(
    () => generator || GradientGeneratorFactory.createDefault(),
    [generator],
  );

  return useMemo(
    () => gradientGenerator.generateFromString(text),
    [text, gradientGenerator],
  );
};

/**
 * Utility function to convert gradient config to CSS background
 * Following Single Responsibility Principle
 */
const gradientConfigToCSS = (config: GradientConfig): string => {
  const [color1, color2] = config.colors;

  if (config.type === "radial") {
    return `radial-gradient(circle at bottom right, hsl(var(--${color1})), hsl(var(--${color2})))`;
  }

  return `linear-gradient(${config.direction}deg, hsl(var(--${color1})), hsl(var(--${color2})))`;
};

/**
 * Size variants for the gradient card
 * Following Open/Closed Principle - easy to extend with new sizes
 */
const sizeVariants = {
  sm: "h-20 w-32",
  md: "h-32 w-48",
  lg: "h-40 w-64",
  xl: "h-48 w-80",
} as const;

/**
 * GradientCard Component
 *
 * A performant React component that generates beautiful gradient cards
 * based on string input. Following SOLID principles:
 *
 * - Single Responsibility: Only handles gradient card rendering
 * - Open/Closed: Easy to extend with new props without modification
 * - Liskov Substitution: Can be used anywhere a card component is expected
 * - Interface Segregation: Clean, focused props interface
 * - Dependency Inversion: Accepts custom gradient generator
 *
 * @example
 * <GradientCard text="Hello World" size="md" interactive>
 *   <h3>Card Title</h3>
 * </GradientCard>
 */
export const GradientCard: React.FC<GradientCardProps> = ({
  text,
  className,
  children,
  generator,
  size = "md",
  interactive = false,
}) => {
  // Generate gradient configuration from text
  const gradientConfig = useGradient(text, generator);

  // Convert to CSS background style
  const backgroundStyle = useMemo(
    () => ({ background: gradientConfigToCSS(gradientConfig) }),
    [gradientConfig],
  );

  return (
    <div
      className={cn(
        // Base styles using design system tokens
        "rounded-[var(--card-radius)]",
        "shadow-[var(--card-shadow)]",
        "transition-all duration-300 ease-out",
        // Size variant
        sizeVariants[size],
        // Interactive styles
        interactive && [
          "cursor-pointer",
          "hover:shadow-[var(--card-shadow-hover)]",
          "hover:scale-105",
          "active:scale-95",
        ],
        // Flex container for children
        "flex items-center justify-center",
        "relative overflow-hidden",
        className,
      )}
      style={backgroundStyle}
      // Accessibility
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      // Performance optimization - prevent unnecessary re-renders
      suppressHydrationWarning
    >
      {/* Content container */}
      {children && (
        <div className="relative z-10 p-4 text-center">{children}</div>
      )}

      {/* Optional overlay for better text readability */}
      {children && (
        <div className="absolute inset-0 bg-black/5 backdrop-blur-[0.5px]" />
      )}
    </div>
  );
};

/**
 * Specialized variant for displaying text on gradient background
 */
interface GradientTextCardProps extends Omit<GradientCardProps, "children"> {
  /** The text to display on the card */
  displayText?: string;
  /** Text color variant */
  textColor?: "light" | "dark" | "auto";
}

export const GradientTextCard: React.FC<GradientTextCardProps> = ({
  displayText,
  textColor = "auto",
  ...props
}) => {
  const textColorClass = useMemo(() => {
    switch (textColor) {
      case "light":
        return "text-white drop-shadow-sm";
      case "dark":
        return "text-gray-900 drop-shadow-sm";
      case "auto":
      default:
        return "text-white drop-shadow-sm";
    }
  }, [textColor]);

  return (
    <GradientCard {...props}>
      {displayText && (
        <span className={cn("text-sm font-medium", textColorClass)}>
          {displayText}
        </span>
      )}
    </GradientCard>
  );
};

export default GradientCard;
