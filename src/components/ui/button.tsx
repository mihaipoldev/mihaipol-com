import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground hover:border-foreground/30",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-accent text-white shadow-card hover:shadow-card-hover hover:scale-105 transition-all",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, style, ...props }, ref) => {
    // For hero variant, we need layered gradient with primary base
    if (variant === "hero") {
      // Extract borderRadius from style if provided, otherwise use rounded-md
      const borderRadius = style?.borderRadius || "0.375rem"; // rounded-md default
      const baseClasses = cn(
        "relative inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 text-white shadow-card hover:shadow-card-hover hover:scale-105",
        size === "sm" && "h-8 px-3 text-xs",
        size === "default" && "h-9 px-4 py-2",
        size === "lg" && "h-11 px-8",
        size === "icon" && "h-9 w-9",
        "[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
        className
      );
      
      if (asChild) {
        // When asChild, wrap in span to maintain structure
        return (
          <span className={baseClasses} style={style}>
            {/* Base - full primary color */}
            <div 
              className="absolute inset-0 bg-primary" 
              style={{ borderRadius }}
            />
            {/* Gradient overlay - secondary at 0.8 opacity */}
            <div 
              className="absolute inset-0"
              style={{
                borderRadius,
                background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary) / 0.8) 50%, hsl(var(--accent)) 100%)`
              }}
            />
            <Slot ref={ref} {...props} className="relative z-10 inline-flex items-center justify-center gap-2">
              {children}
            </Slot>
          </span>
        );
      }
      
      return (
        <button 
          className={baseClasses}
          ref={ref} 
          style={style}
          {...props}
        >
          {/* Base - full primary color */}
          <div 
            className="absolute inset-0 bg-primary" 
            style={{ borderRadius }}
          />
          {/* Gradient overlay - secondary at 0.8 opacity */}
          <div 
            className="absolute inset-0"
            style={{
              borderRadius,
              background: `linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary) / 0.8) 50%, hsl(var(--accent)) 100%)`
            }}
          />
          <span className="relative z-10 inline-flex items-center justify-center gap-2">
            {children}
          </span>
        </button>
      );
    }
    
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} style={style} {...props}>
        {children}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
