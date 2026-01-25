"use client";

import { motion, type Variants, useReducedMotion } from "framer-motion";
import { type ReactNode } from "react";

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
};

const getContainerVariants = (shouldReduceMotion: boolean): Variants => ({
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: shouldReduceMotion ? 0 : 0.1,
    },
  },
});

const getItemVariants = (shouldReduceMotion: boolean): Variants => ({
  hidden: shouldReduceMotion 
    ? { opacity: 0 }
    : { opacity: 0, y: 20, scale: 0.98 },
  visible: shouldReduceMotion
    ? { opacity: 1 }
    : {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          duration: 0.4,
          ease: [0.4, 0, 0.2, 1],
        },
      },
});

export default function StaggerContainer({
  children,
  className,
  staggerDelay = 0.1,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerVariants = getContainerVariants(shouldReduceMotion ?? false);
  const itemVariants = getItemVariants(shouldReduceMotion ?? false);

  const customContainerVariants: Variants = {
    ...containerVariants,
    visible: {
      ...containerVariants.visible,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
      },
    },
  };

  return (
    <motion.div
      variants={customContainerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={itemVariants}>{children}</motion.div>}
    </motion.div>
  );
}
