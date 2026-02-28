"use client";
import { useEffect, useRef } from "react";
import { animate } from "framer-motion";

export function CountUp({ value, className }: { value: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        if (ref.current) {
          ref.current.textContent = Math.round(v).toString();
        }
      },
    });
    return () => controls.stop();
  }, [value]);

  return <span ref={ref} className={className}>0</span>;
}
