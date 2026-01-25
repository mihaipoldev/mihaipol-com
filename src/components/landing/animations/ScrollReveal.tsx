"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import { useRef, type ReactNode } from "react";

type ScrollRevealProps = {
  children: ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
};

export default function ScrollReveal({
  children,
  delay = 0,
  direction = "up",
  className,
}: ScrollRevealProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const shouldReduceMotion = useReducedMotion();

  const getInitialPosition = () => {
    if (shouldReduceMotion) {
      return { opacity: 0 };
    }
    switch (direction) {
      case "down":
        return { y: -20, opacity: 0 };
      case "left":
        return { x: 20, opacity: 0 };
      case "right":
        return { x: -20, opacity: 0 };
      case "up":
      default:
        return { y: 20, opacity: 0 };
    }
  };

  const getAnimatePosition = () => {
    if (shouldReduceMotion) {
      return { opacity: 1 };
    }
    switch (direction) {
      case "down":
        return { y: 0, opacity: 1 };
      case "left":
        return { x: 0, opacity: 1 };
      case "right":
        return { x: 0, opacity: 1 };
      case "up":
      default:
        return { y: 0, opacity: 1 };
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={getInitialPosition()}
      animate={isInView ? getAnimatePosition() : getInitialPosition()}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
