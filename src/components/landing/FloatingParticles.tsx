"use client";

import { motion } from "framer-motion";

export default function FloatingParticles() {
  // Generate random particles
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    size: Math.random() * 4 + 2,
    x: Math.random() * 100,
    y: Math.random() * 100,
    duration: Math.random() * 10 + 20,
    delay: Math.random() * 5,
    opacity: Math.random() * 0.5 + 0.3,
    colorType: ['primary', 'secondary', 'accent'][Math.floor(Math.random() * 3)] as 'primary' | 'secondary' | 'accent',
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[1]">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            background: `radial-gradient(circle, hsl(var(--${particle.colorType}) / ${particle.opacity}) 0%, transparent 70%)`,
            filter: "blur(1px)",
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [particle.opacity, particle.opacity * 0.3, particle.opacity],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: particle.delay,
          }}
        />
      ))}
    </div>
  );
}
