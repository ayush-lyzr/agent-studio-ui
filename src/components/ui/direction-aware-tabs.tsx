"use client";

import {
  ReactNode,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import useMeasure from "react-use-measure";

import { cn } from "@/lib/utils";

type Tab = {
  id: number;
  label: string;
  content: ReactNode;
};

interface OgImageSectionProps {
  tabs: Tab[];
  className?: string;
  tabClassName?: string;
  activeTabClassName?: string;
  rounded?: string;
  defaultTab?: number; // Add this line
  onChange?: () => void;
  rightContent?: ReactNode;
}

const DirectionAwareTabs = forwardRef(
  (
    {
      tabs,
      className,
      tabClassName,
      activeTabClassName = "bg-neutral-700 mix-blend-difference",
      rounded,
      onChange,
      defaultTab = 0,
      rightContent,
    }: OgImageSectionProps,
    tabRef,
  ) => {
    const [activeTab, setActiveTab] = useState(defaultTab);
    const [direction, setDirection] = useState(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [ref, bounds] = useMeasure();

    const content = useMemo(() => {
      const activeTabContent = tabs.find(
        (tab) => tab.id === activeTab,
      )?.content;
      return activeTabContent || null;
    }, [activeTab, tabs]);

    const handleTabClick = (newTabId: number) => {
      if (newTabId !== activeTab && !isAnimating) {
        const newDirection = newTabId > activeTab ? 1 : -1;
        setDirection(newDirection);
        setActiveTab(newTabId);
        onChange ? onChange() : null;
      }
    };

    useImperativeHandle(tabRef, () => ({
      changeTab: (id: number) => {
        handleTabClick(id);
      },
    }));

    const variants = {
      initial: (direction: number) => ({
        x: 300 * direction,
        opacity: 0,
        filter: "blur(4px)",
      }),
      active: {
        x: 0,
        opacity: 1,
        filter: "blur(0px)",
      },
      exit: (direction: number) => ({
        x: -300 * direction,
        opacity: 0,
        filter: "blur(4px)",
      }),
    };

    return (
      <div className="flex w-full flex-col items-center">
        <div className="flex w-full items-center justify-between">
          <div
            className={cn(
              "shadow-inner-shadow flex cursor-pointer space-x-1 rounded-full border border-none bg-neutral-600 px-[3px] py-[3.2px]",
              className,
              rounded,
            )}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs  font-medium text-neutral-200 transition  focus-visible:outline-none focus-visible:outline-1 focus-visible:ring-1 sm:text-sm ",
                  activeTab === tab.id
                    ? "bg-neutral-700 !text-white"
                    : "text-neutral-200/80  hover:text-neutral-300/60",
                  rounded,
                  tabClassName,
                )}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {activeTab === tab.id && (
                  <motion.span
                    layoutId="bubble"
                    className={cn(
                      "absolute inset-0 z-10 border border-white/10",
                      activeTabClassName,
                      rounded,
                    )}
                    transition={{ type: "spring", bounce: 0.19, duration: 0.4 }}
                  />
                )}

                {tab.label}
              </button>
            ))}
          </div>
          {rightContent}
        </div>
        <MotionConfig
          transition={{ duration: 0.4, type: "spring", bounce: 0.2 }}
        >
          <motion.div
            className="relative mx-auto h-full w-full overflow-hidden"
            initial={false}
            animate={{ height: bounds.height }}
          >
            <div className="p-1" ref={ref}>
              <AnimatePresence
                custom={direction}
                mode="popLayout"
                onExitComplete={() => setIsAnimating(false)}
              >
                <motion.div
                  key={activeTab}
                  variants={variants}
                  initial="initial"
                  animate="active"
                  exit="exit"
                  custom={direction}
                  onAnimationStart={() => setIsAnimating(true)}
                  onAnimationComplete={() => setIsAnimating(false)}
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </MotionConfig>
      </div>
    );
  },
);

DirectionAwareTabs.displayName = "DirectionAwareTabs";
export { DirectionAwareTabs };
