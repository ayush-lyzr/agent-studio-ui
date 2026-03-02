import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { motion, useAnimation } from "framer-motion";
import { ReactNode, useEffect } from "react";

interface FAQItem {
  question: string;
  answer: string | ReactNode;
}

interface FaqCardProps {
  delay: number;
  faq: FAQItem;
}

export function FaqCard({ delay, faq }: FaqCardProps) {
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
      exit={{ opacity: 0, y: 10 }}
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{
        duration: 0.6,
        delay: isIntersecting ? delay : 0,
        ease: [0.25, 0.25, 0.25, 0.75],
      }}
      className="space-y-2"
    >
      <h2 className="text-xl font-semibold">{faq.question}</h2>
      <p className="leading-relaxed text-muted-foreground">{faq.answer}</p>
    </motion.div>
  );
}
