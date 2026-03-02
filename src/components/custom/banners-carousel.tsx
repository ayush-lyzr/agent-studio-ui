import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BannersCarouselProps = {
  banners: ReactNode[];
  intervalMs?: number;
  className?: string;
};

export function BannersCarousel({
  banners,
  intervalMs = 5000,
  className,
}: BannersCarouselProps) {
  const variants = {
    enter: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir === 1 ? 24 : -24,
    }),
    center: {
      opacity: 1,
      x: 0,
    },
    exit: (dir: 1 | -1) => ({
      opacity: 0,
      x: dir === 1 ? -24 : 24,
    }),
  };

  const slides = useMemo(
    () => banners.filter((b) => b !== null && b !== undefined && b !== false),
    [banners],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState<1 | -1>(1);

  useEffect(() => {
    if (activeIndex >= slides.length) setActiveIndex(0);
  }, [activeIndex, slides.length]);

  useEffect(() => {
    if (isPaused) return;
    if (slides.length <= 1) return;
    const id = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((idx) => (idx + 1) % slides.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, isPaused, slides.length]);

  const goTo = (idx: number) => {
    setDirection(idx > activeIndex ? 1 : -1);
    setActiveIndex(idx);
  };

  if (slides.length === 0) return null;

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={activeIndex}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {slides[activeIndex]}
        </motion.div>
      </AnimatePresence>

      {slides.length > 1 ? (
        <div className="mt-2 flex items-center justify-center gap-2">
          <div
            className="flex items-center gap-1.5"
            role="tablist"
            aria-label="Banner slides"
          >
            {slides.map((_, idx) => {
              const isActive = idx === activeIndex;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => goTo(idx)}
                  className={cn(
                    "h-1.5 w-1.5 rounded-full transition-colors",
                    isActive
                      ? "bg-muted-foreground/80"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50",
                  )}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Slide ${idx + 1} of ${slides.length}`}
                />
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

