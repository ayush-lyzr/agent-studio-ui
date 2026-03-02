import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { Check } from "lucide-react";
import { motion, useAnimation } from "framer-motion";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { PricingTier } from "./types";

// Types
interface BrandingImage {
  name: string;
  logo: string;
  size: number;
}

interface PlanCardProps {
  tier: PricingTier;
  planType: "monthly" | "yearly" | "default";
  onBuyNow: () => void;
  buttonTitle: string;
  delay?: number;
  key?: string;
}

interface FeatureItemProps {
  feature: string | { text: string; tooltip: string };
}

interface PriceDisplayProps {
  tier: PricingTier;
  planType: "monthly" | "yearly" | "default";
}

interface BrandingFooterProps {
  images: BrandingImage[];
}

// Sub-components
const FeatureItem = ({ feature }: FeatureItemProps) => {
  if (typeof feature === "string") {
    return (
      <div className="flex items-center">
        <div className="mr-2 w-4">
          <Check className="h-4 w-4 text-purple-500" aria-hidden="true" />
        </div>
        <span className="text-sm text-muted-foreground">{feature}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center">
      <div className="mr-2 w-4">
        <Check className="h-4 w-4 text-purple-500" aria-hidden="true" />
      </div>
      <Tooltip>
        <TooltipTrigger className="text-left text-sm text-muted-foreground">
          {feature.text}
        </TooltipTrigger>
        <TooltipContent align="center" className="relative w-[15rem]">
          {feature.tooltip}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

const PriceDisplay = ({ tier, planType }: PriceDisplayProps) => {
  if (planType === "yearly" && tier.monthlyPrice) {
    return (
      <>
        <span className="text-md mr-2 text-muted-foreground line-through">
          ${tier.monthlyPrice}
        </span>
        <span className="text-3xl font-bold">${Number(tier.yearlyPrice)}</span>
        <span className="ml-1 text-muted-foreground">/month</span>
      </>
    );
  }

  if (typeof tier.price === "string" && tier.price.startsWith("$")) {
    return (
      <>
        <span className="text-3xl font-bold">{tier.price}</span>
        <span className="ml-1 text-muted-foreground">
          /{planType === "monthly" ? "month" : "year"}
        </span>
      </>
    );
  }

  return <span className="text-2xl font-bold">{tier.price}</span>;
};

const PopularBadge = () => (
  <div
    className="rounded-t-lg bg-purple-50 p-2 py-4 text-center font-medium text-purple-600 dark:bg-purple-200"
    role="status"
    aria-label="Most popular plan"
  >
    Most popular plan
  </div>
);

const BrandingFooter = ({ images }: BrandingFooterProps) => {
  if (!images.length) return null;

  return (
    <CardFooter
      className={cn(
        "grid h-14 place-content-center place-items-center",
        images?.length == 1 ? "grid-cols-1" : "grid-cols-2",
      )}
    >
      {images.map((org) => (
        <div key={org.name} className="col-span-1">
          <img
            src={org.logo}
            alt={`${org.name} logo`}
            width={org.size}
            height={org.size}
            loading="lazy"
          />
        </div>
      ))}
    </CardFooter>
  );
};

// Main component
export function PlanCard({
  tier,
  planType,
  buttonTitle,
  onBuyNow,
  delay = 0,
  key,
}: PlanCardProps) {
  const controls = useAnimation();
  const { ref, isIntersecting } = useIntersectionObserver();

  useEffect(() => {
    if (isIntersecting) {
      controls.start("visible");
    } else {
      controls.start("hidden");
    }
  }, [isIntersecting, controls]);

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      key={key}
      exit={{ opacity: 0, x: 10 }}
      animate={controls}
      variants={{
        hidden: { opacity: 0, x: 50 },
        visible: { opacity: 1, x: 0 },
      }}
      transition={{
        duration: 0.6,
        delay: isIntersecting ? delay : 0,
        ease: [0.25, 0.25, 0.25, 0.75],
      }}
      className={cn(
        "z-20 col-span-1 flex w-[30%] max-w-[22rem] flex-col rounded-xl border bg-card text-card-foreground shadow",
        tier.isPopular
          ? "w-full place-self-end md:h-full lg:h-[109%]"
          : "h-full",
      )}
      role="article"
      aria-label={`${tier.name} pricing plan`}
    >
      {tier.isPopular && <PopularBadge />}

      <CardHeader className="h-24">
        <h3 className="text-xl font-semibold">{tier.name}</h3>
        <p className="text-sm text-muted-foreground">{tier.description}</p>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="mb-6">
          <PriceDisplay tier={tier} planType={planType} />
        </div>

        <Button
          className="w-full"
          onClick={onBuyNow}
          aria-label={`Select ${tier.name} plan`}
        >
          {buttonTitle}
        </Button>

        <p className="text-bold mt-4 h-4 text-sm">{tier.headline}</p>

        <div className="mt-6 space-y-4">
          {tier.features.map((feature, index) => (
            <FeatureItem key={index} feature={feature} />
          ))}
        </div>
      </CardContent>

      <BrandingFooter images={tier?.brandingImages ?? []} />
    </motion.div>
  );
}
