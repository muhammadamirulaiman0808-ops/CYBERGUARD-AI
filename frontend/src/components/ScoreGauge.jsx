import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "framer-motion";
import { TONE, getRisk } from "../utils/risk";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const EASE = [0.2, 0.8, 0.2, 1];

export default function ScoreGauge({ score, size = 200 }) {
  const value = Math.max(0, Math.min(100, Number(score) || 0));
  const tone = TONE[getRisk(value).tone];
  const reduce = useReducedMotion();

  const count = useMotionValue(reduce ? value : 0);
  const shown = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (reduce) {
      count.set(value);
      return undefined;
    }
    const controls = animate(count, value, { duration: 1.1, ease: EASE });
    return () => controls.stop();
  }, [value, reduce, count]);

  const offset = CIRCUMFERENCE * (1 - value / 100);

  return (
    <div
      className="reticle grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Security score ${value} out of 100`}
    >
      <svg
        viewBox="0 0 120 120"
        className={`absolute left-3 top-3 -rotate-90 ${tone.text}`}
        style={{ width: "calc(100% - 1.5rem)", height: "calc(100% - 1.5rem)" }}
        aria-hidden="true"
      >
        <circle cx="60" cy="60" r={RADIUS} fill="none" stroke="var(--line-strong)" strokeWidth="5" />
        <motion.circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          initial={{ strokeDashoffset: reduce ? offset : CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: reduce ? 0 : 1.1, ease: EASE }}
          style={{ filter: "drop-shadow(0 0 5px currentColor)" }}
        />
      </svg>
      <div className="relative text-center">
        <motion.span className="block font-display text-5xl font-bold leading-none tabular-nums">
          {shown}
        </motion.span>
        <span className="mt-1.5 block font-mono text-xs text-fg-subtle">out of 100</span>
      </div>
    </div>
  );
}
