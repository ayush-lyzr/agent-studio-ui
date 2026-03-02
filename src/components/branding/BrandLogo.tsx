import React, { ImgHTMLAttributes } from "react";
import { BRAND } from "@/lib/branding";

interface BrandLogoProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Height in Tailwind size (e.g. size-6, size-9, h-20). Width defaults to auto. */
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className,
  alt,
  ...props
}) => (
  <img
    src={BRAND.logoUrl}
    alt={alt ?? `${BRAND.name} logo`}
    className={className}
    {...props}
  />
);
