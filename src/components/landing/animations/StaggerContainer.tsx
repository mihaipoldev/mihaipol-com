"use client";

import { type ReactNode, Children, isValidElement } from "react";

type StaggerContainerProps = {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
};

export default function StaggerContainer({
  children,
  className = "",
  staggerDelay = 0.08,
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {Children.map(children, (child, index) => {
        if (!isValidElement(child)) return child;
        return (
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: `${index * staggerDelay}s` }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}
