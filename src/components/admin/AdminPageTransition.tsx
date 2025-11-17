"use client";

import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

type AdminPageTransitionProps = {
  children: ReactNode;
};

export default function AdminPageTransition({ children }: AdminPageTransitionProps) {
  const pathname = usePathname();
  const isFirstMount = useRef(true);

  // Mark as mounted after first render
  if (isFirstMount.current) {
    isFirstMount.current = false;
  }

  return (
    <div className="relative flex flex-1 flex-col">
      <motion.div
        key={pathname}
        initial={isFirstMount.current ? false : { opacity: 0, scale: 0.99 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 0.15,
          ease: "easeOut",
        }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </div>
  );
}

