import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface MovingIndicatorNavProps {
  count: number;
  className?: string;
  activeIndex: number;
}

export function MovingIndicatorNav({
  count,
  className,
  activeIndex,
}: MovingIndicatorNavProps) {
  return (
    <nav className={cn("relative flex items-center gap-1 py-2", className)}>
      {new Array(count).fill(0).map((_, idx) => (
        <motion.div
          className={cn(
            "h-1 rounded-lg",
            activeIndex === idx ? "bg-card-foreground" : "bg-slate-400",
          )}
          initial={false}
          animate={{
            width: activeIndex === idx ? 32 : 12,
            right: activeIndex === idx ? 22 : 32,
          }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30,
          }}
        />
      ))}
    </nav>
  );
}
