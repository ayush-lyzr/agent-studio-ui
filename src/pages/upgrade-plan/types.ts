export interface PricingTier {
  name: string;
  type: "Individual" | "Team";
  price: string | "Contact sales";
  priceId: string;
  description: string;
  features: (string | { text: string; tooltip: string })[];
  isPopular?: boolean;
  monthlyPrice?: string;
  yearlyPrice?: string;
  headline?: string;
  brandingImages: {
    name: string;
    logo: string;
    size: number;
  }[];
}

export interface PricingFeature {
  name: string;
  value: string | number | boolean;
  tooltip?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  description?: string;

  price?:
    | string
    | {
        amount: number;
        currency: string;
        period: string;
      };
  isPopular?: boolean;
  isEnterprise?: boolean;
  features: PricingFeature[];
  ctaText?: string;
  ctaVariant?: "default" | "premium" | "enterprise";
}

export interface PricingTableProps {
  className?: string;
}

export interface PricingCardProps {
  className?: string;
  onCtaClick?: (planId: string) => void;
}
