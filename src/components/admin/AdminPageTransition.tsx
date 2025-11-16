"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

type AdminPageTransitionProps = {
  children: ReactNode;
};

export default function AdminPageTransition({ children }: AdminPageTransitionProps) {
  const pathname = usePathname();
  const isFirstMount = useRef(true);
  const previousPathname = useRef(pathname);

  // Track if pathname changed
  const pathnameChanged = previousPathname.current !== pathname;
  if (pathnameChanged) {
    previousPathname.current = pathname;
  }

  // Mark as mounted after first render
  if (isFirstMount.current) {
    isFirstMount.current = false;
  }

  return (
    <motion.div
      key={pathname}
      initial={isFirstMount.current ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.25, 
        ease: [0.4, 0, 0.2, 1] // Custom easing for smooth transition
      }}
      className="flex flex-1 flex-col"
    >
      {children}
    </motion.div>
  );
}

