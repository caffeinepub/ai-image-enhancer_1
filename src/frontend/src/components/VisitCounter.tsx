import { Users } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useActor } from "../hooks/useActor";

const PULSE_DELAYS = [0, 0.2, 0.4];

export function VisitCounter() {
  const { actor, isFetching } = useActor();
  const [displayCount, setDisplayCount] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;

    actor
      .recordVisit()
      .then((count) => {
        if (cancelled) return;
        const num = Number(count);
        setIsLoaded(true);

        // Animate count-up with ease-out over ~1.5s
        const duration = 1500;
        const start = performance.now();
        const from = Math.max(
          0,
          num - Math.min(num, Math.ceil(num * 0.08) + 20),
        );

        function tick(now: number) {
          const elapsed = now - start;
          const progress = Math.min(elapsed / duration, 1);
          // Ease-out cubic
          const eased = 1 - (1 - progress) ** 3;
          const current = Math.round(from + (num - from) * eased);
          setDisplayCount(current);
          if (progress < 1) {
            rafRef.current = requestAnimationFrame(tick);
          }
        }

        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        // Silently fail — visitor counter is non-critical
      });

    return () => {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [actor, isFetching]);

  if (!isLoaded) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      data-ocid="visit_counter.panel"
      className="visit-counter-banner mb-6 rounded-2xl px-5 py-3 flex items-center justify-center gap-3"
    >
      {/* Glow orb */}
      <div className="relative flex items-center justify-center">
        <div
          className="absolute w-8 h-8 rounded-full bg-primary/20 animate-ping"
          style={{ animationDuration: "2s" }}
        />
        <div className="relative w-7 h-7 rounded-full bg-primary/15 border border-primary/40 flex items-center justify-center">
          <Users className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>

      {/* Counter text */}
      <div className="flex items-center gap-2">
        <span
          className="text-sm font-semibold text-muted-foreground tracking-wide uppercase"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            letterSpacing: "0.1em",
          }}
        >
          Total Visits
        </span>
        <span
          className="visit-counter-number text-xl font-bold"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {displayCount.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground font-medium">
          visitors
        </span>
      </div>

      {/* Pulse dots decoration */}
      <div className="flex items-center gap-1 ml-1">
        {PULSE_DELAYS.map((delay) => (
          <motion.div
            key={delay}
            className="w-1.5 h-1.5 rounded-full bg-primary"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1.4,
              delay,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </motion.div>
  );
}
