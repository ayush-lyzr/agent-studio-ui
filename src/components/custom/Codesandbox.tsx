import * as React from "react";
import type { Transition, Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";

export interface CodesandboxProps extends React.SVGAttributes<SVGSVGElement> {
  width?: number;
  height?: number;
  strokeWidth?: number;
  stroke?: string;
}

const transition: Transition = {
  duration: 0.1,
  opacity: { delay: 0.01 },
};

const variants: Variants = {
  normal: {
    pathLength: 1,
    opacity: 1,
  },
  animate: (custom: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      ...transition,
      delay: 0.06 * custom,
    },
  }),
};

export function Codesandbox({
  width = 24,
  height = 24,
  strokeWidth = 2,
  stroke = "currentColor",
  onMouseEnter,
  onMouseLeave,
  ...props
}: CodesandboxProps) {
  const controls = useAnimation();

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      onMouseEnter={(e) => {
        controls.start("animate");
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        controls.start("normal");
        onMouseLeave?.(e);
      }}
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <motion.path
        variants={variants}
        animate={controls}
        custom={0}
        d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"
      />
      <motion.polyline
        variants={variants}
        animate={controls}
        custom={1}
        points="7.5 4.21 12 6.81 16.5 4.21"
      />
      <motion.polyline
        variants={variants}
        animate={controls}
        custom={2}
        points="7.5 19.79 7.5 14.6 3 12"
      />
      <motion.polyline
        variants={variants}
        animate={controls}
        custom={3}
        points="21 12 16.5 14.6 16.5 19.79"
      />
      <motion.polyline
        variants={variants}
        animate={controls}
        custom={4}
        points="3.27 6.96 12 12.01 20.73 6.96"
      />
      <motion.line
        variants={variants}
        animate={controls}
        custom={5}
        x1="12"
        x2="12"
        y1="22.08"
        y2="12"
      />
    </svg>
  );
}
