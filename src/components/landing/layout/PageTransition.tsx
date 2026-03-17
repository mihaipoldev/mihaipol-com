"use client";

import { type ReactNode } from "react";

type PageTransitionProps = {
  children: ReactNode;
};

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="flex-1">
      {children}
    </div>
  );
}
