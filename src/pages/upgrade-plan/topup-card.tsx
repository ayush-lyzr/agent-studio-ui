import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { motion, useAnimation } from "framer-motion";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { useEffect } from "react";

interface PricingCardProps {
  price: string;
  credits: string;
  onBuyNow: () => void;
  className?: string;
  delay: number;
}

export function TopupCard({
  price,
  credits,
  onBuyNow,
  className,
  delay = 0,
}: PricingCardProps) {
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
      className={className}
    >
      <Card
        className={cn(
          "border--sidebar-border group cursor-pointer bg-secondary transition-all duration-300 ease-in-out",
          className,
        )}
        onClick={onBuyNow}
      >
        <CardContent className="flex flex-col items-center justify-center px-6 pb-4 pt-6 text-center">
          <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-background p-4 transition-colors ease-in-out group-hover:bg-primary">
            <Zap className="size-8 text-muted-foreground group-hover:fill-background group-hover:text-background" />
          </div>
          <h3 className="mb-1 text-3xl font-bold">${price}</h3>
          <p className="text-lg text-muted-foreground">{credits} Credits</p>
        </CardContent>
        <CardFooter className="grid place-items-center px-6 pb-6 pt-2">
          <span
            className={cn(
              buttonVariants({ variant: "outline" }),
              "w-fit bg-background transition-colors group-hover:bg-primary group-hover:text-secondary",
            )}
          >
            Buy Now
          </span>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
