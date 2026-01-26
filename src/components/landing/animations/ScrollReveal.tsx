"use client";

import { motion, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

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
      initial={getInitialPosition()}
      whileInView={getAnimatePosition()}
      viewport={{ once: false, amount: 0.2, margin: "0px 0px -100px 0px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      className={className}
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
}
