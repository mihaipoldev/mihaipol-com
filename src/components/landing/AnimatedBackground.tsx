"use client";

import { useEffect, useRef } from "react";

export default function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    updateCanvasSize();
    window.addEventListener("resize", updateCanvasSize);

    // Orb class
    class Orb {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      colorType: 'primary' | 'secondary' | 'accent';
      opacity: number;
      opacityDirection: number;
      pulseSpeed: number;

      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 150 + 100;
        
        // Use preset colors: primary, secondary, or accent
        const colorTypes: Array<'primary' | 'secondary' | 'accent'> = ['primary', 'secondary', 'accent'];
        this.colorType = colorTypes[Math.floor(Math.random() * colorTypes.length)];
        this.opacity = Math.random() * 0.5 + 0.3;
        this.opacityDirection = Math.random() > 0.5 ? 1 : -1;
        this.pulseSpeed = Math.random() * 0.003 + 0.001;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Bounce off edges
        if (this.x < -this.radius || this.x > window.innerWidth + this.radius) {
          this.vx *= -1;
        }
        if (this.y < -this.radius || this.y > window.innerHeight + this.radius) {
          this.vy *= -1;
        }

        // Pulse opacity
        this.opacity += this.opacityDirection * this.pulseSpeed;
        if (this.opacity > 0.8 || this.opacity < 0.2) {
          this.opacityDirection *= -1;
        }
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Get color from CSS variables
        const colorVar = `--${this.colorType}`;
        const computedColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar);
        const hslMatch = computedColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
        
        if (hslMatch) {
          const [, h, s, l] = hslMatch;
          const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
          
          gradient.addColorStop(0, `hsla(${h}, ${s}%, ${l}%, ${this.opacity * 0.15})`);
          gradient.addColorStop(0.5, `hsla(${h}, ${s}%, ${l}%, ${this.opacity * 0.08})`);
          gradient.addColorStop(1, `hsla(${h}, ${s}%, ${l}%, 0)`);

          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Particle class for smaller floating particles
    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;
      colorType: 'primary' | 'secondary' | 'accent';
      opacity: number;

      constructor() {
        this.x = Math.random() * window.innerWidth;
        this.y = Math.random() * window.innerHeight;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 2 + 1;
        
        const colorTypes: Array<'primary' | 'secondary' | 'accent'> = ['primary', 'secondary', 'accent'];
        this.colorType = colorTypes[Math.floor(Math.random() * colorTypes.length)];
        this.opacity = Math.random() * 0.5 + 0.3;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x < 0) this.x = window.innerWidth;
        if (this.x > window.innerWidth) this.x = 0;
        if (this.y < 0) this.y = window.innerHeight;
        if (this.y > window.innerHeight) this.y = 0;
      }

      draw(ctx: CanvasRenderingContext2D) {
        // Get color from CSS variables
        const colorVar = `--${this.colorType}`;
        const computedColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar);
        const hslMatch = computedColor.match(/(\d+)\s+(\d+)%\s+(\d+)%/);
        
        if (hslMatch) {
          const [, h, s, l] = hslMatch;
          ctx.fillStyle = `hsla(${h}, ${s}%, ${l}%, ${this.opacity * 0.6})`;
          ctx.globalAlpha = this.opacity;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
    }

    // Create orbs and particles
    const orbs: Orb[] = [];
    const particles: Particle[] = [];
    
    const orbCount = window.innerWidth < 768 ? 3 : 5;
    const particleCount = window.innerWidth < 768 ? 30 : 60;

    for (let i = 0; i < orbCount; i++) {
      orbs.push(new Orb());
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    // Animation loop
    let animationFrameId: number;

    const animate = () => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

      // Draw and update orbs
      orbs.forEach((orb) => {
        orb.update();
        orb.draw(ctx);
      });

      // Draw and update particles
      particles.forEach((particle) => {
        particle.update();
        particle.draw(ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", updateCanvasSize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        mixBlendMode: "screen",
        opacity: 0.8,
      }}
    />
  );
}
