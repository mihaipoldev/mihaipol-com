"use client";

import { AnimatePresence, motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const isFirstMount = useRef(true);
  const previousPathname = useRef(pathname);

  useEffect(() => {
    // After first mount, enable animations
    if (isFirstMount.current) {
      isFirstMount.current = false;
    }
    previousPathname.current = pathname;
  }, [pathname]);

  // Always render the same structure to avoid remounting
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={isFirstMount.current ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={isFirstMount.current ? false : { opacity: 0, y: -12 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="flex-1"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
